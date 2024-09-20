import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";

export default [
  {
    files: ["**/*.{js,mjs,cjs,ts}"],
    rules: {
      "quotes": ["error", "double"],               // Enforce double quotes
      "semi": ["error", "always"],                 // Require semicolons
      "max-len": ["error", { code: 100 }],         // Limit line length to 100 characters
      "no-unused-vars": ["error"],                 // Disallow unused variables
      "no-console": "warn",                        // Warn on console.log() usage
      "eqeqeq": ["error", "always"],               // Enforce strict equality (=== and !==)
      // eslint-disable-next-line max-len
      "@typescript-eslint/explicit-function-return-type": "error",  // Require explicit return types for functions
      "@typescript-eslint/no-explicit-any": "warn",  // Warn on usage of the "any" type
    }
  },
  {
    languageOptions: { globals: globals.browser }
  },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
];
