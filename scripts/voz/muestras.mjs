// Genera docs/muestras-voz/: las mismas 3 frases de Caco con cada proveedor, voz y ajuste,
// y una página (index.html) para escucharlas lado a lado y elegir.
// Uso: npm run voz:muestras   (antes: npm run voz:preparar)
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { RAIZ, correrPython } from './comun.mjs';

correrPython('muestras.py');

const { frases, opciones } = JSON.parse(readFileSync(join(RAIZ, 'scripts', 'voz', 'muestras.json'), 'utf8'));
const escapar = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const PROVEEDORES = {
  piper: 'Piper — local y sin internet',
  kokoro: 'Kokoro — local y sin internet (Apache-2.0)',
  edge: 'edge-tts — voces neuronales de Microsoft (necesita internet al generar; servicio no oficial)',
};

const filas = opciones
  .map(
    (o) => `<tr><th scope="row">${escapar(o.nombre)}<br><code>${o.id}</code></th>${frases
      .map((f) => `<td><audio controls preload="none" src="${o.id}-${f.id}.mp3"></audio></td>`)
      .join('')}</tr>`,
  )
  .join('\n');

const html = `<!doctype html>
<html lang="es-MX"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Muestras de voz de Caco</title>
<style>
  body { font: 16px/1.5 system-ui, sans-serif; margin: 24px; color: #1d2b24; background: #fff8e7; }
  h1 { color: #1f6b4a; } table { border-collapse: collapse; width: 100%; } th, td { border: 1px solid #c9c2ad; padding: 8px; text-align: left; vertical-align: middle; }
  thead th { background: #1f6b4a; color: #fff; } tbody th { font-weight: 600; min-width: 16rem; } code { color: #6345a8; font-size: 13px; }
  audio { width: 100%; min-width: 14rem; } .grupo td { background: #ddf0cc; font-weight: 700; }
</style></head><body>
<h1>Muestras de voz de Caco</h1>
<p>Las mismas tres frases con cada opción. "Más lenta" (y "aguda" en edge-tts) es el ajuste pensado para niñas y niños.
Todas están normalizadas al mismo volumen. Elige una opción (su <code>id</code>) para generar todas las frases del juego.</p>
<table><thead><tr><th>Opción</th>${frases.map((f) => `<th>${f.id}<br><small>${escapar(f.texto)}</small></th>`).join('')}</tr></thead>
<tbody>
${Object.keys(PROVEEDORES)
  .map((p) => `<tr class="grupo"><td colspan="${frases.length + 1}">${PROVEEDORES[p]}</td></tr>\n${filas.split('\n').filter((_, i) => opciones[i].proveedor === p).join('\n')}`)
  .join('\n')}
</tbody></table>
</body></html>
`;
writeFileSync(join(RAIZ, 'docs', 'muestras-voz', 'index.html'), html);
console.log('\nAbre docs/muestras-voz/index.html para escucharlas.');
