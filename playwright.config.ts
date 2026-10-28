import { defineConfig } from '@playwright/test';

const enCI = !!process.env.CI;
/**
 * Con BASE_URL (por ejemplo, el link de producción de Vercel) las pruebas corren contra ese sitio
 * y no se construye nada en local. Sin BASE_URL: build de producción + `vite preview`.
 */
const urlBase = process.env.BASE_URL?.replace(/\/$/, '');

/**
 * Recorridos completos del juego en el navegador.
 * En local usa el Chrome instalado; en CI, el Chromium de Playwright.
 */
export default defineConfig({
  testDir: 'e2e',
  timeout: 8 * 60_000,
  expect: { timeout: 30_000 },
  fullyParallel: true,
  // En una laptop de 8 GB, varios navegadores a la vez agotan la memoria: localmente, uno.
  workers: enCI ? 2 : 1,
  retries: enCI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  outputDir: 'test-results',
  use: {
    baseURL: urlBase ?? 'http://localhost:4173',
    channel: enCI ? undefined : 'chrome',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'proyector-1920x1080', testIgnore: /camara/, use: { viewport: { width: 1920, height: 1080 } } },
    { name: 'tablet-1024x768', testIgnore: /camara/, use: { viewport: { width: 1024, height: 768 }, hasTouch: true } },
    {
      // Cámara de prueba de Chrome con permiso concedido; descarga el modelo real (requiere internet).
      name: 'camara',
      testMatch: /camara/,
      // Corre al final, sola: cargar MobileNet en un navegador sin GPU es pesado.
      dependencies: ['proyector-1920x1080', 'tablet-1024x768'],
      timeout: 10 * 60_000,
      use: {
        viewport: { width: 1920, height: 1080 },
        permissions: ['camera'],
        launchOptions: { args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] },
      },
    },
  ],
  webServer: urlBase
    ? undefined
    : {
        command: 'npm run build && npm run preview -- --port 4173 --strictPort',
        url: 'http://localhost:4173',
        reuseExistingServer: !enCI,
        timeout: 180_000,
      },
});
