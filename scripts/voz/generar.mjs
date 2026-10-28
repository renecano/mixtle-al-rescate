// Genera la voz de Mixtle para todas las frases del juego.
//   - Junta las frases de los archivos de contenido (src/voz/frases.ts).
//   - Las genera con el proveedor, la voz y los ajustes de voz.config.json (aplicando su diccionario de pronunciación).
//   - Guarda public/voz/<hash>.mp3 (mono 64 kbps, volumen normalizado) y public/voz/manifiesto.json.
//   - Solo regenera lo nuevo o lo que cambió (texto o configuración).
//   - Si existe una grabación humana en voz-grabaciones/<hash>.(mp3|wav|m4a|ogg), se usa esa en lugar de la voz generada.
//   - Actualiza docs/frases-mixtle.csv (la lista para regrabar).
// Uso: npm run voz:generar   (antes, una vez: npm run voz:preparar)
//      npm run voz:generar -- --max=50   genera solo 50 y para (la siguiente corrida sigue)
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { runnerImport } from 'vite';
import { MODELOS, RAIZ, pythonDelEntorno } from './comun.mjs';
import { escribirCsv } from './lista.mjs';

const CARPETA_VOZ = join(RAIZ, 'public', 'voz');
const GRABACIONES = join(RAIZ, 'voz-grabaciones');
const RUTA_MANIFIESTO = join(CARPETA_VOZ, 'manifiesto.json');

const config = JSON.parse(readFileSync(join(RAIZ, 'voz.config.json'), 'utf8'));
const { cyrb53 } = (await runnerImport('./src/voz/hash.ts')).module;
const { todasLasFrases } = (await runnerImport('./src/voz/frases.ts')).module;

/**
 * Firma de cada audio: proveedor, voz, estilo y ajustes, y el texto tal como lo lee la voz (con la
 * pronunciación ya aplicada). Si cambia la voz o un ajuste, se regenera todo; si cambia una palabra
 * del diccionario, solo las frases que la tienen.
 */
const configVoz = limpiar(config);
delete configVoz.pronunciacion;
const firmaDe = (textoVoz) => cyrb53(JSON.stringify({ ...configVoz, texto: textoVoz }));

function limpiar(objeto = {}) {
  return Object.fromEntries(Object.entries(objeto).filter(([k]) => !k.startsWith('$')));
}

/** Cambia cómo se escriben algunas palabras solo para la voz ("Mixtle" → "Míkstle", "cacomixtle" → "cacomíkstle"). */
function aplicarPronunciacion(texto) {
  let resultado = texto;
  for (const [palabra, dicha] of Object.entries(limpiar(config.pronunciacion))) {
    resultado = resultado.replace(new RegExp(`(?<![\\p{L}])${palabra}(?![\\p{L}])`, 'giu'), (encontrada) =>
      encontrada[0] === encontrada[0].toUpperCase() ? dicha[0].toUpperCase() + dicha.slice(1) : dicha,
    );
  }
  return resultado;
}

function grabacionHumana(archivo) {
  const base = archivo.replace(/\.mp3$/, '');
  for (const ext of ['mp3', 'wav', 'm4a', 'ogg']) {
    const ruta = join(GRABACIONES, `${base}.${ext}`);
    if (existsSync(ruta)) return ruta;
  }
  return null;
}

const huella = (ruta) => `humana:${createHash('sha1').update(readFileSync(ruta)).digest('hex').slice(0, 12)}`;

const frases = todasLasFrases();
const manifiesto = existsSync(RUTA_MANIFIESTO) ? JSON.parse(readFileSync(RUTA_MANIFIESTO, 'utf8')) : { version: 1, frases: {} };
const trabajos = [];
for (const f of frases) {
  const actual = manifiesto.frases[f.archivo];
  const grabacion = grabacionHumana(f.archivo);
  const textoVoz = aplicarPronunciacion(f.texto);
  const firma = grabacion ? huella(grabacion) : firmaDe(textoVoz);
  const vigente = actual && actual.config === firma && actual.texto === f.texto && existsSync(join(CARPETA_VOZ, f.archivo));
  if (vigente) continue;
  trabajos.push(grabacion ? { archivo: f.archivo, texto: f.texto, grabacion, firma } : { archivo: f.archivo, texto: textoVoz, original: f.texto, firma });
}

console.log(`${frases.length} frases; por generar: ${trabajos.length}${trabajos.length ? '' : ' (todo al día)'}`);
// --max=N genera solo N frases en esta corrida (útil en máquinas lentas; la siguiente corrida continúa).
const max = Number(process.argv.find((x) => x.startsWith('--max='))?.slice(6) ?? Infinity);
if (trabajos.length > max) {
  trabajos.splice(max);
  console.log(`En esta corrida: ${max}`);
}
if (trabajos.length) {
  const python = pythonDelEntorno();
  if (!existsSync(python)) {
    console.error('Falta el entorno de voz. Corre primero:  npm run voz:preparar');
    process.exit(1);
  }
  mkdirSync(MODELOS, { recursive: true });
  const rutaTrabajos = join(MODELOS, 'trabajos.json');
  writeFileSync(rutaTrabajos, JSON.stringify(trabajos));
  const r = spawnSync(python, [join(RAIZ, 'scripts', 'voz', 'generar.py'), join(RAIZ, 'voz.config.json'), rutaTrabajos], {
    cwd: RAIZ,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'inherit'],
    env: { ...process.env, PYTHONIOENCODING: 'utf-8', PYTHONUTF8: '1' },
    maxBuffer: 64 * 1024 * 1024,
  });
  // Se guarda lo que sí se generó aunque algo falle a la mitad: la siguiente vez continúa desde ahí.
  const porArchivo = new Map(trabajos.map((t) => [t.archivo, t]));
  for (const linea of (r.stdout ?? '').split('\n')) {
    if (!linea.startsWith('LISTO ')) continue;
    const { archivo, ms } = JSON.parse(linea.slice(6));
    const t = porArchivo.get(archivo);
    manifiesto.frases[archivo] = { texto: t.original ?? t.texto, ms, config: t.firma };
  }
  guardarManifiesto();
  if (r.status !== 0) {
    console.error('\n✗ La generación se interrumpió. Vuelve a correr npm run voz:generar para continuar.');
    process.exit(r.status ?? 1);
  }
}

// Quita del manifiesto (y del disco) las frases que el juego ya no usa.
const enUso = new Set(frases.map((f) => f.archivo));
let quitadas = 0;
for (const archivo of Object.keys(manifiesto.frases)) {
  if (enUso.has(archivo)) continue;
  delete manifiesto.frases[archivo];
  rmSync(join(CARPETA_VOZ, archivo), { force: true });
  quitadas += 1;
}
for (const archivo of existsSync(CARPETA_VOZ) ? readdirSync(CARPETA_VOZ) : []) {
  if (archivo.endsWith('.mp3') && !enUso.has(archivo)) {
    rmSync(join(CARPETA_VOZ, archivo));
    quitadas += 1;
  }
}
guardarManifiesto();
escribirCsv(frases);
console.log(`Listo. ${quitadas ? `${quitadas} audios que ya no se usan se borraron. ` : ''}Manifiesto: public/voz/manifiesto.json`);

function guardarManifiesto() {
  const ordenado = Object.fromEntries(Object.entries(manifiesto.frases).sort(([a], [b]) => a.localeCompare(b)));
  mkdirSync(CARPETA_VOZ, { recursive: true });
  writeFileSync(RUTA_MANIFIESTO, `${JSON.stringify({ version: 1, frases: ordenado }, null, 1)}\n`);
}
