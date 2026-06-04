import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { gemini } from '@/lib/gemini';

export async function POST(req: Request) {
  try {
    const { topic } = await req.json();
    if (!topic) {
      return NextResponse.json({ success: false, error: 'topic is required' }, { status: 400 });
    }

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
