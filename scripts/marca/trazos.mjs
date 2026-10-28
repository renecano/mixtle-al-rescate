// Convierte texto en trazos SVG (path) con opentype.js, para que el logo se vea igual en todas partes
// sin depender de que la fuente esté cargada: pantalla de carga, íconos, archivos sueltos.
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import opentype from 'opentype.js';

const requerir = createRequire(import.meta.url);

/** Carga una fuente de @fontsource (archivo .woff, que opentype.js sabe leer). */
export function cargarFuente(paquete, archivo) {
  const ruta = requerir.resolve(`${paquete}/files/${archivo}`);
  const datos = readFileSync(ruta);
  return opentype.parse(datos.buffer.slice(datos.byteOffset, datos.byteOffset + datos.byteLength));
}

const redondear = (n) => Math.round(n * 10) / 10;

/** Glifos con su posición y avance (en px), con interletraje y espaciado extra; y el ancho total. */
function glifos(fuente, texto, tamano, espaciado) {
  const lista = fuente.stringToGlyphs(texto);
  const escala = tamano / fuente.unitsPerEm;
  let x = 0;
  const items = lista.map((g, i) => {
    const kern = i < lista.length - 1 ? fuente.getKerningValue(g, lista[i + 1]) * escala : 0;
    const avance = g.advanceWidth * escala;
    const item = { glifo: g, x, avance };
    x += avance + kern + espaciado;
    return item;
  });
  const ultimo = items[items.length - 1];
  return { items, total: ultimo ? ultimo.x + ultimo.avance : 0 };
}

function comandosADe(comandos, transformar) {
  let d = '';
  for (const c of comandos) {
    if (c.type === 'Z') {
      d += 'Z';
      continue;
    }
    const pts = [];
    if (c.type === 'C') pts.push([c.x1, c.y1], [c.x2, c.y2]);
    if (c.type === 'Q') pts.push([c.x1, c.y1]);
    pts.push([c.x, c.y]);
    d += c.type + pts.map(([x, y]) => transformar(x, y).map(redondear).join(' ')).join(' ');
  }
  return d;
}

/** Texto en línea recta. `ancla`: 'inicio' | 'centro' | 'fin'. */
export function trazoTexto(fuente, texto, { x, y, tamano, ancla = 'centro', espaciado = 0 }) {
  const { items, total } = glifos(fuente, texto, tamano, espaciado);
  const x0 = ancla === 'centro' ? x - total / 2 : ancla === 'fin' ? x - total : x;
  return items.map(({ glifo, x: gx }) => comandosADe(glifo.getPath(x0 + gx, y, tamano).commands, (px, py) => [px, py])).join('');
}

/**
 * Texto sobre una curva cuadrática (p0, control, p2), centrado en la fracción `centro` del largo de
 * la curva. Cada letra se apoya en la curva y gira con ella.
 */
export function trazoSobreArco(fuente, texto, { p0, control, p2, tamano, centro = 0.5, espaciado = 0 }) {
  const punto = (t) => [
    (1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * control[0] + t ** 2 * p2[0],
    (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * control[1] + t ** 2 * p2[1],
  ];
  const tangente = (t) => [
    2 * (1 - t) * (control[0] - p0[0]) + 2 * t * (p2[0] - control[0]),
    2 * (1 - t) * (control[1] - p0[1]) + 2 * t * (p2[1] - control[1]),
  ];
  // Tabla de largo de la curva para pasar de "distancia" a t.
  const N = 400;
  const largos = [0];
  let anterior = punto(0);
  for (let i = 1; i <= N; i++) {
    const p = punto(i / N);
    largos.push(largos[i - 1] + Math.hypot(p[0] - anterior[0], p[1] - anterior[1]));
    anterior = p;
  }
  const largo = largos[N];
  const tEn = (s) => {
    const objetivo = Math.min(Math.max(s, 0), largo);
    let i = largos.findIndex((l) => l >= objetivo);
    if (i <= 0) return 0;
    const f = (objetivo - largos[i - 1]) / (largos[i] - largos[i - 1] || 1);
    return (i - 1 + f) / N;
  };
  const { items, total } = glifos(fuente, texto, tamano, espaciado);
  const inicio = centro * largo - total / 2;
  return items
    .map(({ glifo, x, avance }) => {
      const t = tEn(inicio + x + avance / 2);
      const [cx, cy] = punto(t);
      const [tx, ty] = tangente(t);
      const angulo = Math.atan2(ty, tx);
      const cos = Math.cos(angulo);
      const sin = Math.sin(angulo);
      // La letra se dibuja con su centro en el origen y luego se gira y se lleva a la curva.
      return comandosADe(glifo.getPath(-avance / 2, 0, tamano).commands, (px, py) => [cx + px * cos - py * sin, cy + px * sin + py * cos]);
    })
    .join('');
}
