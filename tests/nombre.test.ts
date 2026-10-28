import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { todasLasFrases } from '../src/voz/frases';

/*
 * El personaje se llama Mixtle. "Caco" ya no debe aparecer como nombre en nada que se vea o se oiga.
 * "cacomixtle" sí (es el animal), y el nombre anterior solo vive en la migración de datos guardados.
 */
const COMO_NOMBRE = /\bcaco\b/i; // "Caco", "caco" sueltos; no coincide con "cacomixtle"
const RAIZ = join(__dirname, '..');

function archivos(carpeta: string): string[] {
  return readdirSync(carpeta).flatMap((n) => {
    const ruta = join(carpeta, n);
    return statSync(ruta).isDirectory() ? archivos(ruta) : [ruta];
  });
}

describe('el personaje se llama Mixtle', () => {
  it('ninguna frase narrada dice "Caco" (sí puede decir "cacomixtle")', () => {
    const frases = todasLasFrases();
    expect(frases.length).toBeGreaterThan(500);
    const conCaco = frases.filter((f) => COMO_NOMBRE.test(f.texto)).map((f) => `${f.id}: ${f.texto}`);
    expect(conCaco).toEqual([]);
    expect(frases.some((f) => /cacomixtle/i.test(f.texto))).toBe(true);
    expect(frases.some((f) => /\bMixtle\b/.test(f.texto))).toBe(true);
  });

  it('ningún texto del juego (código, página, manifiesto de la app) dice "Caco"', () => {
    // Solo la migración y la mudanza pueden nombrar la dirección y las claves anteriores ("caco-al-rescate").
    const permitidos = ['src/servicios/migracion.ts', 'src/servicios/mudanza.ts'].map((r) => join(RAIZ, r));
    const revisar = [...archivos(join(RAIZ, 'src')), join(RAIZ, 'index.html'), join(RAIZ, 'vite.config.ts')].filter(
      (f) => /\.(tsx?|html|css|json)$/.test(f) && !permitidos.includes(f),
    );
    const hallazgos = revisar.flatMap((f) =>
      readFileSync(f, 'utf8')
        .split('\n')
        .map((linea, i) => ({ f, i: i + 1, linea }))
        .filter(({ linea }) => COMO_NOMBRE.test(linea.replace(/caco-al-rescate/g, ''))),
    );
    expect(hallazgos.map(({ f, i, linea }) => `${f.slice(RAIZ.length + 1)}:${i}: ${linea.trim()}`)).toEqual([]);
  });

  it('el juego se llama "Mixtle al rescate" (título, app instalable) y su lema es "Guardianes del parque"', () => {
    const html = readFileSync(join(RAIZ, 'index.html'), 'utf8');
    expect(html).toContain('<title>Mixtle al rescate</title>');
    const config = readFileSync(join(RAIZ, 'vite.config.ts'), 'utf8');
    expect(config).toContain("name: 'Mixtle al rescate'");
    expect(config).toContain("short_name: 'Mixtle'");
    expect(todasLasFrases().some((f) => f.texto.includes('Guardianes del parque') || f.texto.includes('guardianes del parque'))).toBe(true);
  });
});
