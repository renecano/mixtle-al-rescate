/** Utilidades para escribir ilustraciones SVG como texto. */
export interface ArteSvg {
  clave: string;
  svg: string;
  /** Tamaño al que Phaser rasteriza el SVG (px del juego). */
  ancho: number;
  alto: number;
}

export function svg(ancho: number, alto: number, contenido: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${ancho}" height="${alto}" viewBox="0 0 ${ancho} ${alto}">${contenido}</svg>`;
}

/**
 * Crea una ilustración. `escala` permite rasterizarla más grande que su viewBox
 * para que se vea nítida al proyectarla a 1920×1080.
 */
export function arte(clave: string, ancho: number, alto: number, contenido: string, escala = 1): ArteSvg {
  return { clave, svg: svg(ancho, alto, contenido), ancho: Math.round(ancho * escala), alto: Math.round(alto * escala) };
}

export function aDataUri(svgTexto: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgTexto)}`;
}
