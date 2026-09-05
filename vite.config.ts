import { defineConfig } from 'vitest/config';

export default defineConfig({
  build: {
    target: 'es2022',
    sourcemap: true,
    rollupOptions: {
      input: ['index.html', 'demo/index.html', 'privacy/index.html', 'terms/index.html']
    }
  },
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.ts']
  }
});
