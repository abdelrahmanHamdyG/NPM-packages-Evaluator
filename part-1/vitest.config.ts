import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      reporter: ["json-summary", "text", "lcov"], 
       // 'json-summary' gives totals like total statements, lines, etc.
      all: true,                                  
      // Include all files for coverage, not just the ones tested
      include: ["src/**"],                       
      // Specify the files or directories to include in coverage
      exclude: ["tests/**","src/IssueInterface.ts","src/ContributorInterface.ts"],                      
      // Exclude test files from coverage
      reportsDirectory: "./coverage",             
      // Directory for saving coverage reports
    },
    globals: true,          // Use globals like describe, it, etc.
    environment: "node",     // Node environment (or use 'jsdom' for browser-based tests)
    setupFiles: [],          // Optionally specify setup files if needed
    threads: false,          // Disable workers to avoid issues with ESM
  },
  esbuild: {
    target: "esnext",        // Ensures compatibility with ES modules
  },
});