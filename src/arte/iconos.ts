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
