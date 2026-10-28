import { urlArte } from '../componentes/Arte';

/*
 * Efectos de "juice" (v3): chispas al tocar, lluvia de hojitas que vuela al contador y estallidos.
 * Son elementos sueltos en una capa encima de todo, animados con la Web Animations API sobre
 * transform y opacity (la tarjeta de video los mueve sin trabajo del procesador). Se borran solos.
 * Con movimiento reducido o "animaciones suaves" no hay partículas: el contador sube igual.
 */

export const COLORES_CHISPA = ['#FFD23F', '#4CAF50', '#F28C28', '#FFFFFF'] as const;

export function movimientoReducido(): boolean {
  if (typeof window === 'undefined') return true;
  return document.documentElement.hasAttribute('data-suave') || !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

let capa: HTMLDivElement | null = null;
/** Capa fija encima de todo (no recibe toques). */
function capaDeEfectos(): HTMLDivElement {
  if (capa?.isConnected) return capa;
  capa = document.createElement('div');
  capa.className = 'capa-efectos';
  capa.setAttribute('aria-hidden', 'true');
  document.body.appendChild(capa);
  return capa;
}

function puedeAnimar(el: Element): boolean {
  return typeof (el as HTMLElement).animate === 'function';
}

/** Punto (en px de la ventana) del centro de un elemento. */
export function centroDe(el: Element): { x: number; y: number } {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

/** Chispas que saltan de un punto (al tocar un botón, al acertar). */
export function chispas(x: number, y: number, { cantidad = 8, colores = COLORES_CHISPA as readonly string[], alcance = 70 } = {}): void {
  if (typeof document === 'undefined' || movimientoReducido()) return;
  const padre = capaDeEfectos();
  for (let i = 0; i < cantidad; i++) {
    const el = document.createElement('i');
    el.className = 'chispa';
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.style.background = colores[i % colores.length]!;
    padre.appendChild(el);
    if (!puedeAnimar(el)) {
      el.remove();
      continue;
    }
    const angulo = (i / cantidad) * Math.PI * 2 + (i % 2) * 0.3;
    const d = alcance * (0.7 + ((i * 37) % 10) / 20);
    const animacion = el.animate(
      [
        { transform: 'translate(-50%, -50%) scale(1)', opacity: 1 },
        { transform: `translate(calc(-50% + ${Math.cos(angulo) * d}px), calc(-50% + ${Math.sin(angulo) * d}px)) scale(0.2)`, opacity: 0 },
      ],
      { duration: 520, easing: 'cubic-bezier(0.2, 0.8, 0.3, 1)' },
    );
    animacion.onfinish = () => el.remove();
  }
}

/**
 * Hojitas que salen de `desde` y vuelan en curva hasta `hasta` (el contador). `alLlegar` se llama
 * por cada hojita que llega (para que el número suba de uno en uno). Devuelve cuánto tarda en total.
 */
export function hojitasAlContador(desde: { x: number; y: number }, hasta: Element | null, cantidad: number, alLlegar?: (i: number) => void): number {
  const PASO = 90;
  const VUELO = 750;
  if (typeof document === 'undefined' || !hasta || movimientoReducido()) {
    for (let i = 0; i < cantidad; i++) alLlegar?.(i);
    return 0;
  }
  const destino = centroDe(hasta);
  const padre = capaDeEfectos();
  const url = urlArte('hojita');
  for (let i = 0; i < cantidad; i++) {
    const el = document.createElement('img');
    el.src = url;
    el.alt = '';
    el.className = 'hojita-vuela';
    el.style.left = `${desde.x}px`;
    el.style.top = `${desde.y}px`;
    padre.appendChild(el);
    if (!puedeAnimar(el)) {
      el.remove();
      alLlegar?.(i);
      continue;
    }
    // Primero se abren en abanico y luego vuelan al contador.
    const abanico = { x: Math.cos(i * 1.9) * 80, y: -60 - ((i * 23) % 50) };
    const dx = destino.x - desde.x;
    const dy = destino.y - desde.y;
    const animacion = el.animate(
      [
        { transform: 'translate(-50%, -50%) scale(0.4) rotate(0deg)', opacity: 0 },
        { transform: `translate(calc(-50% + ${abanico.x}px), calc(-50% + ${abanico.y}px)) scale(1.1) rotate(${i * 40}deg)`, opacity: 1, offset: 0.3 },
        { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(0.6) rotate(${i * 40 + 220}deg)`, opacity: 1 },
      ],
      { duration: VUELO, delay: i * PASO, easing: 'cubic-bezier(0.45, 0, 0.55, 1)', fill: 'backwards' },
    );
    animacion.onfinish = () => {
      el.remove();
      alLlegar?.(i);
    };
  }
  return VUELO + (cantidad - 1) * PASO;
}

/** Lluvia de hojitas que caen desde arriba por toda la pantalla (aciertos, fin de lección). */
export function lluviaDeHojitas(cantidad = 14): void {
  if (typeof document === 'undefined' || movimientoReducido()) return;
  const padre = capaDeEfectos();
  const url = urlArte('hojita');
  const ancho = window.innerWidth;
  const alto = window.innerHeight;
  for (let i = 0; i < cantidad; i++) {
    const el = document.createElement('img');
    el.src = url;
    el.alt = '';
    el.className = 'hojita-cae';
    const x = ((i * 0.618034) % 1) * ancho;
    el.style.left = `${x}px`;
    el.style.top = '-6vmin';
    padre.appendChild(el);
    if (!puedeAnimar(el)) {
      el.remove();
      continue;
    }
    const deriva = Math.sin(i * 2.1) * 120;
    const animacion = el.animate(
      [
        { transform: 'translate(0, 0) rotate(0deg)', opacity: 1 },
        { transform: `translate(${deriva * 0.5}px, ${alto * 0.5}px) rotate(${180 + i * 20}deg)`, opacity: 1, offset: 0.5 },
        { transform: `translate(${deriva}px, ${alto + 80}px) rotate(${360 + i * 30}deg)`, opacity: 0.6 },
      ],
      { duration: 1600 + (i % 5) * 220, delay: (i % 7) * 90, easing: 'ease-in', fill: 'backwards' },
    );
    animacion.onfinish = () => el.remove();
  }
}

/** Estallido de rayos y chispas desde el centro de un elemento (cofre que se abre, estampa nueva). */
export function estallido(el: Element | null, colores: readonly string[] = COLORES_CHISPA): void {
  if (!el) return;
  const { x, y } = centroDe(el);
  chispas(x, y, { cantidad: 18, colores, alcance: 220 });
  chispas(x, y, { cantidad: 10, colores, alcance: 120 });
}
