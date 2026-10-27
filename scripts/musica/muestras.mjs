// Descarga las canciones candidatas (solo CC0) de scripts/musica/candidatas.json, las convierte a MP3
// con el mismo volumen y arma docs/muestras-musica/index.html para escucharlas y elegir.
// Uso: npm run musica:muestras   (usa el ffmpeg del entorno de voz: antes, npm run voz:preparar)
import { spawnSync } from 'node:child_process';
import { createWriteStream, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { RAIZ, correr, pythonDelEntorno } from '../voz/comun.mjs';

const DESCARGAS = join(RAIZ, '.musica-descargas'); // originales, fuera de git
const SALIDA = join(RAIZ, 'docs', 'muestras-musica');
const { pistas } = JSON.parse(readFileSync(join(RAIZ, 'scripts', 'musica', 'candidatas.json'), 'utf8'));

const python = pythonDelEntorno();
if (!existsSync(python)) {
  console.error('Falta el entorno con ffmpeg. Corre primero:  npm run voz:preparar');
  process.exit(1);
}
const ffmpeg = spawnSync(python, ['-c', 'import imageio_ffmpeg; print(imageio_ffmpeg.get_ffmpeg_exe())'], { encoding: 'utf8' }).stdout.trim();

async function descargar(url, destino) {
  if (existsSync(destino)) return;
  const r = await fetch(url, { redirect: 'follow' });
  if (!r.ok || !r.body) throw new Error(`${url}: ${r.status}`);
  await pipeline(Readable.fromWeb(r.body), createWriteStream(destino));
}

/** Saca un archivo de un zip descargado (solo se leen datos; nada del zip se ejecuta). */
function extraerDelZip(zip, patron, destino) {
  const codigo = [
    'import re, sys, zipfile',
    'z = zipfile.ZipFile(sys.argv[1])',
    "nombres = [n for n in z.namelist() if re.search(sys.argv[2], n, re.I) and not n.startswith('__MACOSX')]",
    "if not nombres: sys.exit('No se encontró ' + sys.argv[2] + ' en el zip: ' + ', '.join(z.namelist()))",
    "open(sys.argv[3], 'wb').write(z.read(nombres[0]))",
    'print(nombres[0])',
  ].join('\n');
  correr(python, ['-I', '-c', codigo, zip, patron, destino]);
}

mkdirSync(DESCARGAS, { recursive: true });
const durMedidas = {};
for (const pista of pistas) {
  mkdirSync(join(SALIDA, pista.id), { recursive: true });
  for (const c of pista.candidatas) {
    const extension = c.url.split('.').pop();
    const original = join(DESCARGAS, `${c.id}.${extension}`);
    process.stdout.write(`${pista.id}/${c.id}… `);
    await descargar(c.url, original);
    let fuente = original;
    if (c.dentroDelZip) {
      fuente = join(DESCARGAS, `${c.id}-extraido.audio`);
      extraerDelZip(original, c.dentroDelZip, fuente);
    }
    const mp3 = join(SALIDA, pista.id, `${c.id}.mp3`);
    // Mismo volumen percibido para comparar con justicia (el volumen final lo controla el juego).
    correr(ffmpeg, ['-y', '-loglevel', 'error', '-i', fuente, '-af', 'loudnorm=I=-18:TP=-1.5:LRA=11', '-ac', '2', '-ar', '44100', '-b:a', '128k', mp3]);
    const info = spawnSync(ffmpeg, ['-hide_banner', '-i', mp3], { encoding: 'utf8' }).stderr;
    durMedidas[c.id] = /Duration: (\d+):(\d+):(\d+)/.exec(info)?.slice(2, 4).join(':') ?? '?';
    console.log(`✓ ${durMedidas[c.id]}`);
  }
}

const esc = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const secciones = pistas
  .map(
    (p) => `<h2>${esc(p.nombre)}</h2><table><thead><tr><th>Opción</th><th>Escuchar</th><th>Duración</th><th>Autor y licencia</th></tr></thead><tbody>${p.candidatas
      .map(
        (c) => `<tr><th scope="row">${esc(c.titulo)}<br><code>${p.id}/${c.id}</code></th><td><audio controls preload="none" src="${p.id}/${c.id}.mp3"></audio></td><td>${durMedidas[c.id]}</td><td>${esc(c.autor)} · ${esc(c.licencia)}<br><a href="${c.pagina}">${esc(c.pagina)}</a></td></tr>`,
      )
      .join('')}</tbody></table>`,
  )
  .join('\n');

writeFileSync(
  join(SALIDA, 'index.html'),
  `<!doctype html><html lang="es-MX"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Muestras de música de Caco</title>
<style>body{font:16px/1.5 system-ui,sans-serif;margin:24px;color:#1d2b24;background:#fff8e7}h1,h2{color:#1f6b4a}table{border-collapse:collapse;width:100%;margin-bottom:24px}th,td{border:1px solid #c9c2ad;padding:8px;text-align:left;vertical-align:middle}thead th{background:#1f6b4a;color:#fff}code{color:#6345a8;font-size:13px}audio{min-width:16rem;width:100%}</style>
</head><body><h1>Muestras de música de Caco</h1>
<p>Todas son <strong>CC0</strong> (dominio público), verificadas en su página de OpenGameArt. Están al mismo volumen para compararlas;
en el juego la música irá baja (≈25 %) y bajará más mientras habla Caco. Elige una por pista (su <code>id</code>).</p>
${secciones}
</body></html>
`,
);
console.log('\nAbre docs/muestras-musica/index.html para escucharlas.');
