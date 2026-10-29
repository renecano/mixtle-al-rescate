import { arte, type ArteSvg } from './svg';

/*
 * Ambiente de cada unidad (v3, identidad por unidad): una ilustración panorámica (1920×640) que
 * encabeza su tramo del camino, y su paleta. Lugares de Toluca dibujados de forma original:
 * el Nevado de Toluca, unos portales con arcos y un edificio de grandes vitrales (inspirado en el
 * Cosmovitral, sin copiarlo). Solo React. Mismo estilo que el resto: degradados, luz suave y
 * perspectiva aérea.
 */

const A = 1920;
const H = 640;

const cielo = (id: string, arriba: string, abajo: string) =>
  `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${arriba}"/><stop offset="1" stop-color="${abajo}"/></linearGradient></defs><rect width="${A}" height="${H}" fill="url(#${id})"/>`;

const nube = (x: number, y: number, e: number) =>
  `<g transform="translate(${x} ${y}) scale(${e})" opacity=".95"><ellipse cx="0" cy="24" rx="110" ry="20" fill="#DCEDF6"/><circle cx="-56" cy="8" r="34" fill="#fff"/><circle cx="-6" cy="-10" r="48" fill="#fff"/><circle cx="48" cy="4" r="38" fill="#fff"/></g>`;

const sol = (x: number, y: number) =>
  `<circle cx="${x}" cy="${y}" r="120" fill="#FFF3C4" opacity=".55"/><circle cx="${x}" cy="${y}" r="58" fill="#FFDD66"/><circle cx="${x - 16}" cy="${y - 16}" r="18" fill="#fff" opacity=".35"/>`;

/** Árbol redondo con luz arriba y sombra abajo. */
const arbol = (x: number, base: number, e: number, verde = '#3E9A55') =>
  `<g transform="translate(${x} ${base}) scale(${e})"><ellipse cx="0" cy="4" rx="70" ry="12" fill="#2C5E2E" opacity=".2"/><rect x="-12" y="-110" width="24" height="112" rx="8" fill="#7A5236"/><circle cx="0" cy="-150" r="78" fill="${verde}"/><circle cx="-42" cy="-120" r="50" fill="${verde}"/><circle cx="44" cy="-118" r="52" fill="${verde}"/><circle cx="18" cy="-178" r="30" fill="#fff" opacity=".18"/><circle cx="-30" cy="-100" r="30" fill="#000" opacity=".08"/></g>`;

/** Pino u oyamel: pisos de triángulos con borde iluminado. */
const pino = (x: number, base: number, e: number, oscuro = '#245C40', claro = '#3D8A5E') =>
  `<g transform="translate(${x} ${base}) scale(${e})"><rect x="-8" y="-40" width="16" height="44" fill="#5E3A24"/>${[0, 1, 2, 3]
    .map((i) => `<path d="M0 ${-200 + i * 42} L ${48 + i * 14} ${-120 + i * 42} L ${-48 - i * 14} ${-120 + i * 42} Z" fill="${oscuro}"/><path d="M0 ${-200 + i * 42} L ${48 + i * 14} ${-120 + i * 42} L ${10} ${-124 + i * 42} Z" fill="${claro}" opacity=".8"/>`)
    .join('')}</g>`;

/** El Nevado de Toluca, a escala y altura dadas. */
const nevado = (x: number, base: number, e: number, color = '#9DB4CB') =>
  `<g transform="translate(${x} ${base}) scale(${e})">
    <path d="M-560 0 C -400 -60 -240 -150 -120 -210 L -70 -236 L -40 -256 L -14 -236 L 24 -246 L 60 -228 L 100 -250 L 132 -232 C 230 -170 400 -70 560 0 Z" fill="${color}"/>
    <path d="M-40 -256 L -70 -236 L -120 -210 C -260 -140 -400 -60 -560 0 L -240 0 C -170 -90 -90 -180 -40 -256 Z" fill="#6F88A3" opacity=".2"/>
    <path d="M-150 -196 L -70 -236 L -40 -256 L -14 -236 L 24 -246 L 60 -228 L 100 -250 L 132 -232 L 170 -206 L 140 -200 L 118 -214 L 98 -194 L 74 -210 L 50 -190 L 26 -212 L 2 -192 L -22 -212 L -46 -188 L -70 -208 L -96 -190 L -120 -204 Z" fill="#F7FBFF"/>
  </g>`;

/**
 * 1 · Parque, en su estación de reciclaje: la plaza con los tres botes (orgánico, reciclable y no
 * reciclable), banderitas y un letrero. Es otra escena que el parque del grupo (que sale justo arriba
 * en el camino): sin el Nevado ni el árbol grande, para que no se vean dos parques iguales seguidos.
 */
/** Un bote grande de la estación, con su color y su señal (hoja, flechas en círculo o bote). */
const boteEstacion = (x: number, color: string, oscuro: string, senal: string) => `<g transform="translate(${x} 560)">
    <ellipse cx="0" cy="6" rx="96" ry="12" fill="#000" opacity=".15"/>
    <path d="M-78 -210 L 78 -210 L 64 0 L -64 0 Z" fill="${color}" stroke="${oscuro}" stroke-width="8" stroke-linejoin="round"/>
    <rect x="-90" y="-236" width="180" height="30" rx="10" fill="${oscuro}"/>
    <path d="M-56 -190 L -48 -20" stroke="#fff" stroke-width="8" stroke-linecap="round" opacity=".2"/>
    <circle cx="0" cy="-112" r="46" fill="#fff"/>${senal}
  </g>`;
const SENAL_HOJA = `<path d="M-20 -96 q 4 -44 40 -38 q -2 42 -40 38z" fill="#1F6B4A"/><path d="M-16 -100 l 28 -28" stroke="#fff" stroke-width="4"/>`;
const SENAL_FLECHAS = `<path d="M-26 -112 a 26 26 0 1 1 8 19" fill="none" stroke="#2459A6" stroke-width="9" stroke-linecap="round"/><path d="M-30 -96 l 4 -16 l 14 8 z" fill="#2459A6"/>`;
const SENAL_BOTE = `<rect x="-18" y="-128" width="36" height="40" rx="4" fill="#B84A14"/><rect x="-24" y="-136" width="48" height="10" rx="4" fill="#B84A14"/>`;

const PARQUE = `${cielo('am-c1', '#BDE6F7', '#F2F9EC')}${sol(260, 120)}${nube(760, 100, 0.8)}${nube(1500, 120, 0.7)}
  <path d="M0 420 C 300 380 700 400 1000 420 C 1300 440 1600 390 1920 400 L 1920 640 L 0 640 Z" fill="#A9D98C"/>
  <path d="M520 640 L 640 460 L 1280 460 L 1400 640 Z" fill="#E9DCC0"/>
  ${Array.from({ length: 6 }, (_, i) => `<path d="M${640 - i * 22} ${460 + i * 32} H ${1280 + i * 22}" stroke="#D2C29F" stroke-width="3"/>`).join('')}
  <path d="M120 80 Q 960 220 1800 80" fill="none" stroke="#7A5236" stroke-width="5"/>
  ${Array.from({ length: 15 }, (_, i) => {
    const x = 180 + i * 108;
    const t = (x - 120) / 1680;
    const y = 80 + 4 * 140 * t * (1 - t) * 0.5 + 6;
    const color = ['#1F6B4A', '#2459A6', '#B84A14', '#FFD23F'][i % 4];
    return `<path d="M${x - 26} ${y} L ${x + 26} ${y} L ${x} ${y + 46} Z" fill="${color}"/>`;
  }).join('')}
  ${arbol(150, 520, 0.9)}${arbol(1770, 520, 0.95, '#3E9A55')}
  ${boteEstacion(760, '#1F6B4A', '#123D2B', SENAL_HOJA)}${boteEstacion(960, '#2459A6', '#173B70', SENAL_FLECHAS)}${boteEstacion(1160, '#B84A14', '#7A2F0B', SENAL_BOTE)}
  <g transform="translate(1440 560)"><rect x="-8" y="-200" width="16" height="200" fill="#7A5236"/><rect x="-86" y="-232" width="172" height="74" rx="14" fill="#FFF8E7" stroke="#7A5236" stroke-width="7"/>
    <path d="M-50 -196 a 22 22 0 1 1 7 16 M-50 -196 l -4 14 l 14 -4" fill="none" stroke="#1F6B4A" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M6 -206 h 52 M6 -186 h 40" stroke="#1F6B4A" stroke-width="8" stroke-linecap="round"/></g>
  <g transform="translate(470 590)"><rect x="-80" y="-40" width="160" height="14" rx="6" fill="#B07A4A"/><rect x="-80" y="-20" width="160" height="14" rx="6" fill="#9A6A3E"/><rect x="-70" y="-6" width="11" height="34" fill="#5B4636"/><rect x="59" y="-6" width="11" height="34" fill="#5B4636"/></g>`;

/** 2 · Hogar de los animales: humedal (como las ciénegas cerca de Toluca), tules, lirios y un nido. */
const HUMEDAL = `${cielo('am-c2', '#C7E8F2', '#F4F7E2')}${sol(300, 140)}${nube(900, 110, 0.9)}${nube(1600, 150, 0.6)}
  <path d="M0 400 C 300 360 700 380 1000 400 C 1300 420 1600 370 1920 390 L 1920 470 L 0 470 Z" fill="#B7D6B2"/>
  <defs><linearGradient id="am-agua" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8DCFD3"/><stop offset="1" stop-color="#4E9FA8"/></linearGradient></defs>
  <path d="M0 450 C 400 430 900 440 1400 455 C 1650 462 1800 455 1920 450 L 1920 640 L 0 640 Z" fill="url(#am-agua)"/>
  ${[490, 530, 575, 610].map((y, i) => `<path d="M${120 + i * 210} ${y} h ${140 + i * 30} M${980 + i * 160} ${y + 12} h ${110}" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".35"/>`).join('')}
  ${[1240, 1330, 1480, 1560, 1700].map((x, i) => `<g transform="translate(${x} ${580 - (i % 2) * 20})"><ellipse rx="54" ry="14" fill="#3E9A55"/><path d="M0 0 L 50 -6" stroke="#2C7A45" stroke-width="4"/>${i % 2 ? '' : '<circle cx="-14" cy="-10" r="12" fill="#F7A8C8"/><circle cx="-14" cy="-10" r="5" fill="#FFE27A"/>'}</g>`).join('')}
  ${Array.from({ length: 22 }, (_, i) => {
    const x = 20 + i * 28 + (i % 3) * 6;
    const alto = 160 + ((i * 37) % 70);
    return `<path d="M${x} 640 Q ${x + 6} ${640 - alto / 2} ${x + (i % 2 ? 10 : -6)} ${640 - alto}" stroke="#4E8A3E" stroke-width="7" fill="none" stroke-linecap="round"/>${i % 3 === 0 ? `<rect x="${x + (i % 2 ? 4 : -12)}" y="${640 - alto - 6}" width="12" height="40" rx="6" fill="#7A4E2E"/>` : ''}`;
  }).join('')}
  ${arbol(1780, 470, 1.2, '#3E9A55')}
  <g transform="translate(1770 330)"><ellipse rx="44" ry="18" fill="#8A6A44"/><path d="M-40 -4 Q 0 14 40 -4" stroke="#6B4E2E" stroke-width="5" fill="none"/><circle cx="-12" cy="-12" r="9" fill="#E8F4FF"/><circle cx="6" cy="-14" r="9" fill="#E8F4FF"/></g>`;

/** 3 · Bosque del Nevado de Toluca: oyameles y la cumbre nevada de cerca. */
const BOSQUE = `${cielo('am-c3', '#A6D2EE', '#E6F2F6')}${nube(300, 110, 0.8)}${nube(1650, 90, 0.7)}
  ${nevado(960, 560, 1.6, '#93ABC4')}
  <defs><linearGradient id="am-niebla" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".6" stop-color="#fff" stop-opacity=".45"/><stop offset="1" stop-color="#fff" stop-opacity=".2"/></linearGradient></defs>
  <rect y="320" width="${A}" height="180" fill="url(#am-niebla)"/>
  ${Array.from({ length: 16 }, (_, i) => pino(40 + i * 125, 520, 0.9 + (i % 3) * 0.12, '#3B7457', '#5A9C78')).join('')}
  <path d="M0 520 C 400 500 800 510 1200 530 C 1500 545 1700 520 1920 515 L 1920 640 L 0 640 Z" fill="#6FAE6A"/>
  ${[60, 260, 1540, 1760, 1880].map((x, i) => pino(x, 640, 1.5 + (i % 2) * 0.2)).join('')}`;

/** 4 · Calles de Toluca: portales con arcos, un edificio de grandes vitrales y una calle con ciclovía. */
const CALLES = `${cielo('am-c4', '#BEE2F5', '#FDF1DC')}${sol(1700, 120)}${nube(600, 100, 0.8)}
  ${nevado(1100, 330, 0.6, '#C2D2DF')}
  <defs><linearGradient id="am-muro" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F0C680"/><stop offset="1" stop-color="#DC9F55"/></linearGradient></defs>
  <g>
    <rect x="0" y="250" width="900" height="250" fill="url(#am-muro)"/>
    <rect x="0" y="236" width="900" height="22" fill="#B8572E"/>
    ${Array.from({ length: 9 }, (_, i) => `<path d="M${30 + i * 100} 500 V 360 A 40 40 0 0 1 ${110 + i * 100} 360 V 500 Z" fill="#8A5A2B"/><path d="M${30 + i * 100} 360 A 40 40 0 0 1 ${110 + i * 100} 360" fill="none" stroke="#FCE3B4" stroke-width="6"/>`).join('')}
    ${Array.from({ length: 8 }, (_, i) => `<rect x="${60 + i * 100}" y="275" width="40" height="44" rx="6" fill="#7FB3D5" stroke="#FCE3B4" stroke-width="5"/>`).join('')}
  </g>
  <g>
    <rect x="1000" y="170" width="620" height="330" fill="#E9E2D3"/>
    <path d="M990 172 L 1310 92 L 1630 172 Z" fill="#B8572E"/>
    ${[0, 1, 2].map((i) => {
      const x = 1060 + i * 190;
      const vidrios = ['#E63946', '#FFD23F', '#2459A6', '#4CAF50', '#9B6BD6', '#F28C28'];
      const paneles = Array.from({ length: 12 }, (_, j) => {
        const col = j % 3;
        const fila = Math.floor(j / 3);
        return `<rect x="${x + 8 + col * 38}" y="${250 + fila * 54}" width="34" height="50" fill="${vidrios[(i + j) % vidrios.length]}" opacity=".9"/>`;
      }).join('');
      return `<path d="M${x} 480 V 260 A 62 62 0 0 1 ${x + 124} 260 V 480 Z" fill="#2E3A57"/>${paneles}<circle cx="${x + 62}" cy="232" r="26" fill="#FFD23F" stroke="#2E3A57" stroke-width="6"/><path d="M${x} 480 V 260 A 62 62 0 0 1 ${x + 124} 260 V 480" fill="none" stroke="#5B4636" stroke-width="8"/>`;
    }).join('')}
  </g>
  ${arbol(1760, 520, 0.9)}
  <rect y="500" width="${A}" height="140" fill="#9AA5AD"/>
  <rect y="560" width="${A}" height="34" fill="#4CAF50" opacity=".8"/>
  ${Array.from({ length: 12 }, (_, i) => `<rect x="${i * 170 + 20}" y="528" width="90" height="8" rx="4" fill="#fff" opacity=".8"/>`).join('')}
  <g transform="translate(700 578)" stroke="#123D2B" stroke-width="6" fill="none"><circle cx="-34" cy="0" r="22"/><circle cx="34" cy="0" r="22"/><path d="M-34 0 L -6 -30 L 22 -30 L 34 0 M-6 -30 L 0 0 L -34 0"/></g>`;

/** 5 · Escuela: el edificio, el patio con macetas de latas reutilizadas y una canasta. */
const ESCUELA = `${cielo('am-c5', '#C6E7F7', '#FFF6E0')}${sol(260, 130)}${nube(1000, 100, 0.9)}${nube(1700, 140, 0.6)}
  <defs><linearGradient id="am-escuela" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F8CF6A"/><stop offset="1" stop-color="#E9AE42"/></linearGradient></defs>
  <rect x="520" y="200" width="880" height="320" fill="url(#am-escuela)"/>
  <rect x="500" y="186" width="920" height="26" fill="#1F6B4A"/>
  <rect x="500" y="356" width="920" height="14" fill="#1F6B4A" opacity=".85"/>
  ${Array.from({ length: 12 }, (_, i) => `<rect x="${570 + (i % 6) * 140}" y="${i < 6 ? 236 : 396}" width="84" height="84" rx="10" fill="#9ED3EE" stroke="#fff" stroke-width="7"/><path d="M${612 + (i % 6) * 140} ${i < 6 ? 236 : 396} v 84" stroke="#fff" stroke-width="5"/>`).join('')}
  <rect x="910" y="420" width="100" height="100" rx="8" fill="#7A4E2E"/><circle cx="992" cy="474" r="6" fill="#FFD23F"/>
  <rect x="940" y="140" width="40" height="50" fill="#E9AE42"/><path d="M932 140 L 960 108 L 988 140 Z" fill="#B8572E"/><circle cx="960" cy="164" r="12" fill="#FFD23F" stroke="#7A4E2E" stroke-width="4"/>
  <rect y="510" width="${A}" height="130" fill="#D9C9A8"/>
  <path d="M0 510 H 1920" stroke="#BFAE8A" stroke-width="8"/>
  ${[180, 300, 1580, 1700].map((x, i) => `<g transform="translate(${x} 560)"><rect x="-26" y="-10" width="52" height="54" rx="8" fill="${['#C0C8D0', '#E63946', '#2459A6', '#F28C28'][i]}"/><rect x="-26" y="-2" width="52" height="10" fill="#fff" opacity=".4"/><circle cx="-10" cy="-26" r="16" fill="#4CAF50"/><circle cx="12" cy="-30" r="18" fill="#3E9A55"/><circle cx="0" cy="-44" r="9" fill="${['#F28C28', '#FFD23F', '#F7A8C8', '#9B6BD6'][i]}"/></g>`).join('')}
  <g transform="translate(1800 520)"><rect x="-6" y="-260" width="12" height="262" fill="#5B6770"/><rect x="-70" y="-300" width="90" height="60" rx="6" fill="#fff" stroke="#5B6770" stroke-width="6"/><circle cx="-26" cy="-226" r="22" fill="none" stroke="#E07B12" stroke-width="6"/></g>
  ${arbol(120, 520, 0.9)}${arbol(1560, 520, 0.8, '#4BA85E')}`;

export const ARTE_AMBIENTES: ArteSvg[] = [
  arte('ambiente-u1', A, H, PARQUE),
  arte('ambiente-u2', A, H, HUMEDAL),
  arte('ambiente-u3', A, H, BOSQUE),
  arte('ambiente-u4', A, H, CALLES),
  arte('ambiente-u5', A, H, ESCUELA),
];

/** Paleta del ambiente de cada unidad: el fondo de su tramo del camino y de sus lecciones. */
export const AMBIENTES: Record<string, { nombre: string; arte: string; cielo: string; suelo: string }> = {
  u1: { nombre: 'Parque: la estación de reciclaje', arte: 'ambiente-u1', cielo: '#D3EEF9', suelo: '#E1F3D3' },
  u2: { nombre: 'Hogar de los animales', arte: 'ambiente-u2', cielo: '#D8EEF4', suelo: '#DDF0EE' },
  u3: { nombre: 'Bosque del Nevado de Toluca', arte: 'ambiente-u3', cielo: '#D4E8F4', suelo: '#D9EBD9' },
  u4: { nombre: 'Calles de Toluca', arte: 'ambiente-u4', cielo: '#DCEEF8', suelo: '#F6EBDA' },
  u5: { nombre: 'Escuela', arte: 'ambiente-u5', cielo: '#DDF0FA', suelo: '#F8EFD9' },
};
