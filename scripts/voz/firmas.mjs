import { sinComentarios } from './comun.mjs';

/**
 * Las dos firmas de un audio generado:
 * - `firma`: la del archivo final (manifiesto). Cambia si cambia el proveedor, la voz, un ajuste, la
 *   normalización (recorte de silencio, ver voz.config.json) o el texto tal como lo lee la voz.
 * - `firmaAzure`: la del audio tal como lo devolvió Azure, sin la normalización. Con ella se reusan los
 *   originales guardados en .voz-modelos/azure: cambiar solo la normalización vuelve a convertir todo
 *   sin pedir (ni pagar) nada nuevo. Su fórmula es la que tenían las firmas antes de existir la
 *   normalización, para que los originales ya guardados sigan valiendo.
 */
export function firmas(config, textoVoz, hash) {
  const pedido = { proveedor: config.proveedor, voz: config.voz, ajustes: config.ajustes };
  return {
    firma: hash(JSON.stringify({ ...pedido, normalizacion: sinComentarios(config.normalizacion), texto: textoVoz })),
    firmaAzure: hash(JSON.stringify({ ...pedido, texto: textoVoz })),
  };
}

/**
 * Hash corto de la configuración de voz (proveedor, voz, ajustes y normalización, sin el texto). Va en
 * el nombre de cada archivo publicado: así, al cambiar de voz, el archivo cambia de nombre y ninguna
 * caché (navegador, service worker, descarga sin internet) puede servir una copia vieja con otro contenido.
 */
export function configCorto(config, hash) {
  return hash(JSON.stringify({ proveedor: config.proveedor, voz: config.voz, ajustes: config.ajustes, normalizacion: sinComentarios(config.normalizacion) })).slice(0, 8);
}

/**
 * Nombre del archivo publicado de una frase: su clave (hash del texto, la misma con la que se busca en
 * el manifiesto y con la que se nombra una grabación humana) más la configuración de voz, o la huella
 * de la grabación: `<hash-texto>.<hash-config>.mp3`.
 */
export function nombreDeSalida(clave, sufijo) {
  return clave.replace(/\.mp3$/, `.${sufijo}.mp3`);
}

/** ¿Un texto tan corto que un sonido después de una pausa larga no puede ser parte de él? (números, piezas) */
export function esTextoCorto(texto) {
  return texto.trim().split(/\s+/).length <= 3;
}
