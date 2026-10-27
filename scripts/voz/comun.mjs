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
