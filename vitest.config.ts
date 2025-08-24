import { configDefaults, defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Use absolute paths to avoid package.json issues
    alias: {
      '@': resolve(__dirname, './'),
      'tests': resolve(__dirname, './tests')
    },
  },
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./tests/frontend/setup.ts'],
    exclude: [...configDefaults.exclude, '**/node_modules/**', '**/dist/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
    // Skip package.json checking
    deps: {
      inline: true,
    }
  },
});
