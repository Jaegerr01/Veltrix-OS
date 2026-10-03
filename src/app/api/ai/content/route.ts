import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { gemini } from '@/lib/gemini';
import { requireUser } from '@/lib/auth/requireUser';
import { checkRateLimit } from '@/lib/auth/rateLimit';
import { validateText, badRequest, LIMITS } from '@/lib/validation';

export async function POST(req: Request) {
  const auth = await requireUser(req);
  if (auth.response) return auth.response;
  const rl = await checkRateLimit(auth.user.id);
  if (!rl.allowed) return NextResponse.json({ success: false, error: 'Rate limit exceeded. Try again in a minute.' }, { status: 429 });

  try {
    const body = await req.json().catch(() => ({}));
    const check = validateText(body.topic, 'Topic', { max: LIMITS.prompt });
    if (!check.ok) return badRequest(check.error);
    const topic = check.value;

    // Call Gemini content generation logic
    const ideas = await gemini.generateContentIdeas(topic);

    // Save ideas to database
    const savedIdeas = [];
    for (const idea of ideas) {
      const saved = await db.addContentIdea({
        platform: idea.platform,
        title: idea.title,
        hook: idea.hook,
        content: idea.content,
        content_type: idea.content_type,
        status: 'Idea'
      });
      savedIdeas.push(saved);
    }

    // Log action
    await db.logAgentAction(
      'Content Agent',
      'Generate Content Ideas',
      `topic=${topic}`,
      JSON.stringify(ideas),
      'Success'
    );

    return NextResponse.json({ success: true, ideas: savedIdeas });
  } catch (error: any) {
    console.error('Error generating content API:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
