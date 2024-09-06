import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";


export default [
  {
    files: ["src/**/*.{js,mjs,cjs,ts}"],

    rules: {
      'quotes': ['error', 'double'],
      'semi': ['error', 'always'],
      'max-len': ['error', { code: 80 }],
      'no-unused-vars': ['error'],
      '@typescript-eslint/explicit-function-return-type': 'error',  
    },
  },
  {
    files: ["src/**/*.js"], languageOptions: {sourceType: "commonjs"}
  },
  {  
    languageOptions: { globals: {...globals.browser, ...globals.node} }
  },

  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
];