// Exporta docs/frases-mixtle.csv: todas las frases de Mixtle con el nombre de archivo de su audio.
// Sirve para regrabarlas con una voz humana (o con otra herramienta) usando los mismos nombres.
// Uso: npm run voz:lista
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { RAIZ } from './comun.mjs';

const celda = (v) => `"${String(v).replace(/"/g, '""')}"`;

export function escribirCsv(frases) {
  const filas = [['id', 'archivo', 'texto', 'unidad', 'leccion'], ...frases.map((f) => [f.id, f.archivo, f.texto, f.unidad, f.leccion])];
  // BOM para que Excel en Windows abra bien los acentos.
  writeFileSync(join(RAIZ, 'docs', 'frases-mixtle.csv'), `\uFEFF${filas.map((f) => f.map(celda).join(',')).join('\r\n')}\r\n`);
  console.log(`docs/frases-mixtle.csv: ${frases.length} frases`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const { runnerImport } = await import('vite');
  const { todasLasFrases } = (await runnerImport('./src/voz/frases.ts')).module;
  escribirCsv(todasLasFrases());
}
