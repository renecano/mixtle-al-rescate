import { describe, expect, it } from 'vitest';
import { boteResponde, caeBasura, eligeBote, llegaAlSuelo, LLUVIA_INICIAL, vuelveACaer } from '../src/logica/lluvia';

describe('lluvia de basura: los botes responden siempre', () => {
  it('mientras la basura cae, el bote correcto la atrapa y el incorrecto solo da una pista', () => {
    const cae = caeBasura('botella');
    expect(boteResponde(cae)).toBe(true);
    const pista = eligeBote(cae, false);
    expect(pista.efecto).toBe('pista');
    expect(boteResponde(pista.estado)).toBe(true);
    const acierto = eligeBote(cae, true);
    expect(acierto.efecto).toBe('acierto');
    expect(boteResponde(acierto.estado)).toBe(false);
  });

  it('un toque mientras Mixtle dice "¡Uy, llegó al suelo!" cuenta igual (no se pierde)', () => {
    const enElSuelo = llegaAlSuelo(caeBasura('botella'));
    expect(enElSuelo.enElSuelo).toBe(true);
    expect(boteResponde(enElSuelo)).toBe(true);
    const acierto = eligeBote(enElSuelo, true);
    expect(acierto.efecto).toBe('acierto');
    // Ya atrapada: cuando Mixtle termine la frase, esa basura no vuelve a caer.
    expect(vuelveACaer(acierto.estado, 'botella')).toBe(false);
    // Y una pista en el suelo tampoco bloquea nada.
    expect(eligeBote(enElSuelo, false).efecto).toBe('pista');
    expect(boteResponde(eligeBote(enElSuelo, false).estado)).toBe(true);
  });

  it('si nadie elige, al terminar la frase la misma basura vuelve a caer; otra basura o una ya atrapada, no', () => {
    const enElSuelo = llegaAlSuelo(caeBasura('botella'));
    expect(vuelveACaer(enElSuelo, 'botella')).toBe(true);
    expect(vuelveACaer(enElSuelo, 'lata')).toBe(false);
    expect(vuelveACaer(caeBasura('botella'), 'botella')).toBe(false);
  });

  it('entre una basura y otra, o ya atrapada, los botes no hacen nada (ni llegar al suelo cambia nada)', () => {
    expect(boteResponde(LLUVIA_INICIAL)).toBe(false);
    expect(eligeBote(LLUVIA_INICIAL, true).efecto).toBe('nada');
    const atrapada = eligeBote(caeBasura('botella'), true).estado;
    expect(llegaAlSuelo(atrapada)).toBe(atrapada);
    expect(eligeBote(atrapada, true).efecto).toBe('nada');
  });
});
