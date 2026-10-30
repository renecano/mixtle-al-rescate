// Cuánto silencio tienen los audios de la voz: duración total, silencio (pausas de 0.1 s o más por
// debajo de -50 dB), lo hablado (duración menos silencio) y lo fuerte (tiempo por encima de -35 dB:
// las sílabas). Lo fuerte sirve para revisar que recortar el silencio no corte sílabas: debe quedar
// igual antes y después (lo hablado también, salvo por los bordes que se dejan).
// Uso: node scripts/voz/medir-silencio.mjs [carpeta=public/voz] [--salida=archivo.json]
import { spawn } from 'node:child_process';
import { readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ffmpegDelEntorno } from './comun.mjs';

export const UMBRAL_DB = -50;
export const PAUSA_MINIMA_S = 0.1;
/** Por encima de esto es una sílaba (o un sonido fuerte), no un resto de respiración. */
export const UMBRAL_FUERTE_DB = -35;

const carpeta = process.argv.slice(2).find((a) => !a.startsWith('--')) ?? join('public', 'voz');
const salida = process.argv.find((a) => a.startsWith('--salida='))?.slice(9);
const ffmpeg = ffmpegDelEntorno();

/** Duración y tiempo por debajo de un umbral (en pausas de al menos `minimo` s), con silencedetect. */
function debajoDe(archivo, umbralDb, minimo) {
  return new Promise((resolver, fallar) => {
    const p = spawn(ffmpeg, ['-hide_banner', '-nostats', '-i', archivo, '-af', `silencedetect=noise=${umbralDb}dB:d=${minimo}`, '-f', 'null', '-']);
    let texto = '';
    p.stderr.on('data', (d) => (texto += d));
    p.on('error', fallar);
    p.on('close', () => {
      const d = texto.match(/Duration: (\d+):(\d+):(\d+(?:\.\d+)?)/);
      if (!d) return fallar(new Error(`Sin duración: ${archivo}`));
      const duracion = Number(d[1]) * 3600 + Number(d[2]) * 60 + Number(d[3]);
      const silencios = [...texto.matchAll(/silence_duration: (\d+(?:\.\d+)?)/g)].map((m) => Number(m[1]));
      // Un silencio que llega hasta el final no siempre trae silence_duration: se calcula con su inicio.
      const inicios = [...texto.matchAll(/silence_start: (-?\d+(?:\.\d+)?)/g)].map((m) => Number(m[1]));
      if (inicios.length > silencios.length) silencios.push(Math.max(0, duracion - inicios.at(-1)));
      resolver({ duracion, debajo: silencios.reduce((a, b) => a + b, 0) });
    });
  });
}

/** Duración, silencio, hablado y fuerte de un archivo. */
export async function medir(archivo) {
  const { duracion, debajo: silencio } = await debajoDe(archivo, UMBRAL_DB, PAUSA_MINIMA_S);
  const { debajo: flojo } = await debajoDe(archivo, UMBRAL_FUERTE_DB, 0.02);
  return { duracion, silencio, hablado: duracion - silencio, fuerte: duracion - flojo };
}

const archivos = readdirSync(carpeta).filter((n) => n.endsWith('.mp3')).sort();
const resultados = [];
let i = 0;
await Promise.all(
  Array.from({ length: 4 }, async () => {
    while (i < archivos.length) {
      const nombre = archivos[i++];
      const ruta = join(carpeta, nombre);
      resultados.push({ archivo: nombre, bytes: statSync(ruta).size, ...(await medir(ruta)) });
    }
  }),
);
resultados.sort((a, b) => a.archivo.localeCompare(b.archivo));
const suma = (k) => resultados.reduce((n, r) => n + r[k], 0);
const resumen = {
  carpeta,
  archivos: resultados.length,
  duracionS: Number(suma('duracion').toFixed(1)),
  silencioS: Number(suma('silencio').toFixed(1)),
  habladoS: Number(suma('hablado').toFixed(1)),
  fuerteS: Number(suma('fuerte').toFixed(1)),
  porcentajeSilencio: Number(((suma('silencio') / suma('duracion')) * 100).toFixed(1)),
  mb: Number((suma('bytes') / 1e6).toFixed(2)),
  criterio: `silencio = pausas de ${PAUSA_MINIMA_S} s o más por debajo de ${UMBRAL_DB} dB; fuerte = tiempo por encima de ${UMBRAL_FUERTE_DB} dB (silencedetect)`,
};
console.log(JSON.stringify(resumen));
const redondear = (r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, typeof v === 'number' && !Number.isInteger(v) ? Number(v.toFixed(3)) : v]));
if (salida) writeFileSync(salida, `${JSON.stringify({ resumen, archivos: resultados.map(redondear) }, null, 1)}\n`);
