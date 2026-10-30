/*
 * Cómo se descarga el código de cada pantalla (aparte del inicio, que viene con la app). La misma
 * función sirve para mostrarla (React.lazy) y para adelantar su descarga: el navegador no la baja dos veces.
 */
export const cargarGrupos = () => import('./Grupos');
export const cargarCamino = () => import('./Camino');
export const cargarLeccion = () => import('./Leccion');
export const cargarAventura = () => import('./Aventura');
export const cargarAlbum = () => import('./Album');

/** Mientras se ve el inicio: las dos pantallas que siguen, para que "¡Jugar!" no espere una descarga. */
export function precargarPrimerasPantallas(): void {
  void cargarGrupos().catch(() => undefined);
  void cargarCamino().catch(() => undefined);
}

/** Mientras se ve el camino: la lección (con sus ejercicios), para que tocar una no espere una descarga. */
export function precargarLeccion(): void {
  void cargarLeccion().catch(() => undefined);
}
