import { useRef } from 'react';
import { TEXTOS_APP } from '../../contenido/textosApp';
import { mascota, nombreDelGrupo, type Grupo } from '../../logica/grupos';
import { Arte } from './Arte';
import { BotonesSistema } from './BotonesSistema';
import { BotonGrande } from './BotonGrande';

const PRESION_FACILITADOR_MS = 3000;

interface Props {
  grupo: Grupo;
  alAlbum: () => void;
  alCambiarGrupo: () => void;
  alFacilitador: () => void;
}

/**
 * Barra superior del camino: logo (mantenerlo presionado 3 s abre el modo facilitador, un gesto que
 * un niño no hace por accidente), el grupo, sus hojitas, los días jugados y los botones de audio.
 */
export function Encabezado({ grupo, alAlbum, alCambiarGrupo, alFacilitador }: Props) {
  const temporizador = useRef<number | null>(null);
  const cancelar = () => {
    if (temporizador.current) window.clearTimeout(temporizador.current);
    temporizador.current = null;
  };
  const dias = grupo.progreso.dias.length;

  return (
    <header className="flex flex-wrap items-center gap-[clamp(0.5rem,2vmin,1.5rem)] bg-verde px-[clamp(0.75rem,2.5vmin,2rem)] py-2 text-white shadow-[0_0.3rem_0_rgba(0,0,0,0.15)]">
      <button
        type="button"
        aria-label={TEXTOS_APP.facilitador.ayuda}
        data-logo
        className="grid size-[clamp(4rem,9vmin,5.5rem)] shrink-0 cursor-default place-items-center overflow-hidden rounded-full border-4 border-white bg-cielo select-none"
        onPointerDown={() => {
          cancelar();
          temporizador.current = window.setTimeout(alFacilitador, PRESION_FACILITADOR_MS);
        }}
        onPointerUp={cancelar}
        onPointerLeave={cancelar}
        onPointerCancel={cancelar}
        onContextMenu={(e) => e.preventDefault()}
      >
        <Arte clave="mixtle" className="mt-[30%] w-[130%] max-w-none" />
      </button>

      <div className="flex min-w-0 items-center gap-2 rounded-full border-4 border-white px-3 py-1" style={{ backgroundColor: grupo.color }} data-grupo={grupo.id}>
        <Arte clave={mascota(grupo.mascota).arte} className="size-[clamp(2.5rem,6vmin,3.5rem)] object-contain" />
        <span className="truncate text-[clamp(1.1rem,2.6vmin,1.8rem)] font-black">{nombreDelGrupo(grupo)}</span>
      </div>

      <div className="flex items-center gap-2 rounded-full bg-white/15 px-3 py-1" aria-label={`${TEXTOS_APP.camino.hojitas}: ${grupo.progreso.hojitas}`} data-hojitas-grupo={grupo.progreso.hojitas}>
        <Arte clave="hojita" className="size-[clamp(2rem,5vmin,3rem)]" />
        <span className="text-[clamp(1.2rem,3vmin,2rem)] font-black">{grupo.progreso.hojitas}</span>
      </div>
      <div className="flex items-center gap-2 rounded-full bg-white/15 px-3 py-1" aria-label={`${TEXTOS_APP.camino.dias}: ${dias}`}>
        <Arte clave="calendario" className="size-[clamp(2rem,5vmin,3rem)]" />
        <span className="text-[clamp(1.2rem,3vmin,2rem)] font-black">{dias}</span>
      </div>

      <div className="ml-auto flex items-center gap-3">
        <BotonGrande color="morado" etiqueta={TEXTOS_APP.camino.album} className="h-[clamp(4rem,9vmin,5.5rem)] min-w-[clamp(4rem,9vmin,5.5rem)] text-[clamp(1.1rem,2.5vmin,1.6rem)] max-xl:px-0" icono={<Arte clave="icono-estrella" className="size-[1.6em]" />} onClick={alAlbum}>
          {/* En pantallas angostas (tablet) solo el ícono; el nombre sigue para lectores de pantalla. */}
          <span className="max-xl:sr-only">{TEXTOS_APP.camino.album}</span>
        </BotonGrande>
        <BotonGrande color="azul" etiqueta={TEXTOS_APP.camino.cambiarGrupo} className="size-[clamp(4rem,9vmin,5.5rem)]" icono={<Arte clave="icono-casa" className="size-[60%]" />} onClick={alCambiarGrupo} />
        <BotonesSistema enLinea />
      </div>
    </header>
  );
}
