import { useEffect, useState } from 'react';
import { sonido } from '../../servicios/sonido';
import { movimientoReducido } from '../efectos/efectos';
import { useApp, type Pantalla } from '../estado/app';
import { Arte } from './Arte';
import { Logo } from './Logo';

/** Cuánto tarda el panel en cubrir la pantalla y en destaparla (ms). */
export const CUBRE_MS = 320;
export const DESCUBRE_MS = 380;

type Fase = 'quieta' | 'cubre' | 'descubre';

/**
 * Transición de marca entre secciones: un panel verde con el logo barre la pantalla, con Mixtle
 * brincando en su orilla. La pantalla cambia mientras el panel la cubre. Con movimiento reducido o
 * "animaciones suaves", el cambio es inmediato. Devuelve la pantalla que se debe mostrar.
 */
export function useTransicionMarca(): { mostrada: Pantalla; fase: Fase } {
  const [mostrada, setMostrada] = useState(() => useApp.getState().pantalla);
  const [fase, setFase] = useState<Fase>('quieta');

  useEffect(() => {
    const tiempos: number[] = [];
    const limpiar = () => tiempos.splice(0).forEach((t) => window.clearTimeout(t));
    const dejar = useApp.subscribe((s, antes) => {
      if (s.pantalla === antes.pantalla) return;
      limpiar();
      if (movimientoReducido()) {
        setFase('quieta');
        setMostrada(s.pantalla);
        return;
      }
      setFase('cubre');
      sonido.tocar('barrido');
      tiempos.push(
        window.setTimeout(() => {
          setMostrada(useApp.getState().pantalla);
          setFase('descubre');
          tiempos.push(window.setTimeout(() => setFase('quieta'), DESCUBRE_MS));
        }, CUBRE_MS),
      );
    });
    return () => {
      dejar();
      limpiar();
    };
  }, []);

  return { mostrada, fase };
}

/** El panel que barre la pantalla (solo existe mientras dura la transición). */
export function PanelTransicion({ fase }: { fase: Fase }) {
  if (fase === 'quieta') return null;
  return (
    <div className="transicion-marca" data-fase={fase} aria-hidden="true">
      <div className="transicion-panel">
        <Logo sinMixtle className="transicion-logo" />
        <Arte clave="mixtle-entero-celebrando" className="transicion-mixtle" />
      </div>
    </div>
  );
}
