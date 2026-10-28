import { motion } from 'motion/react';
import { TEXTOS_APP } from '../../contenido/textosApp';
import { textoDeLocucion, type Locucion } from '../../voz/locucion';
import { Arte } from './Arte';
import { BotonGrande } from './BotonGrande';
import { MixtleFigura } from './MixtleFigura';

export interface DatosBanner {
  tipo: 'bien' | 'casi';
  texto: Locucion;
}

/**
 * Retroalimentación al instante, abajo de la pantalla.
 * Verde: Mixtle feliz, frase de ánimo y "¡Sigamos!". Naranja: Mixtle amable, la pista e "Intentar otra vez".
 * Nunca hay mensajes que hagan sentir mal.
 */
export function BannerRespuesta({ banner, alContinuar }: { banner: DatosBanner; alContinuar: () => void }) {
  const bien = banner.tipo === 'bien';
  return (
    <motion.div
      className={`fixed inset-x-0 bottom-0 z-40 flex items-center gap-[clamp(0.75rem,3vmin,2rem)] border-t-[6px] border-white px-[clamp(1rem,4vmin,3rem)] py-[clamp(0.75rem,2.5vmin,1.5rem)] ${bien ? 'bg-verde' : 'bg-naranja'}`}
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 26 }}
      role="alert"
      data-banner={banner.tipo}
    >
      <MixtleFigura alto="clamp(5.5rem,15vmin,9rem)" expresion={bien ? 'celebrando' : 'pensando'} className="shrink-0" />
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {bien && <Arte clave="icono-estrella" className="size-[clamp(2.5rem,6vmin,4rem)] shrink-0" />}
        <p className="text-[clamp(1.3rem,3vmin,2.3rem)] leading-tight font-black text-white">{textoDeLocucion(banner.texto)}</p>
      </div>
      <BotonGrande
        color={bien ? 'naranja' : 'azul'}
        latir
        className="h-[clamp(4.5rem,11vmin,6.5rem)] shrink-0 text-[clamp(1.3rem,3vmin,2.2rem)]"
        icono={<Arte clave={bien ? 'icono-siguiente' : 'icono-repetir'} className="size-[1.4em]" />}
        onClick={alContinuar}
      >
        {bien ? TEXTOS_APP.leccion.seguir : TEXTOS_APP.leccion.intentar}
      </BotonGrande>
    </motion.div>
  );
}
