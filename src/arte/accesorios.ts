import { arte, type ArteSvg } from './svg';

/*
 * Accesorios para vestir a la mascota del grupo (solo React). Mismo estilo que el resto del juego:
 * formas redondas, degradados suaves y la paleta de la marca. Cada uno se coloca con su origen
 * (src/logica/accesorios.ts) sobre el ancla de la mascota.
 */

const GORRA = `<defs><linearGradient id="ac-gorra" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3A9C6A"/><stop offset="1" stop-color="#1F6B4A"/></linearGradient></defs>
  <path d="M28 104 C 28 44 66 12 104 12 C 144 12 178 46 178 104 Z" fill="url(#ac-gorra)" stroke="#123D2B" stroke-width="5" stroke-linejoin="round"/>
  <path d="M104 14 C 92 40 90 76 96 104 M104 14 C 120 40 126 76 124 104" fill="none" stroke="#123D2B" stroke-width="3" opacity=".35"/>
  <circle cx="104" cy="14" r="9" fill="#FFD23F" stroke="#123D2B" stroke-width="4"/>
  <ellipse cx="104" cy="106" rx="98" ry="17" fill="#17543A" stroke="#123D2B" stroke-width="5"/>
  <path d="M60 70 q14 -22 34 -16 q-10 18 -34 16z" fill="#FFD23F" stroke="#123D2B" stroke-width="3"/>
  <path d="M50 40 Q 70 24 96 22" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" opacity=".3"/>`;

const LENTES = `<g fill="#CFEAF7" fill-opacity=".45" stroke="#2459A6" stroke-width="9">
    <circle cx="62" cy="46" r="36"/><circle cx="178" cy="46" r="36"/>
  </g>
  <path d="M98 42 Q 120 30 142 42" fill="none" stroke="#2459A6" stroke-width="8" stroke-linecap="round"/>
  <path d="M26 40 L 6 32 M214 40 L 234 32" stroke="#2459A6" stroke-width="7" stroke-linecap="round"/>
  <path d="M42 30 Q 52 22 66 22 M158 30 Q 168 22 182 22" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" opacity=".8"/>`;

/*
 * Paliacate mexicano anudado al cuello: rojo con el estampado blanco típico (florecitas de cuatro
 * pétalos y puntos en retícula, y una orilla punteada), la banda alrededor del cuello, el nudo al
 * frente y arriba con sus dos puntas, y el pico colgando. Antes era un triángulo rojo con puntitos
 * sueltos y se confundía con ropa interior (revisión del 29 de octubre de 2026).
 */
const FLOR_PALIACATE = (x: number, y: number) =>
  `<g transform="translate(${x} ${y})"><ellipse cx="0" cy="-4.5" rx="2.4" ry="4"/><ellipse cx="0" cy="4.5" rx="2.4" ry="4"/><ellipse cx="-4.5" cy="0" rx="4" ry="2.4"/><ellipse cx="4.5" cy="0" rx="4" ry="2.4"/><circle r="1.6" fill="#B71C2C"/></g>`;
const PALIACATE = `<defs>
    <linearGradient id="ac-paliacate" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E03A3E"/><stop offset="1" stop-color="#A8161C"/></linearGradient>
    <clipPath id="ac-paliacate-pico"><path d="M44 36 L 100 108 L 156 36 Z"/></clipPath>
  </defs>
  <path d="M44 36 L 100 108 L 156 36 Z" fill="url(#ac-paliacate)" stroke="#7A1420" stroke-width="5" stroke-linejoin="round"/>
  <g clip-path="url(#ac-paliacate-pico)" fill="#fff">
    ${[[72, 54], [100, 54], [128, 54], [86, 72], [114, 72], [100, 90]].map(([x, y]) => FLOR_PALIACATE(x!, y!)).join('')}
    ${[[86, 54], [114, 54], [72, 72], [100, 72], [128, 72], [86, 90], [114, 90]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.8"/>`).join('')}
  </g>
  <path d="M56 46 L 100 100 L 144 46" fill="none" stroke="#fff" stroke-width="2.4" stroke-dasharray="3.5 3.5" stroke-linecap="round" opacity=".9"/>
  <path d="M6 18 Q 100 46 194 18 L 194 34 Q 100 62 6 34 Z" fill="url(#ac-paliacate)" stroke="#7A1420" stroke-width="5" stroke-linejoin="round"/>
  <g fill="#fff">${[[20, 27], [38, 32], [56, 36], [144, 36], [162, 32], [180, 27]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.6"/>`).join('')}</g>
  <path d="M96 32 L 66 14 Q 54 8 58 20 L 82 42 Z" fill="url(#ac-paliacate)" stroke="#7A1420" stroke-width="4.5" stroke-linejoin="round"/>
  <path d="M104 32 L 134 14 Q 146 8 142 20 L 118 42 Z" fill="url(#ac-paliacate)" stroke="#7A1420" stroke-width="4.5" stroke-linejoin="round"/>
  <circle cx="72" cy="22" r="2" fill="#fff"/><circle cx="128" cy="22" r="2" fill="#fff"/>
  <ellipse cx="100" cy="34" rx="15" ry="12" fill="#C1272D" stroke="#7A1420" stroke-width="4.5"/>
  <path d="M92 30 Q 100 24 108 30" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" opacity=".7"/>`;

const MOCHILA = `<defs><linearGradient id="ac-mochila" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFB347"/><stop offset="1" stop-color="#E07B12"/></linearGradient></defs>
  <path d="M30 20 Q 60 -4 90 20" fill="none" stroke="#7A4E2E" stroke-width="9" stroke-linecap="round"/>
  <rect x="12" y="20" width="96" height="112" rx="26" fill="url(#ac-mochila)" stroke="#8A4A0B" stroke-width="5"/>
  <path d="M14 56 Q 60 74 106 56 L 106 46 Q 106 22 82 20 L 38 20 Q 14 22 14 46 Z" fill="#D9690C" stroke="#8A4A0B" stroke-width="5" stroke-linejoin="round"/>
  <rect x="34" y="84" width="52" height="34" rx="10" fill="#FFD23F" stroke="#8A4A0B" stroke-width="4"/>
  <circle cx="60" cy="64" r="6" fill="#FFD23F" stroke="#8A4A0B" stroke-width="3"/>
  <path d="M26 44 Q 30 30 44 28" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".35"/>`;

const FLOR = `${Array.from({ length: 10 }, (_, i) => {
  const a = (i * Math.PI) / 5;
  return `<ellipse cx="${40 + 22 * Math.cos(a)}" cy="${40 + 22 * Math.sin(a)}" rx="15" ry="11" transform="rotate(${(i * 36).toFixed(0)} ${40 + 22 * Math.cos(a)} ${40 + 22 * Math.sin(a)})" fill="#FF9F1C" stroke="#C26A00" stroke-width="2.5"/>`;
}).join('')}
  ${Array.from({ length: 8 }, (_, i) => {
    const a = (i * Math.PI) / 4 + 0.4;
    return `<circle cx="${40 + 12 * Math.cos(a)}" cy="${40 + 12 * Math.sin(a)}" r="10" fill="#FFB703" stroke="#C26A00" stroke-width="2"/>`;
  }).join('')}
  <circle cx="40" cy="40" r="9" fill="#E85D04"/><circle cx="37" cy="37" r="3" fill="#FFD9A8"/>`;

const CAPA = `<defs><linearGradient id="ac-capa" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3FB27A"/><stop offset="1" stop-color="#1F6B4A"/></linearGradient></defs>
  <path d="M78 14 Q 120 2 162 14 L 232 196 Q 120 222 8 196 Z" fill="url(#ac-capa)" stroke="#123D2B" stroke-width="6" stroke-linejoin="round"/>
  <path d="M20 192 Q 120 214 220 192" fill="none" stroke="#FFD23F" stroke-width="7" stroke-linecap="round"/>
  <path d="M84 22 Q 120 12 156 22" fill="none" stroke="#FFD23F" stroke-width="10" stroke-linecap="round"/>
  <circle cx="120" cy="96" r="30" fill="#FFD23F" stroke="#123D2B" stroke-width="5"/>
  <path d="M104 106 q 12 -30 34 -24 q -8 26 -34 24z" fill="#4CAF50" stroke="#123D2B" stroke-width="3.5" stroke-linejoin="round"/>
  <path d="M60 60 Q 50 120 44 180" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" opacity=".18"/>`;

export const ARTE_ACCESORIOS: ArteSvg[] = [
  arte('accesorio-gorra', 206, 130, GORRA),
  arte('accesorio-lentes', 240, 92, LENTES),
  arte('accesorio-paliacate', 200, 112, PALIACATE),
  arte('accesorio-mochila', 120, 140, MOCHILA),
  arte('accesorio-flor', 80, 80, FLOR),
  arte('accesorio-capa', 240, 220, CAPA),
];
