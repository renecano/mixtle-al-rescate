/**
 * Reparte `n` elementos a lo ancho de [desde, hasta] dejando el mismo espacio a cada uno.
 * Devuelve los centros en x y el ancho máximo que puede ocupar cada elemento.
 */
export function enFila(n: number, desde: number, hasta: number, anchoMaximo: number, separacion = 40): { xs: number[]; ancho: number } {
  if (n <= 0) return { xs: [], ancho: 0 };
  const paso = (hasta - desde) / n;
  const ancho = Math.min(anchoMaximo, paso - separacion);
  return { xs: Array.from({ length: n }, (_, i) => Math.round(desde + paso * (i + 0.5))), ancho: Math.round(ancho) };
}
