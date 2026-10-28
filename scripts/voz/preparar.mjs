// Prepara todo lo necesario para generar la voz de Mixtle:
//   1. Un entorno de Python en .venv-voz/ (ignorado por git) con Piper, Kokoro, edge-tts y ffmpeg.
//   2. Los modelos de voz en .voz-modelos/ (ignorado por git).
// Uso: npm run voz:preparar   (se puede repetir: lo que ya está no se vuelve a descargar)
import { spawnSync } from 'node:child_process';
import { createWriteStream, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { MODELOS, RAIZ, VENV, correr, pythonDelEntorno } from './comun.mjs';

const PIPER = 'https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/es/es_MX';
const KOKORO = 'https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0';

export const ARCHIVOS_MODELO = [
  { archivo: 'es_MX-ald-medium.onnx', url: `${PIPER}/ald/medium/es_MX-ald-medium.onnx` },
  { archivo: 'es_MX-ald-medium.onnx.json', url: `${PIPER}/ald/medium/es_MX-ald-medium.onnx.json` },
  { archivo: 'es_MX-claude-high.onnx', url: `${PIPER}/claude/high/es_MX-claude-high.onnx` },
  { archivo: 'es_MX-claude-high.onnx.json', url: `${PIPER}/claude/high/es_MX-claude-high.onnx.json` },
  { archivo: 'kokoro-v1.0.int8.onnx', url: `${KOKORO}/kokoro-v1.0.int8.onnx` },
  { archivo: 'voices-v1.0.bin', url: `${KOKORO}/voices-v1.0.bin` },
];

/** Busca un Python 3.10–3.12 (las bibliotecas de voz aún no publican paquetes para 3.13+ en todos los casos). */
function buscarPython() {
  const candidatos =
    process.platform === 'win32'
      ? [['py', ['-3.12']], ['py', ['-3.11']], ['py', ['-3.10']], ['python', []]]
      : [['python3.12', []], ['python3.11', []], ['python3', []]];
  for (const [cmd, args] of candidatos) {
    const r = spawnSync(cmd, [...args, '-c', 'import sys; print(sys.version_info[:2])'], { encoding: 'utf8' });
    const m = r.status === 0 && /\((\d+), (\d+)\)/.exec(r.stdout);
    if (m && Number(m[1]) === 3 && Number(m[2]) >= 10 && Number(m[2]) <= 12) return [cmd, args];
  }
  return null;
}

async function descargar(url, destino) {
  const respuesta = await fetch(url, { redirect: 'follow' });
  if (!respuesta.ok || !respuesta.body) throw new Error(`No se pudo descargar ${url}: ${respuesta.status}`);
  const total = Number(respuesta.headers.get('content-length') ?? 0);
  let recibido = 0;
  let ultimo = 0;
  const cuerpo = Readable.fromWeb(respuesta.body);
  cuerpo.on('data', (trozo) => {
    recibido += trozo.length;
    const pct = total ? Math.floor((recibido / total) * 100) : 0;
    if (pct >= ultimo + 10) {
      ultimo = pct;
      process.stdout.write(` ${pct}%`);
    }
  });
  await pipeline(cuerpo, createWriteStream(destino));
  process.stdout.write('\n');
}

if (!existsSync(pythonDelEntorno())) {
  const python = buscarPython();
  if (!python) {
    console.error(
      'No encontré Python 3.10, 3.11 o 3.12.\n' +
        'Instálalo desde https://www.python.org/downloads/release/python-3120/ (marca "Add python.exe to PATH")\n' +
        'y vuelve a correr:  npm run voz:preparar',
    );
    process.exit(1);
  }
  console.log(`Creando el entorno de voz en .venv-voz con ${python[0]} ${python[1].join(' ')}…`);
  correr(python[0], [...python[1], '-m', 'venv', VENV]);
}

console.log('Instalando bibliotecas de voz…');
correr(pythonDelEntorno(), ['-m', 'pip', 'install', '--disable-pip-version-check', '-q', '-r', join(RAIZ, 'scripts', 'voz', 'requirements.txt')]);

mkdirSync(MODELOS, { recursive: true });
for (const { archivo, url } of ARCHIVOS_MODELO) {
  const destino = join(MODELOS, archivo);
  if (existsSync(destino) && statSync(destino).size > 0) {
    console.log(`✓ ${archivo} (ya estaba)`);
    continue;
  }
  process.stdout.write(`Descargando ${archivo}…`);
  await descargar(url, destino);
}

// La configuración publicada de la voz "ald" trae "phoneme_type": "PhonemeType.ESPEAK", que las
// versiones actuales de Piper no aceptan; el valor correcto es "espeak". Se corrige aquí.
const configAld = join(MODELOS, 'es_MX-ald-medium.onnx.json');
const textoAld = readFileSync(configAld, 'utf8');
if (textoAld.includes('"PhonemeType.ESPEAK"')) {
  writeFileSync(configAld, textoAld.replace('"PhonemeType.ESPEAK"', '"espeak"'));
  console.log('✓ Corregida la configuración de la voz ald (phoneme_type).');
}
console.log('\nListo. Ahora puedes correr:  npm run voz:muestras');
