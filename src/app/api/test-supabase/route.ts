import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { db } from '@/lib/db';
import { gemini } from '@/lib/ai/gemini';
import { asErr } from '@/lib/errors';

export async function GET() {
  // SECURITY: dev-only diagnostic. In production this endpoint created a user
  // with a hardcoded password via the service-role key — must never be reachable.
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  try {
    // Credentials come from the dev environment only — nothing is hardcoded.
    const email = process.env.TEST_USER_EMAIL;
    const password = process.env.TEST_USER_PASSWORD;
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Set TEST_USER_EMAIL and TEST_USER_PASSWORD in .env.local (dev only, throwaway values) to run this diagnostic.' },
        { status: 400 }
      );
    }

    console.log('Ensuring test user session...');
    try {
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true
      });
    } catch {}

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError || !authData.user) {
      throw new Error(`Auth failed: ${authError?.message}`);
    }

    console.log('Testing table existence...');
    const { error: profilesErr } = await supabase.from('profiles').select('id').limit(1);
    const { error: activitiesErr } = await supabase.from('activities').select('id').limit(1);
    const { error: notesErr } = await supabase.from('notes').select('id').limit(1);
    const { error: agentMemoryErr } = await supabase.from('agent_memory').select('id').limit(1);

    if (notesErr) {
      console.warn('public.notes table is missing or inaccessible. Schema migration required.');
      await supabase.auth.signOut();
      return NextResponse.json({
        success: false,
        error: 'The notes table is missing. Please execute the supabase_schema.sql migration in your Supabase SQL Editor first.',
        tables: {
          profiles: profilesErr ? profilesErr.message : 'exists',
          activities: activitiesErr ? activitiesErr.message : 'exists',
          notes: notesErr.message,
          agent_memory: agentMemoryErr ? agentMemoryErr.message : 'exists'
        }
      });
    }

    // 1. Test Embedding Generation
    console.log('Testing embedding generation...');
    const embedding = await gemini.getEmbedding('Test business fact for PostelOS memory retrieval.');
    const embeddingValid = Array.isArray(embedding) && embedding.length === 768;
    console.log(`Embedding valid: ${embeddingValid}, dimensions: ${embedding?.length}`);

    if (!embeddingValid) {
      await supabase.auth.signOut();
      return NextResponse.json({
        success: false,
        step: 'embedding_generation',
        error: 'Failed to generate a valid 768-dimension embedding array'
      }, { status: 500 });
    }

    // 2. Test Add Memory (writes to public.notes and generates embedding)
    console.log('Testing db.addMemory...');
    const testContent = `Unique Test Note: We charge exactly $1,750 for custom NextJS dashboards with Tailwind styling. This was saved at ${new Date().toISOString()}`;
    const newNote = await db.addMemory({
      type: 'Strategy',
      content: testContent,
      tags: ['test-run', 'pricing'],
      importance: 9,
      source: 'Test API Endpoint'
    });

    console.log(`Note created: ${newNote.id}`);

    // 3. Test Search Memory (Vector Similarity search)
    console.log('Testing db.searchMemories vector search...');
    const results = await db.searchMemories('how much do we charge for nextjs custom dashboards?', 3);
    console.log(`Search results count: ${results.length}`);
    
    const matchedNote = results.find(n => n.content.includes('Unique Test Note'));
    
    // 4. Clean up test note
    console.log('Cleaning up test note...');
    await supabaseAdmin
      .from('notes')
      .delete()
      .eq('id', newNote.id);

    // Sign out to clean up session
    await supabase.auth.signOut();

    return NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        email: email
      },
      embedding: {
        valid: embeddingValid,
        dimensions: embedding.length,
        preview: embedding.slice(0, 5)
      },
      note: {
        created: !!newNote.id,
        id: newNote.id,
        content: newNote.content
      },
      search: {
        totalResults: results.length,
        matchedTestNote: !!matchedNote,
        matchedSource: matchedNote?.source,
        resultsPreview: results.map(r => ({ content: r.content.substring(0, 100), source: r.source }))
      }
    });

  } catch (errRaw: unknown) { const err = asErr(errRaw);
    try {
      await supabase.auth.signOut();
    } catch {}
    return NextResponse.json({ success: false, error: err.message || err }, { status: 500 });
  }
}



