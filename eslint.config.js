import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";

export default [
  { languageOptions: { globals: globals.browser } },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  {
    // Add this section to turn off the rule
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
];