import { defineConfig } from 'tsup'
import path from 'path';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm', 'iife'],
  globalName: 'ObjectQLUI',
  dts: true,
  clean: true,
  // Remove strict external, we will shim them
  // external: ['react', 'react-dom'],
  noExternal: ['clsx', 'tailwind-merge', 'class-variance-authority', '@radix-ui/react-label', '@radix-ui/react-slot', '@radix-ui/react-checkbox', 'lucide-react', 'react-hook-form', 'zod', '@hookform/resolvers'],
  define: {
    'process.env.NODE_ENV': '"production"'
  },
  minify: true,
  target: 'es2020',
  esbuildOptions(options) {
      options.alias = {
          'react/jsx-runtime': path.resolve(__dirname, 'src/shims/jsx-runtime.ts'),
          'react': path.resolve(__dirname, 'src/shims/react.ts'),
          'react-dom': path.resolve(__dirname, 'src/shims/react-dom.ts'),
      };
      // Ignore CSS imports - we build CSS separately
      options.loader = {
          ...options.loader,
          '.css': 'empty',
      };
  }
})
