import { schedule } from '@netlify/functions';

// Runs every day at 10:00 PM UTC — generates and emails the daily operations brief to Barry
const handler = schedule('0 22 * * *', async () => {
  const siteUrl = process.env.URL || process.env.NEXT_PUBLIC_SITE_URL;
  if (!siteUrl) {
    console.error('[daily-brief] No site URL configured');
    return { statusCode: 500 };
  }

  const secret = process.env.CRON_SECRET;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (secret) headers['Authorization'] = `Bearer ${secret}`;

  try {
    const res = await fetch(`${siteUrl}/api/autopilot/daily-brief`, {
      method: 'POST',
      headers,
    });
    const data = await res.json();
    console.log('[daily-brief] Result:', JSON.stringify(data));
    return { statusCode: 200 };
  } catch (err) {
    console.error('[daily-brief] Failed:', err);
    return { statusCode: 500 };
  }
});

export { handler };
