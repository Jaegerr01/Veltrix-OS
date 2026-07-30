import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The AgentLand catalogue is read from disk at runtime by
  // src/lib/agents/catalogue.ts (232 markdown prompts, ~14 KB each — far too
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
