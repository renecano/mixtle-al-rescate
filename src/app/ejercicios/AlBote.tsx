import { motion } from 'motion/react';
import { useRef, useState } from 'react';
import { claveImagenResiduo } from '../../arte/residuos';
import { CATEGORIAS } from '../../data/categorias';
import { RESIDUOS } from '../../data/residuos';
import type { AlBote as Datos } from '../../contenido/tipos';
import { categoriaDe, esCorrecto, textoPista } from '../../logica/clasificacion';
import { sonido } from '../../servicios/sonido';
import { Arte } from '../componentes/Arte';
import type { PropsEjercicio } from './comun';

/**
 * 2. Al bote: cada residuo se arrastra a su bote (o se toca el bote). Usa la misma lógica de la v1
 * (categoriaDe/esCorrecto), así que respeta la configuración de categorias.ts.
 */
export function AlBote({ ejercicio, responder, bloqueado }: PropsEjercicio<Datos>) {
  const residuos = ejercicio.residuos.map((id) => RESIDUOS.find((r) => r.id === id)!).filter(Boolean);
  const [indice, setIndice] = useState(0);
  const [arrastre, setArrastre] = useState<{ x: number; y: number } | null>(null);
  const [sacudir, setSacudir] = useState<{ bote: string; vez: number } | null>(null);
  const [acierto, setAcierto] = useState<string | null>(null);
  const inicio = useRef<{ x: number; y: number } | null>(null);
  const actual = residuos[indice];

  const soltarEn = (boteId: string) => {
    if (!actual || bloqueado) return;
    if (esCorrecto(actual, boteId, CATEGORIAS)) {
      sonido.tocar('acierto');
      setAcierto(boteId);
      window.setTimeout(() => setAcierto(null), 600);
      if (indice + 1 >= residuos.length) {
        setIndice(residuos.length);
        responder({ correcto: true, terminado: true });
      } else setIndice(indice + 1);
    } else {
      setSacudir((s) => ({ bote: boteId, vez: (s?.vez ?? 0) + 1 }));
      responder({ correcto: false, terminado: false, pista: textoPista(categoriaDe(actual, CATEGORIAS)!) });
    }
  };

  return (
    <div className="flex w-full flex-col items-center gap-[clamp(1rem,3vmin,2rem)]" data-ejercicio="al-bote">
      <div className="flex items-center gap-3" aria-hidden>
        {residuos.map((r, i) => (
          <span key={r.id} className={`size-4 rounded-full ${i < indice ? 'bg-verde' : i === indice ? 'bg-naranja' : 'bg-white/70'}`} />
        ))}
      </div>
      <div className="grid h-[clamp(8rem,22vmin,14rem)] place-items-center">
        {actual && (
          <motion.div
            key={actual.id}
            role="button"
            tabIndex={0}
            aria-label={actual.nombre}
            data-residuo={actual.id}
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: arrastre ? 1.08 : 1, opacity: 1, x: arrastre?.x ?? 0, y: arrastre?.y ?? 0 }}
            transition={arrastre ? { duration: 0 } : { type: 'spring', stiffness: 300, damping: 22 }}
            className="relative z-10 grid size-[clamp(8rem,22vmin,14rem)] cursor-grab touch-none place-items-center rounded-full bg-crema shadow-[0_0.5rem_0_rgba(18,61,43,0.2)] active:cursor-grabbing"
            onPointerDown={(e) => {
              if (bloqueado) return;
              sonido.desbloquear();
              e.currentTarget.setPointerCapture(e.pointerId);
              inicio.current = { x: e.clientX, y: e.clientY };
            }}
            onPointerMove={(e) => {
              if (!inicio.current) return;
              setArrastre({ x: e.clientX - inicio.current.x, y: e.clientY - inicio.current.y });
            }}
            onPointerUp={(e) => {
              if (!inicio.current) return;
              inicio.current = null;
              setArrastre(null);
              const bote = document
                .elementsFromPoint(e.clientX, e.clientY)
                .map((el) => el.closest<HTMLElement>('[data-bote]'))
                .find(Boolean);
              if (bote?.dataset.bote) soltarEn(bote.dataset.bote);
            }}
            onPointerCancel={() => {
              inicio.current = null;
              setArrastre(null);
            }}
          >
            <Arte clave={claveImagenResiduo(actual.imagen)} className="size-[78%] object-contain" />
          </motion.div>
        )}
      </div>
      <div className="flex flex-wrap items-end justify-center gap-[clamp(1rem,4vmin,3rem)]">
        {CATEGORIAS.map((c) => (
          <motion.button
            key={`${c.id}-${sacudir?.bote === c.id ? sacudir.vez : 0}`}
            type="button"
            data-bote={c.id}
            aria-label={`Bote ${c.nombre}`}
            onClick={() => soltarEn(c.id)}
            initial={false}
            animate={sacudir?.bote === c.id ? { rotate: [0, -6, 6, -4, 4, 0] } : acierto === c.id ? { scale: [1, 1.12, 1] } : {}}
            whileTap={{ scale: 0.95 }}
            className="flex cursor-pointer flex-col items-center gap-1"
          >
            <Arte clave={`bote-${c.id}`} className="h-[clamp(7rem,20vmin,13rem)]" />
            <span className="rounded-full border-4 bg-white px-4 py-1 text-[clamp(1rem,2.3vmin,1.6rem)] font-extrabold" style={{ borderColor: c.color, color: c.color }}>
              {c.nombre}
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
