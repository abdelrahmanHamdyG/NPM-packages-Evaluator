import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,          // Use globals like describe, it, etc.
    environment: 'node',     // Node environment (or use 'jsdom' for browser-based tests)
    setupFiles: [],          // Optionally specify setup files if needed
    threads: false,          // Disable workers to avoid issues with ESM
  },
  esbuild: {
    target: 'esnext',        // Ensures compatibility with ES modules
  },
})
