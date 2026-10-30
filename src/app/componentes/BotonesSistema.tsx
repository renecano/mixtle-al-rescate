import { useSyncExternalStore } from 'react';
import { musica } from '../../servicios/audio/motor';
import { estadoMusica, estadoSonido, type Interruptor } from '../../servicios/estadoSonido';

/** Si la música empezó hace menos de esto, fue este toque el que la arrancó. */
const RECIEN_MS = 1000;
import { Arte } from './Arte';
import { BotonGrande } from './BotonGrande';

function useEncendido(interruptor: Interruptor): boolean {
  return useSyncExternalStore(
    (avisar) => interruptor.escuchar(avisar),
    () => interruptor.estaActivo,
  );
}

/** Del mismo tamaño que en las aventuras: ~120 px en el proyector y ~85 px en la tablet. */
const TAMANO = 'size-[clamp(4rem,10vmin,7.5rem)]';
const ICONO = 'size-[clamp(2.75rem,6.5vmin,4.75rem)] shrink-0';

/**
 * Botones de pantalla completa, música y voz (por separado). Por defecto flotan arriba a la derecha;
 * con `enLinea` van dentro de una barra.
 */
export function BotonesSistema({ enLinea = false }: { enLinea?: boolean }) {
  const vozActiva = useEncendido(estadoSonido);
  const musicaActiva = useEncendido(estadoMusica);
  const puedePantallaCompleta = typeof document !== 'undefined' && !!document.fullscreenEnabled;

  return (
    <div className={enLinea ? 'flex shrink-0 gap-3 max-xl:gap-2' : 'absolute top-4 right-4 z-20 flex gap-4'} data-recorrido="sistema">
      {puedePantallaCompleta && (
        <BotonGrande
          color="verde"
          etiqueta="Pantalla completa"
          className={enLinea ? `${TAMANO} max-xl:size-16` : TAMANO}
          icono={<Arte clave="icono-pantalla" className={ICONO} />}
          onClick={() => {
            if (document.fullscreenElement) void document.exitFullscreen();
            else void document.documentElement.requestFullscreen().catch(() => undefined);
          }}
        />
      )}
      <BotonGrande
        color={musicaActiva ? 'morado' : 'gris'}
        etiqueta={musicaActiva ? 'Apagar la música' : 'Encender la música'}
        presionado={musicaActiva}
        className={enLinea ? `${TAMANO} max-xl:size-16` : TAMANO}
        icono={<Arte clave={musicaActiva ? 'icono-musica' : 'icono-musica-no'} className={ICONO} />}
        onClick={() => {
          // Música activada pero bloqueada por el navegador: el pointerdown de este mismo toque la
          // acaba de arrancar. Ese toque quería oírla, no apagarla (antes había que tocar dos veces).
          const hace = musicaActiva ? musica.empezoHace(Date.now()) : null;
          if (hace !== null && hace < RECIEN_MS) return;
          estadoMusica.alternar();
        }}
      />
      <BotonGrande
        color={vozActiva ? 'azul' : 'gris'}
        etiqueta={vozActiva ? 'Apagar la voz' : 'Encender la voz'}
        presionado={vozActiva}
        className={enLinea ? `${TAMANO} max-xl:size-16` : TAMANO}
        icono={<Arte clave={vozActiva ? 'icono-sonido' : 'icono-mudo'} className={ICONO} />}
        onClick={() => estadoSonido.alternar()}
      />
    </div>
  );
}
