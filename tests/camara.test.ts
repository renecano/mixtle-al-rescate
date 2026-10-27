import { describe, expect, it } from 'vitest';
// Lista oficial de clases que devuelve MobileNet (la misma que usa el juego en el navegador).
import { IMAGENET_CLASSES } from '@tensorflow-models/mobilenet/dist/imagenet_classes';
import { CATEGORIAS, type Categoria } from '../src/data/categorias';
import { MAPEO_IMAGENET } from '../src/data/mapeoImagenet';
import { categoriaDe } from '../src/logica/clasificacion';
import { interpretar, resolverEtiqueta } from '../src/logica/interpretacion';
import { motivoDeError } from '../src/servicios/camara';
import { urlArchivoModelo } from '../src/servicios/clasificador/teachableMachine';

const CLASES = new Set(Object.values(IMAGENET_CLASSES as Record<number, string>));
const UMBRAL = 0.3;

describe('mapeo de ImageNet', () => {
  const entradas = Object.entries(MAPEO_IMAGENET);

  it('MobileNet tiene 1000 clases (ImageNet repite un par de nombres)', () => {
    expect(Object.values(IMAGENET_CLASSES)).toHaveLength(1000);
    expect(CLASES.size).toBeGreaterThan(990);
  });

  it.each(entradas.map(([k]) => [k]))('"%s" es una clase real de ImageNet', (etiqueta) => {
    expect(CLASES.has(etiqueta)).toBe(true);
  });

  it.each(entradas)('"%s" apunta solo a una categoría existente', (_etiqueta, entrada) => {
    const categoria = categoriaDe(entrada, CATEGORIAS);
    expect(categoria).not.toBeNull();
    expect(CATEGORIAS.map((c) => c.id)).toContain(categoria!.id);
    expect(entrada.nombre.trim().length).toBeGreaterThan(0);
  });

  it('cubre las tres categorías por defecto', () => {
    const usadas = new Set(entradas.map(([, e]) => categoriaDe(e, CATEGORIAS)?.id));
    for (const c of CATEGORIAS) expect(usadas.has(c.id)).toBe(true);
  });

  it('sigue apuntando a botes existentes con 2 categorías', () => {
    const dos: Categoria[] = [
      { ...CATEGORIAS[0]! },
      { ...CATEGORIAS[1]!, id: 'inorganico', nombre: 'Inorgánico', acepta: ['reciclable', 'no-reciclable'] },
    ];
    for (const [, e] of entradas) expect(categoriaDe(e, dos)).not.toBeNull();
  });
});

describe('interpretar lo que ve la cámara', () => {
  it('con confianza suficiente, Caco dice qué es', () => {
    const r = interpretar([{ etiqueta: 'banana', probabilidad: 0.82 }], MAPEO_IMAGENET, CATEGORIAS, UMBRAL);
    expect(r).toMatchObject({ tipo: 'seguro', nombre: 'un plátano', categoria: { id: 'organico' } });
  });

  it('con confianza baja, pide ayuda', () => {
    const r = interpretar([{ etiqueta: 'water bottle', probabilidad: 0.12 }], MAPEO_IMAGENET, CATEGORIAS, UMBRAL);
    expect(r.tipo).toBe('duda');
  });

  it('si la etiqueta no está en la tabla, pide ayuda', () => {
    const r = interpretar([{ etiqueta: 'tabby, tabby cat', probabilidad: 0.95 }], MAPEO_IMAGENET, CATEGORIAS, UMBRAL);
    expect(r).toEqual({ tipo: 'duda', mejor: { etiqueta: 'tabby, tabby cat', probabilidad: 0.95 } });
  });

  it('si lo principal es otra cosa muy segura, no adivina con una opción secundaria', () => {
    const r = interpretar(
      [
        { etiqueta: 'water bottle', probabilidad: 0.31 },
        { etiqueta: 'jersey, T-shirt, tee shirt', probabilidad: 0.6 },
      ],
      MAPEO_IMAGENET,
      CATEGORIAS,
      UMBRAL,
    );
    expect(r.tipo).toBe('duda');
  });

  it('usa la mejor opción conocida aunque no sea la primera si la primera es dudosa', () => {
    const r = interpretar(
      [
        { etiqueta: 'jersey, T-shirt, tee shirt', probabilidad: 0.4 },
        { etiqueta: 'pop bottle, soda bottle', probabilidad: 0.35 },
      ],
      MAPEO_IMAGENET,
      CATEGORIAS,
      UMBRAL,
    );
    expect(r).toMatchObject({ tipo: 'seguro', categoria: { id: 'reciclable' } });
  });

  it('sin predicciones pide ayuda', () => {
    expect(interpretar([], MAPEO_IMAGENET, CATEGORIAS, UMBRAL)).toEqual({ tipo: 'duda', mejor: null });
  });

  it('entiende etiquetas de Teachable Machine con el id del bote (sin importar acentos o mayúsculas)', () => {
    expect(resolverEtiqueta('organico', MAPEO_IMAGENET, CATEGORIAS)?.categoria.id).toBe('organico');
    expect(resolverEtiqueta('Orgánico', MAPEO_IMAGENET, CATEGORIAS)?.categoria.id).toBe('organico');
    expect(resolverEtiqueta('No reciclable', MAPEO_IMAGENET, CATEGORIAS)?.categoria.id).toBe('no-reciclable');
    expect(resolverEtiqueta('nada', MAPEO_IMAGENET, CATEGORIAS)).toBeNull();
  });
});

describe('cámara y modelo propio', () => {
  it('explica por qué no hay cámara', () => {
    expect(motivoDeError({ name: 'NotAllowedError' })).toBe('denegada');
    expect(motivoDeError({ name: 'NotFoundError' })).toBe('sin-camara');
    expect(motivoDeError({ name: 'NotReadableError' })).toBe('ocupada');
    expect(motivoDeError(new Error('x'))).toBe('error');
    expect(motivoDeError(null)).toBe('error');
  });

  it('arma la URL de Teachable Machine con o sin "/" final', () => {
    expect(urlArchivoModelo('https://teachablemachine.withgoogle.com/models/abc/', 'model.json')).toBe(
      'https://teachablemachine.withgoogle.com/models/abc/model.json',
    );
    expect(urlArchivoModelo('modelo', 'metadata.json')).toBe('modelo/metadata.json');
  });
});
