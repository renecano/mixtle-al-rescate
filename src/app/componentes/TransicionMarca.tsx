import { useEffect, useState } from 'react';
import { flushSync } from 'react-dom';
import { sonido } from '../../servicios/sonido';
import { movimientoReducido } from '../efectos/efectos';
import { useApp, type Pantalla } from '../estado/app';
import { Arte } from './Arte';
import { Logo } from './Logo';

/** Cuánto tarda el panel en cubrir la pantalla y en destaparla (ms). */
export const CUBRE_MS = 320;
export const DESCUBRE_MS = 380;
/** Tope de espera a que la pantalla nueva se pinte bajo el panel antes de destaparla (ms). */
export const ESPERA_PINTADO_MS = 150;

type Fase = 'quieta' | 'cubre' | 'descubre';

/**
 * Transición de marca entre secciones: un panel verde con el logo barre la pantalla, con Mixtle
 * brincando en su orilla. La pantalla cambia mientras el panel la cubre, y el destape empieza un par
 * de cuadros después, cuando la pantalla nueva ya se montó y se pintó: así el primer cuadro del
 * destape no carga con el layout de la pantalla nueva (en Edge, en una laptop modesta, se veía
 * trabado). Con movimiento reducido o "animaciones suaves", el cambio es inmediato. Devuelve la
 * pantalla que se debe mostrar.
 */
export function useTransicionMarca(): { mostrada: Pantalla; fase: Fase } {
  const [mostrada, setMostrada] = useState(() => useApp.getState().pantalla);
  const [fase, setFase] = useState<Fase>('quieta');

  useEffect(() => {
    const tiempos: number[] = [];
    const cuadros: number[] = [];
    const limpiar = () => {
      tiempos.splice(0).forEach((t) => window.clearTimeout(t));
      cuadros.splice(0).forEach((c) => window.cancelAnimationFrame(c));
    };
    // Llama a `fn` cuando lo recién montado ya se pintó (dos cuadros), o a los ESPERA_PINTADO_MS como tope.
    const trasPintar = (fn: () => void) => {
      let hecho = false;
      const ir = () => {
        if (hecho) return;
        hecho = true;
        fn();
      };
      cuadros.push(window.requestAnimationFrame(() => cuadros.push(window.requestAnimationFrame(ir))));
      tiempos.push(window.setTimeout(ir, ESPERA_PINTADO_MS));
    };
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
          // La pantalla nueva se monta ya (bajo el panel); el destape, cuando esté pintada.
          flushSync(() => setMostrada(useApp.getState().pantalla));
          trasPintar(() => {
            setFase('descubre');
            tiempos.push(window.setTimeout(() => setFase('quieta'), DESCUBRE_MS));
          });
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
