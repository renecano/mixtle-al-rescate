import { act, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { PanelFacilitador } from '../src/app/componentes/PanelFacilitador';
import { PROGRESO_VACIO } from '../src/logica/camino';
import { nuevoGrupo } from '../src/logica/grupos';
import { useDescargaSinInternet } from '../src/servicios/sinInternet';

const grupo = { ...nuevoGrupo({ mascota: 'ardilla', color: '#1F6B4A', etiqueta: '2°B' }, 'g', 0), progreso: PROGRESO_VACIO };
const montar = () => render(<PanelFacilitador grupo={grupo} alCerrar={() => undefined} alRecorrido={() => undefined} />);
const estado = () => document.querySelector<HTMLElement>('[data-sin-internet]')!;

beforeEach(() => useDescargaSinInternet.setState({ fase: 'esperando', bytesListos: 0, bytesTotales: 0 }));

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
