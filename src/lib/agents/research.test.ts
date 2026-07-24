import { describe, it, expect, vi, afterEach } from 'vitest';
import { fetchWebsiteSnapshot } from './research';

describe('fetchWebsiteSnapshot SSRF guard', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('blocks private IP hosts without making a network call', async () => {
    const fetchMock = vi.fn();
    global.fetch = fetchMock as any;
    const result = await fetchWebsiteSnapshot('http://127.0.0.1:8000/admin');
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/private\/internal host blocked/i);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('blocks .internal and cloud-metadata-style hosts', async () => {
    const fetchMock = vi.fn();
    global.fetch = fetchMock as any;
    const result = await fetchWebsiteSnapshot('http://169.254.169.254/latest/meta-data');
    expect(result.ok).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('fetches a normal public site', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response('<html><title>Hi</title><body>Hello world</body></html>', { status: 200 }));
    global.fetch = fetchMock as any;
    const result = await fetchWebsiteSnapshot('https://example.com');
    expect(result.ok).toBe(true);
    expect(result.title).toBe('Hi');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('blocks a redirect to a private host instead of following it', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 302, headers: { Location: 'http://169.254.169.254/latest/meta-data' } }));
    global.fetch = fetchMock as any;
    const result = await fetchWebsiteSnapshot('https://example.com');
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/redirect target blocked/i);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('follows a redirect to another public host', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 302, headers: { Location: 'https://example.org/final' } }))
      .mockResolvedValueOnce(new Response('<html><title>Final</title></html>', { status: 200 }));
    global.fetch = fetchMock as any;
    const result = await fetchWebsiteSnapshot('https://example.com');
    expect(result.ok).toBe(true);
    expect(result.url).toBe('https://example.org/final');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('gives up after too many redirects', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 302, headers: { Location: 'https://example.com/loop' } }));
    global.fetch = fetchMock as any;
    const result = await fetchWebsiteSnapshot('https://example.com');
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/too many redirects/i);
  });
});
