import { motion } from 'motion/react';
import type { Tarjeta as DatosTarjeta } from '../../contenido/tipos';
import type { Locucion } from '../../voz/locucion';
import { sonido } from '../../servicios/sonido';
import { Arte } from '../componentes/Arte';

/** Lo que un ejercicio le avisa a la lección cada vez que el grupo intenta algo. */
export interface Respuesta {
  correcto: boolean;
  /** true cuando el ejercicio completo quedó resuelto. */
  terminado: boolean;
  /** Pista más precisa que la del ejercicio (por ejemplo, la del bote correcto). */
  pista?: Locucion;
  /** Frase al acertar (por ejemplo, el "por qué" en ¿Sí o no?). */
  exito?: Locucion;
}

export interface PropsEjercicio<E> {
  ejercicio: E;
  responder: (r: Respuesta) => void;
  /** true mientras se muestra el banner de respuesta (no se puede tocar nada). */
  bloqueado: boolean;
}

export type EstadoTarjeta = 'normal' | 'elegida' | 'bien' | 'mal' | 'apagada';

interface PropsTarjeta {
  tarjeta: DatosTarjeta;
  estado?: EstadoTarjeta;
  /** Mostrar el nombre debajo del dibujo (apoyo para quienes ya leen). */
  conTexto?: boolean;
  /** Cambia cada vez que hay que sacudirla (error). */
  sacudir?: number;
  tamano?: string;
  onClick?: () => void;
}

const BORDES: Record<EstadoTarjeta, string> = {
  normal: 'border-white bg-white',
  elegida: 'border-azul bg-cielo ring-8 ring-azul/30',
  bien: 'border-verde bg-verde-claro ring-8 ring-verde/30',
  mal: 'border-naranja bg-white',
  apagada: 'border-white bg-white opacity-40',
};

/** Tarjeta ilustrada grande para tocar (siempre ≥ 64 px; el nombre se lee también en voz). */
export function Tarjeta({ tarjeta, estado = 'normal', conTexto = false, sacudir = 0, tamano = 'clamp(7.5rem,19vmin,13rem)', onClick }: PropsTarjeta) {
  return (
    <motion.button
      type="button"
      aria-label={tarjeta.nombre}
      aria-pressed={estado === 'elegida' || estado === 'bien'}
      data-tarjeta={tarjeta.id}
      disabled={estado === 'apagada' || estado === 'bien'}
      onPointerDown={() => sonido.desbloquear()}
      onClick={onClick}
      key={sacudir}
      initial={false}
      animate={sacudir ? { x: [0, -14, 14, -10, 10, 0] } : { x: 0 }}
      transition={{ duration: 0.4 }}
      whileTap={{ scale: 0.95 }}
      className={`relative flex cursor-pointer flex-col items-center justify-center gap-1 rounded-[1.75rem] border-[6px] p-3 shadow-[0_0.45rem_0_rgba(18,61,43,0.25)] disabled:cursor-default ${BORDES[estado]}`}
      style={{ width: tamano, minHeight: tamano }}
    >
      <Arte clave={tarjeta.arte} className="h-[72%] max-h-[10rem] w-[80%] object-contain" />
      {conTexto && <span className="text-center text-[clamp(1rem,2.2vmin,1.5rem)] leading-tight font-extrabold text-tinta">{tarjeta.nombre}</span>}
      {estado === 'bien' && (
        <span className="absolute -top-4 -right-4 grid size-12 place-items-center rounded-full border-4 border-white bg-verde">
          <Arte clave="palomita" className="size-7" />
        </span>
      )}
    </motion.button>
  );
}

/** Revuelve sin dejar el orden original (para que "ordena" nunca empiece resuelto). */
export function revolver<T>(lista: readonly T[], azar: () => number = Math.random): T[] {
  const copia = [...lista];
  for (let intento = 0; intento < 10; intento++) {
    for (let i = copia.length - 1; i > 0; i--) {
      const j = Math.floor(azar() * (i + 1));
      [copia[i], copia[j]] = [copia[j]!, copia[i]!];
    }
    if (copia.length < 2 || copia.some((x, i) => x !== lista[i])) return copia;
  }
  return [...copia.slice(1), copia[0]!];
}
