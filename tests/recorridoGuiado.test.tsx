import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { RecorridoGuiado } from '../src/app/componentes/RecorridoGuiado';
import { useNarrador } from '../src/app/estado/narrador';
import { TEXTOS_APP } from '../src/contenido/textosApp';
import { debeMostrarRecorrido, PASOS_RECORRIDO, pasosDisponibles } from '../src/logica/recorridoGuiado';
import { todasLasFrases } from '../src/voz/frases';

const dice = TEXTOS_APP.recorrido.dice;
const pasoActual = () => document.querySelector<HTMLElement>('[data-recorrido-guiado]')?.dataset.recorridoGuiado;
const contador = () => document.querySelector('[data-paso-recorrido]')?.textContent;
const subtitulo = () => useNarrador.getState().subtitulo;

/** Una pantalla falsa con lo que señala el recorrido (todo, o todo menos `sin`). */
function Pantalla({ sin = [] as string[] }) {
  const objetivos = PASOS_RECORRIDO.map((p) => p.objetivo).filter((o): o is string => !!o && !sin.includes(o));
  return (
    <div>
      {objetivos.map((o) => (
        <div key={o} data-recorrido={o}>
          {o}
        </div>
      ))}
    </div>
  );
}

/** Monta la pantalla falsa y el recorrido, y espera a que aparezca (un cuadro después). */
async function montar(sin: string[] = []) {
  const alTerminar = vi.fn();
  render(
    <>
      <Pantalla sin={sin} />
      <RecorridoGuiado alTerminar={alTerminar} />
    </>,
  );
  await screen.findByRole('dialog', { name: TEXTOS_APP.recorrido.etiqueta });
  return alTerminar;
}

afterEach(() => useNarrador.setState({ subtitulo: '' }));

describe('cuándo aparece el recorrido guiado', () => {
  it('la primera vez en el aparato sí; ya visto (o saltado), no', () => {
    expect(debeMostrarRecorrido('', null)).toBe(true);
    expect(debeMostrarRecorrido('', 'si')).toBe(false);
  });

  it('con ?e2e (pruebas, capturas, tráiler) no tapa nada, salvo que se pida con ?recorrido-guiado', () => {
    expect(debeMostrarRecorrido('?e2e', null)).toBe(false);
    expect(debeMostrarRecorrido('?e2e&recorrido-guiado', null)).toBe(true);
    expect(debeMostrarRecorrido('?recorrido-guiado', 'si')).toBe(true);
  });

  it('se salta los pasos cuyo elemento no está en pantalla (por ejemplo, sin siguiente lección)', () => {
    const pasos = pasosDisponibles((o) => o !== 'siguiente');
    expect(pasos.map((p) => p.id)).not.toContain('siguienteLeccion');
    expect(pasos[0]!.id).toBe('hola');
    expect(pasos.at(-1)!.id).toBe('fin');
  });
});

describe('recorrido guiado', () => {
  it('empieza saludando, dice cada paso en voz alta y señala cada cosa en orden', async () => {
    const alTerminar = await montar();
    expect(screen.getByRole('dialog', { name: TEXTOS_APP.recorrido.etiqueta })).toBeInTheDocument();
    expect(pasoActual()).toBe('hola');
    expect(contador()).toBe(`1 de ${PASOS_RECORRIDO.length}`);
    // Mixtle habla en un efecto, después de que la ventana aparece: se espera a que lo diga.
    await waitFor(() => expect(subtitulo()).toBe(dice.hola));

    fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
    expect(pasoActual()).toBe('siguienteLeccion');
    expect(subtitulo()).toBe(dice.siguienteLeccion);
    await waitFor(() => expect(document.querySelector('[data-senalado="siguiente"]')).not.toBeNull());

    // Se recorren todos; el último botón dice "¡A jugar!" y termina.
    for (let n = 2; n < PASOS_RECORRIDO.length; n++) fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
    expect(pasoActual()).toBe('fin');
    expect(screen.queryByRole('button', { name: 'Saltar' })).toBeNull();
    expect(alTerminar).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: '¡A jugar!' }));
    expect(alTerminar).toHaveBeenCalledTimes(1);
  });

  it('"Saltar" está a la vista desde el principio y termina el recorrido', async () => {
    const alTerminar = await montar();
    fireEvent.click(screen.getByRole('button', { name: 'Saltar' }));
    expect(alTerminar).toHaveBeenCalledTimes(1);
  });

  it('"Atrás" regresa al paso anterior', async () => {
    await montar();
    fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
    fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
    expect(pasoActual()).toBe('parque');
    fireEvent.click(screen.getByRole('button', { name: 'Atrás' }));
    expect(pasoActual()).toBe('siguienteLeccion');
  });

  it('con teclado: flechas para avanzar y regresar, Escape para saltar', async () => {
    const alTerminar = await montar();
    act(() => void fireEvent.keyDown(window, { key: 'ArrowRight' }));
    expect(pasoActual()).toBe('siguienteLeccion');
    act(() => void fireEvent.keyDown(window, { key: 'ArrowLeft' }));
    expect(pasoActual()).toBe('hola');
    act(() => void fireEvent.keyDown(window, { key: 'Escape' }));
    expect(alTerminar).toHaveBeenCalledTimes(1);
  });

  it('si algo no está en pantalla, ese paso no sale y la cuenta se ajusta', async () => {
    await montar(['dias']);
    expect(contador()).toBe(`1 de ${PASOS_RECORRIDO.length - 1}`);
    const vistos: string[] = [];
    for (let n = 0; n < PASOS_RECORRIDO.length - 2; n++) {
      vistos.push(pasoActual()!);
      fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
    }
    expect(vistos).not.toContain('dias');
  });

  it('cada frase del recorrido tiene su audio registrado (Mixtle la dice con su voz)', () => {
    const textos = new Set(todasLasFrases().map((f) => f.texto));
    for (const frase of [...Object.values(dice), TEXTOS_APP.recorrido.sistemaSinPantalla]) expect(textos).toContain(frase);
  });
});
