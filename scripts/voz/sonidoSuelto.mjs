// Detecta en un audio un "sonido suelto": un tramo corto de sonido (hasta 0.6 s) después de una pausa
// interna larga (0.7 s o más). Con el estilo «excited», Azure a veces agrega uno al final de palabras
// sueltas (por ejemplo, tras "tres" o "sesenta y un"); sin el estilo no pasa, y de una toma a otra
// cambia, así que la solución es pedir otra toma, no cortar (podría ser una sílaba).
import { spawn } from 'node:child_process';
import { ffmpegDelEntorno } from './comun.mjs';

export const UMBRAL_DB = -50;
export const PAUSA_LARGA_S = 0.7;
export const SONIDO_CORTO_S = 0.6;

/** Duración y silencios (inicio, fin, duración) de un audio, con silencedetect. */
export function silencios(ruta, ffmpeg = ffmpegDelEntorno()) {
  return new Promise((resolver, fallar) => {
    const p = spawn(ffmpeg, ['-hide_banner', '-nostats', '-i', ruta, '-af', `silencedetect=noise=${UMBRAL_DB}dB:d=0.1`, '-f', 'null', '-']);
    let t = '';
    p.stderr.on('data', (d) => (t += d));
    p.on('error', fallar);
    p.on('close', () => {
      const d = t.match(/Duration: (\d+):(\d+):(\d+(?:\.\d+)?)/);
      if (!d) return fallar(new Error(`Sin duración: ${ruta}`));
      const duracion = Number(d[1]) * 3600 + Number(d[2]) * 60 + Number(d[3]);
      const inicios = [...t.matchAll(/silence_start: (-?[\d.]+)/g)].map((m) => Number(m[1]));
      const fines = [...t.matchAll(/silence_end: ([\d.]+)/g)].map((m) => Number(m[1]));
      resolver({ duracion, silencios: inicios.map((inicio, i) => ({ inicio: Math.max(0, inicio), fin: fines[i] ?? duracion })) });
    });
  });
}

/** Cuántos sonidos sueltos tiene el audio (0 si está limpio). */
export async function sonidosSueltos(ruta, ffmpeg) {
  const { duracion, silencios: s } = await silencios(ruta, ffmpeg);
  let n = 0;
  for (let i = 0; i < s.length; i++) {
    const pausa = s[i];
    const esInterna = pausa.inicio > 0.05 && pausa.fin < duracion - 0.05;
    if (!esInterna || pausa.fin - pausa.inicio < PAUSA_LARGA_S) continue;
    const finDelSonido = s[i + 1]?.inicio ?? duracion;
    if (finDelSonido - pausa.fin <= SONIDO_CORTO_S) n++;
  }
  return n;
}
