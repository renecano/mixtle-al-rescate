// Utilidades compartidas por los scripts de voz (Node, sin bash: funcionan en PowerShell).
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

export const RAIZ = process.cwd();
export const VENV = join(RAIZ, '.venv-voz');
export const MODELOS = join(RAIZ, '.voz-modelos');

/** Python del entorno virtual de voz. */
export function pythonDelEntorno() {
  return process.platform === 'win32' ? join(VENV, 'Scripts', 'python.exe') : join(VENV, 'bin', 'python');
}

/** Corre un comando mostrando su salida; termina con error claro si falla. */
export function correr(comando, args, opciones = {}) {
  const r = spawnSync(comando, args, { stdio: 'inherit', ...opciones });
  if (r.error) throw r.error;
  if (r.status !== 0) {
    console.error(`\n✗ Falló: ${comando} ${args.join(' ')}`);
    process.exit(r.status ?? 1);
  }
}

/** Corre un script de Python con el entorno de voz (y avisa si falta prepararlo). */
export function correrPython(script, args = []) {
  const python = pythonDelEntorno();
  if (!existsSync(python)) {
    console.error('Falta el entorno de voz. Corre primero:  npm run voz:preparar');
    process.exit(1);
  }
  correr(python, [join(RAIZ, 'scripts', 'voz', script), ...args], {
    env: { ...process.env, PYTHONIOENCODING: 'utf-8', PYTHONUTF8: '1' },
  });
}

/** Quita las claves de comentario ("$comentario"). */
export function sinComentarios(objeto = {}) {
  return Object.fromEntries(Object.entries(objeto).filter(([k]) => !k.startsWith('$')));
}

/**
 * Cambia cómo se escriben algunas palabras solo para la voz ("Mixtle" → "Míkstle",
 * "cacomixtle" → "cacomíkstle"), respetando mayúsculas y límites de palabra. El texto en pantalla no cambia.
 */
export function aplicadorDePronunciacion(diccionario = {}) {
  const entradas = Object.entries(sinComentarios(diccionario));
  return (texto) => {
    let resultado = texto;
    for (const [palabra, dicha] of entradas) {
      resultado = resultado.replace(new RegExp(`(?<![\\p{L}])${palabra}(?![\\p{L}])`, 'giu'), (encontrada) =>
        // Se respeta la mayúscula inicial de lo escrito ("Mixtle" → "Míkstle", "mixtle" → "míkstle").
        (encontrada[0] === encontrada[0].toUpperCase() ? dicha[0].toUpperCase() : dicha[0].toLowerCase()) + dicha.slice(1),
      );
    }
    return resultado;
  };
}
