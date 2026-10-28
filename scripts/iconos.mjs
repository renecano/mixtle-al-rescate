// Genera los íconos PNG de la app instalable (PWA) a partir de la cara de Mixtle en SVG.
// Uso: node scripts/iconos.mjs   (usa el Chrome instalado; no descarga nada)
import { chromium } from '@playwright/test';
import { mkdir, readFile } from 'node:fs/promises';

const cara = await readFile('public/favicon.svg', 'utf8');
// Fondo cuadrado a sangre (sirve como ícono "maskable") y la cara al 80 % para el área segura.
const html = (lado) => `<!doctype html><html><body style="margin:0">
  <div style="width:${lado}px;height:${lado}px;background:#1F6B4A;display:grid;place-items:center">
    <div style="width:${lado * 0.8}px;height:${lado * 0.8}px">${cara.replace('<svg ', '<svg width="100%" height="100%" ')}</div>
  </div></body></html>`;

await mkdir('public/iconos', { recursive: true });
const navegador = await chromium.launch({ channel: 'chrome' });
for (const lado of [192, 512]) {
  const pagina = await navegador.newPage({ viewport: { width: lado, height: lado } });
  await pagina.setContent(html(lado));
  await pagina.screenshot({ path: `public/iconos/icono-${lado}.png` });
  await pagina.close();
}
await navegador.close();
console.log('Íconos en public/iconos/');
