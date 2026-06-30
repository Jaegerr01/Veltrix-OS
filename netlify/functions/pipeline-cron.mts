import { schedule } from '@netlify/functions';

// Runs every 30 minutes — processes all leads through the autonomous pipeline
// Netlify provides process.env.URL automatically (your live site URL)
const handler = schedule('*/30 * * * *', async () => {
  const siteUrl = process.env.URL || process.env.NEXT_PUBLIC_SITE_URL;
  if (!siteUrl) {
    console.error('[pipeline-cron] No site URL configured');
    return { statusCode: 500 };
  }

  const secret = process.env.CRON_SECRET;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (secret) headers['Authorization'] = `Bearer ${secret}`;

  try {
    const res = await fetch(`${siteUrl}/api/autopilot/run`, {
      method: 'POST',
      headers,
    });
    const data = await res.json();
    console.log('[pipeline-cron] Result:', JSON.stringify(data));
    return { statusCode: 200 };
  } catch (err) {
    console.error('[pipeline-cron] Failed:', err);
    return { statusCode: 500 };
  }
});

export { handler };
