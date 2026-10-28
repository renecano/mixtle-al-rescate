import { migrarPreferencias, PREFIJO } from './migracion';
import { leerMudanza } from './mudanza';

/**
 * Preferencias del dispositivo. Solo se guarda si la voz (con los efectos) y la música están
 * encendidas. No se guarda nada de las niñas y los niños.
 */
export const CLAVES = {
  /** Voz de Mixtle y efectos de sonido. */
  sonido: 'mixtle-al-rescate:sonido',
  musica: 'mixtle-al-rescate:musica',
} as const;

export type Almacen = Pick<Storage, 'getItem' | 'setItem'>;

function almacenPorDefecto(): Almacen | null {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null;
  } catch {
    // Acceder a localStorage puede lanzar (modo privado, permisos bloqueados).
    return null;
  }
}

/**
 * Al cargar, antes de que nadie lea una preferencia: pasar las guardadas con el nombre anterior del
 * juego y, si se llegó con una mudanza de dirección (#mudanza=…), poner las que traía (sin pisar las
 * que ya hay en esta dirección). Nunca lanza.
 */
export function prepararPreferencias(almacen: Storage | null = almacenPorDefecto() as Storage | null, fragmento = typeof location !== 'undefined' ? location.hash : ''): void {
  migrarPreferencias(almacen);
  const mudanza = leerMudanza(fragmento);
  if (!almacen || !mudanza) return;
  try {
    for (const [clave, valor] of Object.entries(mudanza.preferencias)) {
      if (almacen.getItem(`${PREFIJO}:${clave}`) === null) almacen.setItem(`${PREFIJO}:${clave}`, valor);
    }
  } catch {
    // Almacenamiento bloqueado: se usan las de por defecto.
  }
}
prepararPreferencias();

/** Lee un interruptor (encendido por defecto). Nunca lanza. */
export function leerInterruptor(clave: string, almacen: Almacen | null = almacenPorDefecto()): boolean {
  try {
    return almacen?.getItem(clave) !== 'no';
  } catch {
    return true;
  }
}

/** Lee un interruptor que viene apagado por defecto (solo es true si se guardó "si"). Nunca lanza. */
export function leerInterruptorApagado(clave: string, almacen: Almacen | null = almacenPorDefecto()): boolean {
  try {
    return almacen?.getItem(clave) === 'si';
  } catch {
    return false;
  }
}

/** Guarda un interruptor. Si no se puede, el juego sigue con la preferencia en memoria. */
export function guardarInterruptor(clave: string, activo: boolean, almacen: Almacen | null = almacenPorDefecto()): void {
  try {
    almacen?.setItem(clave, activo ? 'si' : 'no');
  } catch {
    // Ignorar: almacenamiento bloqueado o lleno.
  }
}

export function leerSonidoActivo(almacen?: Almacen | null): boolean {
  return leerInterruptor(CLAVES.sonido, almacen === undefined ? almacenPorDefecto() : almacen);
}

export function guardarSonidoActivo(activo: boolean, almacen?: Almacen | null): void {
  guardarInterruptor(CLAVES.sonido, activo, almacen === undefined ? almacenPorDefecto() : almacen);
}
