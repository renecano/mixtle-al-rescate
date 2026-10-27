import Phaser from 'phaser';
import { ANIMALES } from '../data/animales';
import { progreso, resumenDiploma } from '../logica/progreso';

export interface ObjetoTocable {
  nombre: string;
  escena: string;
  x: number;
  y: number;
  ancho: number;
  alto: number;
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
          if (o.input?.enabled && o.name && 'getBounds' in o) {
            const b = (o as unknown as Phaser.GameObjects.Components.GetBounds).getBounds();
            lista.push({ nombre: o.name, escena: escena.scene.key, x: b.centerX, y: b.centerY, ancho: b.width, alto: b.height });
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
  };
}
