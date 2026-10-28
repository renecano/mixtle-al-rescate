import { useEffect, useRef } from 'react';
import { estallido } from '../efectos/efectos';
import { Arte } from './Arte';

export type FaseCofre = 'cerrado' | 'sacude' | 'abierto';

interface Props {
  fase: FaseCofre;
  /** Lo que trae: se muestra desde antes de abrirlo (nada de premios al azar). */
  hojitas: number;
  className?: string;
}

/**
 * El cofre: cerrado se balancea y brilla un poco (anticipación); al tocarlo se sacude; al abrirse
 * estalla en rayos y chispas. Lo que trae se ve desde el principio en su etiqueta.
 */
export function CofreAnimado({ fase, hojitas, className = '' }: Props) {
  const caja = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (fase === 'abierto') estallido(caja.current);
  }, [fase]);
  return (
    <div className={`cofre-escena ${className}`} data-fase={fase}>
      <div className="cofre-rayos" aria-hidden="true" />
      <div className="cofre-brillo" aria-hidden="true" />
      <div ref={caja} className="cofre-caja">
        <Arte clave={fase === 'abierto' ? 'cofre-abierto' : 'cofre'} className="h-full w-full object-contain" />
      </div>
      <div className="cofre-etiqueta" data-cofre-hojitas={hojitas}>
        <Arte clave="hojita" className="size-[1.2em]" />
        {fase === 'abierto' ? `+${hojitas}` : hojitas}
      </div>
    </div>
  );
}
