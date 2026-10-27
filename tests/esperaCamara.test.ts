import { afterEach, describe, expect, it, vi } from 'vitest';
import { abrirCamara, camarasActivas } from '../src/servicios/camara';

function flujoFalso() {
  const pista = { readyState: 'live', stop: vi.fn(function (this: { readyState: string }) { this.readyState = 'ended'; }), getSettings: () => ({}) };
  const flujo = Object.setPrototypeOf({ getTracks: () => [pista], getVideoTracks: () => [pista] }, MediaStream.prototype) as MediaStream;
  return { pista, flujo };
}

function simularCamara(getUserMedia: () => Promise<MediaStream>) {
  Object.defineProperty(navigator, 'mediaDevices', { value: { getUserMedia }, configurable: true });
}

afterEach(() => {
  vi.useRealTimers();
  Object.defineProperty(navigator, 'mediaDevices', { value: undefined, configurable: true });
});

describe('abrir la cámara', () => {
  it('sin soporte en el navegador, avisa sin lanzar errores', async () => {
    Object.defineProperty(navigator, 'mediaDevices', { value: undefined, configurable: true });
    expect(await abrirCamara(100, 100)).toEqual({ ok: false, motivo: 'sin-soporte' });
  });

  it('con permiso negado, explica el motivo', async () => {
    simularCamara(() => Promise.reject(new DOMException('no', 'NotAllowedError')));
    expect(await abrirCamara(100, 100)).toEqual({ ok: false, motivo: 'denegada' });
  });

  it('si nadie responde el permiso, sigue sin cámara y apaga la que llegue tarde', async () => {
    vi.useFakeTimers();
    const { pista, flujo } = flujoFalso();
    let conceder: (f: MediaStream) => void = () => undefined;
    simularCamara(() => new Promise((r) => (conceder = r)));
    const resultado = abrirCamara(100, 100, () => false, 1000);
    await vi.advanceTimersByTimeAsync(1001);
    expect(await resultado).toEqual({ ok: false, motivo: 'sin-respuesta' });
    conceder(flujo); // el permiso llega cuando ya nadie lo espera
    await vi.runAllTimersAsync();
    expect(pista.stop).toHaveBeenCalled();
    expect(camarasActivas()).toBe(0);
  });

  it('si se eligió jugar con dibujos mientras esperaba, apaga la cámara al llegar', async () => {
    const { pista, flujo } = flujoFalso();
    simularCamara(() => Promise.resolve(flujo));
    expect(await abrirCamara(100, 100, () => true)).toEqual({ ok: false, motivo: 'sin-respuesta' });
    expect(pista.stop).toHaveBeenCalled();
    expect(camarasActivas()).toBe(0);
  });

  it('con cámara: la entrega y al detener la apaga', async () => {
    const { pista, flujo } = flujoFalso();
    simularCamara(() => Promise.resolve(flujo));
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
    const r = await abrirCamara(100, 100);
    expect(r.ok).toBe(true);
    expect(camarasActivas()).toBe(1);
    if (r.ok) r.detener();
    expect(pista.stop).toHaveBeenCalled();
    expect(camarasActivas()).toBe(0);
  });
});
