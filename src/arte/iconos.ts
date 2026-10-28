import { arte, type ArteSvg } from './svg';

const BOCINA = `<path d="M18 38h14l18-15v54L32 62H18z" fill="#fff" stroke="#fff" stroke-width="4" stroke-linejoin="round"/>`;

export const ICONOS: ArteSvg[] = [
  arte(
    'icono-sonido',
    100,
    100,
    `${BOCINA}
     <path d="M60 36c6 4 9 9 9 14s-3 10-9 14" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round"/>
     <path d="M70 26c10 7 15 15 15 24s-5 17-15 24" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round"/>`,
  ),
  arte(
    'icono-mudo',
    100,
    100,
    `${BOCINA}
     <path d="M62 38l22 24M84 38L62 62" stroke="#fff" stroke-width="8" stroke-linecap="round"/>`,
  ),
  arte(
    'icono-musica',
    100,
    100,
    `<path d="M38 70V22l44-10v48" fill="none" stroke="#fff" stroke-width="8" stroke-linejoin="round"/>
     <ellipse cx="28" cy="72" rx="13" ry="10" fill="#fff"/><ellipse cx="72" cy="62" rx="13" ry="10" fill="#fff"/>`,
  ),
  arte(
    'icono-musica-no',
    100,
    100,
    `<path d="M38 70V22l44-10v48" fill="none" stroke="#fff" stroke-width="8" stroke-linejoin="round" opacity=".55"/>
     <ellipse cx="28" cy="72" rx="13" ry="10" fill="#fff" opacity=".55"/><ellipse cx="72" cy="62" rx="13" ry="10" fill="#fff" opacity=".55"/>
     <path d="M14 14L86 86" stroke="#fff" stroke-width="9" stroke-linecap="round"/>`,
  ),
  arte(
    'icono-repetir',
    100,
    100,
    `<path d="M50 20a30 30 0 1 1-28 19" fill="none" stroke="#fff" stroke-width="9" stroke-linecap="round"/>
     <path d="M10 24l13 19 16-14z" fill="#fff" stroke="#fff" stroke-width="4" stroke-linejoin="round"/>`,
  ),
  arte('icono-jugar', 100, 100, `<path d="M34 20l48 30-48 30z" fill="#fff" stroke="#fff" stroke-width="8" stroke-linejoin="round"/>`),
  arte(
    'icono-siguiente',
    100,
    100,
    `<path d="M20 50h52M50 24l26 26-26 26" fill="none" stroke="#fff" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/>`,
  ),
  arte(
    'icono-camara',
    100,
    100,
    `<rect x="10" y="30" width="80" height="54" rx="12" fill="#fff"/>
     <path d="M34 31l7-11h18l7 11z" fill="#fff"/>
     <circle cx="50" cy="57" r="16" fill="none" stroke="#2459A6" stroke-width="7"/>`,
  ),
  arte(
    'icono-casa',
    100,
    100,
    `<path d="M14 48L50 18l36 30" fill="none" stroke="#fff" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>
     <path d="M26 44v38h48V44" fill="#fff"/>
     <rect x="43" y="58" width="14" height="24" rx="3" fill="#1F6B4A"/>`,
  ),
  arte(
    'icono-pantalla',
    100,
    100,
    `<path d="M16 38V16h22M62 16h22v22M84 62v22H62M38 84H16V62" fill="none" stroke="#fff" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>`,
  ),
  arte(
    'hojita',
    100,
    100,
    `<path d="M14 86 C 14 42 46 14 88 12 C 88 56 60 88 14 86 Z" fill="#3FA56B" stroke="#1F6B4A" stroke-width="5" stroke-linejoin="round"/>
     <path d="M14 86 C 38 64 58 44 80 22" stroke="#DDF0CC" stroke-width="5" fill="none" stroke-linecap="round"/>`,
  ),
  arte(
    'candado',
    100,
    100,
    `<path d="M30 46 V 34 a20 20 0 0 1 40 0 V 46" fill="none" stroke="#fff" stroke-width="10"/>
     <rect x="20" y="44" width="60" height="44" rx="10" fill="#fff"/><circle cx="50" cy="64" r="7" fill="#5B6770"/>`,
  ),
  arte(
    'palomita',
    100,
    100,
    `<path d="M18 52 L 42 76 L 84 26" fill="none" stroke="#fff" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/>`,
  ),
  arte(
    'calendario',
    100,
    100,
    `<rect x="12" y="20" width="76" height="68" rx="12" fill="#fff"/><rect x="12" y="20" width="76" height="20" rx="10" fill="#F0567A"/>
     <path d="M32 12 v16 M68 12 v16" stroke="#fff" stroke-width="8" stroke-linecap="round"/>
     <circle cx="34" cy="58" r="6" fill="#1F6B4A"/><circle cx="50" cy="58" r="6" fill="#1F6B4A"/><circle cx="66" cy="58" r="6" fill="#1F6B4A"/><circle cx="34" cy="74" r="6" fill="#1F6B4A"/>`,
  ),
  arte(
    'cofre',
    200,
    170,
    `<ellipse cx="100" cy="160" rx="86" ry="8" fill="#000" opacity=".15"/>
     <rect x="20" y="72" width="160" height="84" rx="12" fill="#B07D4B" stroke="#7A4E2E" stroke-width="7"/>
     <path d="M20 76 C 20 30 180 30 180 76 Z" fill="#C8955F" stroke="#7A4E2E" stroke-width="7" stroke-linejoin="round"/>
     <rect x="16" y="68" width="168" height="14" rx="6" fill="#FFD23F" stroke="#B88A00" stroke-width="4"/>
     <rect x="84" y="62" width="32" height="40" rx="6" fill="#FFD23F" stroke="#B88A00" stroke-width="4"/>
     <circle cx="100" cy="82" r="6" fill="#7A4E2E"/>
     <path d="M48 96 v52 M152 96 v52" stroke="#7A4E2E" stroke-width="6" opacity=".5"/>`,
  ),
  arte(
    'cofre-abierto',
    200,
    170,
    `<ellipse cx="100" cy="160" rx="86" ry="8" fill="#000" opacity=".15"/>
     <path d="M28 70 C 40 20 160 20 172 70 Z" fill="#FFE07A" opacity=".7"/>
     <path d="M30 40 L 20 12 M100 26 V 0 M170 40 L 180 12" stroke="#FFD23F" stroke-width="7" stroke-linecap="round"/>
     <rect x="20" y="72" width="160" height="84" rx="12" fill="#B07D4B" stroke="#7A4E2E" stroke-width="7"/>
     <path d="M54 70 C 64 46 92 50 100 62 C 112 46 138 48 146 70 Z" fill="#3FA56B"/>
     <path d="M20 72 C 30 50 170 50 180 72 L 172 82 C 160 66 40 66 28 82 Z" fill="#7A4E2E"/>
     <rect x="16" y="76" width="168" height="12" rx="6" fill="#FFD23F" stroke="#B88A00" stroke-width="4"/>
     <path d="M48 96 v52 M152 96 v52" stroke="#7A4E2E" stroke-width="6" opacity=".5"/>`,
  ),
  arte(
    'icono-estrella',
    100,
    100,
    `<path d="M50 6l12.6 27.5 30 3.4-22.4 20.3 6.3 29.6L50 71.6 23.5 86.8l6.3-29.6L7.4 36.9l30-3.4z" fill="#FFD23F" stroke="#fff" stroke-width="5" stroke-linejoin="round"/>`,
  ),
  arte(
    'icono-corazon',
    100,
    100,
    `<path d="M50 86S10 62 10 34c0-13 10-22 21-22 9 0 15 5 19 12 4-7 10-12 19-12 11 0 21 9 21 22 0 28-40 52-40 52z" fill="#F0567A" stroke="#fff" stroke-width="5"/>`,
  ),
];
