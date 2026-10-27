import Phaser from 'phaser';
import { ANIMALES } from '../data/animales';
import { progreso, resumenDiploma } from '../logica/progreso';
import { entradaTerminada } from '../ui/transicion';
import { camarasActivas } from './camara';

export interface ObjetoTocable {
  nombre: string;
  escena: string;
  /** Centro visual, en coordenadas del juego. */
  x: number;
  y: number;
  ancho: number;
  alto: number;
  /** Tamaño real del área de toque, en coordenadas del juego. */
  toqueAncho: number;
  toqueAlto: number;
}

type ConTransformacion = Phaser.GameObjects.GameObject &
  Phaser.GameObjects.Components.GetBounds & { getWorldTransformMatrix(): Phaser.GameObjects.Components.TransformMatrix };

/** Tamaño del área de toque (no del dibujo), con la escala de todos sus contenedores. */
function zonaDeToque(o: ConTransformacion): { ancho: number; alto: number } {
  const m = o.getWorldTransformMatrix();
  const sx = Math.hypot(m.a, m.b);
  const sy = Math.hypot(m.c, m.d);
  const h = o.input?.hitArea as unknown;
  if (h instanceof Phaser.Geom.Circle) return { ancho: h.radius * 2 * sx, alto: h.radius * 2 * sy };
  if (h instanceof Phaser.Geom.Rectangle) return { ancho: h.width * sx, alto: h.height * sy };
  const b = o.getBounds();
  return { ancho: b.width, alto: b.height };
}

/**
 * Ganchos para las pruebas automáticas de recorrido (Playwright). Solo se activan en
 * desarrollo o con `?e2e` en la dirección; no exponen ni guardan datos de nadie.
 */
export function exponerParaPruebas(juego: Phaser.Game): void {
  const params = new URLSearchParams(window.location.search);
  if (!import.meta.env.DEV && !params.has('e2e')) return;

  const tocables = (): ObjetoTocable[] => {
    const lista: ObjetoTocable[] = [];
    for (const escena of juego.scene.getScenes(true)) {
      const visitar = (objetos: Phaser.GameObjects.GameObject[]) => {
        for (const o of objetos) {
          const visible = (o as unknown as { visible?: boolean }).visible !== false;
          if (!visible) continue;
          if (o.input?.enabled && o.name && 'getBounds' in o && 'getWorldTransformMatrix' in o) {
            const t = o as ConTransformacion;
            const b = t.getBounds();
            const z = zonaDeToque(t);
            lista.push({
              nombre: o.name,
              escena: escena.scene.key,
              x: b.centerX,
              y: b.centerY,
              ancho: b.width,
              alto: b.height,
              toqueAncho: z.ancho,
              toqueAlto: z.alto,
            });
          }
          if (o instanceof Phaser.GameObjects.Container) visitar(o.list);
        }
      };
      visitar(escena.children.list);
    }
    return lista;
  };

  (window as unknown as Record<string, unknown>).__caco = {
    escenas: () => juego.scene.getScenes(true).map((s) => s.scene.key),
    tocables,
    resumen: () => resumenDiploma(progreso(), ANIMALES),
    camarasActivas,
    fps: () => Math.round(juego.loop.actualFps),
    /** true cuando ninguna pantalla visible está a media animación de entrada (para capturas). */
    quieto: () => {
      const activas = juego.scene.getScenes(true).filter((s) => s.scene.key !== 'Boot');
      return activas.length > 0 && activas.every(entradaTerminada);
    },
  };
}
