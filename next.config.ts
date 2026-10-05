import type { NextConfig } from "next";
import path from "node:path";

/**
 * Security headers. CSP is shipped as Report-Only first (violations POST to /api/csp-report) so a missed
 * third-party source can never white-screen the app; once the reports are clean, rename the header key to
 * "Content-Security-Policy" to enforce it. The other headers are enforced now.
 */
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "media-src 'self' blob: data:",
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "report-uri /api/csp-report",
].join('; ');

const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // microphone=(self): ARIA needs the mic on this origin only.
  { key: 'Permissions-Policy', value: 'microphone=(self), camera=(), geolocation=(), payment=()' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  ...(process.env.NODE_ENV === 'production' ? [{ key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' }] : []),
  { key: 'Content-Security-Policy-Report-Only', value: csp },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Pin the project root. Without this Next infers it from a stray lockfile in a parent folder (it did on the dev PC),
  // which bakes a wrong Windows-style nested path into the Netlify server handler and every page returns 502.
  outputFileTracingRoot: path.resolve(process.cwd()),
  turbopack: { root: path.resolve(process.cwd()) },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
  // The AgentLand catalogue is read from disk at runtime by
  // src/lib/agents/catalogue.ts (232 markdown prompts, ~14 KB each - far too
  // large to bundle). Next.js does not trace files under src/ into the
  // serverless output, so without this the loader works in dev and throws
  // ENOENT in a deployed build.
  outputFileTracingIncludes: {
    '/api/**': [
      './src/lib/agents/catalogue/**/*.md',
      './src/lib/agents/catalogue/index.json',
    ],
  },
};

export default nextConfig;
