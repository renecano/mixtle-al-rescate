import type { Animal } from '../data/animales';

/**
 * Lo que pasa durante una partida, solo en memoria. No se guarda nada de las
 * niñas y los niños: al recargar la página o volver a jugar, todo empieza en cero.
 */
export class Progreso {
  /** Residuos recogidos en el nivel 1, en el orden en que se recogieron. */
  readonly recolectados: string[] = [];
  /** Residuos que llegaron a su bote correcto (nivel 2). */
  readonly separados = new Set<string>();
  /** Residuos que se clasificaron bien en el bonus. */
  readonly separadosBonus = new Set<string>();
  /** Zonas limpias (el animal de cada zona quedó feliz). */
  readonly animalesFelices = new Set<Animal['id']>();
  /** Mariposas que llegaron a las flores plantadas en el nivel 3. */
  mariposasNuevas = 0;
  /** Árboles y flores plantados en el nivel 3. */
  plantados = 0;

  recolectar(id: string): void {
    if (!this.recolectados.includes(id)) this.recolectados.push(id);
  }

  separar(id: string): void {
    if (this.recolectados.includes(id)) this.separados.add(id);
  }

  separarEnBonus(id: string): void {
    this.separadosBonus.add(id);
  }

  ayudarAnimal(id: Animal['id']): void {
    this.animalesFelices.add(id);
  }

  plantar(atraeMariposas: number): void {
    this.plantados += 1;
    this.mariposasNuevas += Math.max(0, atraeMariposas);
  }
}

export interface ResumenDiploma {
  residuosSeparados: number;
  animalesAyudados: number;
  plantados: number;
}

/** Números del diploma: residuos bien separados (nivel 2 + bonus) y animales ayudados. */
export function resumenDiploma(p: Progreso, animales: readonly Animal[]): ResumenDiploma {
  const animalesAyudados =
    animales.filter((a) => p.animalesFelices.has(a.id)).reduce((suma, a) => suma + a.cantidad, 0) + p.mariposasNuevas;
  return {
    residuosSeparados: p.separados.size + p.separadosBonus.size,
    animalesAyudados,
    plantados: p.plantados,
  };
}

export type FiguraAnimal = 'ardilla' | 'colibri' | 'mariposa';

const FIGURA: Record<Animal['id'], FiguraAnimal> = { ardilla: 'ardilla', colibri: 'colibri', mariposas: 'mariposa' };

/**
 * Un dibujo por cada animal que cuenta el diploma, para que la cifra coincida con lo
 * que el grupo ve: los animales de las zonas limpias y las mariposas que llegaron a las flores.
 */
export function animalesDelDiploma(p: Progreso, animales: readonly Animal[]): FiguraAnimal[] {
  const figuras: FiguraAnimal[] = [];
  for (const a of animales) {
    if (p.animalesFelices.has(a.id)) for (let i = 0; i < a.cantidad; i++) figuras.push(FIGURA[a.id]);
  }
  for (let i = 0; i < p.mariposasNuevas; i++) figuras.push('mariposa');
  return figuras;
}

/** La partida en curso. Se reinicia al tocar "¡Jugar!" o "Jugar otra vez". */
let actual = new Progreso();

export function progreso(): Progreso {
  return actual;
}

export function reiniciarProgreso(): Progreso {
  actual = new Progreso();
  return actual;
}
