import { describe, expect, it } from 'vitest';
import { elegirVoz, estimarDuracion, type VozDisponible } from '../src/servicios/eleccionVoz';

const v = (lang: string, name = lang, localService = true): VozDisponible => ({ lang, name, localService });

describe('elegirVoz', () => {
  it('prefiere español de México', () => {
    const voces = [v('en-US'), v('es-ES'), v('es-MX', 'Microsoft Sabina'), v('es-US')];
    expect(elegirVoz(voces)?.lang).toBe('es-MX');
  });

  it('acepta guion bajo y mayúsculas en el código de idioma (Android)', () => {
    expect(elegirVoz([v('es_ES'), v('ES_mx')])?.lang).toBe('ES_mx');
  });

  it('sin es-MX usa otra variante latinoamericana antes que la de España', () => {
    expect(elegirVoz([v('es-ES'), v('es-US')])?.lang).toBe('es-US');
    expect(elegirVoz([v('es-ES'), v('es-419')])?.lang).toBe('es-419');
  });

  it('entre voces es-MX prefiere una natural', () => {
    const voces = [v('es-MX', 'Microsoft Raul'), v('es-MX', 'Microsoft Dalia Online (Natural)', false)];
    expect(elegirVoz(voces)?.name).toContain('Natural');
  });

  it('devuelve null si no hay voces en español', () => {
    expect(elegirVoz([v('en-US'), v('fr-FR')])).toBeNull();
    expect(elegirVoz([])).toBeNull();
  });
});

describe('estimarDuracion', () => {
  it('crece con el largo de la frase', () => {
    expect(estimarDuracion('¡Hola!')).toBeLessThan(estimarDuracion('El parque está lleno de basura y los animales están tristes.'));
  });

  it('da tiempos razonables para frases cortas', () => {
    const ms = estimarDuracion('¿Me ayudas a rescatarlos?');
    expect(ms).toBeGreaterThan(1000);
    expect(ms).toBeLessThan(4000);
  });
});
