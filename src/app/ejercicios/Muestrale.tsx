import { useEffect, useRef, useState } from 'react';
import { CATEGORIAS, type Categoria } from '../../data/categorias';
import { MAPEO_IMAGENET } from '../../data/mapeoImagenet';
import { MODELO } from '../../data/modelo';
import { TEXTOS } from '../../data/textos';
import { TEXTOS_APP } from '../../contenido/textosApp';
import type { Muestrale as Datos } from '../../contenido/tipos';
import { textoPista } from '../../logica/clasificacion';
import { interpretar } from '../../logica/interpretacion';
import { abrirCamara } from '../../servicios/camara';
import { cargarClasificador, type Clasificador } from '../../servicios/clasificador';
import { Arte } from '../componentes/Arte';
import { BotonGrande } from '../componentes/BotonGrande';
import { decir } from '../estado/narrador';
import type { PropsEjercicio } from './comun';
import { EligeImagen } from './EligeImagen';

type Paso = 'camara' | 'cargando' | 'listo' | 'pensando' | 'botes' | 'dibujos';

/**
 * 8. Muéstrale a Caco: se muestra un residuo real a la cámara y Caco intenta reconocerlo
 * (en el dispositivo, sin guardar ni enviar imágenes). Sin cámara o sin modelo, se juega
 * "Elige la imagen" con dibujos.
 */
export function Muestrale({ ejercicio, responder, bloqueado }: PropsEjercicio<Datos>) {
  const [paso, setPaso] = useState<Paso>('camara');
  const [esperado, setEsperado] = useState<Categoria | null>(null);
  const video = useRef<HTMLDivElement>(null);
  const camara = useRef<{ elemento: HTMLVideoElement; detener: () => void } | null>(null);
  const clasificador = useRef<Clasificador | null>(null);
  const vivo = useRef(true);

  useEffect(() => {
    vivo.current = true;
    return () => {
      vivo.current = false;
      camara.current?.detener();
      camara.current = null;
    };
  }, []);

  const aDibujos = (mensaje: string) => {
    camara.current?.detener();
    camara.current = null;
    setPaso('dibujos');
    decir([mensaje, ejercicio.respaldo.consigna]);
  };

  const encender = async () => {
    setPaso('cargando');
    const r = await abrirCamara(480, 360, () => !vivo.current);
    if (!vivo.current) return;
    if (!r.ok) return aDibujos(TEXTOS.bonus.sinCamara[r.motivo]);
    camara.current = { elemento: r.video, detener: r.detener };
    video.current?.replaceChildren(r.video);
    decir(TEXTOS.bonus.cargando);
    try {
      clasificador.current = await cargarClasificador();
    } catch {
      if (vivo.current) aDibujos(TEXTOS.bonus.sinModelo);
      return;
    }
    if (!vivo.current) return;
    setPaso('listo');
    decir(TEXTOS.bonus.listo);
  };

  const adivinar = async () => {
    if (!clasificador.current || !camara.current) return;
    setPaso('pensando');
    decir(TEXTOS.bonus.pensando);
    let interp;
    try {
      interp = interpretar(await clasificador.current.clasificar(camara.current.elemento), MAPEO_IMAGENET, CATEGORIAS, MODELO.umbralConfianza);
    } catch {
      interp = { tipo: 'duda' as const, mejor: null };
    }
    if (!vivo.current) return;
    if (interp.tipo === 'seguro') {
      setEsperado(interp.categoria);
      decir(TEXTOS.bonus.creoQueEs(interp.nombre));
    } else {
      setEsperado(null);
      decir(TEXTOS.bonus.meAyudas);
    }
    setPaso('botes');
  };

  const elegirBote = (c: Categoria) => {
    if (bloqueado) return;
    // Si Caco pidió ayuda no hay forma de saber la respuesta: se agradece y cuenta como hecho.
    if (!esperado) return responder({ correcto: true, terminado: true, exito: TEXTOS.bonus.gracias });
    if (c.id === esperado.id) responder({ correcto: true, terminado: true });
    else responder({ correcto: false, terminado: false, pista: textoPista(esperado) });
  };

  if (paso === 'dibujos') return <EligeImagen ejercicio={ejercicio.respaldo} responder={responder} bloqueado={bloqueado} />;

  return (
    <div className="flex flex-col items-center gap-4" data-ejercicio="muestrale">
      <div className="flex flex-wrap items-center justify-center gap-6">
        <div className="relative grid aspect-[4/3] w-[clamp(16rem,40vmin,30rem)] place-items-center overflow-hidden rounded-[1.75rem] border-[6px] border-white bg-verde-oscuro">
          {/* Aquí se monta el <video> de la cámara; React no pone nada dentro de este div. */}
          <div ref={video} className="absolute inset-0 [&>video]:!h-full [&>video]:!w-full [&>video]:!rounded-none [&>video]:!border-0" />
          {paso === 'camara' && <Arte clave="icono-camara" className="relative size-24 opacity-80" />}
          {paso === 'cargando' && <Arte clave="brillo" className="relative size-24 animate-spin" />}
        </div>
        <div className="flex flex-col gap-4">
          {paso === 'camara' && (
            <BotonGrande color="azul" className="h-20 text-[clamp(1.4rem,3vmin,2rem)]" icono={<Arte clave="icono-camara" className="size-12" />} onClick={() => void encender()}>
              {TEXTOS.bonus.botonCamara}
            </BotonGrande>
          )}
          {(paso === 'listo' || paso === 'pensando') && (
            <BotonGrande color="morado" latir={paso === 'listo'} className="h-20 text-[clamp(1.4rem,3vmin,2rem)]" onClick={() => void adivinar()}>
              {TEXTOS_APP.leccion.adivina}
            </BotonGrande>
          )}
          <BotonGrande color="verde" className="h-16 text-[clamp(1.1rem,2.4vmin,1.6rem)]" onClick={() => aDibujos(TEXTOS.bonus.conDibujos)}>
            {TEXTOS.bonus.botonDibujos}
          </BotonGrande>
        </div>
      </div>
      <p className="max-w-[40rem] rounded-2xl bg-white/90 px-4 py-2 text-center text-[clamp(0.95rem,2vmin,1.25rem)] font-bold">{TEXTOS.bonus.privacidad}</p>
      {paso === 'botes' && (
        <div className="flex gap-6">
          {CATEGORIAS.map((c) => (
            <button key={c.id} type="button" data-bote={c.id} aria-label={`Bote ${c.nombre}`} onClick={() => elegirBote(c)} className="flex cursor-pointer flex-col items-center gap-1">
              <Arte clave={`bote-${c.id}`} className="h-[clamp(6rem,16vmin,10rem)]" />
              <span className="rounded-full border-4 bg-white px-3 font-extrabold" style={{ borderColor: c.color, color: c.color }}>
                {c.nombre}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
