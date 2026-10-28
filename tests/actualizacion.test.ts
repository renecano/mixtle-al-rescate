import { describe, expect, it, vi } from 'vitest';
import { vigilarActualizaciones } from '../src/servicios/actualizacion';

/** Un service worker de mentira: solo lo que usa vigilarActualizaciones. */
function swFalso(conControlador: boolean) {
  const eventos = new EventTarget();
  return {
    controller: conControlador ? ({} as ServiceWorker) : null,
    addEventListener: eventos.addEventListener.bind(eventos),
    cambiarVersion: () => eventos.dispatchEvent(new Event('controllerchange')),
  };
}

describe('versión nueva publicada', () => {
  it('avisa una sola vez cuando la versión nueva toma el control', () => {
    const sw = swFalso(true);
    const aviso = vi.fn();
    vigilarActualizaciones(aviso, sw as unknown as ServiceWorkerContainer);
    sw.cambiarVersion();
    sw.cambiarVersion();
    expect(aviso).toHaveBeenCalledTimes(1);
  });

  it('en la primera visita no avisa (no hay versión vieja que cambiar)', () => {
    const sw = swFalso(false);
    const aviso = vi.fn();
    vigilarActualizaciones(aviso, sw as unknown as ServiceWorkerContainer);
    sw.cambiarVersion();
    expect(aviso).not.toHaveBeenCalled();
  });

  it('sin service worker (navegador viejo o pruebas) no hace nada', () => {
    expect(() => vigilarActualizaciones(vi.fn(), undefined)).not.toThrow();
  });
});
