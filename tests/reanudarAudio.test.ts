import { describe, expect, it, vi } from 'vitest';
import { reanudarContexto, vigilarContexto, type ContextoAudio } from '../src/servicios/audio/reanudar';

/** Un contexto de audio falso: su estado se cambia a mano y avisa con "statechange". */
function contextoFalso(estado: string) {
  const eventos = new EventTarget();
  const ctx = {
    state: estado,
    resume: vi.fn(() => Promise.resolve()),
    addEventListener: eventos.addEventListener.bind(eventos),
    cambiar(nuevo: string) {
      this.state = nuevo;
      eventos.dispatchEvent(new Event('statechange'));
    },
  };
  return ctx as typeof ctx & ContextoAudio;
}

function volverALaPagina(visible = true) {
  Object.defineProperty(document, 'visibilityState', { value: visible ? 'visible' : 'hidden', configurable: true });
  document.dispatchEvent(new Event('visibilitychange'));
}

describe('el audio suena en cuanto el navegador deja', () => {
  it('visita de regreso: si el navegador ya deja sonar al entrar, la música empieza sin esperar un toque', () => {
    const alPoderSonar = vi.fn();
    vigilarContexto(contextoFalso('running'), alPoderSonar);
    expect(alPoderSonar).toHaveBeenCalledTimes(1);
  });

  it('primera visita: la música espera hasta que el navegador deja sonar (tras el primer toque)', () => {
    const alPoderSonar = vi.fn();
    const ctx = contextoFalso('suspended');
    vigilarContexto(ctx, alPoderSonar);
    expect(alPoderSonar).not.toHaveBeenCalled();
    ctx.cambiar('running');
    expect(alPoderSonar).toHaveBeenCalledTimes(1);
  });

  it('al volver a la página (tras salir de la app o bloquear la tablet) se reanuda el audio pausado', () => {
    const ctx = contextoFalso('running');
    vigilarContexto(ctx, () => undefined);
    ctx.cambiar('suspended');
    volverALaPagina(false);
    expect(ctx.resume).not.toHaveBeenCalled();
    volverALaPagina(true);
    expect(ctx.resume).toHaveBeenCalledTimes(1);
  });
});

describe('reanudar el contexto con cada toque', () => {
  it('reanuda si está pausado, también si quedó "interrupted" (iPad al volver a la app)', () => {
    for (const estado of ['suspended', 'interrupted']) {
      const ctx = contextoFalso(estado);
      reanudarContexto(ctx);
      expect(ctx.resume).toHaveBeenCalledTimes(1);
    }
  });

  it('no hace nada si ya suena, si está cerrado o si no hay audio, y nunca lanza', () => {
    for (const estado of ['running', 'closed']) {
      const ctx = contextoFalso(estado);
      reanudarContexto(ctx);
      expect(ctx.resume).not.toHaveBeenCalled();
    }
    expect(() => reanudarContexto(undefined)).not.toThrow();
    const rechaza = contextoFalso('suspended');
    rechaza.resume.mockImplementation(() => Promise.reject(new Error('sin permiso')));
    expect(() => reanudarContexto(rechaza)).not.toThrow();
  });
});
