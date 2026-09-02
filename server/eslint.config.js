import js from '@eslint/js';
import globals from 'globals';
import { defineConfig, globalIgnores } from 'eslint/config';
import eslintConfigPrettier from 'eslint-config-prettier';

export default defineConfig([
    globalIgnores(['node_modules', 'drizzle']),
    {
        files: ['**/*.js'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: {
                ...globals.node,
                ...globals.es2021,
            },
        },
        rules: {
            ...js.configs.recommended.rules,
            'no-unused-vars': [
                'warn',
                {
                    argsIgnorePattern: '^_',
                    varsIgnorePattern: '^_',
                    caughtErrorsIgnorePattern: '^_',
                },
            ],
            'no-console': 'off',
        },
    },
    {
        files: ['**/*.test.js', '**/tests/**/*.js'],
        languageOptions: {
            globals: {
                ...globals.jest,
            },
        },
    },
    eslintConfigPrettier,
]);
