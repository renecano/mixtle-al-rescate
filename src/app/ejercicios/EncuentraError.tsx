import { motion } from 'motion/react';
import { useState } from 'react';
import type { EncuentraError as Datos } from '../../contenido/tipos';
import { sonido } from '../../servicios/sonido';
import { Arte } from '../componentes/Arte';
import type { PropsEjercicio } from './comun';

/** 6. Encuentra el error: una escena con cosas que están mal; hay que tocarlas todas. */
export function EncuentraError({ ejercicio, responder, bloqueado }: PropsEjercicio<Datos>) {
  const errores = ejercicio.objetos.filter((o) => o.mal);
  const [encontrados, setEncontrados] = useState<string[]>([]);
  const [sacudir, setSacudir] = useState<{ id: string; vez: number } | null>(null);

  const tocar = (id: string, mal: boolean) => {
    if (bloqueado || encontrados.includes(id)) return;
    if (mal) {
      const nuevos = [...encontrados, id];
      setEncontrados(nuevos);
      if (nuevos.length === errores.length) responder({ correcto: true, terminado: true });
      else sonido.tocar('acierto');
    } else {
      setSacudir((s) => ({ id, vez: (s?.vez ?? 0) + 1 }));
      responder({ correcto: false, terminado: false });
    }
  };

  return (
    <div className="flex w-full flex-col items-center gap-3" data-ejercicio="encuentra-error">
      <div className="flex gap-2" aria-label={`Encontradas: ${encontrados.length} de ${errores.length}`}>
        {errores.map((e, i) => (
          <span key={e.id} className={`grid size-10 place-items-center rounded-full border-4 border-white ${i < encontrados.length ? 'bg-verde' : 'bg-white/50'}`}>
            {i < encontrados.length && <Arte clave="palomita" className="size-6" />}
          </span>
        ))}
      </div>
      <div className="relative aspect-video w-[min(92vw,calc(56vh*16/9))] overflow-hidden rounded-[1.75rem] border-[6px] border-white shadow-[0_0.5rem_0_rgba(18,61,43,0.25)]">
        <Arte clave={ejercicio.escena} className="absolute inset-0 h-full w-full object-cover" />
        {ejercicio.objetos.map((o) => {
          const hallado = encontrados.includes(o.id);
          return (
            <motion.button
              key={`${o.id}-${sacudir?.id === o.id ? sacudir.vez : 0}`}
              type="button"
              aria-label={o.nombre}
              data-objeto={o.id}
              onClick={() => tocar(o.id, o.mal)}
              initial={false}
              animate={sacudir?.id === o.id ? { x: [0, -10, 10, -6, 6, 0] } : hallado ? { scale: [1, 1.2, 1] } : {}}
              className={`absolute grid min-h-16 min-w-16 -translate-x-1/2 -translate-y-1/2 cursor-pointer place-items-center rounded-full ${hallado ? 'ring-8 ring-verde' : ''}`}
              style={{ left: `${o.x}%`, top: `${o.y}%`, width: `${o.ancho}%`, aspectRatio: '1' }}
            >
              <Arte clave={o.arte} className="h-full w-full object-contain" />
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
