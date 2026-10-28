import { motion } from 'motion/react';
import { useEffect } from 'react';
import { TEXTOS_APP } from '../../contenido/textosApp';
import { UNIDADES } from '../../contenido/unidades';
import { Arte } from '../componentes/Arte';
import { BotonesSistema } from '../componentes/BotonesSistema';
import { BotonGrande } from '../componentes/BotonGrande';
import { CacoGuia } from '../componentes/CacoGuia';
import { useApp } from '../estado/app';
import { useGrupoActual } from '../estado/grupos';
import { callar, decir } from '../estado/narrador';

/** Álbum de animales de Toluca: una estampa por unidad terminada, con su dato curioso narrado. */
export function Album() {
  const grupo = useGrupoActual();
  const alCamino = useApp((s) => s.alCamino);

  useEffect(() => {
    decir(TEXTOS_APP.album.bienvenida);
    return () => callar();
  }, []);

  return (
    <main data-pantalla="album" data-entrada-lista="true" className="relative flex h-full w-full flex-col items-center gap-6 overflow-y-auto bg-gradient-to-b from-[#FFF1C7] to-crema px-4 pt-6 pb-36">
      <BotonesSistema />
      <div className="flex w-full max-w-[80rem] items-center gap-4">
        <BotonGrande color="verde" etiqueta={TEXTOS_APP.leccion.alCamino} className="size-[clamp(4rem,9vmin,5.5rem)]" icono={<Arte clave="icono-casa" className="size-[60%]" />} onClick={() => alCamino()} />
        <h1 className="text-[clamp(1.8rem,5vmin,3.6rem)] font-black text-morado">{TEXTOS_APP.album.titulo}</h1>
      </div>
      {/* auto-fill: con pocas unidades, cada estampa conserva su tamaño en lugar de estirarse. */}
      <div className="grid w-full max-w-[80rem] grid-cols-[repeat(auto-fill,minmax(clamp(10rem,22vmin,14rem),1fr))] gap-[clamp(1rem,3vmin,2rem)]">
        {UNIDADES.map((u) => {
          const ganada = !!grupo?.progreso.estampas.includes(u.estampa.id);
          return (
            <motion.button
              key={u.id}
              type="button"
              whileTap={{ scale: 0.95 }}
              data-estampa={u.estampa.id}
              data-ganada={ganada}
              aria-label={ganada ? u.estampa.nombre : TEXTOS_APP.album.bloqueada}
              onClick={() => decir(ganada ? [u.estampa.nombre, u.estampa.dato] : TEXTOS_APP.album.bloqueada, { expresion: ganada ? 'feliz' : 'pensando' })}
              className={`flex cursor-pointer flex-col items-center gap-2 rounded-[1.75rem] border-[6px] p-4 shadow-[0_0.45rem_0_rgba(18,61,43,0.2)] ${ganada ? 'border-[#FFD23F] bg-white' : 'border-white bg-white/60'}`}
            >
              <div className="flex h-[clamp(7rem,20vmin,12rem)] w-full items-center justify-center overflow-hidden">
                {/* Sin ganar: silueta oscura (se adivina el animal, pero aún no se ve). */}
                <Arte clave={u.estampa.arte} className={`h-full w-full object-contain ${ganada ? '' : 'opacity-25 brightness-0'}`} />
              </div>
              <span className="text-center text-[clamp(1.1rem,2.6vmin,1.6rem)] font-black">{ganada ? u.estampa.nombre : '?'}</span>
              <span className="rounded-full px-3 text-sm font-bold text-white" style={{ backgroundColor: u.color }}>
                {TEXTOS_APP.camino.unidad} {u.numero}
              </span>
            </motion.button>
          );
        })}
      </div>
      <div className="fixed bottom-3 left-3">
        <CacoGuia alto="clamp(5rem,12vmin,8rem)" soloMientrasHabla />
      </div>
    </main>
  );
}
