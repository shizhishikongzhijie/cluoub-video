import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import {globalIgnores} from 'eslint/config'
import simpleImportSort from 'eslint-plugin-simple-import-sort'
import prettier from 'eslint-plugin-prettier'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    plugins: {
      'simple-import-sort': simpleImportSort,
      prettier: prettier
    },
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules:{
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'prettier/prettier': [
        'error',
        {
          eslintIntegration: true,
          singleQuote: true,
          semi: false,
          bracketSpacing: true,
          tabWidth: 4,
          useTabs: false,
          'files.insertFinalNewline': true,
          htmlWhitespaceSensitivity: 'strict',
          trailingComma: 'none',
          endOfLine: 'auto',
          printWidth: 120,
          proseWrap: "never",
          plugins: [
            "prettier-plugin-organize-imports",
            "prettier-plugin-packagejson"
          ],
        }
      ],
    }
  },
])
