import { useApp } from '../app/estado/app';
import type Phaser from 'phaser';
import { ANIMALES } from '../data/animales';
import { progreso, resumenDiploma } from '../logica/progreso';
import { entradaTerminada } from '../ui/transicion';
import { juegoActual } from '../aventuras/juegoActual';
import { musica } from './audio/motor';
import { voz } from './voz';

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

// Ojo: aquí no se importa Phaser como valor, para no cargarlo antes de entrar a una aventura.
type ConTransformacion = Phaser.GameObjects.GameObject &
  Phaser.GameObjects.Components.GetBounds & { getWorldTransformMatrix(): Phaser.GameObjects.Components.TransformMatrix };

/** Tamaño del área de toque (no del dibujo), con la escala de todos sus contenedores. */
function zonaDeToque(o: ConTransformacion): { ancho: number; alto: number } {
  const m = o.getWorldTransformMatrix();
  const sx = Math.hypot(m.a, m.b);
  const sy = Math.hypot(m.c, m.d);
  const h = o.input?.hitArea as { radius?: number; width?: number; height?: number } | undefined;
  if (h && typeof h.radius === 'number') return { ancho: h.radius * 2 * sx, alto: h.radius * 2 * sy };
  if (h && typeof h.width === 'number' && typeof h.height === 'number') return { ancho: h.width * sx, alto: h.height * sy };
  const b = o.getBounds();
  return { ancho: b.width, alto: b.height };
}

/**
 * Ganchos para las pruebas automáticas de recorrido (Playwright). Solo se activan en
 * desarrollo o con `?e2e` en la dirección; no exponen ni guardan datos de nadie.
 */
export function exponerParaPruebas(): void {
  const params = new URLSearchParams(window.location.search);
  if (!import.meta.env.DEV && !params.has('e2e')) return;

  /** Escenas de Phaser activas (ninguna si se están viendo pantallas de React). */
  const escenasActivas = () => juegoActual()?.scene.getScenes(true) ?? [];

  const tocables = (): ObjetoTocable[] => {
    const lista: ObjetoTocable[] = [];
    for (const escena of escenasActivas()) {
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
          const hijos = (o as unknown as { list?: unknown }).list;
          if (o.type === 'Container' && Array.isArray(hijos)) visitar(hijos as Phaser.GameObjects.GameObject[]);
        }
      };
      visitar(escena.children.list);
    }
    return lista;
  };

  (window as unknown as Record<string, unknown>).__mixtle = {
    escenas: () => escenasActivas().map((s) => s.scene.key),
    /** Pantalla de React visible (por ejemplo "inicio" o "aventura"). */
    pantalla: () => document.querySelector<HTMLElement>('[data-pantalla]')?.dataset.pantalla ?? null,
    tocables,
    resumen: () => resumenDiploma(progreso(), ANIMALES),
    /** Marcador de la aventura de las unidades 2 a 5 (lo que llevan rescatado, sembrado, etc.). */
    marcador: () => (juegoActual()?.registry.get('marcador') as Record<string, number> | undefined) ?? null,
    /** Frases dichas con audio grabado y con la voz del navegador. */
    voz: () => ({ ...voz.cuenta }),
    /** Pista de música de fondo que está sonando (o null). */
    musica: () => musica.pistaActual,
    fps: () => Math.round(juegoActual()?.loop.actualFps ?? 0),
    /** Vuelve al camino como si se acabara de ganar esa estampa (revisar la recompensa y grabar el tráiler). */
    estampaNueva: (id: string) => useApp.getState().alCamino(id),
    /** true cuando ninguna pantalla visible está a media animación de entrada (para capturas). */
    quieto: () => {
      const activas = escenasActivas().filter((s) => s.scene.key !== 'Boot');
      if (activas.length) return activas.every(entradaTerminada);
      if (juegoActual()) return false; // la aventura aún está cargando
      return !!document.querySelector('[data-pantalla][data-entrada-lista="true"]');
    },
  };
}
