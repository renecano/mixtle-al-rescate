import { motion } from 'motion/react';
import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { TEXTOS_APP } from '../../contenido/textosApp';
import { UNIDADES } from '../../contenido/unidades';
import { estadosDelCamino, HOJITAS_COFRE, nodosDelCamino, siguienteNodo, type EstadoNodo, type Nodo } from '../../logica/camino';
import { mascota } from '../../logica/grupos';
import { sonido } from '../../servicios/sonido';
import { Arte } from '../componentes/Arte';
import { BotonGrande } from '../componentes/BotonGrande';
import { CacoGuia } from '../componentes/CacoGuia';
import { Encabezado } from '../componentes/Encabezado';
import { Modal } from '../componentes/Modal';
import { PanelFacilitador } from '../componentes/PanelFacilitador';
import { ParqueGrupo } from '../componentes/ParqueGrupo';
import { useApp } from '../estado/app';
import { useGrupoActual, useGrupos } from '../estado/grupos';
import { callar, decir } from '../estado/narrador';

/** Las burbujas zigzaguean: posición horizontal (en %) según su lugar en la unidad. */
const ZIGZAG = [50, 66, 76, 66, 50, 34, 24, 34];

function posicionesZigzag(nodos: readonly Nodo[]): number[] {
  let enUnidad = 0;
  return nodos.map((n, i) => {
    if (i > 0 && nodos[i - 1]!.unidad.id !== n.unidad.id) enUnidad = 0;
    return ZIGZAG[enUnidad++ % ZIGZAG.length]!;
  });
}

export function Camino() {
  const grupo = useGrupoActual();
  const abrirCofre = useGrupos((s) => s.abrirCofre);
  const { abrirLeccion, abrirAventura, abrirAlbum, irAGrupos, estampaNueva, olvidarEstampaNueva } = useApp();
  const [cofre, setCofre] = useState<string | null>(null);
  const [facilitador, setFacilitador] = useState(false);
  const nodos = useMemo(() => nodosDelCamino(UNIDADES), []);
  const siguiente = useRef<HTMLDivElement>(null);

  const progreso = grupo?.progreso;
  const estados = progreso ? estadosDelCamino(nodos, progreso, grupo.desbloquearTodo) : [];
  const indiceSiguiente = progreso ? siguienteNodo(nodos, progreso) : null;

  useEffect(() => {
    if (!grupo) {
      irAGrupos();
      return;
    }
    // Solo se desplaza si la siguiente lección no se ve (así el parque queda a la vista al empezar).
    siguiente.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    if (!estampaNueva) decir(indiceSiguiente === null ? TEXTOS_APP.camino.terminaron : TEXTOS_APP.camino.hola(mascota(grupo.mascota).nombre), { expresion: 'senalando' });
    return () => callar();
    // Solo al entrar al camino.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!grupo || !progreso) return null;

  const tocar = (n: Nodo, estado: EstadoNodo) => {
    sonido.desbloquear();
    if (estado === 'bloqueado') {
      decir(TEXTOS_APP.camino.bloqueada, { expresion: 'pensando' });
      return;
    }
    if (n.tipo === 'leccion') abrirLeccion(n.leccion.id);
    else if (n.tipo === 'aventura') abrirAventura(n.unidad.id);
    else if (estado === 'disponible') {
      setCofre(n.unidad.id);
      decir(TEXTOS_APP.cofre.llegaron, { expresion: 'sorprendido' });
    }
  };

  // Posición horizontal de cada parada: zigzag que reinicia en cada unidad.
  const posiciones = posicionesZigzag(nodos);
  return (
    <main data-pantalla="camino" data-entrada-lista="true" className="flex h-full w-full flex-col bg-gradient-to-b from-cielo to-verde-claro">
      <Encabezado grupo={grupo} alAlbum={abrirAlbum} alCambiarGrupo={irAGrupos} alFacilitador={() => setFacilitador(true)} />
      <div className="relative min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-[70rem] flex-col items-center gap-4 px-4 pt-4 pb-16">
          <ParqueGrupo progreso={progreso} className="aspect-[16/6] w-full max-w-[calc(30vh*16/6)]" />
          {nodos.map((n, i) => {
            const nuevaUnidad = i === 0 || nodos[i - 1]!.unidad.id !== n.unidad.id;
            const x = posiciones[i]!;
            const esSiguiente = i === indiceSiguiente;
            return (
              <Fragment key={n.id}>
                {nuevaUnidad && <EncabezadoUnidad unidadId={n.unidad.id} />}
                {/* scroll-mt: al desplazarse a la siguiente parada queda espacio para el globo de Caco bajo el encabezado. */}
                <div ref={esSiguiente ? siguiente : undefined} className={`relative h-[clamp(7.5rem,17vmin,11rem)] w-full scroll-mt-[clamp(10rem,24vmin,15rem)] scroll-mb-8 ${esSiguiente ? 'z-10' : ''}`}>
                  <div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ left: `${x}%` }}>
                    <BurbujaNodo nodo={n} estado={estados[i]!} siguiente={esSiguiente} alTocar={() => tocar(n, estados[i]!)} hecho={estados[i] === 'hecho'} />
                  </div>
                  {esSiguiente && (
                    // Un solo Caco: el que señala la siguiente parada es el que habla, con su globo a un lado,
                    // del lado contrario de la parada (el camino zigzaguea: ahí siempre hay espacio libre).
                    <motion.div
                      // w-max: el globo conserva su ancho (si no, se encoge al espacio que queda en la columna).
                      className="absolute top-0 w-max"
                      style={x > 50 ? { right: `calc(${100 - x}% + clamp(4rem,9vmin,6rem))` } : { left: `calc(${x}% + clamp(4rem,9vmin,6rem))` }}
                      initial={{ opacity: 0, x: x > 50 ? -30 : 30 }}
                      animate={{ opacity: 1, x: 0 }}
                    >
                      <CacoGuia
                        alto="clamp(7rem,17vmin,11rem)"
                        globo={x > 50 ? 'izquierda' : 'derecha'}
                        anchoGlobo="min(22rem,26vw)"
                        globoDesdeArriba
                        expresionFija="senalando"
                        espejo={x <= 50}
                        soloMientrasHabla
                      />
                    </motion.div>
                  )}
                </div>
              </Fragment>
            );
          })}
          {/* Camino terminado: no hay parada que señalar; Caco habla al final del camino. */}
          {indiceSiguiente === null && (
            <div ref={siguiente} className="flex w-full justify-center pt-4">
              <CacoGuia alto="clamp(7rem,17vmin,11rem)" globo="arriba" anchoGlobo="min(28rem,60vw)" expresionFija="celebrando" soloMientrasHabla />
            </div>
          )}
        </div>
      </div>

      {cofre && (
        <ModalCofre
          alAbrir={() => {
            abrirCofre(cofre);
            sonido.celebrar();
            decir(TEXTOS_APP.cofre.abierto(HOJITAS_COFRE), { expresion: 'celebrando' });
          }}
          alCerrar={() => setCofre(null)}
        />
      )}
      {estampaNueva && <ModalEstampa id={estampaNueva} alCerrar={olvidarEstampaNueva} />}
      {facilitador && <PanelFacilitador grupo={grupo} alCerrar={() => setFacilitador(false)} />}
    </main>
  );
}

function EncabezadoUnidad({ unidadId }: { unidadId: string }) {
  const u = UNIDADES.find((x) => x.id === unidadId)!;
  return (
    <button
      type="button"
      onClick={() => decir([TEXTOS_APP.camino.encabezadoUnidad(u.numero, u.titulo), u.tema])}
      className="mt-4 flex w-full max-w-[52rem] cursor-pointer items-center gap-4 rounded-[1.75rem] border-[5px] border-white px-6 py-4 text-left text-white shadow-[0_0.45rem_0_rgba(18,61,43,0.25)]"
      style={{ backgroundColor: u.color }}
      data-unidad={u.id}
    >
      <span className="grid size-[clamp(3.5rem,8vmin,5rem)] shrink-0 place-items-center rounded-full bg-white/25 text-[clamp(1.8rem,4.5vmin,3rem)] font-black">{u.numero}</span>
      <span className="flex flex-col">
        <span className="text-[clamp(1.4rem,3.4vmin,2.4rem)] leading-tight font-black">{u.titulo}</span>
        <span className="text-[clamp(1rem,2.2vmin,1.4rem)] font-bold opacity-95">{u.tema}</span>
      </span>
    </button>
  );
}

function BurbujaNodo({ nodo, estado, siguiente, hecho, alTocar }: { nodo: Nodo; estado: EstadoNodo; siguiente: boolean; hecho: boolean; alTocar: () => void }) {
  const color = estado === 'bloqueado' ? '#8B969C' : nodo.unidad.color;
  const grande = nodo.tipo === 'aventura';
  const tamano = grande ? 'clamp(7rem,16vmin,10.5rem)' : 'clamp(5.5rem,12.5vmin,8.5rem)';
  const titulo = nodo.tipo === 'leccion' ? nodo.leccion.titulo : nodo.tipo === 'aventura' ? nodo.unidad.aventura.titulo : TEXTOS_APP.cofre.titulo;
  const arte = nodo.tipo === 'leccion' ? nodo.leccion.arte : nodo.tipo === 'aventura' ? nodo.unidad.aventura.arte : hecho ? 'cofre-abierto' : 'cofre';
  return (
    <div className="flex flex-col items-center gap-1">
      <motion.button
        type="button"
        aria-label={`${titulo}${estado === 'bloqueado' ? ' (bloqueada)' : estado === 'hecho' ? ' (terminada)' : ''}`}
        data-nodo={nodo.id}
        data-estado={estado}
        onClick={alTocar}
        animate={siguiente ? { scale: [1, 1.08, 1] } : {}}
        transition={siguiente ? { duration: 1.4, repeat: Infinity } : {}}
        whileTap={{ scale: 0.92 }}
        // scroll-mb: al desplazarse hacia la parada, queda por encima de Caco (fijo abajo a la izquierda).
        className={`relative grid scroll-mt-[9rem] scroll-mb-[clamp(10rem,26vmin,16rem)] cursor-pointer place-items-center border-[6px] shadow-[0_0.5rem_0_rgba(18,61,43,0.3)] ${nodo.tipo === 'cofre' ? 'rounded-[1.5rem] bg-transparent shadow-none' : 'rounded-full'} ${hecho ? 'border-[#FFD23F]' : 'border-white'}`}
        style={{ width: tamano, height: tamano, backgroundColor: nodo.tipo === 'cofre' ? undefined : color }}
      >
        {nodo.tipo === 'cofre' ? (
          <Arte clave={arte} className={`h-[95%] w-[95%] object-contain ${estado === 'bloqueado' ? 'opacity-40 grayscale' : ''}`} />
        ) : (
          // Disco blanco detrás del dibujo: contraste aunque el dibujo sea del mismo color que la unidad.
          <span className="grid h-[76%] w-[76%] place-items-center rounded-full bg-white/90">
            <Arte clave={arte} className={`h-[78%] w-[78%] object-contain ${estado === 'bloqueado' ? 'opacity-40 grayscale' : ''}`} />
          </span>
        )}
        {estado === 'bloqueado' && (
          <span className="absolute -right-2 -bottom-2 grid size-12 place-items-center rounded-full border-4 border-white bg-[#5B6770]">
            <Arte clave="candado" className="size-7" />
          </span>
        )}
        {hecho && nodo.tipo !== 'cofre' && (
          <span className="absolute -top-2 -right-2 grid size-12 place-items-center rounded-full border-4 border-white bg-verde">
            <Arte clave="palomita" className="size-7" />
          </span>
        )}
        {grande && <Arte clave="icono-estrella" className="absolute -top-6 size-14" />}
      </motion.button>
      <span className="max-w-[12rem] rounded-full bg-white/85 px-3 text-center text-[clamp(0.95rem,2vmin,1.3rem)] leading-tight font-extrabold text-tinta">{titulo}</span>
    </div>
  );
}

function ModalCofre({ alAbrir, alCerrar }: { alAbrir: () => void; alCerrar: () => void }) {
  const [abierto, setAbierto] = useState(false);
  return (
    <Modal etiqueta={TEXTOS_APP.cofre.titulo}>
      <motion.div key={String(abierto)} initial={{ scale: 0.6, rotate: -8 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring' }}>
        <Arte clave={abierto ? 'cofre-abierto' : 'cofre'} className="h-[clamp(9rem,28vmin,16rem)]" />
      </motion.div>
      {abierto && (
        <div className="flex items-center gap-3 text-[clamp(2rem,6vmin,4rem)] font-black text-verde">
          <Arte clave="hojita" className="size-[1.2em]" />+{HOJITAS_COFRE}
        </div>
      )}
      <CacoGuia alto="clamp(5rem,13vmin,8rem)" />
      <BotonGrande
        latir
        className="h-20 text-[clamp(1.4rem,3.2vmin,2.2rem)]"
        onClick={() => {
          if (!abierto) {
            setAbierto(true);
            alAbrir();
          } else alCerrar();
        }}
      >
        {abierto ? TEXTOS_APP.cofre.seguir : TEXTOS_APP.cofre.abrir}
      </BotonGrande>
    </Modal>
  );
}

function ModalEstampa({ id, alCerrar }: { id: string; alCerrar: () => void }) {
  const u = UNIDADES.find((x) => x.estampa.id === id);
  useEffect(() => {
    if (!u) return;
    sonido.celebrar();
    decir([TEXTOS_APP.album.nueva(u.estampa.nombre), u.estampa.dato], { expresion: 'celebrando' });
  }, [u]);
  if (!u) return null;
  return (
    <Modal etiqueta={TEXTOS_APP.album.titulo}>
      <motion.div initial={{ rotate: -20, scale: 0.4 }} animate={{ rotate: 0, scale: 1 }} transition={{ type: 'spring' }} className="grid size-[clamp(10rem,30vmin,16rem)] place-items-center rounded-[2rem] border-[6px] border-[#FFD23F] bg-white p-4">
        <Arte clave={u.estampa.arte} className="max-h-full max-w-full object-contain" />
      </motion.div>
      <p className="text-[clamp(1.6rem,4vmin,2.6rem)] font-black text-verde">{u.estampa.nombre}</p>
      <CacoGuia alto="clamp(5rem,13vmin,8rem)" />
      <BotonGrande latir className="h-20 text-[clamp(1.4rem,3.2vmin,2.2rem)]" onClick={alCerrar}>
        {TEXTOS_APP.cofre.seguir}
      </BotonGrande>
    </Modal>
  );
}
