import { arte, type ArteSvg } from './svg';

/*
 * Decoraciones a los lados del camino, según el ambiente de cada unidad (revisión de la v3, punto 3):
 * árboles, bancas y faroles en el parque; tules, estanques y un nido en el hogar de los animales;
 * pinos y rocas en el bosque del Nevado; casas de colores, portales y bicis en las calles de Toluca;
 * canasta y macetas en la escuela. Solo React (el camino), dibujos fijos, mismo estilo con luz.
 */

const sombra = (cx: number, cy: number, rx: number) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${rx * 0.14}" fill="#1F4A2E" opacity=".18"/>`;

const COPA = `<defs><radialGradient id="dc-copa" cx="38%" cy="30%" r="75%"><stop offset="0" stop-color="#6CC77E"/><stop offset=".6" stop-color="#3E8E5E"/><stop offset="1" stop-color="#2C7048"/></radialGradient>
  <linearGradient id="dc-tronco" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#5E3E28"/><stop offset=".45" stop-color="#8E6444"/><stop offset="1" stop-color="#5E3E28"/></linearGradient></defs>`;

const ARBOL = `${COPA}${sombra(100, 250, 80)}
  <path d="M86 250 C 90 210 88 170 92 140 L 108 140 C 112 170 110 210 114 250 Z" fill="url(#dc-tronco)"/>
  <circle cx="100" cy="100" r="74" fill="url(#dc-copa)"/><circle cx="52" cy="128" r="46" fill="url(#dc-copa)"/><circle cx="150" cy="128" r="46" fill="url(#dc-copa)"/>
  <circle cx="76" cy="70" r="22" fill="#fff" opacity=".15"/>`;

const ARBOL_NIDO = `${ARBOL}
  <g transform="translate(138 112)"><ellipse rx="30" ry="13" fill="#8A6A44"/><path d="M-28 -3 Q 0 12 28 -3" stroke="#6B4E2E" stroke-width="4" fill="none"/><circle cx="-9" cy="-9" r="7" fill="#E8F4FF"/><circle cx="7" cy="-11" r="7" fill="#E8F4FF"/></g>`;

const BANCA = `${sombra(110, 112, 96)}
  <rect x="22" y="40" width="176" height="16" rx="6" fill="#B07A4A"/><rect x="22" y="62" width="176" height="16" rx="6" fill="#9A6A3E"/>
  <rect x="16" y="80" width="188" height="14" rx="6" fill="#C08A55"/>
  <rect x="32" y="92" width="12" height="20" fill="#4A3A2E"/><rect x="176" y="92" width="12" height="20" fill="#4A3A2E"/>
  <path d="M30 44 H 190" stroke="#fff" stroke-width="3" opacity=".3"/>`;

const FAROL = `${sombra(30, 214, 26)}
  <rect x="24" y="44" width="12" height="170" rx="5" fill="#2E4A3E"/><rect x="14" y="204" width="32" height="12" rx="5" fill="#2E4A3E"/>
  <path d="M12 44 L 48 44 L 40 10 L 20 10 Z" fill="#FFF2C2" stroke="#2E4A3E" stroke-width="5" stroke-linejoin="round"/>
  <path d="M10 10 L 50 10 L 30 -6 Z" fill="#2E4A3E" transform="translate(0 6)"/>`;

const TULES = `<defs><linearGradient id="dc-agua" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8DCFD3"/><stop offset="1" stop-color="#4E9FA8"/></linearGradient></defs>
  <ellipse cx="80" cy="206" rx="76" ry="14" fill="url(#dc-agua)"/>
  ${[20, 38, 54, 72, 90, 108, 126, 140]
    .map((x, i) => {
      const alto = 130 + ((i * 37) % 60);
      return `<path d="M${x} 206 Q ${x + 4} ${206 - alto / 2} ${x + (i % 2 ? 8 : -5)} ${206 - alto}" stroke="#4E8A3E" stroke-width="6" fill="none" stroke-linecap="round"/>${i % 2 === 0 ? `<rect x="${x + (i % 2 ? 3 : -10)}" y="${206 - alto - 4}" width="11" height="34" rx="5.5" fill="#7A4E2E"/>` : ''}`;
    })
    .join('')}`;

const ESTANQUE = `<defs><radialGradient id="dc-estanque" cx="45%" cy="40%" r="70%"><stop offset="0" stop-color="#A7DDE0"/><stop offset="1" stop-color="#4E9FA8"/></radialGradient></defs>
  <ellipse cx="120" cy="64" rx="112" ry="40" fill="#8DBB6F"/><ellipse cx="120" cy="62" rx="100" ry="32" fill="url(#dc-estanque)"/>
  <path d="M60 58 h 40 M140 70 h 34" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".45"/>
  <g transform="translate(86 70)"><ellipse rx="22" ry="8" fill="#3E9A55"/><circle cx="-6" cy="-6" r="8" fill="#F7A8C8"/><circle cx="-6" cy="-6" r="3" fill="#FFE27A"/></g>
  <ellipse cx="160" cy="54" rx="18" ry="7" fill="#3E9A55"/>`;

const PINO = `${sombra(80, 272, 56)}<rect x="72" y="232" width="16" height="40" fill="#5E3A24"/>
  ${[0, 1, 2, 3]
    .map(
      (i) =>
        `<path d="M80 ${20 + i * 52} L ${130 + i * 12} ${110 + i * 52} L ${30 - i * 12} ${110 + i * 52} Z" fill="#245C40"/><path d="M80 ${20 + i * 52} L ${130 + i * 12} ${110 + i * 52} L ${92} ${106 + i * 52} Z" fill="#3D8A5E" opacity=".85"/>`,
    )
    .join('')}
  <path d="M80 20 L 70 44 L 90 44 Z" fill="#fff" opacity=".7"/>`;

const ROCA = `${sombra(80, 92, 70)}
  <path d="M14 90 C 10 60 34 34 64 30 C 96 26 132 40 146 66 C 152 80 148 90 140 92 Z" fill="#9AA3A8"/>
  <path d="M30 60 C 46 42 72 38 92 42" stroke="#fff" stroke-width="7" stroke-linecap="round" opacity=".3" fill="none"/>
  <path d="M100 92 C 120 70 134 66 146 72" fill="#7F888D"/>`;

const casa = (pared: string, puerta: string) => `${sombra(90, 196, 84)}
  <rect x="16" y="70" width="148" height="126" fill="${pared}"/>
  <path d="M6 76 L 90 18 L 174 76 Z" fill="#B8572E"/><path d="M6 76 L 174 76" stroke="#8F3F1E" stroke-width="6"/>
  <rect x="34" y="96" width="34" height="38" rx="4" fill="#9ED3EE" stroke="#fff" stroke-width="5"/>
  <rect x="112" y="96" width="34" height="38" rx="4" fill="#9ED3EE" stroke="#fff" stroke-width="5"/>
  <path d="M74 196 V 150 A 16 16 0 0 1 106 150 V 196 Z" fill="${puerta}"/>
  <rect x="30" y="134" width="42" height="8" rx="3" fill="#E63946"/><circle cx="40" cy="132" r="5" fill="#F28C28"/><circle cx="58" cy="131" r="5" fill="#FFD23F"/>`;

const PORTAL = `<defs><linearGradient id="dc-muro" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F0C680"/><stop offset="1" stop-color="#DC9F55"/></linearGradient></defs>
  ${sombra(110, 200, 106)}
  <rect x="6" y="40" width="208" height="160" fill="url(#dc-muro)"/><rect x="0" y="28" width="220" height="16" fill="#B8572E"/>
  ${[0, 1, 2].map((i) => `<path d="M${18 + i * 66} 200 V 110 A 26 26 0 0 1 ${70 + i * 66} 110 V 200 Z" fill="#8A5A2B"/><path d="M${18 + i * 66} 110 A 26 26 0 0 1 ${70 + i * 66} 110" fill="none" stroke="#FCE3B4" stroke-width="5"/>`).join('')}
  ${[0, 1, 2].map((i) => `<rect x="${30 + i * 66}" y="56" width="28" height="30" rx="4" fill="#7FB3D5" stroke="#FCE3B4" stroke-width="4"/>`).join('')}`;

const CANASTA = `${sombra(70, 254, 50)}
  <rect x="64" y="70" width="12" height="184" fill="#5B6770"/>
  <rect x="10" y="20" width="120" height="78" rx="8" fill="#fff" stroke="#5B6770" stroke-width="7"/>
  <rect x="44" y="44" width="52" height="34" fill="none" stroke="#E07B12" stroke-width="5"/>
  <ellipse cx="70" cy="100" rx="28" ry="7" fill="none" stroke="#E07B12" stroke-width="6"/>
  <path d="M46 102 L 56 132 M70 106 V 136 M94 102 L 84 132" stroke="#fff" stroke-width="3" opacity=".9"/>`;

export const ARTE_DECORACIONES: ArteSvg[] = [
  arte('deco-arbol', 200, 262, ARBOL),
  arte('deco-arbol-nido', 200, 262, ARBOL_NIDO),
  arte('deco-banca', 220, 122, BANCA),
  arte('deco-farol', 60, 222, FAROL),
  arte('deco-tules', 160, 222, TULES),
  arte('deco-estanque', 240, 108, ESTANQUE),
  arte('deco-pino', 160, 280, PINO),
  arte('deco-roca', 160, 100, ROCA),
  arte('deco-casa-rosa', 180, 202, casa('#F4A6B8', '#7A4E2E')),
  arte('deco-casa-azul', 180, 202, casa('#8FC1E3', '#5B3A24')),
  arte('deco-portal', 220, 204, PORTAL),
  arte('deco-canasta', 140, 262, CANASTA),
];

type Decoracion = { arte: string; arriba: number; ancho?: number };

/**
 * Qué va a cada lado del tramo de cada unidad. `arriba` es la altura en % del tramo (debajo de la
 * postal); `ancho`, cuánto mide comparado con el tamaño normal (1 = normal).
 */
export const DECORACIONES: Record<string, { izq: Decoracion[]; der: Decoracion[] }> = {
  u1: {
    izq: [{ arte: 'deco-arbol', arriba: 32, ancho: 1.2 }, { arte: 'deco-banca', arriba: 52 }, { arte: 'deco-farol', arriba: 66, ancho: 0.45 }, { arte: 'flores-naranja', arriba: 82, ancho: 0.8 }],
    der: [{ arte: 'arbusto', arriba: 40 }, { arte: 'deco-arbol', arriba: 58, ancho: 1.1 }, { arte: 'deco-banca', arriba: 76 }, { arte: 'flores-morada', arriba: 88, ancho: 0.7 }],
  },
  u2: {
    izq: [{ arte: 'deco-tules', arriba: 32 }, { arte: 'deco-estanque', arriba: 52, ancho: 1.2 }, { arte: 'deco-arbol-nido', arriba: 66, ancho: 1.2 }, { arte: 'mariposa-feliz', arriba: 86, ancho: 0.7 }],
    der: [{ arte: 'mariposa-feliz', arriba: 36, ancho: 0.7 }, { arte: 'deco-estanque', arriba: 50, ancho: 1.1 }, { arte: 'deco-tules', arriba: 66 }, { arte: 'deco-tules', arriba: 84, ancho: 0.8 }],
  },
  u3: {
    izq: [{ arte: 'deco-pino', arriba: 30, ancho: 1.1 }, { arte: 'deco-pino', arriba: 50, ancho: 0.8 }, { arte: 'deco-roca', arriba: 68 }, { arte: 'deco-pino', arriba: 80, ancho: 1 }],
    der: [{ arte: 'deco-pino', arriba: 36, ancho: 0.9 }, { arte: 'deco-roca', arriba: 54, ancho: 0.8 }, { arte: 'deco-pino', arriba: 64, ancho: 1.2 }, { arte: 'deco-pino', arriba: 84, ancho: 0.8 }],
  },
  u4: {
    izq: [{ arte: 'deco-casa-rosa', arriba: 32, ancho: 1.1 }, { arte: 'deco-portal', arriba: 50, ancho: 1.2 }, { arte: 'bici', arriba: 64 }, { arte: 'deco-farol', arriba: 90, ancho: 0.45 }],
    der: [{ arte: 'deco-portal', arriba: 36, ancho: 1.2 }, { arte: 'deco-casa-azul', arriba: 54, ancho: 1.1 }, { arte: 'bici', arriba: 72 }, { arte: 'deco-casa-rosa', arriba: 84 }],
  },
  u5: {
    izq: [{ arte: 'escuela', arriba: 32, ancho: 1.2 }, { arte: 'lata-maceta', arriba: 52, ancho: 0.8 }, { arte: 'pelota', arriba: 66, ancho: 0.6 }, { arte: 'deco-canasta', arriba: 78, ancho: 0.7 }],
    der: [{ arte: 'deco-canasta', arriba: 36, ancho: 0.7 }, { arte: 'frasco-lapices', arriba: 54, ancho: 0.8 }, { arte: 'lata-maceta', arriba: 68, ancho: 0.8 }, { arte: 'escuela', arriba: 82, ancho: 1.1 }],
  },
};
