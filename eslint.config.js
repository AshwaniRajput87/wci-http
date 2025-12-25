import js from '@eslint/js'
import tseslint from 'typescript-eslint'

export default [
  // Base JS rules
  js.configs.recommended,

  // TypeScript rules
  ...tseslint.configs.recommended,

  // Node / config files (CJS)
  {
    files: ['*.cjs'],
    languageOptions: {
      globals: {
        module: 'readonly',
        require: 'readonly',
      },
    },
  },

  // Ignore build artifacts
  {
    ignores: ['build', 'node_modules'],
  },
]
