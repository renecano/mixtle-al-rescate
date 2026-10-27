import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../src/app/App';
import { pantallaInicial, useApp } from '../src/app/estado/app';
import { progreso } from '../src/logica/progreso';
import { estadoSonido } from '../src/servicios/estadoSonido';

// Phaser necesita un lienzo real: en estas pruebas la aventura es un doble que solo registra la llamada.
const { crearAventura } = vi.hoisted(() => ({ crearAventura: vi.fn(() => ({ destroy: vi.fn() })) }));
vi.mock('../src/aventuras/unidad1', () => ({ crearAventuraUnidad1: crearAventura }));

beforeEach(() => {
  useApp.setState({ pantalla: 'inicio', escenaInicial: undefined });
  crearAventura.mockClear();
});

describe('pantalla de inicio', () => {
  it('muestra el título y un botón grande para jugar', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: /Caco\s+al rescate/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /¡Jugar!/ })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Caco, el cacomixtle' })).toBeInTheDocument();
  });

  it('el botón de sonido se puede apagar y encender', async () => {
    estadoSonido.fijar(true);
    render(<App />);
    const boton = screen.getByRole('button', { name: 'Apagar el sonido' });
    expect(boton).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(boton);
    expect(estadoSonido.estaActivo).toBe(false);
    expect(screen.getByRole('button', { name: 'Encender el sonido' })).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(screen.getByRole('button', { name: 'Encender el sonido' }));
    expect(estadoSonido.estaActivo).toBe(true);
  });

  it('"¡Jugar!" reinicia la partida y monta la aventura de la unidad 1', async () => {
    progreso().recolectar('lata');
    render(<App />);
    await userEvent.click(screen.getByRole('button', { name: /¡Jugar!/ }));
    expect(progreso().recolectados).toEqual([]);
    expect(useApp.getState().pantalla).toBe('aventura');
    await vi.waitFor(() => expect(crearAventura).toHaveBeenCalledTimes(1));
  });

  it('al terminar la aventura se vuelve al inicio', async () => {
    useApp.setState({ pantalla: 'aventura' });
    render(<App />);
    await vi.waitFor(() => expect(crearAventura).toHaveBeenCalled());
    const [, opciones] = crearAventura.mock.calls[0] as unknown as [HTMLElement, { alTerminar: () => void }];
    act(() => opciones.alTerminar());
    expect(screen.getByRole('button', { name: /¡Jugar!/ })).toBeInTheDocument();
  });
});

describe('atajos para revisar', () => {
  it('?escena=Nivel2 entra directo solo en desarrollo o con ?e2e', () => {
    expect(pantallaInicial('?escena=Nivel2', true)).toEqual({ pantalla: 'aventura', escenaInicial: 'Nivel2' });
    expect(pantallaInicial('?escena=Nivel2&e2e', false)).toEqual({ pantalla: 'aventura', escenaInicial: 'Nivel2' });
    expect(pantallaInicial('?escena=Nivel2', false)).toEqual({ pantalla: 'inicio' });
    expect(pantallaInicial('?escena=Cualquiera', true)).toEqual({ pantalla: 'inicio' });
  });

  it('?galeria muestra el arte', () => {
    expect(pantallaInicial('?galeria', false)).toEqual({ pantalla: 'aventura', escenaInicial: 'Galeria' });
  });
});
