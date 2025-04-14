import globals from "globals";
import pluginJs from "@eslint/js";

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
  {
    files: ["**/*.js"],
    languageOptions: {
      sourceType: "module", // Set "module" if using import/export
      globals: globals.browser, // Use browser globals
    },
    rules: {
      "no-unused-vars": "warn",
      "no-console": "off", // Allow console logs
      ...pluginJs.configs.recommended.rules, // Apply recommended ESLint rules
    },
  },
];