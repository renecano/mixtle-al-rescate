import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig, type Plugin } from 'vitest/config';
import { logoSvg } from './src/arte/marca';

/** Pone el logo (SVG con letras en trazos) en la pantalla de carga de index.html: se ve antes que el código. */
function logoDeCarga(): Plugin {
  return {
    name: 'mixtle-logo-de-carga',
    transformIndexHtml: (html) => html.replace('<!--logo-carga-->', logoSvg({ atributos: 'class="pantalla-carga-logo" aria-hidden="true"' })),
  };
}

export default defineConfig({
  base: './',
  plugins: [
    react(),
    tailwindcss(),
    logoDeCarga(),
    VitePWA({
      // El juego se guarda en el dispositivo tras la primera visita y funciona sin internet.
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['favicon.svg', 'iconos/*.png', 'marca/*.svg'],
      manifest: {
        name: 'Mixtle al rescate',
        short_name: 'Mixtle',
        description: 'Guardianes del parque: aprende a cuidar el parque, a sus animales y a separar la basura con Mixtle el cacomixtle.',
        lang: 'es-MX',
        start_url: './',
        scope: './',
        display: 'fullscreen',
        orientation: 'landscape',
        background_color: '#D3EEF9',
        theme_color: '#1F6B4A',
        icons: [
          { src: 'iconos/icono-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'iconos/icono-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'iconos/icono-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Todo el juego (código, fuente, arte, voz y música) queda disponible sin conexión.
        globPatterns: ['**/*.{js,css,html,svg,png,woff2,mp3,json}'],
        // La lista de audios va aparte: primero la de internet (siempre la más nueva) y, sin conexión,
        // la última guardada. Así una versión vieja en caché nunca deja a Mixtle con la lista vieja.
        globIgnores: ['**/voz/manifiesto.json'],
        runtimeCaching: [
          {
            urlPattern: /\/voz\/manifiesto\.json$/,
            handler: 'NetworkFirst',
            options: { cacheName: 'mixtle-voz-manifiesto', networkTimeoutSeconds: 4 },
          },
        ],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        cleanupOutdatedCaches: true,
        navigateFallback: 'index.html',
      },
      devOptions: { enabled: false },
    }),
  ],
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/phaser')) return 'phaser';
          if (/node_modules\/(react|react-dom|scheduler)\//.test(id)) return 'react';
          return undefined;
        },
      },
    },
  },
  test: {
    environment: 'happy-dom',
    include: ['tests/**/*.test.{ts,tsx}'],
    setupFiles: ['tests/preparar.ts'],
  },
});
