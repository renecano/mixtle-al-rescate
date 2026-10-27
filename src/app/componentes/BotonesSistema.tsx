import { useSyncExternalStore } from 'react';
import { estadoSonido } from '../../servicios/estadoSonido';
import { Arte } from './Arte';
import { BotonGrande } from './BotonGrande';

function useSonidoActivo(): boolean {
  return useSyncExternalStore(
    (avisar) => estadoSonido.escuchar(avisar),
    () => estadoSonido.estaActivo,
  );
}

/** Del mismo tamaño que en las aventuras: ~120 px en el proyector y ~85 px en la tablet. */
const TAMANO = 'size-[clamp(4.5rem,11vmin,8rem)]';
const ICONO = 'size-[clamp(2.75rem,6.5vmin,4.75rem)] shrink-0';

/** Botones de sonido y pantalla completa, arriba a la derecha. */
export function BotonesSistema() {
  const activo = useSonidoActivo();
  const puedePantallaCompleta = typeof document !== 'undefined' && !!document.fullscreenEnabled;

  return (
    <div className="absolute top-4 right-4 z-20 flex gap-4">
      {puedePantallaCompleta && (
        <BotonGrande
          color="verde"
          etiqueta="Pantalla completa"
          className={TAMANO}
          icono={<Arte clave="icono-pantalla" className={ICONO} />}
          onClick={() => {
            if (document.fullscreenElement) void document.exitFullscreen();
            else void document.documentElement.requestFullscreen().catch(() => undefined);
          }}
        />
      )}
      <BotonGrande
        color={activo ? 'azul' : 'gris'}
        etiqueta={activo ? 'Apagar el sonido' : 'Encender el sonido'}
        presionado={activo}
        className={TAMANO}
        icono={<Arte clave={activo ? 'icono-sonido' : 'icono-mudo'} className={ICONO} />}
        onClick={() => estadoSonido.alternar()}
      />
    </div>
  );
}
