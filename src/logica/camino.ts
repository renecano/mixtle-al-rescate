import type { Leccion, Unidad } from '../contenido/tipos';

/** Progreso de un grupo (se guarda en el dispositivo; nada personal). */
export interface ProgresoGrupo {
  /** Lecciones terminadas: id → mejor resultado. */
  lecciones: Record<string, { hojitas: number; aLaPrimera: number; veces: number }>;
  cofres: string[];
  aventuras: string[];
  estampas: string[];
  hojitas: number;
  /** Días en que jugó el grupo (AAAA-MM-DD, hora local). */
  dias: string[];
}

export const PROGRESO_VACIO: ProgresoGrupo = { lecciones: {}, cofres: [], aventuras: [], estampas: [], hojitas: 0, dias: [] };

export const HOJITAS_COFRE = 15;
export const HOJITAS_AVENTURA = 20;

export type Nodo =
  | { tipo: 'leccion'; id: string; unidad: Unidad; leccion: Leccion; indice: number }
  | { tipo: 'cofre'; id: string; unidad: Unidad }
  | { tipo: 'aventura'; id: string; unidad: Unidad };

export type EstadoNodo = 'hecho' | 'disponible' | 'bloqueado';

/** Todas las paradas del camino en orden: lecciones, el cofre a la mitad y la aventura al final de cada unidad. */
export function nodosDelCamino(unidades: readonly Unidad[]): Nodo[] {
  const nodos: Nodo[] = [];
  for (const unidad of unidades) {
    unidad.lecciones.forEach((leccion, indice) => {
      nodos.push({ tipo: 'leccion', id: `leccion:${leccion.id}`, unidad, leccion, indice });
      if (indice === unidad.cofreTrasLeccion) nodos.push({ tipo: 'cofre', id: `cofre:${unidad.id}`, unidad });
    });
    nodos.push({ tipo: 'aventura', id: `aventura:${unidad.id}`, unidad });
  }
  return nodos;
}

export function nodoHecho(n: Nodo, p: ProgresoGrupo): boolean {
  if (n.tipo === 'leccion') return !!p.lecciones[n.leccion.id];
  if (n.tipo === 'cofre') return p.cofres.includes(n.unidad.id);
  return p.aventuras.includes(n.unidad.id);
}

/**
 * Las paradas se desbloquean en orden. Lo ya hecho se puede repetir.
 * El modo facilitador puede desbloquearlo todo para saltar directo a una lección.
 */
export function estadosDelCamino(nodos: readonly Nodo[], p: ProgresoGrupo, desbloquearTodo = false): EstadoNodo[] {
  let anterioresHechos = true;
  return nodos.map((n) => {
    const hecho = nodoHecho(n, p);
    const estado: EstadoNodo = hecho ? 'hecho' : anterioresHechos || desbloquearTodo ? 'disponible' : 'bloqueado';
    anterioresHechos = anterioresHechos && hecho;
    return estado;
  });
}

/** La siguiente parada por hacer (donde se para Mixtle a señalar), o null si ya terminó todo. */
export function siguienteNodo(nodos: readonly Nodo[], p: ProgresoGrupo): number | null {
  const i = nodos.findIndex((n) => !nodoHecho(n, p));
  return i === -1 ? null : i;
}

export function unidadCompleta(u: Unidad, p: ProgresoGrupo): boolean {
  return u.lecciones.every((l) => p.lecciones[l.id]) && p.aventuras.includes(u.id);
}

/** Fecha local AAAA-MM-DD. */
export function hoyLocal(fecha = new Date()): string {
  const d = (n: number) => String(n).padStart(2, '0');
  return `${fecha.getFullYear()}-${d(fecha.getMonth() + 1)}-${d(fecha.getDate())}`;
}

function conDia(p: ProgresoGrupo, hoy: string): string[] {
  return p.dias.includes(hoy) ? p.dias : [...p.dias, hoy].sort();
}

export function completarLeccion(p: ProgresoGrupo, leccionId: string, r: { hojitas: number; aLaPrimera: number }, hoy: string): ProgresoGrupo {
  const antes = p.lecciones[leccionId];
  return {
    ...p,
    hojitas: p.hojitas + r.hojitas,
    lecciones: {
      ...p.lecciones,
      [leccionId]: {
        hojitas: Math.max(antes?.hojitas ?? 0, r.hojitas),
        aLaPrimera: Math.max(antes?.aLaPrimera ?? 0, r.aLaPrimera),
        veces: (antes?.veces ?? 0) + 1,
      },
    },
    dias: conDia(p, hoy),
  };
}

export function abrirCofre(p: ProgresoGrupo, unidadId: string, hoy: string): ProgresoGrupo {
  if (p.cofres.includes(unidadId)) return p;
  return { ...p, cofres: [...p.cofres, unidadId], hojitas: p.hojitas + HOJITAS_COFRE, dias: conDia(p, hoy) };
}

/** Al terminar la aventura de una unidad se gana su estampa del álbum. */
export function completarAventura(p: ProgresoGrupo, unidad: Unidad, hoy: string): ProgresoGrupo {
  const primera = !p.aventuras.includes(unidad.id);
  return {
    ...p,
    aventuras: primera ? [...p.aventuras, unidad.id] : p.aventuras,
    estampas: p.estampas.includes(unidad.estampa.id) ? p.estampas : [...p.estampas, unidad.estampa.id],
    hojitas: p.hojitas + (primera ? HOJITAS_AVENTURA : 0),
    dias: conDia(p, hoy),
  };
}

/**
 * Racha suave: cuántos días seguidos se ha jugado, contando hasta hoy o ayer
 * (así no se "pierde" en la mañana antes de jugar). Nunca se usa para regañar.
 */
export function rachaDias(dias: readonly string[], hoy: string): number {
  const set = new Set(dias);
  const fecha = new Date(`${hoy}T12:00:00`);
  if (!set.has(hoy)) fecha.setDate(fecha.getDate() - 1);
  let racha = 0;
  while (set.has(hoyLocal(fecha))) {
    racha += 1;
    fecha.setDate(fecha.getDate() - 1);
  }
  return racha;
}

/** Cuántas hojitas se pueden ganar como máximo (para medir cuánto ha crecido el parque). */
export function hojitasPosibles(unidades: readonly Unidad[]): number {
  return unidades.reduce(
    (suma, u) => suma + u.lecciones.reduce((s, l) => s + 10 + l.ejercicios.length, 0) + HOJITAS_COFRE + HOJITAS_AVENTURA,
    0,
  );
}

export interface EtapaParque {
  /** 0 = parque gris y sucio; 1 = parque lleno de vida (cuánto color tiene). */
  avance: number;
  /** Basura que aún se ve (de 8 a 0). */
  basura: number;
  arboles: number;
  flores: number;
}

export const MAXIMOS_PARQUE = { basura: 8, arboles: 6, flores: 14 } as const;

/** Color que gana el parque con la primera parada (0 = gris, 1 = verde). */
const COLOR_INICIAL = 0.35;

/** Cuánto pesa cada parada en el color del parque: una aventura vale lo de dos lecciones. */
const PESO = { leccion: 1, cofre: 0.5, aventura: 2 } as const;

/**
 * Cómo se ve el parque del grupo. **Cada lección se nota**: quita una basura, siembra una flor y
 * le da más color al parque. Cada aventura quita dos basuras y planta un árbol. Los animales
 * llegan con las estampas del álbum (unidades completadas).
 *
 * El color da un salto grande con la primera lección (de gris a casi la mitad de verde) y luego
 * sigue subiendo con cada parada (raíz cuadrada): el grupo ve que su esfuerzo sirve desde el día uno.
 */
export function etapaParque(p: ProgresoGrupo, unidades: readonly Unidad[]): EtapaParque {
  const lecciones = Object.keys(p.lecciones).length;
  const cofres = p.cofres.length;
  const aventuras = p.aventuras.length;
  const hecho = lecciones * PESO.leccion + cofres * PESO.cofre + aventuras * PESO.aventura;
  const total = unidades.reduce((s, u) => s + u.lecciones.length * PESO.leccion + PESO.cofre + PESO.aventura, 0);
  return {
    avance: hecho <= 0 ? 0 : Math.min(1, COLOR_INICIAL + (1 - COLOR_INICIAL) * Math.sqrt(hecho / Math.max(1, total))),
    basura: Math.max(0, MAXIMOS_PARQUE.basura - lecciones - 2 * aventuras),
    arboles: Math.min(MAXIMOS_PARQUE.arboles, Math.floor(lecciones / 3) + aventuras),
    flores: Math.min(MAXIMOS_PARQUE.flores, lecciones + cofres),
  };
}
