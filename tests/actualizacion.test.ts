import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { actualizarAhora, esMomentoSeguro, programarRevisiones, REVISION_CADA_MS, REVISION_MINIMA_MS, useActualizacion, vigilarActualizaciones } from '../src/servicios/actualizacion';
import { activarLaQueEspera, opcionesDeRegistro } from '../src/servicios/arranque';

/*
 * Una versión nueva publicada debe tomar el control sola. Antes no pasaba: el service worker nuevo se
 * quedaba "esperando" y la laptop seguía con la versión vieja hasta cerrar todas las pestañas (René lo
 * vio con la voz anterior). El escenario completo, con dos builds reales, lo reproduce
 * scripts/probar-actualizacion.mjs; aquí, las dos piezas que lo hacen posible.
 */

/** Un service worker falso: solo recibe mensajes y cambia de estado. */
function swFalso(state = 'installed') {
  const sw = { state, mensajes: [] as unknown[], oyentes: [] as (() => void)[], postMessage: (m: unknown) => sw.mensajes.push(m), addEventListener: (_: string, fn: () => void) => sw.oyentes.push(fn), cambiar(nuevo: string) { sw.state = nuevo; sw.oyentes.forEach((f) => f()); } };
  return sw;
}

describe('el service worker nuevo toma el control sin cerrar las pestañas', () => {
  it('el build pide skipWaiting y clientsClaim (el plugin no los pone solo sin injectRegister "auto")', () => {
    const config = readFileSync(join(process.cwd(), 'vite.config.ts'), 'utf8');
    const workbox = config.slice(config.indexOf('workbox: {'));
    expect(workbox).toMatch(/skipWaiting: true/);
    expect(workbox).toMatch(/clientsClaim: true/);
  });

  it('al registrar, a un service worker que ya está esperando se le pide activarse', () => {
    const esperando = swFalso('installed');
    activarLaQueEspera({ waiting: esperando as never, installing: null, addEventListener: () => undefined });
    expect(esperando.mensajes).toEqual([{ type: 'SKIP_WAITING' }]);
  });

  it('si llega una versión nueva mientras se juega, se le pide activarse en cuanto termina de instalarse', () => {
    const nuevo = swFalso('installing');
    const oyentes: Record<string, () => void> = {};
    vi.stubGlobal('navigator', { serviceWorker: { controller: {} } });
    activarLaQueEspera({ waiting: null, installing: nuevo as never, addEventListener: (ev: string, fn: () => void) => (oyentes[ev] = fn) });
    oyentes.updatefound!();
    nuevo.cambiar('installed');
    expect(nuevo.mensajes).toEqual([{ type: 'SKIP_WAITING' }]);
    vi.unstubAllGlobals();
  });

  it('en la primera instalación (sin versión anterior controlando) no se pide nada: no hay a quién reemplazar', () => {
    const nuevo = swFalso('installing');
    const oyentes: Record<string, () => void> = {};
    vi.stubGlobal('navigator', { serviceWorker: { controller: null } });
    activarLaQueEspera({ waiting: null, installing: nuevo as never, addEventListener: (ev: string, fn: () => void) => (oyentes[ev] = fn) });
    oyentes.updatefound!();
    nuevo.cambiar('installed');
    expect(nuevo.mensajes).toEqual([]);
    vi.unstubAllGlobals();
  });

  it('sw.js se pide siempre a la red: updateViaCache "none"', () => {
    expect(opcionesDeRegistro().updateViaCache).toBe('none');
  });

  it('se recarga en pantallas seguras (inicio, grupos, camino, álbum), nunca a media lección ni aventura', () => {
    for (const p of ['inicio', 'grupos', 'camino', 'album']) expect(esMomentoSeguro(p), p).toBe(true);
    for (const p of ['leccion', 'aventura']) expect(esMomentoSeguro(p), p).toBe(false);
  });

  it('con la pestaña abierta busca versiones nuevas al volver a ella (no más de una vez por minuto) y cada 15 min', () => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
    const registro = { update: vi.fn(async () => undefined) };
    const oyentes: Record<string, () => void> = {};
    const doc = { visibilityState: 'visible' as DocumentVisibilityState, addEventListener: (ev: string, fn: () => void) => (oyentes[ev] = fn), removeEventListener: vi.fn() };
    const dejar = programarRevisiones(registro, doc);
    oyentes.visibilitychange!();
    expect(registro.update).not.toHaveBeenCalled(); // acaba de cargar: aún no toca
    vi.setSystemTime(REVISION_MINIMA_MS);
    oyentes.visibilitychange!();
    expect(registro.update).toHaveBeenCalledTimes(1);
    doc.visibilityState = 'hidden';
    vi.setSystemTime(REVISION_MINIMA_MS * 3);
    oyentes.visibilitychange!();
    expect(registro.update).toHaveBeenCalledTimes(1); // al ocultarse no
    vi.advanceTimersByTime(REVISION_CADA_MS);
    expect(registro.update).toHaveBeenCalledTimes(2); // cada 15 min
    dejar();
    expect(doc.removeEventListener).toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('el aviso del inicio: a un service worker esperando se le pide activarse y se recarga', async () => {
    vi.useFakeTimers();
    const esperando = swFalso('installed');
    const recargar = vi.fn();
    await actualizarAhora({ getRegistration: async () => ({ waiting: esperando }) } as never, recargar);
    expect(esperando.mensajes).toEqual([{ type: 'SKIP_WAITING' }]);
    vi.advanceTimersByTime(300);
    expect(recargar).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it('deja constancia de que hay versión nueva (para el aviso) al tomar el control o al quedar esperando', () => {
    useActualizacion.setState({ hayNueva: false, esperando: false });
    const oyentes: (() => void)[] = [];
    vigilarActualizaciones(() => undefined, { controller: {}, addEventListener: (_: string, fn: () => void) => oyentes.push(fn) } as never);
    oyentes.forEach((f) => f());
    expect(useActualizacion.getState().hayNueva).toBe(true);
    useActualizacion.setState({ hayNueva: false, esperando: false });
    activarLaQueEspera({ waiting: swFalso('installed') as never, installing: null, addEventListener: () => undefined });
    expect(useActualizacion.getState()).toEqual({ hayNueva: true, esperando: true });
  });

  it('cuando la versión nueva toma el control, se avisa una vez (y nunca en la primera instalación)', () => {
    const avisos = vi.fn();
    const oyentes: (() => void)[] = [];
    vigilarActualizaciones(avisos, { controller: {}, addEventListener: (_: string, fn: () => void) => oyentes.push(fn) } as never);
    oyentes.forEach((f) => f());
    oyentes.forEach((f) => f());
    expect(avisos).toHaveBeenCalledTimes(1);
    const primeraVez = vi.fn();
    const oyentes2: (() => void)[] = [];
    vigilarActualizaciones(primeraVez, { controller: null, addEventListener: (_: string, fn: () => void) => oyentes2.push(fn) } as never);
    oyentes2.forEach((f) => f());
    expect(primeraVez).not.toHaveBeenCalled();
  });
});
