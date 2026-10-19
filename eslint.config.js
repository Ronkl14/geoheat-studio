import js from '@eslint/js';
import tsParser from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

export default tsParser.config(
  { ignores: ['dist/**', 'node_modules/**'] },
  js.configs.recommended,
  ...tsParser.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: {
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        fetch: 'readonly',
        URL: 'readonly',
        Blob: 'readonly',
        File: 'readonly',
        AbortSignal: 'readonly',
        Date: 'readonly',
        Math: 'readonly',
        Object: 'readonly',
        String: 'readonly',
        Number: 'readonly',
        Array: 'readonly',
        Set: 'readonly',
        Map: 'readonly',
        RegExp: 'readonly',
      },
    },
    plugins: { 'react-hooks': reactHooks, 'react-refresh': reactRefresh },
    rules: {
      ...reactHooks.configs.flat.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
  {
    files: ['tests/**/*.mjs'],
    languageOptions: { globals: { test: 'readonly', assert: 'readonly', File: 'readonly' } },
  },
);
