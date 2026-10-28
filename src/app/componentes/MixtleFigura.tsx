import { motion } from 'motion/react';
import { Arte } from './Arte';

/*
 * Mixtle en React, armado igual que en las aventuras: el cuerpo (360×440 en el dibujo)
 * y la cola aparte (260×440), unida a la cadera en el punto (240, 400) del cuerpo.
 */
const CUERPO = { ancho: 360, alto: 440 };
const COLA = { ancho: 260, alto: 440, x: 212, origenX: 28 / 260, origenY: 400 / 440 };

export type ExpresionMixtle = 'normal' | 'feliz' | 'habla' | 'pensando' | 'sorprendido' | 'celebrando' | 'senalando';

interface Props {
  /** Alto de Mixtle (cualquier medida CSS). */
  alto: string;
  expresion?: ExpresionMixtle;
  /** Mirar hacia la izquierda (por ejemplo, para señalar algo que está a su izquierda). */
  espejo?: boolean;
  className?: string;
}

export function MixtleFigura({ alto, expresion = 'normal', espejo = false, className = '' }: Props) {
  const anchoTotal = COLA.x + COLA.ancho;
  const pct = (v: number, total: number) => `${(v / total) * 100}%`;
  // Las partes van en posición absoluta: el contenedor necesita estar posicionado (relative si no se indica otra).
  const posicion = /\b(absolute|fixed|relative|sticky)\b/.test(className) ? '' : 'relative';
  return (
    <div
      className={`${posicion} ${className}`}
      style={{ height: alto, aspectRatio: `${anchoTotal} / ${CUERPO.alto}`, transform: espejo ? 'scaleX(-1)' : undefined }}
      role="img"
      aria-label="Mixtle, el cacomixtle"
    >
      <motion.div
        className="absolute top-0"
        style={{
          left: pct(COLA.x, anchoTotal),
          width: pct(COLA.ancho, anchoTotal),
          height: '100%',
          transformOrigin: `${COLA.origenX * 100}% ${COLA.origenY * 100}%`,
        }}
        animate={{ rotate: expresion === 'celebrando' ? [-12, 14, -12] : [-6, 7, -6] }}
        transition={{ duration: expresion === 'celebrando' ? 0.8 : 2.8, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Arte clave="mixtle-cola" className="h-full w-full" />
      </motion.div>
      <motion.div
        className="absolute top-0 left-0 h-full origin-bottom"
        style={{ width: pct(CUERPO.ancho, anchoTotal) }}
        animate={expresion === 'celebrando' ? { y: ['0%', '-6%', '0%'] } : { scaleY: [1, 1.025, 1] }}
        transition={{ duration: expresion === 'celebrando' ? 0.5 : 3.2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Arte clave={expresion === 'normal' ? 'mixtle' : `mixtle-${expresion}`} className="h-full w-full" />
      </motion.div>
    </div>
  );
}
