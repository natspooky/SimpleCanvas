import { defineConfig } from 'rollup';
import terser from '@rollup/plugin-terser';

export default defineConfig({
	input: 'src/simple-canvas.js',
	output: [
		{
			file: 'dist/simple-canvas.esm.js',
			format: 'esm',
		},

		{
			file: 'dist/simple-canvas.cjs.js',
			format: 'cjs',
		},

		{
			file: 'dist/simple-canvas.js',
			format: 'umd',
			name: 'SimpleCanvas',
		},

		{
			file: 'dist/simple-canvas.min.js',
			format: 'umd',
			name: 'SimpleCanvas',
			plugins: [terser()],
		},
	],
});
