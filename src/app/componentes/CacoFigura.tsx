import { motion } from 'motion/react';
import { Arte } from './Arte';

/*
 * Caco en React, armado igual que en las aventuras: el cuerpo (360×440 en el dibujo)
 * y la cola aparte (260×440), unida a la cadera en el punto (240, 400) del cuerpo.
 */
const CUERPO = { ancho: 360, alto: 440 };
const COLA = { ancho: 260, alto: 440, x: 212, origenX: 28 / 260, origenY: 400 / 440 };

export type ExpresionCaco = 'normal' | 'feliz' | 'habla';

interface Props {
  /** Alto de Caco (cualquier medida CSS). */
  alto: string;
  expresion?: ExpresionCaco;
  className?: string;
}

export function CacoFigura({ alto, expresion = 'normal', className = '' }: Props) {
  const anchoTotal = COLA.x + COLA.ancho;
  const pct = (v: number, total: number) => `${(v / total) * 100}%`;
  // Las partes van en posición absoluta: el contenedor necesita estar posicionado (relative si no se indica otra).
  const posicion = /\b(absolute|fixed|relative|sticky)\b/.test(className) ? '' : 'relative';
  return (
    <div
      className={`${posicion} ${className}`}
      style={{ height: alto, aspectRatio: `${anchoTotal} / ${CUERPO.alto}` }}
      role="img"
      aria-label="Caco, el cacomixtle"
    >
      <motion.div
        className="absolute top-0"
        style={{
          left: pct(COLA.x, anchoTotal),
          width: pct(COLA.ancho, anchoTotal),
          height: '100%',
          transformOrigin: `${COLA.origenX * 100}% ${COLA.origenY * 100}%`,
        }}
        animate={{ rotate: [-6, 7, -6] }}
        transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Arte clave="caco-cola" className="h-full w-full" />
      </motion.div>
      <motion.div
        className="absolute top-0 left-0 h-full origin-bottom"
        style={{ width: pct(CUERPO.ancho, anchoTotal) }}
        animate={{ scaleY: [1, 1.025, 1] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Arte clave={expresion === 'normal' ? 'caco' : `caco-${expresion}`} className="h-full w-full" />
      </motion.div>
    </div>
  );
}
