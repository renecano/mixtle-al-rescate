import { create } from 'zustand';
import { registrarAudio } from './audio/registro';

/*
 * Descarga para jugar sin internet: el código que no va en el precache (lecciones, aventuras, Phaser),
 * las imágenes, los efectos, las voces de Mixtle y la música (~36 MB).
 *
 * Antes, el service worker guardaba todo al instalarse (862 archivos, uno a la vez): con Slow 4G
 * tardaba ~18 min y no se activaba, y mientras tanto usaba la red que hacía falta para jugar. Ahora
 * el service worker guarda solo lo esencial y se activa en segundos, y esto baja lo demás después de
 * que la primera pantalla está lista: varios a la vez, con prioridad baja, haciendo una pausa en cada
 * cambio de pantalla, y lo guarda en la caché de la que el service worker lo sirve (CacheFirst, ver
 * vite.config.ts).
 *
 * La lista (sin-internet.json) se arma al construir, con la revisión de cada archivo: así se baja
 * solo lo nuevo o lo que cambió (por ejemplo, al cambiar la voz) y se borra lo que ya no se usa.
 */

export const CACHE_SIN_INTERNET = 'mixtle-sin-internet';
export const LISTA_SIN_INTERNET = 'sin-internet.json';
/** Archivos que se bajan a la vez (con prioridad baja, para no estorbar lo que pide la pantalla). */
export const SIMULTANEAS = 4;
/** Pausa de la descarga al cambiar de pantalla: lo que pide la pantalla nueva va primero. */
export const PAUSA_AL_CAMBIAR_MS = 3000;
/** Cabecera con la que se guarda la revisión de cada archivo en la caché. */
export const CABECERA_REVISION = 'x-mixtle-rev';

export interface ArchivoSinInternet {
  ruta: string;
  bytes: number;
  rev: string;
}

export type FaseDescarga = 'esperando' | 'descargando' | 'listo' | 'sin-conexion' | 'no-disponible';

export interface EstadoDescarga {
  fase: FaseDescarga;
  bytesListos: number;
  bytesTotales: number;
}

export const useDescargaSinInternet = create<EstadoDescarga>(() => ({ fase: 'esperando', bytesListos: 0, bytesTotales: 0 }));

/** El avance en porcentaje (sin redondear hacia arriba: 100 solo cuando de verdad terminó). */
export function porcentaje(e: Pick<EstadoDescarga, 'bytesListos' | 'bytesTotales'>): number {
  if (!e.bytesTotales) return 0;
  return Math.min(100, Math.floor((e.bytesListos / e.bytesTotales) * 100));
}

/**
 * Orden de bajada: primero el código y las imágenes (sin ellos no se abre una lección sin internet),
 * luego los efectos (chicos, suenan en todas partes), las voces y al final la música.
 */
function prioridad(ruta: string): number {
  if (ruta.startsWith('sonidos/')) return 1;
  if (ruta.startsWith('voz/')) return 2;
  if (ruta.startsWith('musica/')) return 3;
  return 0;
}

export interface Dependencias {
  lista: readonly ArchivoSinInternet[];
  cache: Pick<Cache, 'keys' | 'match' | 'put' | 'delete'>;
  /** Pide un archivo a la red (en el navegador: fetch con prioridad baja). */
  traer: (url: string) => Promise<Response>;
  /** De ruta relativa a URL completa (la llave de la caché). */
  url: (ruta: string) => string;
  simultaneas?: number;
  alAvanzar?: (e: EstadoDescarga) => void;
  /** Antes de cada archivo: espera si la pantalla acaba de cambiar (ver pausarDescarga). */
  esperarTurno?: () => Promise<void>;
}

/**
 * Baja lo que falta y deja la caché igual a la lista. Devuelve el estado final. Si se cae la red,
 * para y devuelve "sin-conexion" (lo bajado se queda; la próxima vez sigue donde se quedó).
 */
export async function descargar({ lista, cache, traer, url, simultaneas = SIMULTANEAS, alAvanzar, esperarTurno }: Dependencias): Promise<EstadoDescarga> {
  const quiere = new Map(lista.map((a) => [url(a.ruta), a]));
  // Lo que ya está guardado con la revisión correcta se queda; lo que ya no se usa, se borra.
  const vigentes = new Set<string>();
  for (const pedido of await cache.keys()) {
    const a = quiere.get(pedido.url);
    if (!a) {
      await cache.delete(pedido);
      continue;
    }
    const r = await cache.match(pedido);
    if (r?.headers.get(CABECERA_REVISION) === a.rev) vigentes.add(pedido.url);
  }
  const bytesTotales = lista.reduce((n, a) => n + a.bytes, 0);
  const pendientes = lista.filter((a) => !vigentes.has(url(a.ruta))).sort((a, b) => prioridad(a.ruta) - prioridad(b.ruta));
  const estado: EstadoDescarga = { fase: pendientes.length ? 'descargando' : 'listo', bytesListos: bytesTotales - pendientes.reduce((n, a) => n + a.bytes, 0), bytesTotales };
  alAvanzar?.({ ...estado });
  if (!pendientes.length) return estado;

  let cayo = false;
  const siguiente = async (): Promise<void> => {
    while (!cayo) {
      await esperarTurno?.();
      const a = pendientes.shift();
      if (!a) return;
      try {
        // Con ?rev=… el service worker no la sirve de su caché (podría ser una copia vieja): va a la red.
        const r = await traer(`${url(a.ruta)}?rev=${encodeURIComponent(a.rev)}`);
        if (!r.ok) throw new Error(`${r.status}`);
        const cuerpo = await r.blob();
        // Cabeceras nuevas: el cuerpo ya viene sin comprimir, así que no se copia content-encoding.
        const cabeceras = new Headers({ 'content-type': r.headers.get('content-type') ?? 'audio/mpeg', 'content-length': String(cuerpo.size), [CABECERA_REVISION]: a.rev });
        await cache.put(url(a.ruta), new Response(cuerpo, { status: 200, headers: cabeceras }));
        estado.bytesListos += a.bytes;
        alAvanzar?.({ ...estado });
      } catch {
        cayo = true;
      }
    }
  };
  await Promise.all(Array.from({ length: Math.max(1, simultaneas) }, siguiente));
  estado.fase = cayo ? 'sin-conexion' : 'listo';
  alAvanzar?.({ ...estado });
  return estado;
}

let enCurso: Promise<void> | null = null;
let pausaHasta = 0;
let retenidaHasta = 0;
/** Lo más que se retiene la descarga esperando a que algo empiece (si nunca avisa, sigue sola). */
export const RETENCION_MAXIMA_MS = 15000;

/** La pantalla cambió: la descarga no empieza archivos nuevos por un momento (los que van, siguen). */
export function pausarDescarga(ms = PAUSA_AL_CAMBIAR_MS): void {
  pausaHasta = Math.max(pausaHasta, Date.now() + ms);
}

/**
 * Retiene la descarga hasta que `soltarDescarga()` avise (por ejemplo, al tocar una lección: hasta que
 * su primer ejercicio esté en pantalla y Mixtle narrando), o hasta `maxMs`, lo que pase primero.
 */
export function retenerDescarga(maxMs = RETENCION_MAXIMA_MS): void {
  retenidaHasta = Math.max(retenidaHasta, Date.now() + maxMs);
}

export function soltarDescarga(): void {
  retenidaHasta = 0;
}

/** Hasta cuándo no se empiezan archivos nuevos (para pruebas). */
export function descargaDetenidaHasta(): number {
  return Math.max(pausaHasta, retenidaHasta);
}

const esperarPausa = async () => {
  // Se revisa seguido: soltarDescarga() puede llegar antes de que venza la retención.
  while (Date.now() < descargaDetenidaHasta()) await new Promise((r) => setTimeout(r, Math.min(250, descargaDetenidaHasta() - Date.now())));
};

/**
 * En el navegador: baja la lista y lo que falta. Se llama cuando la primera pantalla ya está lista y
 * el service worker está activo. Si no hay red, se reintenta al volver la conexión. Nunca lanza.
 */
export function iniciarDescargaSinInternet(): Promise<void> {
  if (enCurso) return enCurso;
  enCurso = (async () => {
    try {
      if (typeof caches === 'undefined' || !('serviceWorker' in navigator)) {
        useDescargaSinInternet.setState({ fase: 'no-disponible' });
        return;
      }
      const base = new URL(import.meta.env.BASE_URL, location.href);
      const r = await fetch(new URL(LISTA_SIN_INTERNET, base), { cache: 'no-cache' });
      if (!r.ok) throw new Error(`${r.status}`);
      const lista = (await r.json()) as ArchivoSinInternet[];
      await descargar({
        lista,
        cache: await caches.open(CACHE_SIN_INTERNET),
        // Prioridad baja: si a la vez se pide algo para jugar, eso va primero.
        traer: (u) => fetch(u, { cache: 'no-cache', priority: 'low' } as RequestInit),
        url: (ruta) => new URL(ruta, base).href,
        alAvanzar: (e) => {
          if (e.fase !== useDescargaSinInternet.getState().fase) registrarAudio('descarga sin internet', { fase: e.fase, porcentaje: porcentaje(e) });
          useDescargaSinInternet.setState(e);
        },
        esperarTurno: esperarPausa,
      });
    } catch {
      useDescargaSinInternet.setState({ fase: 'sin-conexion' });
    } finally {
      enCurso = null;
      if (useDescargaSinInternet.getState().fase === 'sin-conexion') window.addEventListener('online', () => void iniciarDescargaSinInternet(), { once: true });
    }
  })();
  return enCurso;
}
