// Copia las pistas elegidas (scripts/musica/elegidas.json) a public/musica/<pista>.mp3,
// desde el original descargado, con volumen normalizado y tamaño moderado para la web.
// Uso: npm run musica:instalar   (antes: npm run musica:muestras, que descarga las candidatas)
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { RAIZ, correr, pythonDelEntorno } from '../voz/comun.mjs';

const elegidas = JSON.parse(readFileSync(join(RAIZ, 'scripts', 'musica', 'elegidas.json'), 'utf8'));
const { pistas } = JSON.parse(readFileSync(join(RAIZ, 'scripts', 'musica', 'candidatas.json'), 'utf8'));
const descargas = join(RAIZ, '.musica-descargas');
const ffmpeg = spawnSync(pythonDelEntorno(), ['-c', 'import imageio_ffmpeg; print(imageio_ffmpeg.get_ffmpeg_exe())'], { encoding: 'utf8' }).stdout?.trim();
if (!ffmpeg || !existsSync(descargas)) {
  console.error('Faltan las descargas o ffmpeg. Corre primero:  npm run voz:preparar  y  npm run musica:muestras');
  process.exit(1);
}
mkdirSync(join(RAIZ, 'public', 'musica'), { recursive: true });
for (const pista of pistas) {
  const id = elegidas[pista.id];
  const candidata = pista.candidatas.find((c) => c.id === id);
  if (!candidata) throw new Error(`"${id}" no es candidata de ${pista.id}`);
  const original = readdirSync(descargas).find((f) => f.startsWith(`${id}-extraido`)) ?? readdirSync(descargas).find((f) => f.startsWith(`${id}.`));
  if (!original) throw new Error(`No está descargada "${id}"`);
  // Música de fondo: estéreo 96 kbps; volumen normalizado (el juego la pone baja, ≈25 %).
  correr(ffmpeg, ['-y', '-loglevel', 'error', '-i', join(descargas, original), '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11', '-ac', '2', '-ar', '44100', '-b:a', '96k', join(RAIZ, 'public', 'musica', `${pista.id}.mp3`)]);
  console.log(`✓ musica/${pista.id}.mp3 ← ${candidata.titulo} (${candidata.autor}, ${candidata.licencia})`);
}
