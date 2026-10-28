import { motion } from 'motion/react';
import type { ReactNode } from 'react';

/** Ventana encima de la pantalla, con fondo oscurecido. */
export function Modal({ children, etiqueta }: { children: ReactNode; etiqueta: string }) {
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
        className="flex max-h-[92vh] w-[min(46rem,94vw)] flex-col items-center gap-5 overflow-y-auto rounded-[2rem] border-[6px] border-white bg-crema p-[clamp(1.25rem,4vmin,2.5rem)] text-center shadow-[0_0.6rem_0_rgba(0,0,0,0.25)]"
        initial={{ scale: 0.85, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
