/**
 * Preferencias del dispositivo. Solo se guarda si la voz (con los efectos) y la música están
 * encendidas. No se guarda nada de las niñas y los niños.
 */
export const CLAVES = {
  /** Voz de Caco y efectos de sonido. */
  sonido: 'caco-al-rescate:sonido',
  musica: 'caco-al-rescate:musica',
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
