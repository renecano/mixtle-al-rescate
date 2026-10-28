import { normalizarFrase } from './locucion';

/**
 * Hash corto y estable de un texto (cyrb53, 53 bits en hexadecimal). Lo usan el generador de voz
 * (en Node) y el juego (en el navegador) para encontrar el audio de cada frase: public/voz/<hash>.mp3.
 */
export function cyrb53(texto: string, semilla = 0): string {
  let h1 = 0xdeadbeef ^ semilla;
  let h2 = 0x41c6ce57 ^ semilla;
  for (let i = 0; i < texto.length; i++) {
    const c = texto.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 2654435761);
    h2 = Math.imul(h2 ^ c, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16).padStart(14, '0');
}

/** Nombre del archivo de audio de una frase. Una grabación humana debe llevar este mismo nombre. */
export function archivoDeFrase(texto: string): string {
  return `${cyrb53(normalizarFrase(texto))}.mp3`;
}
