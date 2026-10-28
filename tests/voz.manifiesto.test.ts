import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { CATEGORIAS } from '../src/data/categorias';
import { RESIDUOS } from '../src/data/residuos';
import { TEXTOS } from '../src/data/textos';
import { textoAcierto, textoPista } from '../src/logica/clasificacion';
import { TEXTOS_APP } from '../src/contenido/textosApp';
import { narracionesCompletas, todasLasFrases } from '../src/voz/frases';
import { archivoDeFrase, cyrb53 } from '../src/voz/hash';
import { numeroEnPalabras, piezasDeTexto, textoDeLocucion, textoHablado, type Locucion } from '../src/voz/locucion';
import { planDeLocucion, type Manifiesto } from '../src/voz/plan';

const CARPETA = join(process.cwd(), 'public', 'voz');
const manifiesto = JSON.parse(readFileSync(join(CARPETA, 'manifiesto.json'), 'utf8')) as Manifiesto;

describe('números en palabras (para encadenar audios)', () => {
  it.each([
    [0, false, 'cero'],
    [1, false, 'uno'],
    [1, true, 'un'],
    [15, false, 'quince'],
    [21, true, 'veintiún'],
    [22, false, 'veintidós'],
    [30, false, 'treinta'],
    [31, true, 'treinta y un'],
    [47, false, 'cuarenta y siete'],
    [100, false, 'cien'],
  ] as const)('%i → "%s"', (n, ante, palabra) => {
    expect(numeroEnPalabras(n, ante)).toBe(palabra);
  });

  it('rechaza números fuera de 0–100', () => {
    expect(() => numeroEnPalabras(101)).toThrow();
    expect(() => numeroEnPalabras(-1)).toThrow();
    expect(() => numeroEnPalabras(2.5)).toThrow();
  });

  it('el subtítulo usa cifras y la voz palabras', () => {
    const l = TEXTOS.diploma.narracion(13, 1);
    expect(textoDeLocucion(l)).toBe('¡Felicidades, guardianes del parque! Separaron bien 13 residuos y ayudaron a 1 animal.');
    expect(piezasDeTexto(l)).toEqual(['¡Felicidades, guardianes del parque! Separaron bien', 'trece', 'residuos y ayudaron a', 'un', 'animal.']);
  });
});

describe('nombre de archivo de cada frase', () => {
  it('es estable (las grabaciones humanas dependen de él)', () => {
    expect(cyrb53('¡Hola! Soy Caco, el cacomixtle del parque.')).toBe(cyrb53('¡Hola! Soy Caco, el cacomixtle del parque.'));
    expect(archivoDeFrase('¡Hola! Soy Caco, el cacomixtle del parque.')).toMatch(/^[0-9a-f]{14}\.mp3$/);
    expect(cyrb53('a')).not.toBe(cyrb53('b'));
  });

  it('no cambia por espacios de más', () => {
    expect(archivoDeFrase('  ¡Muy  bien! ')).toBe(archivoDeFrase('¡Muy bien!'));
  });

  it('no hay dos frases distintas con el mismo archivo', () => {
    const frases = todasLasFrases();
    expect(new Set(frases.map((f) => f.archivo)).size).toBe(frases.length);
    expect(new Set(frases.map((f) => f.texto)).size).toBe(frases.length);
  });
});

describe('toda frase narrada tiene su audio', () => {
  const frases = todasLasFrases();

  it.each(frases.map((f) => [f.id, f] as const))('%s está en el manifiesto y su mp3 existe', (_id, f) => {
    const entrada = manifiesto.frases[f.archivo];
    expect(entrada, `Falta audio de "${f.texto}" → npm run voz:generar`).toBeDefined();
    expect(entrada!.texto).toBe(f.texto);
    expect(entrada!.ms).toBeGreaterThan(200);
    expect(existsSync(join(CARPETA, f.archivo))).toBe(true);
  });

  it('el manifiesto no guarda audios que ya no se usan', () => {
    const enUso = new Set(frases.map((f) => f.archivo));
    expect(Object.keys(manifiesto.frases).filter((a) => !enUso.has(a))).toEqual([]);
  });

  const sinAudio = (l: Locucion) => planDeLocucion(l, manifiesto).faltantes;

  it('todo lo que dice Caco en la aventura de la unidad 1 se puede decir con audio', () => {
    const locuciones: Locucion[] = [
      ...TEXTOS.intro,
      TEXTOS.nivel1.instruccion,
      TEXTOS.nivel2.instruccion,
      ...RESIDUOS.map((r) => TEXTOS.nivel2.pregunta(r.nombre)),
      ...RESIDUOS.flatMap((r) => TEXTOS.nivel2.celebraciones.map((c) => textoAcierto(r, c))),
      ...CATEGORIAS.map(textoPista),
      ...Object.values(TEXTOS.nivel3),
      TEXTOS.bonus.bienvenida,
      TEXTOS.bonus.seCayo,
      TEXTOS.bonus.fin,
    ];
    expect(locuciones.flatMap(sinAudio)).toEqual([]);
  });

  it('los resúmenes con números (fin de lección, cofre, diplomas) suenan de corrido: un solo audio', () => {
    const lista = narracionesCompletas();
    expect(lista.length).toBeGreaterThan(100);
    for (const n of lista) {
      const plan = planDeLocucion(n.locucion, manifiesto);
      expect(plan.archivos, `${n.id}: "${textoHablado(n.locucion)}"`).toHaveLength(1);
    }
  });

  it('el resumen de la lección dice "salió" con uno y "salieron" con varios', () => {
    expect(textoHablado(TEXTOS_APP.leccion.terminada(11, 1, 6))).toBe('¡Lección terminada! Ganaron once hojitas, y uno de seis ejercicios salió a la primera.');
    expect(textoHablado(TEXTOS_APP.leccion.terminada(15, 5, 6))).toBe('¡Lección terminada! Ganaron quince hojitas, y cinco de seis ejercicios salieron a la primera.');
  });

  it('la narración del diploma tiene audio para cualquier resultado de 0 a 100', () => {
    for (let r = 0; r <= 100; r++) {
      for (const a of [0, 1, 2, r]) expect(sinAudio(TEXTOS.diploma.narracion(r, a))).toEqual([]);
    }
  });

  it('el plan suma las duraciones de las piezas', () => {
    const l = TEXTOS.diploma.narracion(2, 3);
    const plan = planDeLocucion(l, manifiesto);
    expect(plan.archivos).toHaveLength(5);
    expect(plan.ms).toBeGreaterThan(2000);
    expect(planDeLocucion('Una frase que no existe', manifiesto)).toMatchObject({ archivos: null, faltantes: ['Una frase que no existe'] });
    expect(planDeLocucion('¡Hola!', null).archivos).toBeNull();
  });
});
