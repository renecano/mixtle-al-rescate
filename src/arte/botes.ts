import type { Categoria, IconoCategoria } from '../data/categorias';
import { arte, type ArteSvg } from './svg';

/** Íconos de categoría dibujados en una caja de 100×100, en el color del bote. */
export function iconoCategoria(icono: IconoCategoria, c: string): string {
  switch (icono) {
    case 'hoja':
      return `<path d="M18 84 C 18 40 50 14 88 12 C 88 56 62 86 18 84 Z" fill="${c}"/>
        <path d="M18 84 C 40 64 60 44 80 22 M44 62 L 40 44 M58 48 L 74 50" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round"/>`;
    case 'reciclaje': {
      const flecha = `<path d="M50 20 A 32 32 0 0 1 77.7 36" fill="none" stroke="${c}" stroke-width="11" stroke-linecap="round"/>
        <path d="M83 47 L 68 41 L 86 30 Z" fill="${c}" stroke="${c}" stroke-width="4" stroke-linejoin="round"/>`;
      return `${flecha}<g transform="rotate(120 50 52)">${flecha}</g><g transform="rotate(240 50 52)">${flecha}</g>`;
    }
    case 'basura':
      return `<rect x="22" y="22" width="56" height="10" rx="4" fill="${c}"/><rect x="40" y="12" width="20" height="10" rx="3" fill="${c}"/>
        <path d="M27 36 L 73 36 L 68 90 L 32 90 Z" fill="${c}"/>
        <path d="M41 46 V 80 M50 46 V 80 M59 46 V 80" stroke="#fff" stroke-width="5" stroke-linecap="round"/>`;
    case 'papel':
      return `<path d="M24 10 H 62 L 78 26 V 90 H 24 Z" fill="${c}"/><path d="M62 10 V 26 H 78" fill="#fff" opacity=".6"/>
        <path d="M34 42 H 68 M34 56 H 68 M34 70 H 58" stroke="#fff" stroke-width="6" stroke-linecap="round"/>`;
    case 'botella':
      return `<rect x="40" y="6" width="20" height="12" rx="3" fill="${c}"/>
        <path d="M42 18 H 58 V 28 C 58 34 72 38 72 52 V 86 C 72 92 68 94 62 94 H 38 C 32 94 28 92 28 86 V 52 C 28 38 42 34 42 28 Z" fill="${c}"/>
        <path d="M38 56 V 82" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".7"/>`;
    case 'lata':
      return `<path d="M28 18 V 82 C 28 94 72 94 72 82 V 18 Z" fill="${c}"/><ellipse cx="50" cy="18" rx="22" ry="8" fill="${c}" stroke="#fff" stroke-width="4"/>
        <path d="M28 46 H 72 M28 62 H 72" stroke="#fff" stroke-width="5"/>`;
  }
}

/** Oscurece un color '#RRGGBB' en `cuanto` por ciento. */
export function oscurecer(color: string, cuanto: number): string {
  const n = parseInt(color.slice(1), 16);
  const f = 1 - cuanto / 100;
  const canal = (desplazamiento: number) => Math.round(((n >> desplazamiento) & 0xff) * f);
  return `#${[16, 8, 0].map((d) => canal(d).toString(16).padStart(2, '0')).join('')}`;
}

/** Bote de basura en el color de la categoría, con su ícono en un círculo blanco. */
export function arteBote(cat: Categoria): ArteSvg {
  const oscuro = oscurecer(cat.color, 18);
  return arte(
    `bote-${cat.id}`,
    260,
    300,
    `<ellipse cx="130" cy="292" rx="110" ry="8" fill="#000" opacity=".15"/>
     <path d="M40 92 L 220 92 L 200 280 Q 198 290 188 290 L 72 290 Q 62 290 60 280 Z" fill="${cat.color}" stroke="${oscuro}" stroke-width="8" stroke-linejoin="round"/>
     <path d="M70 110 L 80 270 M190 110 L 180 270" stroke="#fff" stroke-width="6" stroke-linecap="round" opacity=".18"/>
     <circle cx="130" cy="186" r="64" fill="#fff"/>
     <g transform="translate(86 142) scale(0.88)">${iconoCategoria(cat.icono, cat.color)}</g>`,
    1.2,
  );
}

/** Tapa del bote, aparte para poder abrirla con una animación. */
export function arteTapa(cat: Categoria): ArteSvg {
  const oscuro = oscurecer(cat.color, 18);
  return arte(
    `tapa-${cat.id}`,
    260,
    80,
    `<rect x="100" y="8" width="60" height="28" rx="10" fill="${oscuro}"/>
     <rect x="24" y="30" width="212" height="42" rx="16" fill="${oscuro}"/>
     <rect x="36" y="36" width="188" height="10" rx="5" fill="#fff" opacity=".22"/>`,
    1.2,
  );
}
