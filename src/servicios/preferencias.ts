/**
 * Preferencias del juego. Lo único que se guarda es si el sonido está activo.
 * No se guarda nada de las niñas y los niños.
 */
const CLAVE_SONIDO = 'caco-al-rescate:sonido';

type Almacen = Pick<Storage, 'getItem' | 'setItem'>;

function almacenPorDefecto(): Almacen | null {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null;
  } catch {
    // Acceder a localStorage puede lanzar (modo privado, permisos bloqueados).
    return null;
  }
}

export function leerSonidoActivo(almacen: Almacen | null = almacenPorDefecto()): boolean {
  try {
    return almacen?.getItem(CLAVE_SONIDO) !== 'no';
  } catch {
    return true;
  }
}

export function guardarSonidoActivo(activo: boolean, almacen: Almacen | null = almacenPorDefecto()): void {
  try {
    almacen?.setItem(CLAVE_SONIDO, activo ? 'si' : 'no');
  } catch {
    // Si no se puede guardar, el juego sigue funcionando con la preferencia en memoria.
  }
}
