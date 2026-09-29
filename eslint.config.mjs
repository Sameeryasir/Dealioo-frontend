import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// --- ESLint config ---
// What: Next.js lint + softer React Compiler rules for existing patterns
 // Why: Keep intelligence feedback without blocking every commit on legacy ref patterns
// Related: .husky/pre-commit, lint-staged in package.json

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // --- Known safe patterns in this codebase (store bootstrap, callback refs) ---
      // Keep as warnings so the editor still flags them (intelligence), without failing CI/commit.
      "react-hooks/refs": "warn",
      "react-hooks/set-state-in-effect": "warn",
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
