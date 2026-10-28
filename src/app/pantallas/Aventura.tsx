import { useEffect, useRef } from 'react';
import type Phaser from 'phaser';
import { musica } from '../../servicios/audio/motor';
import { useApp } from '../estado/app';

/** Phaser dibuja texto en un lienzo: hay que esperar a que la fuente Nunito esté lista. */
async function prepararFuentes(): Promise<void> {
  try {
    const fuentes = document.fonts;
    if (!fuentes) return;
    await Promise.race([
      Promise.all(['700 48px Nunito', '800 48px Nunito', '900 48px Nunito'].map((f) => fuentes.load(f))),
      new Promise((r) => setTimeout(r, 3000)),
    ]);
  } catch {
    // Sin la fuente se usa la del sistema; el juego sigue igual.
  }
}

/**
 * Monta una aventura de Phaser dentro de React. Phaser se descarga aquí (no al abrir la app)
 * y se destruye al salir, liberando la memoria.
 */
export function Aventura() {
  const contenedor = useRef<HTMLDivElement>(null);
  const escenaInicial = useApp((s) => s.escenaInicial);
  const volverAlInicio = useApp((s) => s.volverAlInicio);

  useEffect(() => musica.poner('lecciones'), []);

  useEffect(() => {
    let juego: Phaser.Game | null = null;
    let cancelado = false;
    void (async () => {
      await prepararFuentes();
      const { crearAventuraUnidad1 } = await import('../../aventuras/unidad1');
      if (cancelado || !contenedor.current) return;
      juego = crearAventuraUnidad1(contenedor.current, { escenaInicial, alTerminar: volverAlInicio });
    })();
    return () => {
      cancelado = true;
      juego?.destroy(true);
    };
  }, [escenaInicial, volverAlInicio]);

  return <div data-pantalla="aventura" ref={contenedor} className="h-full w-full bg-verde-oscuro" />;
}
