import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { TEXTOS } from '../../data/textos';
import { reiniciarProgreso } from '../../logica/progreso';
import { musica } from '../../servicios/audio/motor';
import { sonido } from '../../servicios/sonido';
import { voz } from '../../servicios/voz';
import { Arte } from '../componentes/Arte';
import { BotonesSistema } from '../componentes/BotonesSistema';
import { BotonGrande } from '../componentes/BotonGrande';
import { CacoFigura } from '../componentes/CacoFigura';
import { useApp } from '../estado/app';

const MARIPOSAS = [
  { left: '61%', top: '55%', retraso: 0 },
  { left: '74%', top: '42%', retraso: 0.6 },
  { left: '95%', top: '70%', retraso: 1.2 },
];

/** Pantalla tipo póster: título, Caco, los animales del parque y el botón "¡Jugar!". */
export function Inicio() {
  const jugar = useApp((s) => s.jugar);
  const [entradaLista, setEntradaLista] = useState(false);
  useEffect(() => musica.poner('tranquila'), []);

  return (
    <main data-pantalla="inicio" data-entrada-lista={entradaLista} className="relative h-full w-full overflow-hidden">
      <Arte clave="parque" className="absolute inset-0 h-full w-full object-cover object-bottom" />

      <motion.h1
        initial={{ y: '-120%' }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 120, damping: 11 }}
        onAnimationComplete={() => setEntradaLista(true)}
        className="absolute top-[4%] left-[58%] -translate-x-1/2 text-center text-[clamp(3.5rem,11vmin,9.5rem)] leading-[0.9] font-black whitespace-pre text-white"
        style={{ WebkitTextStroke: '0.12em var(--color-verde)', paintOrder: 'stroke fill', textShadow: '0 0.08em 0 rgba(18,61,43,0.35)' }}
      >
        {TEXTOS.inicio.titulo}
      </motion.h1>

      <CacoFigura alto="min(64%, 48vw)" className="absolute bottom-[4%] left-[5%]" />

      <motion.div
        className="absolute right-[10%] bottom-[6%] h-[24%]"
        animate={{ y: [0, -24, 0] }}
        transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1.6, ease: 'easeOut' }}
      >
        <Arte clave="ardilla-feliz" className="h-full" />
      </motion.div>

      <motion.div
        className="absolute top-[47%] right-[5%] h-[13%]"
        animate={{ y: [0, -18, 0] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Arte clave="colibri-feliz" className="h-full" />
      </motion.div>

      {MARIPOSAS.map((m, i) => (
        <motion.div
          key={i}
          className="absolute h-[9%]"
          style={{ left: m.left, top: m.top }}
          animate={{ scaleX: [1, 0.2, 1], y: [0, -20, 0] }}
          transition={{ scaleX: { duration: 0.4, repeat: Infinity, delay: m.retraso }, y: { duration: 3, repeat: Infinity, delay: m.retraso } }}
        >
          <Arte clave="mariposa-feliz" className="h-full" />
        </motion.div>
      ))}

      <div className="absolute bottom-[9%] left-[58%] -translate-x-1/2">
        <BotonGrande
          latir
          className="h-[clamp(5rem,16vmin,11rem)] px-[clamp(2rem,5vmin,4rem)] text-[clamp(2.5rem,8vmin,5.5rem)]"
          icono={<Arte clave="icono-jugar" className="h-[0.8em]" />}
          onClick={() => {
            sonido.desbloquear();
            voz.desbloquear();
            reiniciarProgreso();
            jugar();
          }}
        >
          {TEXTOS.inicio.jugar}
        </BotonGrande>
      </div>

      <BotonesSistema />
    </main>
  );
}
