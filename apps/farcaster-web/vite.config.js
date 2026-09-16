import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import basicSsl from '@vitejs/plugin-basic-ssl';

const httpsEnabled = process.env.HTTPS !== 'false';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    nodePolyfills({
      globals: {
        Buffer: true,
        stream: true,
        process: true,
      },
    }),
    ...(httpsEnabled ? [basicSsl()] : []),
  ],
  resolve: {
    alias: {
      '~': path.resolve(__dirname, './src'),
    },
  },
  server: {
    https: httpsEnabled,
  },
  build: {
    sourcemap: 'hidden',
    // Match browserslist config: chrome >= 111, edge >= 111, firefox >= 128, safari >= 16.4
    // These browsers all support ES2020 features natively (classes, async/await, spread, etc.)
    target: ['chrome111', 'edge111', 'firefox128', 'safari16.4'],
    rollupOptions: {
      output: {
        manualChunks: {
          // Split heavy vendor libraries into separate chunks
          'vendor-viem': ['viem'],
          'vendor-wagmi': ['wagmi', '@wagmi/core', '@wagmi/connectors'],
          'vendor-solana': ['@solana/web3.js'],
          'vendor-privy': ['@privy-io/react-auth'],
          'vendor-draftjs': [
            'draft-js',
            '@draft-js-plugins/editor',
            '@draft-js-plugins/mention',
            '@draft-js-plugins/emoji',
            '@draft-js-plugins/linkify',
          ],
          'vendor-emoji': [
            'emoji-mart',
            '@emoji-mart/data',
            '@emoji-mart/react',
          ],
          'vendor-charts': ['recharts'],
        },
      },
      plugins: [],
    },
  },
});
