import { gruposValidos } from '../logica/grupos';
import { almacenIndexedDb } from './almacen';
import { PREFIJO } from './migracion';
import { DIRECCION_NUEVA, fragmentoDeMudanza, type Mudanza } from './mudanza';

/**
 * El juego se abrió en la dirección anterior: empaca los grupos y las preferencias de este aparato,
 * borra la copia sin conexión de la dirección anterior (para que no se quede mostrando la versión
 * vieja) y abre la dirección nueva con la mudanza en el fragmento de la URL.
 */
export async function mudarse(): Promise<void> {
  let fragmento = '';
  try {
    const grupos = gruposValidos(await almacenIndexedDb.leer());
    const preferencias: Mudanza['preferencias'] = {};
    for (const clave of ['sonido', 'musica', 'proyector', 'suave']) {
      const valor = localStorage.getItem(`${PREFIJO}:${clave}`);
      if (valor === 'si' || valor === 'no') preferencias[clave] = valor;
    }
    if (grupos.length || Object.keys(preferencias).length) fragmento = fragmentoDeMudanza({ v: 1, grupos, preferencias });
  } catch {
    // Sin acceso a lo guardado: se muda sin datos.
  }
  try {
    for (const r of (await navigator.serviceWorker?.getRegistrations()) ?? []) await r.unregister();
    for (const k of await caches.keys()) await caches.delete(k);
  } catch {
    // Nada que limpiar.
  }
  location.replace(DIRECCION_NUEVA + fragmento);
}
