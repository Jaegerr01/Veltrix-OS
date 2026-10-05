import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Test doubles legitimately need loose typing (mock factories, partial fixtures).
  { files: ["**/*.test.ts", "**/*.test.tsx"], rules: { "@typescript-eslint/no-explicit-any": "off" } },
  { rules: { "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_", ignoreRestSiblings: true }] } },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Keep ESLint out of generated / non-source trees (build output, deploy
    // artefacts, graph dumps, agent tooling, the 230-file agent catalogue).
    ".netlify/**",
    "coverage/**",
    "graphify-out/**",
    ".claude/**",
    ".agent/**",
    "public/**",
    "src/lib/agents/catalogue/**",
    "**/*.tsbuildinfo",
  ]),
]);

export default eslintConfig;
