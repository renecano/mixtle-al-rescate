import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PanelFacilitador } from '../src/app/componentes/PanelFacilitador';
import { useGrupos, usarAlmacen } from '../src/app/estado/grupos';
import { PROGRESO_VACIO } from '../src/logica/camino';
import { ETIQUETA_DEMO } from '../src/logica/demo';
import { nuevoGrupo } from '../src/logica/grupos';
import { almacenEnMemoria } from '../src/servicios/almacen';
import { useDescargaSinInternet } from '../src/servicios/sinInternet';

const grupo = { ...nuevoGrupo({ mascota: 'ardilla', color: '#1F6B4A', etiqueta: '2°B' }, 'g', 0), progreso: PROGRESO_VACIO };
const montar = (alCerrar = () => undefined) => render(<PanelFacilitador grupo={grupo} alCerrar={alCerrar} alRecorrido={() => undefined} />);
const estado = () => document.querySelector<HTMLElement>('[data-sin-internet]')!;

beforeEach(() => {
  useDescargaSinInternet.setState({ fase: 'esperando', bytesListos: 0, bytesTotales: 0 });
  usarAlmacen(almacenEnMemoria());
  useGrupos.setState({ grupos: [grupo], actualId: grupo.id, cargado: true, guardadoOk: true });
});

describe('modo facilitador: grupo de demostración y borrar', () => {
  it('"Crear grupo de demostración" agrega un grupo Demo, lo deja elegido y cierra el panel', () => {
    const alCerrar = vi.fn();
    montar(alCerrar);
    fireEvent.click(screen.getByRole('button', { name: 'Crear grupo de demostración' }));
    const grupos = useGrupos.getState().grupos;
    expect(grupos.map((g) => g.etiqueta)).toEqual(['2°B', ETIQUETA_DEMO]);
    expect(useGrupos.getState().actualId).toBe(grupos[1]!.id);
    expect(grupos[0]!.progreso).toEqual(PROGRESO_VACIO);
    expect(alCerrar).toHaveBeenCalledTimes(1);
  });

  it('"Borrar este grupo" pide confirmación y entonces lo quita (cancelar no borra)', () => {
    const alCerrar = vi.fn();
    montar(alCerrar);
    fireEvent.click(screen.getByRole('button', { name: 'Borrar este grupo' }));
    expect(screen.getByText('¿Seguro? Se borra el grupo con todo su avance de este aparato.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(useGrupos.getState().grupos).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: 'Borrar este grupo' }));
    fireEvent.click(document.querySelector('[data-confirmar="borrar"] button')!);
    expect(useGrupos.getState().grupos).toEqual([]);
    expect(useGrupos.getState().actualId).toBeNull();
    expect(alCerrar).toHaveBeenCalledTimes(1);
  });
});

describe('modo facilitador: ¿se puede usar sin internet?', () => {
  it('muestra el avance de la descarga en porcentaje, y "Listo" al terminar', () => {
    montar();
    expect(estado()).toHaveTextContent('La descarga para usar sin internet empieza en un momento');
    act(() => useDescargaSinInternet.setState({ fase: 'descargando', bytesListos: 420, bytesTotales: 1000 }));
    expect(estado()).toHaveTextContent('Descargando para usar sin internet: 42 %');
    act(() => useDescargaSinInternet.setState({ fase: 'listo', bytesListos: 1000, bytesTotales: 1000 }));
    expect(screen.getByRole('status')).toHaveTextContent('Listo para usar sin internet');
  });

  it('sin conexión dice cuánto va y que sigue al volver la conexión', () => {
    useDescargaSinInternet.setState({ fase: 'sin-conexion', bytesListos: 300, bytesTotales: 1000 });
    montar();
    expect(estado()).toHaveTextContent('Sin conexión: va en 30 %');
    expect(estado()).toHaveTextContent('sigue al volver la conexión');
  });
});

describe('modo facilitador: "Cerrar" siempre a la vista', () => {
  it('"Cerrar" va en el pie fijo de la ventana, fuera de la zona que se desplaza (en la tablet quedaba fuera de la vista)', () => {
    montar();
    const cerrar = screen.getByRole('button', { name: 'Cerrar' });
    expect(cerrar.closest('[data-modal-pie]')).not.toBeNull();
    expect(cerrar.closest('[data-modal-cuerpo]')).toBeNull();
    // Lo demás sí va en la zona que se desplaza.
    expect(screen.getByRole('button', { name: 'Borrar este grupo' }).closest('[data-modal-cuerpo]')).not.toBeNull();
  });

  it('con la confirmación de borrar abierta, "Cerrar" sigue en el pie', () => {
    montar();
    fireEvent.click(screen.getByRole('button', { name: 'Borrar este grupo' }));
    expect(screen.getByRole('button', { name: 'Cerrar' }).closest('[data-modal-pie]')).not.toBeNull();
  });
});
