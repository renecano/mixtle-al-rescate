import { gruposValidos, type Grupo } from '../logica/grupos';

/*
 * Mudanza de dirección: el juego estaba en caco-al-rescate.vercel.app y ahora está en
 * mixtle-al-rescate.vercel.app. Lo guardado en un navegador (IndexedDB, localStorage) pertenece a
 * cada dirección, así que al cambiar de dirección se perdería. Por eso, si el juego se abre en la
 * dirección anterior, empaca los grupos y las preferencias y se los lleva a la nueva en el fragmento
 * de la URL (#mudanza=…): el fragmento nunca se envía a ningún servidor. No hay datos de niñas ni niños:
 * solo el animal, el color y la etiqueta del grupo, y su avance.
 */

export const DIRECCION_ANTERIOR = 'caco-al-rescate.vercel.app';
export const DIRECCION_NUEVA = 'https://mixtle-al-rescate.vercel.app/';
const MARCA = 'mudanza=';

export interface Mudanza {
  v: 1;
  grupos: Grupo[];
  /** Preferencias del aparato ("si" / "no"), por nombre corto: sonido, musica, proyector. */
  preferencias: Record<string, string>;
}

/** Texto → base64url (UTF-8). */
function aBase64Url(texto: string): string {
  const bytes = new TextEncoder().encode(texto);
  let binario = '';
  for (const b of bytes) binario += String.fromCharCode(b);
  return btoa(binario).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function deBase64Url(b64: string): string {
  const binario = atob(b64.replace(/-/g, '+').replace(/_/g, '/'));
  return new TextDecoder().decode(Uint8Array.from(binario, (c) => c.charCodeAt(0)));
}

/** El fragmento de URL que lleva la mudanza ("#mudanza=…"). */
export function fragmentoDeMudanza(m: Mudanza): string {
  return `#${MARCA}${aBase64Url(JSON.stringify(m))}`;
}

/** Lee la mudanza de un fragmento de URL. Si no hay, o está dañada, devuelve null (nunca lanza). */
export function leerMudanza(fragmento: string): Mudanza | null {
  try {
    const i = fragmento.indexOf(MARCA);
    if (i < 0) return null;
    const datos = JSON.parse(deBase64Url(fragmento.slice(i + MARCA.length))) as Partial<Mudanza>;
    if (datos?.v !== 1) return null;
    const preferencias: Record<string, string> = {};
    for (const [clave, valor] of Object.entries(datos.preferencias ?? {})) {
      if (/^[a-z]+$/.test(clave) && (valor === 'si' || valor === 'no')) preferencias[clave] = valor;
    }
    return { v: 1, grupos: gruposValidos(datos.grupos), preferencias };
  } catch {
    return null;
  }
}

/** ¿El juego se abrió en la dirección anterior? */
export function enDireccionAnterior(host: string = typeof location !== 'undefined' ? location.hostname : ''): boolean {
  return host === DIRECCION_ANTERIOR;
}
