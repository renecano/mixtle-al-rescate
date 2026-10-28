import { act, render, renderHook, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../src/app/App';
import { CUBRE_MS, DESCUBRE_MS } from '../src/app/componentes/TransicionMarca';
import { hojitasAlContador } from '../src/app/efectos/efectos';
import { useCuentaAnimada } from '../src/app/efectos/ContadorHojitas';
import { useApp } from '../src/app/estado/app';
import { VITRINA_TRAS_MS } from '../src/app/pantallas/Inicio';
import { ESCENAS_VITRINA, Vitrina } from '../src/app/pantallas/Vitrina';

vi.mock('../src/aventuras/unidad1', () => ({ crearAventuraUnidad1: vi.fn(() => ({ destroy: vi.fn() })) }));

/** Deja que terminen los import() perezosos y que React pinte lo que llegó. */
async function asentar() {
  for (let i = 0; i < 5; i++) {
    await act(async () => {
      await vi.dynamicImportSettled();
    });
  }
}

beforeEach(() => {
  vi.useFakeTimers();
  useApp.setState({ pantalla: 'inicio', proyector: false, suave: false });
  document.documentElement.removeAttribute('data-suave');
});

afterEach(() => {
  vi.useRealTimers();
});

describe('modo vitrina', () => {
  it('en el proyector, empieza solo tras 60 s sin tocar el inicio', async () => {
    useApp.setState({ proyector: true });
    render(<App />);
    act(() => void vi.advanceTimersByTime(VITRINA_TRAS_MS - 1000));
    await asentar();
    expect(screen.queryByRole('dialog', { name: /Modo vitrina/ })).toBeNull();
    act(() => void vi.advanceTimersByTime(1500));
    await asentar();
    expect(screen.getByRole('dialog', { name: /Modo vitrina/ })).toBeInTheDocument();
  });

  it('un toque reinicia la cuenta de 60 s', async () => {
    useApp.setState({ proyector: true });
    render(<App />);
    act(() => void vi.advanceTimersByTime(VITRINA_TRAS_MS - 5000));
    act(() => void window.dispatchEvent(new Event('pointerdown')));
    act(() => void vi.advanceTimersByTime(10_000));
    await asentar();
    expect(screen.queryByRole('dialog', { name: /Modo vitrina/ })).toBeNull();
  });

  it('fuera del proyector no empieza (en la tablet del salón no estorba)', async () => {
    render(<App />);
    act(() => void vi.advanceTimersByTime(VITRINA_TRAS_MS * 2));
    await asentar();
    expect(screen.queryByRole('dialog', { name: /Modo vitrina/ })).toBeNull();
  });

  it('recorre sus escenas en bucle y sale con un toque o una tecla', () => {
    const alSalir = vi.fn();
    render(<Vitrina alSalir={alSalir} />);
    const dialogo = screen.getByRole('dialog', { name: /Modo vitrina/ });
    expect(dialogo).toHaveAttribute('data-vitrina', 'hola');
    for (const escena of ESCENAS_VITRINA.slice(1)) {
      const anterior = ESCENAS_VITRINA[ESCENAS_VITRINA.indexOf(escena) - 1]!;
      act(() => void vi.advanceTimersByTime(anterior.ms));
      expect(dialogo).toHaveAttribute('data-vitrina', escena.id);
    }
    act(() => void vi.advanceTimersByTime(ESCENAS_VITRINA.at(-1)!.ms));
    expect(dialogo).toHaveAttribute('data-vitrina', 'hola');
    act(() => void window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' })));
    expect(alSalir).toHaveBeenCalledTimes(1);
    act(() => dialogo.click());
    expect(alSalir).toHaveBeenCalledTimes(2);
  });

  it('dura menos de un minuto por vuelta y termina invitando a jugar', () => {
    const total = ESCENAS_VITRINA.reduce((s, e) => s + e.ms, 0);
    expect(total).toBeGreaterThan(25_000);
    expect(total).toBeLessThan(60_000);
    expect(ESCENAS_VITRINA.at(-1)!.texto).toMatch(/jugar/i);
  });
});

describe('transición de marca', () => {
  it('el panel cubre la pantalla, cambia la sección por debajo y se va', async () => {
    render(<App />);
    act(() => useApp.getState().irAGrupos());
    expect(document.querySelector('.transicion-marca')).toHaveAttribute('data-fase', 'cubre');
    // Mientras cubre, sigue el inicio debajo.
    expect(document.querySelector('[data-pantalla="inicio"]')).not.toBeNull();
    act(() => void vi.advanceTimersByTime(CUBRE_MS));
    await asentar();
    expect(document.querySelector('.transicion-marca')).toHaveAttribute('data-fase', 'descubre');
    act(() => void vi.advanceTimersByTime(DESCUBRE_MS));
    await asentar();
    expect(document.querySelector('.transicion-marca')).toBeNull();
    expect(document.querySelector('[data-pantalla="inicio"]')).toBeNull();
  });

  it('con "animaciones suaves" el cambio es inmediato, sin panel', async () => {
    document.documentElement.setAttribute('data-suave', '');
    render(<App />);
    act(() => useApp.getState().irAGrupos());
    expect(document.querySelector('.transicion-marca')).toBeNull();
    await asentar();
    expect(document.querySelector('[data-pantalla="inicio"]')).toBeNull();
  });
});

describe('juice: hojitas y contador', () => {
  it('el contador sube de uno en uno hasta el valor nuevo y baja de inmediato', () => {
    const { result, rerender } = renderHook(({ v }) => useCuentaAnimada(v, 50), { initialProps: { v: 10 } });
    expect(result.current).toBe(10);
    rerender({ v: 13 });
    expect(result.current).toBe(10);
    act(() => void vi.advanceTimersByTime(50));
    expect(result.current).toBe(11);
    // Cada paso se programa después de pintar el anterior.
    act(() => void vi.advanceTimersByTime(50));
    act(() => void vi.advanceTimersByTime(50));
    expect(result.current).toBe(13);
    act(() => void vi.advanceTimersByTime(500));
    expect(result.current).toBe(13);
    rerender({ v: 5 });
    expect(result.current).toBe(5);
  });

  it('con movimiento reducido las hojitas llegan al instante (el número sube igual)', () => {
    document.documentElement.setAttribute('data-suave', '');
    const llegan = vi.fn();
    const dura = hojitasAlContador({ x: 0, y: 0 }, document.body, 4, llegan);
    expect(dura).toBe(0);
    expect(llegan).toHaveBeenCalledTimes(4);
  });
});
