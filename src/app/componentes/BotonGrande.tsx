import { motion } from 'motion/react';
import type { ReactNode } from 'react';
import { sonido } from '../../servicios/sonido';
import { centroDe, chispas } from '../efectos/efectos';

const COLORES = {
  naranja: 'bg-naranja shadow-[0_0.5rem_0_#8a370f]',
  verde: 'bg-verde shadow-[0_0.5rem_0_#154a33]',
  azul: 'bg-azul shadow-[0_0.5rem_0_#1a4279]',
  morado: 'bg-morado shadow-[0_0.5rem_0_#4a3380]',
  gris: 'bg-[#5b6770] shadow-[0_0.5rem_0_#40494f]',
} as const;

interface Props {
  children?: ReactNode;
  icono?: ReactNode;
  color?: keyof typeof COLORES;
  /** Nombre para lectores de pantalla (obligatorio si el botón solo tiene ícono). */
  etiqueta?: string;
  presionado?: boolean;
  className?: string;
  latir?: boolean;
  onClick: () => void;
}

/**
 * Botón grande y redondeado, con sombra (mínimo 64 px de alto). Cada toque responde: se aplasta y
 * rebota, suena y suelta chispas donde se tocó. Mismo estilo que los botones de las aventuras.
 */
export function BotonGrande({ children, icono, color = 'naranja', etiqueta, presionado, className = '', latir, onClick }: Props) {
  return (
    <motion.button
      type="button"
      aria-label={etiqueta}
      aria-pressed={presionado}
      onPointerDown={() => sonido.desbloquear()}
      onClick={(e) => {
        sonido.tocar('toque');
        // Con teclado no hay punto de toque: las chispas salen del centro del botón.
        const punto = e.clientX || e.clientY ? { x: e.clientX, y: e.clientY } : centroDe(e.currentTarget);
        chispas(punto.x, punto.y, { cantidad: 7, alcance: 55 });
        onClick();
      }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scaleX: 1.08, scaleY: 0.88 }}
      animate={latir ? { scale: [1, 1.06, 1] } : undefined}
      transition={latir ? { duration: 1.4, repeat: Infinity, ease: 'easeInOut' } : { type: 'spring', stiffness: 500, damping: 25 }}
      className={`flex min-h-16 min-w-16 cursor-pointer items-center justify-center gap-3 rounded-[2rem] border-4 border-white/90 ${children ? 'px-6' : ''} font-extrabold text-white outline-offset-4 focus-visible:outline-4 focus-visible:outline-crema ${COLORES[color]} ${className}`}
    >
      {icono}
      {children}
    </motion.button>
  );
}
