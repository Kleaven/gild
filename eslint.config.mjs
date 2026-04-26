import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import importPlugin from 'eslint-plugin-import';

export default [
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'src/lib/supabase/types.ts',
    ],
  },
  {
    files: ['src/**/*.ts', 'src/**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      import: importPlugin,
    },
    settings: {
      'import/resolver': {
        typescript: {
          project: './tsconfig.json',
        },
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/consistent-type-imports': 'error',
      'import/no-cycle': 'error',
      'import/no-self-import': 'error',
      'import/no-restricted-paths': [
        'error',
        {
          zones: [
            {
              target: './src/lib',
              from: './src/app',
              message: 'lib/* must never import from app/',
            },
            {
              target: './src/lib/billing',
              from: './src/lib/courses',
              except: ['./types.ts', './**/types.ts', './**/*.types.ts'],
              message: 'lib/billing may only import types from lib/courses',
            },
          ],
        },
      ],
    },
  },
];
