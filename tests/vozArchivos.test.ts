import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { configCorto, nombreDeSalida } from '../scripts/voz/firmas.mjs';
import { cyrb53 } from '../src/voz/hash';
import { planDeLocucion, type Manifiesto } from '../src/voz/plan';

/*
 * El nombre de cada mp3 de voz lleva la configuración de voz: `<hash-texto>.<hash-config>.mp3`. Antes
 * era solo el hash del texto, así que al cambiar de voz el archivo conservaba el nombre con otro
 * contenido y cualquier caché (navegador, service worker, descarga sin internet) podía servir la copia
 * vieja. Con el nombre nuevo, un cambio de voz es una URL nueva en todas partes.
 */

const CARPETA = join(process.cwd(), 'public', 'voz');
const manifiesto = JSON.parse(readFileSync(join(CARPETA, 'manifiesto.json'), 'utf8')) as Manifiesto;
const CONFIG = { proveedor: 'azure', voz: 'es-MX-Alejo:MAI-Voice-2-Flash', ajustes: { estilo: 'excited' }, normalizacion: { $comentario: 'x', pausaS: 0.35 } };

describe('el nombre del archivo cambia con la voz', () => {
  it('lleva la clave de la frase y un hash corto de la configuración', () => {
    const cfg = configCorto(CONFIG, cyrb53);
    expect(cfg).toMatch(/^[0-9a-f]{8}$/);
    expect(nombreDeSalida('0123456789abcd.mp3', cfg)).toBe(`0123456789abcd.${cfg}.mp3`);
  });

  it('cambia si cambia la voz, el estilo o la normalización; no si cambia un comentario', () => {
    const base = configCorto(CONFIG, cyrb53);
    expect(configCorto({ ...CONFIG, voz: 'es-MX-JorgeNeural' }, cyrb53)).not.toBe(base);
    expect(configCorto({ ...CONFIG, ajustes: { estilo: '' } }, cyrb53)).not.toBe(base);
    expect(configCorto({ ...CONFIG, normalizacion: { ...CONFIG.normalizacion, pausaS: 0.3 } }, cyrb53)).not.toBe(base);
    expect(configCorto({ ...CONFIG, normalizacion: { ...CONFIG.normalizacion, $comentario: 'otro' } }, cyrb53)).toBe(base);
  });

  it('el juego pide el archivo publicado (con la configuración), no la clave', () => {
    const m: Manifiesto = { version: 1, frases: { [`${cyrb53('¡Hola!')}.mp3`]: { texto: '¡Hola!', ms: 500, archivo: `${cyrb53('¡Hola!')}.abcdef12.mp3` } } };
    expect(planDeLocucion('¡Hola!', m).archivos).toEqual([`${cyrb53('¡Hola!')}.abcdef12.mp3`]);
    // Un manifiesto sin `archivo` (anterior) sigue funcionando con la clave.
    expect(planDeLocucion('¡Hola!', { version: 1, frases: { [`${cyrb53('¡Hola!')}.mp3`]: { texto: '¡Hola!', ms: 500 } } }).archivos).toEqual([`${cyrb53('¡Hola!')}.mp3`]);
  });
});

describe('los audios publicados del juego', () => {
  const entradas = Object.entries(manifiesto.frases);

  it('cada entrada nombra su archivo con su clave y la configuración (o la huella de una grabación), y existe', () => {
    for (const [clave, e] of entradas) {
      expect(e.archivo, clave).toMatch(new RegExp(`^${clave.replace('.mp3', '')}\\.([0-9a-f]{8}|h[0-9a-f]{12})\\.mp3$`));
      expect(existsSync(join(CARPETA, e.archivo!)), e.archivo).toBe(true);
    }
  });

  it('todos los generados llevan la misma configuración de voz', () => {
    const sufijos = new Set(entradas.map(([, e]) => e.archivo!.split('.')[1]).filter((s) => !s!.startsWith('h')));
    expect(sufijos.size).toBe(1);
  });

  it('no hay dos entradas con el mismo archivo, ni mp3 sueltos que ningún manifiesto nombre', () => {
    const archivos = entradas.map(([, e]) => e.archivo!);
    expect(new Set(archivos).size).toBe(archivos.length);
    const enDisco = readdirSync(CARPETA).filter((n) => n.endsWith('.mp3'));
    expect(enDisco.filter((n) => !archivos.includes(n))).toEqual([]);
  });
});
