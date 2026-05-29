import js from '@eslint/js';
import globals from 'globals';
import { defineConfig } from 'eslint/config';
import eslintPluginPrettier from 'eslint-plugin-prettier';
import eslintConfigPrettier from 'eslint-config-prettier';

export default defineConfig([
	eslintConfigPrettier,
	{
		files: ['**/*.{js,mjs,cjs}'],
		extends: ['js/recommended'],
		languageOptions: { globals: globals.browser },
		plugins: {
			js,
			prettier: eslintPluginPrettier,
		},
		rules: {
			'prettier/prettier': 'error',
			semi: ['warn', 'always'],
		},
		ignores: ['*.json', 'README.md', 'package-lock.json', 'dist/*'],
	},
]);
