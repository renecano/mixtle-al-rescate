import { arte, type ArteSvg } from './svg';

/*
 * Personajes originales del juego, dibujados a mano en SVG con estilo plano.
 * Mixtle es un cacomixtle (Bassariscus astutus): cuerpo esbelto gris-pardo,
 * orejas grandes, anillos claros alrededor de los ojos y cola larga con
 * anillos blancos y negros.
 */

const TINTA = '#2A211C';

// ─── Mixtle ────────────────────────────────────────────────────────────────
const C = {
  piel: '#B09C8A',
  pielOscura: '#8A7563',
  crema: '#F4ECDF',
  rosa: '#E8A99A',
  boca: '#7A2E2E',
  lengua: '#E87B7B',
};

type ExpresionMixtle = 'normal' | 'habla' | 'feliz' | 'parpadeo' | 'pensando' | 'sorprendido' | 'celebrando' | 'senalando';

const CONTENTO: readonly ExpresionMixtle[] = ['feliz', 'habla', 'celebrando'];

function ojosMixtle(expresion: ExpresionMixtle): string {
  if (expresion === 'feliz' || expresion === 'celebrando') {
    return `<path d="M118 158 Q 137 134 156 158 M204 158 Q 223 134 242 158" fill="none" stroke="${TINTA}" stroke-width="7" stroke-linecap="round"/>`;
  }
  if (expresion === 'parpadeo') {
    return `<path d="M118 152 Q 137 164 156 152 M204 152 Q 223 164 242 152" fill="none" stroke="${TINTA}" stroke-width="6" stroke-linecap="round"/>`;
  }
  if (expresion === 'sorprendido') {
    const grande = (x: number) =>
      `<circle cx="${x}" cy="150" r="24" fill="${TINTA}"/><circle cx="${x - 8}" cy="141" r="9" fill="#fff"/><circle cx="${x + 8}" cy="160" r="4" fill="#fff"/>`;
    return grande(137) + grande(223);
  }
  // Pensando mira hacia arriba; señalando mira hacia donde apunta.
  const dx = expresion === 'pensando' || expresion === 'senalando' ? 8 : 0;
  const dy = expresion === 'pensando' ? -8 : 0;
  const ojo = (x0: number) => {
    const x = x0 + dx;
    const y = 152 + dy;
    return `<circle cx="${x}" cy="${y}" r="20" fill="${TINTA}"/>
     <circle cx="${x - 7}" cy="${y - 8}" r="7.5" fill="#fff"/>
     <circle cx="${x + 7}" cy="${y + 8}" r="3.5" fill="#fff"/>`;
  };
  return ojo(137) + ojo(223);
}

function bocaMixtle(expresion: ExpresionMixtle): string {
  const linea = `<path d="M180 196 V 206" stroke="${TINTA}" stroke-width="4" stroke-linecap="round"/>`;
  if (expresion === 'sorprendido') {
    return `${linea}<ellipse cx="180" cy="218" rx="10" ry="13" fill="${C.boca}" stroke="${TINTA}" stroke-width="3"/>`;
  }
  if (expresion === 'pensando') {
    return `${linea}<path d="M168 212 Q 182 206 194 213" fill="none" stroke="${TINTA}" stroke-width="4" stroke-linecap="round"/>`;
  }
  if (expresion === 'habla' || expresion === 'feliz' || expresion === 'celebrando') {
    const alto = expresion === 'habla' ? 228 : 236;
    return `${linea}
      <path d="M163 205 Q 180 ${alto} 197 205 Z" fill="${C.boca}" stroke="${TINTA}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M171 ${alto - 13} Q 180 ${alto - 5} 189 ${alto - 13} Q 180 ${alto - 18} 171 ${alto - 13} Z" fill="${C.lengua}"/>`;
  }
  return `${linea}<path d="M164 206 Q 172 215 180 206 Q 188 215 196 206" fill="none" stroke="${TINTA}" stroke-width="4" stroke-linecap="round"/>`;
}

function cuerpoMixtle(expresion: ExpresionMixtle): string {
  const oreja = (x: number, giro: number) =>
    `<g transform="rotate(${giro} ${x} 78)">
       <ellipse cx="${x}" cy="78" rx="38" ry="60" fill="${C.pielOscura}"/>
       <ellipse cx="${x}" cy="86" rx="23" ry="42" fill="${C.rosa}"/>
     </g>`;
  const mejillas =
    CONTENTO.includes(expresion)
      ?`<ellipse cx="112" cy="196" rx="15" ry="9" fill="#F0907E" opacity=".55"/><ellipse cx="248" cy="196" rx="15" ry="9" fill="#F0907E" opacity=".55"/>`
      : '';
  return `
    <ellipse cx="180" cy="428" rx="125" ry="12" fill="#000" opacity=".12"/>
    ${oreja(104, -22)}${oreja(256, 22)}
    <path d="M108 252 C 92 330 98 400 128 420 L 232 420 C 262 400 268 330 252 252 C 236 214 124 214 108 252 Z" fill="${C.piel}"/>
    <ellipse cx="180" cy="332" rx="52" ry="80" fill="${C.crema}"/>
    <ellipse cx="116" cy="414" rx="46" ry="18" fill="${C.pielOscura}"/>
    <ellipse cx="244" cy="414" rx="46" ry="18" fill="${C.pielOscura}"/>
    <path d="M112 318 C 90 352 94 396 122 408 M248 318 C 270 352 266 396 238 408" fill="none" stroke="${C.pielOscura}" stroke-width="5" stroke-linecap="round" opacity=".6"/>
    ${patasDelanteras(expresion)}
    <path d="M180 70 C 252 70 282 120 274 166 C 266 206 226 236 180 240 C 134 236 94 206 86 166 C 78 120 108 70 180 70 Z" fill="${C.piel}"/>
    <path d="M98 176 C 118 216 150 234 180 234 C 210 234 242 216 262 176 C 240 192 214 198 180 198 C 146 198 120 192 98 176 Z" fill="${C.crema}"/>
    <path d="M180 74 C 166 100 166 128 180 146 C 194 128 194 100 180 74 Z" fill="${C.pielOscura}" opacity=".55"/>
    <ellipse cx="137" cy="152" rx="35" ry="31" fill="${C.crema}"/>
    <ellipse cx="223" cy="152" rx="35" ry="31" fill="${C.crema}"/>
    ${ojosMixtle(expresion)}
    <ellipse cx="180" cy="194" rx="37" ry="26" fill="${C.crema}"/>
    ${mejillas}
    <path d="M165 180 Q 180 171 195 180 Q 193 192 180 197 Q 167 192 165 180 Z" fill="${TINTA}"/>
    <ellipse cx="175" cy="179" rx="5" ry="2.5" fill="#fff" opacity=".6"/>
    ${bocaMixtle(expresion)}
    <g stroke="${TINTA}" stroke-width="2.5" stroke-linecap="round" opacity=".5">
      <path d="M148 196 L 100 186 M148 204 L 102 212 M212 196 L 260 186 M212 204 L 258 212"/>
    </g>
    ${expresion === 'pensando' ? `<ellipse cx="200" cy="238" rx="22" ry="15" fill="${C.pielOscura}"/><path d="M190 232 v8 M200 232 v9 M210 232 v8" stroke="${C.piel}" stroke-width="3" stroke-linecap="round"/>` : ''}`;
}

/** Patas delanteras: abajo (sentado), arriba (celebrando), una apuntando o una en la barbilla (pensando). */
function patasDelanteras(expresion: ExpresionMixtle): string {
  const brazo = (x1: number, y1: number, x2: number, y2: number) =>
    `<path d="M${x1} ${y1} L ${x2} ${y2}" stroke="${C.piel}" stroke-width="26" stroke-linecap="round"/>`;
  const mano = (x: number, y: number) => `<ellipse cx="${x}" cy="${y}" rx="21" ry="15" fill="${C.pielOscura}"/>`;
  const abajo = (x1: number, x2: number) => {
    const pata = x2 - 2 * Math.sign(180 - x2); // un poco hacia afuera, como en el dibujo original
    return `${brazo(x1, 326, x2, 396)}<ellipse cx="${pata}" cy="402" rx="21" ry="12" fill="${C.pielOscura}"/>
     <path d="M${pata - 7} 398 v8 M${pata + 1} 398 v8" stroke="${C.piel}" stroke-width="3" stroke-linecap="round"/>`;
  };
  if (expresion === 'celebrando') return `${brazo(146, 300, 76, 214)}${mano(72, 208)}${brazo(214, 300, 284, 214)}${mano(288, 208)}`;
  if (expresion === 'senalando') return `${abajo(152, 150)}${brazo(212, 300, 318, 282)}${mano(332, 280)}`;
  if (expresion === 'pensando') return `${abajo(152, 150)}${brazo(208, 320, 202, 262)}`;
  return `${abajo(152, 150)}${abajo(208, 210)}`;
}

const ESCALA_MIXTLE = 1.3;

const COLA_MIXTLE = `
  <path d="M28 400 C 160 412 232 332 206 232 C 186 152 120 122 150 40" fill="none" stroke="${TINTA}" stroke-width="68" stroke-linecap="round"/>
  <path d="M28 400 C 160 412 232 332 206 232 C 186 152 120 122 150 40" fill="none" stroke="#F7F2E9" stroke-width="58" stroke-linecap="round"/>
  <path d="M28 400 C 160 412 232 332 206 232 C 186 152 120 122 150 40" fill="none" stroke="#2F2723" stroke-width="58" stroke-dasharray="34 30" stroke-dashoffset="10"/>
  <circle cx="150" cy="40" r="29" fill="#2F2723"/>
  <path d="M60 380 C 150 380 200 320 182 240" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" opacity=".25"/>`;

// ─── Ardilla gris mexicana (Sciurus aureogaster): lomo gris y panza rojiza ───
const A = { gris: '#8F8A86', grisOscuro: '#6E6966', borde: '#BDB8B4', rojizo: '#D9773B', crema: '#F4E6D4' };

function ardilla(feliz: boolean): string {
  const ojos = feliz
    ? `<circle cx="86" cy="100" r="11" fill="${TINTA}"/><circle cx="124" cy="100" r="11" fill="${TINTA}"/>
       <circle cx="82" cy="95" r="4.5" fill="#fff"/><circle cx="120" cy="95" r="4.5" fill="#fff"/>
       <circle cx="90" cy="104" r="2" fill="#fff"/><circle cx="128" cy="104" r="2" fill="#fff"/>`
    : `<circle cx="86" cy="104" r="8" fill="${TINTA}"/><circle cx="124" cy="104" r="8" fill="${TINTA}"/>
       <path d="M74 94 L 96 86 M136 94 L 114 86" stroke="${TINTA}" stroke-width="4.5" stroke-linecap="round"/>
       <path d="M78 116 q -5 10 0 14 q 5 -4 0 -14 z" fill="#7EC8E3"/>`;
  const boca = feliz
    ? `<path d="M94 128 Q 105 142 116 128" fill="#7A2E2E" stroke="${TINTA}" stroke-width="3"/>
       <ellipse cx="72" cy="122" rx="10" ry="6" fill="#F0907E" opacity=".55"/><ellipse cx="138" cy="122" rx="10" ry="6" fill="#F0907E" opacity=".55"/>`
    : `<path d="M95 138 Q 105 128 115 138" fill="none" stroke="${TINTA}" stroke-width="4" stroke-linecap="round"/>`;
  const cola = feliz
    ? 'M150 252 C 252 252 262 150 222 92 C 192 48 232 14 254 30 C 204 -6 148 40 170 100 C 186 150 162 202 132 232 Z'
    : 'M150 252 C 240 262 268 200 248 150 C 232 112 256 92 262 100 C 236 70 196 100 204 150 C 210 190 170 214 132 232 Z';
  return `
    <ellipse cx="120" cy="268" rx="100" ry="10" fill="#000" opacity=".12"/>
    <path d="${cola}" fill="${A.gris}" stroke="${A.borde}" stroke-width="10" stroke-linejoin="round"/>
    <ellipse cx="110" cy="196" rx="62" ry="72" fill="${A.gris}"/>
    <ellipse cx="106" cy="208" rx="38" ry="52" fill="${A.rojizo}"/>
    <g transform="rotate(-14 76 60)"><ellipse cx="76" cy="60" rx="15" ry="25" fill="${A.gris}"/><ellipse cx="76" cy="64" rx="8" ry="15" fill="${A.rojizo}"/></g>
    <g transform="rotate(14 134 60)"><ellipse cx="134" cy="60" rx="15" ry="25" fill="${A.gris}"/><ellipse cx="134" cy="64" rx="8" ry="15" fill="${A.rojizo}"/></g>
    <circle cx="105" cy="106" r="54" fill="${A.gris}"/>
    <ellipse cx="105" cy="126" rx="30" ry="21" fill="${A.crema}"/>
    ${ojos}
    <ellipse cx="105" cy="118" rx="8" ry="5.5" fill="${TINTA}"/>
    ${boca}
    <ellipse cx="88" cy="182" rx="15" ry="12" fill="${A.grisOscuro}"/>
    <ellipse cx="124" cy="182" rx="15" ry="12" fill="${A.grisOscuro}"/>
    <ellipse cx="78" cy="262" rx="28" ry="12" fill="${A.grisOscuro}"/>
    <ellipse cx="140" cy="262" rx="28" ry="12" fill="${A.grisOscuro}"/>`;
}

// ─── Colibrí ─────────────────────────────────────────────────────────────
const H = { verde: '#2FA36B', verdeOscuro: '#1E7A4E', panza: '#D6F2DF', garganta: '#D7263D', ala: '#8FDDB4' };

function colibri(feliz: boolean): string {
  const ojo = feliz
    ? `<circle cx="82" cy="70" r="8" fill="${TINTA}"/><circle cx="79" cy="67" r="3" fill="#fff"/>
       <ellipse cx="98" cy="88" rx="7" ry="4" fill="#F0907E" opacity=".6"/>`
    : `<circle cx="82" cy="74" r="7" fill="${TINTA}"/><path d="M73 75 A 9 9 0 0 1 91 75 Z" fill="${H.verdeOscuro}"/>
       <path d="M74 66 Q 82 60 92 64" stroke="${TINTA}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
  const pico = feliz ? 'M60 76 L 2 80 L 60 86 Z' : 'M60 82 L 14 112 L 64 90 Z';
  const alaPlegada = feliz
    ? ''
    : `<path d="M110 82 C 140 70 180 80 205 110 C 170 110 135 105 110 98 Z" fill="${H.verdeOscuro}" opacity=".9"/>`;
  return `
    <path d="M180 100 L 238 118 L 226 142 Z" fill="${H.verdeOscuro}"/>
    <path d="M70 86 C 90 52 150 46 186 72 C 206 86 214 104 222 122 C 196 122 170 122 150 120 C 110 122 76 112 70 86 Z" fill="${H.verde}"/>
    <path d="M96 104 C 120 124 160 124 196 116 C 172 132 128 136 100 120 Z" fill="${H.panza}"/>
    <circle cx="86" cy="78" r="30" fill="${H.verde}"/>
    <ellipse cx="96" cy="100" rx="22" ry="13" fill="${H.garganta}"/>
    <path d="${pico}" fill="${TINTA}"/>
    ${ojo}${alaPlegada}`;
}

const ALA_COLIBRI = `<path d="M10 70 C 30 22 90 2 136 8 C 112 32 70 60 10 70 Z" fill="${H.ala}" stroke="${H.verde}" stroke-width="5" stroke-linejoin="round"/>
  <path d="M30 60 C 60 40 90 26 118 16" stroke="#fff" stroke-width="3" opacity=".6" fill="none" stroke-linecap="round"/>`;

// ─── Mariposa monarca ────────────────────────────────────────────────────
function mariposa(feliz: boolean): string {
  const naranja = feliz ? '#F28C28' : '#C9A27A';
  const borde = '#1D1D1D';
  const alas = `
    <path d="M108 88 C 80 28 30 8 12 30 C 0 60 30 96 104 98 Z" fill="${naranja}" stroke="${borde}" stroke-width="8" stroke-linejoin="round"/>
    <path d="M106 102 C 60 106 28 136 48 162 C 68 180 100 152 108 114 Z" fill="${naranja}" stroke="${borde}" stroke-width="8" stroke-linejoin="round"/>
    <path d="M104 92 L 40 34 M104 94 L 22 56 M104 96 L 34 82 M106 106 L 50 150 M106 110 L 76 160" stroke="${borde}" stroke-width="3.5" fill="none" stroke-linecap="round"/>
    <g fill="#fff"><circle cx="20" cy="36" r="3.5"/><circle cx="12" cy="52" r="3"/><circle cx="34" cy="20" r="3"/><circle cx="46" cy="158" r="3"/><circle cx="58" cy="168" r="3"/></g>`;
  const antenas = feliz
    ? 'M104 52 Q 92 22 80 16 M116 52 Q 128 22 140 16'
    : 'M104 52 Q 90 40 80 50 M116 52 Q 130 40 140 50';
  const puntas = feliz ? [80, 16, 140, 16] : [80, 50, 140, 50];
  const cara = feliz
    ? `<path d="M104 66 Q 110 72 116 66" stroke="#fff" stroke-width="2.5" fill="none" stroke-linecap="round"/>`
    : `<path d="M104 70 Q 110 64 116 70" stroke="#fff" stroke-width="2.5" fill="none" stroke-linecap="round"/>`;
  return `
    ${alas}
    <g transform="translate(220 0) scale(-1 1)">${alas}</g>
    <ellipse cx="110" cy="108" rx="9" ry="40" fill="${borde}"/>
    <path d="${antenas}" stroke="${borde}" stroke-width="4" fill="none" stroke-linecap="round"/>
    <circle cx="${puntas[0]}" cy="${puntas[1]}" r="5" fill="${borde}"/><circle cx="${puntas[2]}" cy="${puntas[3]}" r="5" fill="${borde}"/>
    <circle cx="110" cy="60" r="15" fill="${borde}"/>
    <circle cx="104" cy="57" r="4" fill="#fff"/><circle cx="116" cy="57" r="4" fill="#fff"/>
    <circle cx="104.5" cy="58" r="2" fill="${borde}"/><circle cx="116.5" cy="58" r="2" fill="${borde}"/>
    ${cara}`;
}

export const PERSONAJES: ArteSvg[] = [
  arte('mixtle', 360, 440, cuerpoMixtle('normal'), ESCALA_MIXTLE),
  arte('mixtle-habla', 360, 440, cuerpoMixtle('habla'), ESCALA_MIXTLE),
  arte('mixtle-feliz', 360, 440, cuerpoMixtle('feliz'), ESCALA_MIXTLE),
  arte('mixtle-parpadeo', 360, 440, cuerpoMixtle('parpadeo'), ESCALA_MIXTLE),
  arte('mixtle-pensando', 360, 440, cuerpoMixtle('pensando'), ESCALA_MIXTLE),
  arte('mixtle-sorprendido', 360, 440, cuerpoMixtle('sorprendido'), ESCALA_MIXTLE),
  arte('mixtle-celebrando', 360, 440, cuerpoMixtle('celebrando'), ESCALA_MIXTLE),
  arte('mixtle-senalando', 360, 440, cuerpoMixtle('senalando'), ESCALA_MIXTLE),
  arte('mixtle-cola', 260, 440, COLA_MIXTLE, ESCALA_MIXTLE),
  arte('ardilla-triste', 270, 280, ardilla(false), 1.2),
  arte('ardilla-feliz', 270, 280, ardilla(true), 1.2),
  arte('colibri-triste', 240, 150, colibri(false), 1.2),
  arte('colibri-feliz', 240, 150, colibri(true), 1.2),
  arte('colibri-ala', 140, 80, ALA_COLIBRI, 1.2),
  arte('mariposa-triste', 220, 180, mariposa(false), 1.2),
  arte('mariposa-feliz', 220, 180, mariposa(true), 1.2),
];
