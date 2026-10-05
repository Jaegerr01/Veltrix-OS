-- ================================================================
-- 2026-10-02_004  PostelOS Memory Vault (built-in, replaces the external Obsidian integration)
-- NOT auto-run. Barry applies this in the Supabase SQL editor (see migrations/README.md, order 5).
-- Safe to re-run (idempotent). RLS: every row is private to its owner (user_id = auth.uid()).
-- ================================================================

create table if not exists public.vault_notes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users(id) on delete cascade,
  title       text not null check (char_length(title) between 1 and 200),
  path        text not null default '' check (char_length(path) <= 300),      -- folder, e.g. 'Decisions/2026'; '' = root
  body        text not null default '' check (char_length(body) <= 200000),   -- markdown
  tags        text[] not null default '{}',
  pinned      boolean not null default false,
  source      text not null default 'user' check (source in ('user', 'agent', 'system')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  -- full-text search (title weighted above body). Immutable expression => allowed as a generated column.
  search      tsvector generated always as (
                setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
                setweight(to_tsvector('english', coalesce(body, '')),  'B')
              ) stored
);

create unique index if not exists vault_notes_user_path_title_uq on public.vault_notes (user_id, lower(path), lower(title));
create index if not exists vault_notes_user_updated_idx on public.vault_notes (user_id, updated_at desc);
create index if not exists vault_notes_search_idx on public.vault_notes using gin (search);
create index if not exists vault_notes_tags_idx on public.vault_notes using gin (tags);

-- [[wiki-links]] parsed from note bodies. to_key = lower(trim(title)); backlinks = rows whose to_key matches a note's title.
create table if not exists public.vault_links (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.users(id) on delete cascade,
  from_note_id  uuid not null references public.vault_notes(id) on delete cascade,
  to_title      text not null,
  to_key        text not null,
  created_at    timestamptz not null default now(),
  unique (from_note_id, to_key)
);
create index if not exists vault_links_user_to_idx on public.vault_links (user_id, to_key);

create or replace function public.vault_touch_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists vault_notes_touch on public.vault_notes;
create trigger vault_notes_touch before update on public.vault_notes
  for each row execute function public.vault_touch_updated_at();

alter table public.vault_notes enable row level security;
alter table public.vault_links enable row level security;

drop policy if exists "vault_notes_owner" on public.vault_notes;
create policy "vault_notes_owner" on public.vault_notes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "vault_links_owner" on public.vault_links;
create policy "vault_links_owner" on public.vault_links
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
