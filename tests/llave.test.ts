// @vitest-environment node
import { execSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/*
 * La llave de Azure solo vive en .env.local de la computadora que genera las voces. Nunca en el
 * repositorio, nunca en dist/ (lo que se publica) y nunca en código que llegue al navegador.
 */
const RAIZ = join(__dirname, '..');
const llave = (() => {
  // Igual que scripts/voz/azure.mjs: primero la variable de entorno, luego .env.local.
  if (process.env.AZURE_SPEECH_KEY) return process.env.AZURE_SPEECH_KEY.trim();
  const archivo = join(RAIZ, '.env.local');
  if (!existsSync(archivo)) return '';
  return readFileSync(archivo, 'utf8').match(/^\s*AZURE_SPEECH_KEY\s*=\s*"?([^"\r\n]+)"?/m)?.[1]?.trim() ?? '';
})();

function archivos(carpeta: string): string[] {
  return readdirSync(carpeta).flatMap((n) => {
    const ruta = join(carpeta, n);
    return statSync(ruta).isDirectory() ? archivos(ruta) : [ruta];
  });
}

describe('la llave de Azure está protegida', () => {
  it('.env.local está ignorado por git', () => {
    expect(execSync('git check-ignore .env.local', { cwd: RAIZ, encoding: 'utf8' }).trim()).toBe('.env.local');
    expect(execSync('git ls-files .env.local .env', { cwd: RAIZ, encoding: 'utf8' }).trim()).toBe('');
  });

  it('el código del juego (lo que llega al navegador) no lee la llave ni usa VITE_AZURE', () => {
    const delJuego = archivos(join(RAIZ, 'src')).filter((f) => /\.(tsx?|css|html)$/.test(f));
    const usos = delJuego.filter((f) => /AZURE_SPEECH|VITE_AZURE/.test(readFileSync(f, 'utf8')));
    expect(usos).toEqual([]);
    // git grep sale con 1 cuando no encuentra nada: eso es lo esperado.
    let repo: string;
    try {
      repo = execSync('git grep -l "VITE_AZURE" -- ":!tests/llave.test.ts"', { cwd: RAIZ, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    } catch {
      repo = '';
    }
    expect(repo).toBe('');
  });

  it('ni el repositorio ni dist/ contienen el valor de la llave (si ya está en .env.local)', () => {
    if (!llave) return; // Sin llave todavía: no hay valor que buscar.
    const delRepo = execSync('git ls-files', { cwd: RAIZ, encoding: 'utf8' })
      .split('\n')
      .filter(Boolean)
      .map((f) => join(RAIZ, f))
      .filter((f) => existsSync(f) && statSync(f).size < 5_000_000);
    const publicados = existsSync(join(RAIZ, 'dist')) ? archivos(join(RAIZ, 'dist')) : [];
    const conLlave = [...delRepo, ...publicados].filter((f) => readFileSync(f).includes(llave));
    expect(conLlave.map((f) => f.slice(RAIZ.length + 1))).toEqual([]);
  });

  it('lo publicado (dist/) no menciona la llave ni el servicio de voz', () => {
    if (!existsSync(join(RAIZ, 'dist'))) return;
    const conAzure = archivos(join(RAIZ, 'dist')).filter((f) => /\.(js|html|json)$/.test(f) && /AZURE_SPEECH|tts\.speech\.microsoft\.com/.test(readFileSync(f, 'utf8')));
    expect(conAzure).toEqual([]);
  });
});
