import { defineConfig } from 'tsup'

export default defineConfig([
  {
    entry: ['bin/index.ts'],
    outDir: 'dist',
    target: 'node18',
    platform: 'node',
    format: ['esm'],
    splitting: false,
    sourcemap: true,
    minify: false,
    shims: true,
    dts: true
  }
])
