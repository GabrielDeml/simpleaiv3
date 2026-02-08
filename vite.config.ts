import { defineConfig, type PluginOption } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(async () => {
  const plugins: PluginOption[] = [react(), tailwindcss()];

  if (process.env.ANALYZE) {
    const { visualizer } = await import('rollup-plugin-visualizer');
    plugins.push(
      visualizer({
        filename: 'bundle-analysis.html',
        open: true,
        gzipSize: true,
      }),
    );
  }

  return {
    base: '/simpleaiv3/',
    plugins,
    worker: {
      format: 'es' as const,
    },
    server: {
      headers: {
        'Cross-Origin-Embedder-Policy': 'require-corp',
        'Cross-Origin-Opener-Policy': 'same-origin',
      },
    },
    build: {
      target: 'esnext',
      sourcemap: false,
      chunkSizeWarningLimit: 6000,
      rollupOptions: {
        output: {
          manualChunks: {
            tfjs: ['@tensorflow/tfjs'],
            three: ['three', '@react-three/fiber', '@react-three/drei'],
            webllm: ['@mlc-ai/web-llm'],
            d3: ['d3-scale', 'd3-scale-chromatic', 'd3-array'],
          },
        },
      },
    },
    optimizeDeps: {
      exclude: ['@mlc-ai/web-llm'],
    },
  };
});
