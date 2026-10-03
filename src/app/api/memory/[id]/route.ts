import { NextResponse } from 'next/server';
import { z } from 'zod';
import { vaultHandler } from '@/lib/api/vaultRoute';
import { parseJson } from '@/lib/api/validate';
import { vault } from '@/lib/db/vault';

export const dynamic = 'force-dynamic';

const idSchema = z.string().uuid();
const patchSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  body: z.string().max(200_000).optional(),
  path: z.string().max(300).optional(),
  tags: z.array(z.string().max(60)).max(30).optional(),
  pinned: z.boolean().optional(),
}).refine(v => Object.keys(v).length > 0, { message: 'Nothing to update' });

type Ctx = { params: Promise<{ id: string }> };
const badId = () => NextResponse.json({ success: false, error: 'Invalid note id.' }, { status: 400 });

export async function GET(req: Request, { params }: Ctx) {
  const id = idSchema.safeParse((await params).id);
  if (!id.success) return badId();
  return vaultHandler(req, { bucket: 'read' }, async (user) => NextResponse.json({ success: true, ...(await vault.read(id.data, user.id)) }));
}

export async function PATCH(req: Request, { params }: Ctx) {
  const id = idSchema.safeParse((await params).id);
  if (!id.success) return badId();
  return vaultHandler(req, { bucket: 'write', limit: 60 }, async (user) => {
    const parsed = await parseJson(req, patchSchema);
    if (parsed.response) return parsed.response;
    return NextResponse.json({ success: true, note: await vault.patch(id.data, parsed.data, user.id) });
  });
}

export async function DELETE(req: Request, { params }: Ctx) {
  const id = idSchema.safeParse((await params).id);
  if (!id.success) return badId();
  return vaultHandler(req, { bucket: 'write', limit: 60 }, async (user) => {
    await vault.remove(id.data, user.id);
    return NextResponse.json({ success: true });
  });
}
