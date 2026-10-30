import { motion } from 'motion/react';
import type { ReactNode } from 'react';

/**
 * Ventana encima de la pantalla, con fondo oscurecido. `ancho`: el de la ventana (CSS); el vestidor pide una
 * más ancha. El contenido se desplaza si no cabe (como mucho 92 % del alto de la pantalla). `pie`: lo que
 * debe verse siempre aunque el contenido se desplace (el botón "Cerrar" del modo facilitador, que en la
 * tablet quedaba fuera de la vista): va fijo abajo, fuera de la zona que se desplaza.
 */
export function Modal({ children, etiqueta, ancho = 'min(46rem,94vw)', pie }: { children: ReactNode; etiqueta: string; ancho?: string; pie?: ReactNode }) {
  return (
    <motion.div
      className="fixed inset-0 z-50 grid place-items-center bg-verde-oscuro/70 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      role="dialog"
      aria-modal="true"
      aria-label={etiqueta}
    >
      <motion.div
        className="flex max-h-[92vh] flex-col overflow-hidden rounded-[2rem] border-[6px] border-white bg-crema text-center shadow-[0_0.6rem_0_rgba(0,0,0,0.25)]"
        style={{ width: ancho }}
        initial={{ scale: 0.85, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      >
        <div className={`flex min-h-0 w-full flex-1 flex-col items-center gap-5 overflow-y-auto p-[clamp(1.25rem,4vmin,2.5rem)] ${pie ? 'pb-3' : ''}`} data-modal-cuerpo>
          {children}
        </div>
        {pie && (
          <div className="w-full shrink-0 px-[clamp(1.25rem,4vmin,2.5rem)] pb-[clamp(1rem,3vmin,1.75rem)] pt-2" data-modal-pie>
            {pie}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
