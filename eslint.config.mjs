import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // react-hooks v6 (pulled in by eslint-config-next 16) introduced
  // set-state-in-effect as an error; the shell's derive-state-from-props
  // effects predate the rule and are intentional. Keep it visible as warning.
  {
    rules: {
      "react-hooks/set-state-in-effect": "warn",
    },
  },
  // Plain CommonJS node scripts, not part of the Next.js app build.
  {
    files: ["scripts/**/*.js"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
