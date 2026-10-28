// Presupuesto de la primera pantalla: lo que se descarga antes de ver el inicio no debe pasar de
// ~250 KB comprimidos (regla de la v3). Mide dist/ después de npm run build:
//   - index.html (con el logo de la pantalla de carga),
//   - los scripts, módulos precargados y hojas de estilo que pide index.html,
//   - todas las fuentes .woff2 que declara esa hoja de estilo (peor caso: el navegador solo baja las que usa).
// Las demás pantallas, Phaser, la voz y la música se descargan después.
// Uso: node scripts/presupuesto.mjs   (falla con código 1 si se pasa)
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { gzipSync } from 'node:zlib';

export const LIMITE_KB = 250;

/** Archivos que pide la primera pantalla, con su tamaño comprimido (gzip nivel 9, como un servidor). */
export function medirPrimeraPantalla(dist) {
  const html = readFileSync(join(dist, 'index.html'), 'utf8');
  const pedidos = new Set();
  for (const m of html.matchAll(/<(?:script[^>]*\bsrc|link[^>]*\bhref)="\.?\/?(assets\/[^"]+\.(?:js|css))"/g)) pedidos.add(m[1]);
  const fuentes = new Set();
  for (const css of [...pedidos].filter((p) => p.endsWith('.css'))) {
    const texto = readFileSync(join(dist, css), 'utf8');
    for (const m of texto.matchAll(/url\(\.?\/?([^)]+\.woff2)\)/g)) fuentes.add(join(dirname(css), m[1]).replace(/\\/g, '/'));
  }
  const gz = (buffer) => gzipSync(buffer, { level: 9 }).length;
  const filas = [
    { archivo: 'index.html', bytes: gz(Buffer.from(html)) },
    ...[...pedidos].map((p) => ({ archivo: p, bytes: gz(readFileSync(join(dist, p))) })),
    // Las woff2 ya vienen comprimidas: cuentan tal cual.
    ...[...fuentes].map((p) => ({ archivo: p, bytes: readFileSync(join(dist, p)).length })),
  ];
  return { filas, total: filas.reduce((s, f) => s + f.bytes, 0) };
}

// Corre solo cuando se llama como script (las pruebas importan medirPrimeraPantalla).
if (process.argv[1]?.endsWith('presupuesto.mjs')) {
  const { filas, total } = medirPrimeraPantalla(join(process.cwd(), 'dist'));
  for (const f of filas.sort((a, b) => b.bytes - a.bytes)) console.log(`${(f.bytes / 1024).toFixed(1).padStart(7)} KB  ${f.archivo}`);
  const kb = total / 1024;
  console.log(`${kb.toFixed(1).padStart(7)} KB  total antes de la primera pantalla (límite ${LIMITE_KB} KB)`);
  if (kb > LIMITE_KB) {
    console.error(`✗ Se pasa del presupuesto por ${(kb - LIMITE_KB).toFixed(1)} KB: carga después lo que no se ve en el inicio.`);
    process.exit(1);
  }
}
