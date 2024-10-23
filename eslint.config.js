import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";

export default [
  {
    files: ["**/*.{js,mjs,cjs,ts}"],
    rules: {
      "quotes": ["error", "double"],               // Enforce double quotes
      "semi": ["error", "always"],                 // Require semicolons
      "max-len": ["error", { code: 300 }],         // Limit line length to 300 characters
      "no-unused-vars": ["error"],                 // Disallow unused variables
      "eqeqeq": ["error", "always"],               // Enforce strict equality (=== and !==)
        
      
      
    }
  },
  {
    languageOptions: { globals: globals.browser }
  },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
];
