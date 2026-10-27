/** Generador pseudoaleatorio con semilla (mulberry32), para repartos reproducibles en pruebas. */
export function crearAleatorio(semilla: number): () => number {
  let a = semilla >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface Rect {
  x: number;
  y: number;
  ancho: number;
  alto: number;
}

export interface Circulo {
  x: number;
  y: number;
  r: number;
}

export interface ZonaReparto {
  rect: Rect;
  /** Áreas donde no debe caer basura (por ejemplo, encima de un animal). */
  evitar?: readonly Circulo[];
}

export interface Colocacion<T> {
  item: T;
  zona: number;
  x: number;
  y: number;
  angulo: number;
}

/**
 * Reparte los elementos entre las zonas (por turnos) y les da una posición dentro de su zona
 * sin que se encimen entre sí ni con las áreas a evitar.
 */
export function repartir<T>(
  items: readonly T[],
  zonas: readonly ZonaReparto[],
  aleatorio: () => number,
  distanciaMinima = 125,
): Colocacion<T>[] {
  if (!zonas.length) return [];
  const resultado: Colocacion<T>[] = [];
  items.forEach((item, i) => {
    const zona = i % zonas.length;
    const { rect, evitar = [] } = zonas[zona]!;
    // Se compara contra todo lo ya colocado: dos zonas vecinas tampoco deben encimar piezas.
    const libre = (x: number, y: number, dist: number) =>
      resultado.every((c) => Math.hypot(c.x - x, c.y - y) >= dist) &&
      evitar.every((e) => Math.hypot(e.x - x, e.y - y) >= e.r);

    let punto: { x: number; y: number } | null = null;
    // Intentamos con la distancia ideal y la vamos relajando si la zona está muy llena.
    for (let dist = distanciaMinima; !punto && dist > 0; dist -= 15) {
      for (let intento = 0; intento < 200 && !punto; intento++) {
        const x = rect.x + aleatorio() * rect.ancho;
        const y = rect.y + aleatorio() * rect.alto;
        if (libre(x, y, dist)) punto = { x, y };
      }
    }
    punto ??= { x: rect.x + rect.ancho / 2, y: rect.y + rect.alto / 2 };
    resultado.push({ item, zona, x: Math.round(punto.x), y: Math.round(punto.y), angulo: Math.round((aleatorio() - 0.5) * 40) });
  });
  return resultado;
}
