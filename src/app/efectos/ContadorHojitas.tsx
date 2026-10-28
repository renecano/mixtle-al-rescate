import { forwardRef, useEffect, useRef, useState } from 'react';
import { Arte } from '../componentes/Arte';
import { movimientoReducido } from './efectos';

/**
 * Número que sube contando (de uno en uno) hasta `valor`, con un saltito en cada paso. Si `valor`
 * baja (por ejemplo, al gastar hojitas en un accesorio), baja de inmediato.
 */
export function useCuentaAnimada(valor: number, msPorPaso = 70): number {
  const [mostrado, setMostrado] = useState(valor);
  useEffect(() => {
    if (mostrado === valor) return;
    // Sube de uno en uno; si bajó, se iguala en el siguiente turno (en pantalla ya se ve el valor nuevo).
    const t = window.setTimeout(() => setMostrado((m) => (m > valor ? valor : Math.min(valor, m + 1))), mostrado > valor ? 0 : msPorPaso);
    return () => window.clearTimeout(t);
  }, [valor, mostrado, msPorPaso]);
  return mostrado > valor || movimientoReducido() ? valor : mostrado;
}

interface Props {
  valor: number;
  className?: string;
  /** Texto para lectores de pantalla ("Hojitas: 15"). */
  etiqueta: string;
}

/** Contador de hojitas: la hojita y el número que cuenta. Recibe un ref para que las hojitas vuelen hacia él. */
export const ContadorHojitas = forwardRef<HTMLDivElement, Props>(function ContadorHojitas({ valor, className = '', etiqueta }, ref) {
  const mostrado = useCuentaAnimada(valor);
  const numero = useRef<HTMLSpanElement>(null);
  // Saltito del número cada vez que cambia.
  useEffect(() => {
    const el = numero.current;
    if (!el || typeof el.animate !== 'function' || movimientoReducido()) return;
    el.animate([{ transform: 'scale(1.35)' }, { transform: 'scale(1)' }], { duration: 180, easing: 'ease-out' });
  }, [mostrado]);
  return (
    <div ref={ref} className={`flex items-center gap-2 ${className}`} aria-label={`${etiqueta}: ${valor}`} data-hojitas-mostradas={mostrado}>
      <Arte clave="hojita" className="size-[1.4em] shrink-0" />
      <span ref={numero} className="inline-block min-w-[1.5ch] font-black tabular-nums">
        {mostrado}
      </span>
    </div>
  );
});
