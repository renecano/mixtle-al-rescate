// Convierte las recetas de src/servicios/recetasSonido.ts en audios (public/sonidos/<nombre>.mp3)
// para reproducirlos con Howler. Es el mismo sintetizador que antes sonaba en vivo con Web Audio:
// osciladores con barrido de frecuencia, envolvente exponencial y ruido filtrado (pasa banda).
// Uso: npm run sonidos:generar   (usa el ffmpeg del entorno de voz)
import { spawnSync } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { runnerImport } from 'vite';
import { MODELOS, RAIZ, correr, pythonDelEntorno } from '../voz/comun.mjs';

const FRECUENCIA = 44100;
const MAESTRO = 0.8;
const { RECETAS } = (await runnerImport('./src/servicios/recetasSonido.ts')).module;

/** Ruido blanco reproducible (mismo audio cada vez que se genera). */
function aleatorio(semilla) {
  let a = semilla >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), a | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return (((t ^ (t >>> 14)) >>> 0) / 4294967296) * 2 - 1;
  };
}

/** Filtro pasa banda (fórmulas RBJ), como el BiquadFilterNode "bandpass". */
function pasaBanda(f0, q) {
  const w = (2 * Math.PI * f0) / FRECUENCIA;
  const alfa = Math.sin(w) / (2 * q);
  const a0 = 1 + alfa;
  const [b0, b2, a1, a2] = [alfa / a0, -alfa / a0, (-2 * Math.cos(w)) / a0, (1 - alfa) / a0];
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  return (x) => {
    const y = b0 * x + b2 * x2 - a1 * y1 - a2 * y2;
    x2 = x1; x1 = x; y2 = y1; y1 = y;
    return y;
  };
}

function envolvente(t, nota) {
  const ataque = Math.min(0.015, nota.d / 3);
  const piso = 0.0001;
  if (t < 0 || t > nota.d) return 0;
  if (t < ataque) return piso * Math.pow(nota.vol / piso, t / ataque);
  return nota.vol * Math.pow(piso / nota.vol, (t - ataque) / (nota.d - ataque));
}

function onda(tipo, fase) {
  const x = fase - Math.floor(fase);
  if (tipo === 'sine') return Math.sin(2 * Math.PI * x);
  if (tipo === 'triangle') return 1 - 4 * Math.abs(x - 0.5);
  if (tipo === 'square') return x < 0.5 ? 1 : -1;
  return 2 * x - 1; // sawtooth
}

function renderizar(notas) {
  const fin = Math.max(...notas.map((n) => n.t + n.d)) + 0.05;
  const muestras = new Float32Array(Math.ceil(fin * FRECUENCIA));
  notas.forEach((n, i) => {
    const inicio = Math.floor(n.t * FRECUENCIA);
    const largo = Math.ceil(n.d * FRECUENCIA);
    const ruido = aleatorio(1234 + i);
    const filtro = pasaBanda(n.f, 1.2);
    let fase = 0;
    for (let k = 0; k < largo && inicio + k < muestras.length; k++) {
      const t = k / FRECUENCIA;
      const frecuencia = n.f2 ? n.f * Math.pow(n.f2 / n.f, t / n.d) : n.f;
      let valor;
      if (n.onda === 'ruido') valor = filtro(ruido());
      else {
        fase += frecuencia / FRECUENCIA;
        valor = onda(n.onda, fase);
      }
      muestras[inicio + k] += valor * envolvente(t, n) * MAESTRO;
    }
  });
  return muestras;
}

function wav(muestras) {
  const datos = Buffer.alloc(muestras.length * 2);
  muestras.forEach((m, i) => datos.writeInt16LE(Math.round(Math.max(-1, Math.min(1, m)) * 32767), i * 2));
  const cabecera = Buffer.alloc(44);
  cabecera.write('RIFF', 0);
  cabecera.writeUInt32LE(36 + datos.length, 4);
  cabecera.write('WAVEfmt ', 8);
  cabecera.writeUInt32LE(16, 16);
  cabecera.writeUInt16LE(1, 20); // PCM
  cabecera.writeUInt16LE(1, 22); // mono
  cabecera.writeUInt32LE(FRECUENCIA, 24);
  cabecera.writeUInt32LE(FRECUENCIA * 2, 28);
  cabecera.writeUInt16LE(2, 32);
  cabecera.writeUInt16LE(16, 34);
  cabecera.write('data', 36);
  cabecera.writeUInt32LE(datos.length, 40);
  return Buffer.concat([cabecera, datos]);
}

const ffmpeg = spawnSync(pythonDelEntorno(), ['-c', 'import imageio_ffmpeg; print(imageio_ffmpeg.get_ffmpeg_exe())'], { encoding: 'utf8' }).stdout?.trim();
if (!ffmpeg) {
  console.error('Falta el entorno con ffmpeg. Corre primero:  npm run voz:preparar');
  process.exit(1);
}
const salida = join(RAIZ, 'public', 'sonidos');
mkdirSync(salida, { recursive: true });
mkdirSync(MODELOS, { recursive: true });
for (const [nombre, notas] of Object.entries(RECETAS)) {
  const temporal = join(MODELOS, `${nombre}.wav`);
  writeFileSync(temporal, wav(renderizar(notas)));
  correr(ffmpeg, ['-y', '-loglevel', 'error', '-i', temporal, '-ac', '1', '-b:a', '96k', join(salida, `${nombre}.mp3`)]);
  rmSync(temporal);
  console.log(`✓ sonidos/${nombre}.mp3`);
}
