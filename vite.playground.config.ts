import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vueJsx from '@vitejs/plugin-vue-jsx';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  root: fileURLToPath(new URL('./playground', import.meta.url)),
  plugins: [vue(), vueJsx()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  css: {
    preprocessorOptions: {
      scss: { quietDeps: true, silenceDeprecations: ['import', 'global-builtin', 'legacy-js-api', 'slash-div', 'color-functions', 'mixed-decls'] },
    },
  },
  server: { port: 5180 },
});
