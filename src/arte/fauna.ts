import { arte, type ArteSvg } from './svg';

/*
 * Más fauna del Valle de Toluca, dibujada en SVG con el mismo estilo plano:
 * - Ajolote de montaña (Ambystoma rivulare), de los arroyos del Nevado de Toluca: piel oscura,
 *   cabeza ancha y branquias externas plumosas.
 * - Tlacuache (Didelphis virginiana): pelaje gris, cara blanca, hocico largo con nariz rosa,
 *   orejas negras redondas y cola larga sin pelo.
 */
const TINTA = '#2A211C';

const AJOLOTE = `
  <ellipse cx="140" cy="192" rx="110" ry="9" fill="#000" opacity=".12"/>
  <path d="M190 150 C 240 150 262 120 256 96 C 248 120 220 132 186 130 Z" fill="#4E4234"/>
  <ellipse cx="150" cy="142" rx="62" ry="36" fill="#5E5040"/>
  <ellipse cx="104" cy="168" rx="14" ry="22" fill="#4E4234" transform="rotate(25 104 168)"/>
  <ellipse cx="190" cy="170" rx="14" ry="22" fill="#4E4234" transform="rotate(-25 190 170)"/>
  <g fill="none" stroke="#C2566B" stroke-width="9" stroke-linecap="round">
    <path d="M58 70 C 34 52 22 40 14 24"/><path d="M52 92 C 26 88 12 82 2 70"/><path d="M56 112 C 32 118 18 124 8 136"/>
    <path d="M202 70 C 226 52 238 40 246 24"/><path d="M208 92 C 234 88 248 82 258 70"/><path d="M204 112 C 228 118 242 124 252 136"/>
  </g>
  <g stroke="#E58A9A" stroke-width="4" stroke-linecap="round">
    <path d="M30 48 l-8 4 M22 36 l-8 2 M28 84 l-8 -6 M16 80 l-6 -8 M30 120 l-6 8 M18 126 l-4 8"/>
    <path d="M230 48 l8 4 M238 36 l8 2 M232 84 l8 -6 M244 80 l6 -8 M230 120 l6 8 M242 126 l4 8"/>
  </g>
  <ellipse cx="130" cy="92" rx="80" ry="54" fill="#665745"/>
  <circle cx="92" cy="72" r="4" fill="#8A7A62"/><circle cx="168" cy="66" r="5" fill="#8A7A62"/><circle cx="150" cy="128" r="4" fill="#8A7A62"/>
  <circle cx="84" cy="96" r="12" fill="${TINTA}"/><circle cx="176" cy="96" r="12" fill="${TINTA}"/>
  <circle cx="80" cy="92" r="4" fill="#fff"/><circle cx="172" cy="92" r="4" fill="#fff"/>
  <path d="M104 116 Q 130 134 156 116" fill="none" stroke="${TINTA}" stroke-width="5" stroke-linecap="round"/>
  <ellipse cx="96" cy="114" rx="9" ry="5" fill="#E58A9A" opacity=".6"/><ellipse cx="164" cy="114" rx="9" ry="5" fill="#E58A9A" opacity=".6"/>`;

const TLACUACHE = `
  <ellipse cx="150" cy="212" rx="120" ry="9" fill="#000" opacity=".12"/>
  <path d="M220 160 C 270 170 286 120 262 92 C 252 80 240 84 244 96 C 260 124 240 150 214 144" fill="none" stroke="#E7A7A0" stroke-width="12" stroke-linecap="round"/>
  <ellipse cx="166" cy="146" rx="78" ry="54" fill="#A3A09C"/>
  <path d="M110 120 C 130 100 200 96 236 124" fill="none" stroke="#C9C6C2" stroke-width="10" stroke-linecap="round" opacity=".6"/>
  <rect x="112" y="178" width="22" height="30" rx="10" fill="#3B3633"/><rect x="198" y="178" width="22" height="30" rx="10" fill="#3B3633"/>
  <circle cx="68" cy="58" r="20" fill="#2B2724"/><circle cx="120" cy="52" r="20" fill="#2B2724"/>
  <circle cx="68" cy="58" r="10" fill="#E7A7A0"/><circle cx="120" cy="52" r="10" fill="#E7A7A0"/>
  <path d="M60 80 C 60 54 128 46 134 80 C 140 110 110 130 70 140 C 40 146 14 140 10 128 C 30 120 52 104 60 80 Z" fill="#F4F1EC"/>
  <circle cx="10" cy="128" r="9" fill="#E7A7A0"/>
  <circle cx="74" cy="92" r="9" fill="${TINTA}"/><circle cx="71" cy="89" r="3" fill="#fff"/>
  <path d="M34 128 Q 46 134 58 128" fill="none" stroke="${TINTA}" stroke-width="3.5" stroke-linecap="round"/>
  <path d="M28 120 L 2 112 M28 124 L 4 128" stroke="${TINTA}" stroke-width="2" opacity=".5"/>`;

/** Caritas para "¿Sí o no?": se distinguen por la boca (y la lágrima), no solo por el color. */
const CARITA_FELIZ = `
  <circle cx="100" cy="100" r="92" fill="#3FA56B" stroke="#fff" stroke-width="8"/>
  <circle cx="68" cy="78" r="12" fill="#fff"/><circle cx="132" cy="78" r="12" fill="#fff"/>
  <path d="M52 112 Q 100 168 148 112" fill="none" stroke="#fff" stroke-width="14" stroke-linecap="round"/>`;

const CARITA_TRISTE = `
  <circle cx="100" cy="100" r="92" fill="#B84A14" stroke="#fff" stroke-width="8"/>
  <circle cx="68" cy="80" r="12" fill="#fff"/><circle cx="132" cy="80" r="12" fill="#fff"/>
  <path d="M56 150 Q 100 108 144 150" fill="none" stroke="#fff" stroke-width="14" stroke-linecap="round"/>
  <path d="M60 98 q -9 16 0 22 q 9 -6 0 -22 z" fill="#CFEAF7"/>`;

export const FAUNA: ArteSvg[] = [
  arte('ajolote', 260, 200, AJOLOTE, 1.2),
  arte('tlacuache', 290, 220, TLACUACHE, 1.2),
  arte('carita-feliz', 200, 200, CARITA_FELIZ, 1.2),
  arte('carita-triste', 200, 200, CARITA_TRISTE, 1.2),
];
