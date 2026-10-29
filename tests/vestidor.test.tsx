import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { Vestidor } from '../src/app/componentes/Vestidor';
import { useGrupos, usarAlmacen } from '../src/app/estado/grupos';
import { useNarrador } from '../src/app/estado/narrador';
import { TEXTOS_APP } from '../src/contenido/textosApp';
import { ACCESORIOS, conArticulo, hojitasDisponibles } from '../src/logica/accesorios';
import { textoDeLocucion } from '../src/voz/locucion';
import { PROGRESO_VACIO } from '../src/logica/camino';
import { nuevoGrupo } from '../src/logica/grupos';
import { almacenEnMemoria } from '../src/servicios/almacen';

/** Un grupo elegido con estas hojitas ganadas. */
function grupoCon(hojitas: number) {
  usarAlmacen(almacenEnMemoria());
  const g = { ...nuevoGrupo({ mascota: 'ardilla', color: '#1F6B4A', etiqueta: '2°B' }, 'g', 0), progreso: { ...PROGRESO_VACIO, hojitas } };
  useGrupos.setState({ grupos: [g], actualId: g.id, cargado: true, guardadoOk: true });
}
const actual = () => useGrupos.getState().grupos[0]!;
const tarjeta = (id: string) => document.querySelector<HTMLElement>(`[data-accesorio="${id}"]`)!;

function Montado() {
  return <Vestidor grupo={actual()} alCerrar={() => undefined} />;
}

/** Toca "Comprar" y luego "Sí, comprar" en la pregunta. */
function comprar(id: string, nombre: RegExp) {
  fireEvent.click(within(tarjeta(id)).getByRole('button', { name: nombre }));
  fireEvent.click(screen.getByRole('button', { name: 'Sí, comprar' }));
}
const pregunta = () => document.querySelector<HTMLElement>('[data-pregunta-compra]');

beforeEach(() => grupoCon(45));

describe('vestidor de la mascota', () => {
  it('muestra cada accesorio con su precio a la vista', () => {
    render(<Montado />);
    expect(within(tarjeta('gorra')).getByText('Gorra')).toBeInTheDocument();
    expect(tarjeta('gorra').querySelector('[data-precio="30"]')).not.toBeNull();
    expect(tarjeta('capa').querySelector('[data-precio="80"]')).not.toBeNull();
  });

  it('con hojitas suficientes se compra, se pone y se descuenta', () => {
    const { rerender } = render(<Montado />);
    expect(tarjeta('gorra')).toHaveAttribute('data-estado', 'disponible');
    comprar('gorra', /Comprar Gorra/);
    rerender(<Montado />);
    expect(tarjeta('gorra')).toHaveAttribute('data-estado', 'puesto');
    expect(hojitasDisponibles(actual().progreso)).toBe(15);
    // Ya no alcanza para los lentes: se dice cuántas faltan, sin bloquear ni regañar.
    expect(tarjeta('lentes')).toHaveAttribute('data-estado', 'faltan');
    expect(within(tarjeta('lentes')).getByText('¡Junten 25 más!')).toBeInTheDocument();
  });

  it('tocar uno que no alcanza no gasta nada (y no pregunta)', () => {
    grupoCon(10);
    render(<Montado />);
    fireEvent.click(within(tarjeta('mochila')).getByRole('button'));
    expect(pregunta()).toBeNull();
    expect(hojitasDisponibles(actual().progreso)).toBe(10);
    expect(actual().progreso.accesorios ?? []).toEqual([]);
  });

  it('antes de comprar pregunta, con el precio y la mascota ya con el accesorio, y aún no gasta', () => {
    render(<Montado />);
    fireEvent.click(within(tarjeta('lentes')).getByRole('button', { name: /Comprar Lentes/ }));
    const p = pregunta()!;
    expect(p).toHaveAttribute('data-pregunta-compra', 'lentes');
    expect(p).toHaveAccessibleName('¿Compran los lentes por 40 hojitas?');
    expect(p.querySelector('[data-precio="40"]')).not.toBeNull();
    expect(p.querySelector('[data-accesorio-puesto="lentes"]')).not.toBeNull();
    expect(hojitasDisponibles(actual().progreso)).toBe(45);
    // Mixtle lo dice en voz alta (subtítulo con la cifra).
    expect(useNarrador.getState().subtitulo).toBe('¿Compran los lentes por 40 hojitas?');
  });

  it('"No, todavía no" (o Escape) cierra la pregunta sin gastar', () => {
    render(<Montado />);
    fireEvent.click(within(tarjeta('gorra')).getByRole('button', { name: /Comprar Gorra/ }));
    fireEvent.click(screen.getByRole('button', { name: 'No, todavía no' }));
    expect(pregunta()).toBeNull();
    fireEvent.click(within(tarjeta('gorra')).getByRole('button', { name: /Comprar Gorra/ }));
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(pregunta()).toBeNull();
    expect(hojitasDisponibles(actual().progreso)).toBe(45);
    expect(actual().progreso.accesorios ?? []).toEqual([]);
  });

  it('"Sí, comprar" compra una sola vez y cierra la pregunta', () => {
    render(<Montado />);
    comprar('gorra', /Comprar Gorra/);
    expect(pregunta()).toBeNull();
    expect(actual().progreso.accesorios).toEqual(['gorra']);
    expect(hojitasDisponibles(actual().progreso)).toBe(15);
  });

  it('la pregunta de cada accesorio lleva su artículo y su precio', () => {
    expect(ACCESORIOS.map((a) => textoDeLocucion(TEXTOS_APP.vestidor.confirmar(conArticulo(a.id), a.precio)))).toEqual([
      '¿Compran la flor de cempasúchil por 25 hojitas?',
      '¿Compran la gorra por 30 hojitas?',
      '¿Compran los lentes por 40 hojitas?',
      '¿Compran el paliacate por 50 hojitas?',
      '¿Compran la mochila por 60 hojitas?',
      '¿Compran la capa de guardián por 80 hojitas?',
    ]);
  });

  it('quitárselo lo guarda (no se pierde) y se puede volver a poner gratis', () => {
    const { rerender } = render(<Montado />);
    comprar('gorra', /Comprar Gorra/);
    rerender(<Montado />);
    fireEvent.click(within(tarjeta('gorra')).getByRole('button', { name: 'Quitársela' }));
    rerender(<Montado />);
    expect(tarjeta('gorra')).toHaveAttribute('data-estado', 'guardado');
    fireEvent.click(within(tarjeta('gorra')).getByRole('button', { name: 'Ponérsela' }));
    rerender(<Montado />);
    expect(tarjeta('gorra')).toHaveAttribute('data-estado', 'puesto');
    expect(hojitasDisponibles(actual().progreso)).toBe(15);
    // Y se ve en la mascota.
    expect(document.querySelector('[data-mascota-vestida] [data-accesorio-puesto="gorra"]')).not.toBeNull();
  });
});
