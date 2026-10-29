import { fireEvent, render, within } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { Vestidor } from '../src/app/componentes/Vestidor';
import { useGrupos, usarAlmacen } from '../src/app/estado/grupos';
import { hojitasDisponibles } from '../src/logica/accesorios';
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
    fireEvent.click(within(tarjeta('gorra')).getByRole('button', { name: /Comprar Gorra/ }));
    rerender(<Montado />);
    expect(tarjeta('gorra')).toHaveAttribute('data-estado', 'puesto');
    expect(hojitasDisponibles(actual().progreso)).toBe(15);
    // Ya no alcanza para los lentes: se dice cuántas faltan, sin bloquear ni regañar.
    expect(tarjeta('lentes')).toHaveAttribute('data-estado', 'faltan');
    expect(within(tarjeta('lentes')).getByText('¡Junten 25 más!')).toBeInTheDocument();
  });

  it('tocar uno que no alcanza no gasta nada', () => {
    grupoCon(10);
    render(<Montado />);
    fireEvent.click(within(tarjeta('mochila')).getByRole('button'));
    expect(hojitasDisponibles(actual().progreso)).toBe(10);
    expect(actual().progreso.accesorios ?? []).toEqual([]);
  });

  it('quitárselo lo guarda (no se pierde) y se puede volver a poner gratis', () => {
    const { rerender } = render(<Montado />);
    fireEvent.click(within(tarjeta('gorra')).getByRole('button', { name: /Comprar Gorra/ }));
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
