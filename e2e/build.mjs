// Builds the app with the throwaway mock environment so the e2e suite (and its NEXT_PUBLIC_* values) match.
import { spawnSync } from 'node:child_process';
import { mockEnv } from './env.mjs';
const r = spawnSync('npx', ['next', 'build'], { stdio: 'inherit', shell: true, env: { ...process.env, ...mockEnv } });
process.exit(r.status ?? 1);
