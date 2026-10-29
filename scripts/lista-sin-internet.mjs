// La lista de lo que se baja para jugar sin internet (dist/sin-internet.json), con el tamaño y la
// revisión (huella del contenido) de cada archivo. La usa src/servicios/sinInternet.ts para bajar
// solo lo nuevo o lo que cambió. La arma vite.config.ts al construir:
// - el código que no se guarda al instalar el service worker (lecciones, aventuras, Phaser…),
// - las imágenes (íconos y marca),
// - y el audio: efectos, voces y música.
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/** Carpetas de public/ que se bajan para jugar sin internet, y qué archivos de cada una. */
export const CARPETAS_SIN_INTERNET = [
  { carpeta: 'iconos', tipos: /\.(png|svg)$/ },
  { carpeta: 'marca', tipos: /\.(png|svg)$/ },
  { carpeta: 'sonidos', tipos: /\.mp3$/ },
  { carpeta: 'voz', tipos: /\.mp3$/ },
  { carpeta: 'musica', tipos: /\.mp3$/ },
];

const revision = (contenido) => createHash('sha1').update(contenido).digest('hex').slice(0, 12);

/**
 * @param {string} carpetaPublica
 * @param {{ ruta: string, contenido: string | Uint8Array }[]} codigo  archivos del build que no van en el precache
 * @returns {{ ruta: string, bytes: number, rev: string }[]}
 */
export function listaSinInternet(carpetaPublica, codigo = []) {
  const lista = codigo.map(({ ruta, contenido }) => ({ ruta, bytes: Buffer.byteLength(contenido), rev: revision(contenido) }));
  for (const { carpeta, tipos } of CARPETAS_SIN_INTERNET) {
    const dir = join(carpetaPublica, carpeta);
    if (!existsSync(dir)) continue;
    for (const nombre of readdirSync(dir).filter((n) => tipos.test(n)).sort()) {
      const contenido = readFileSync(join(dir, nombre));
      lista.push({ ruta: `${carpeta}/${nombre}`, bytes: contenido.length, rev: revision(contenido) });
    }
  }
  return lista;
}

/**
 * Lo esencial para que el juego arranque sin internet, que se guarda al instalar el service worker:
 * el index.html, el código que carga el inicio (y sus importaciones), el de Grupos y Camino (que el
 * inicio adelanta), el CSS y las fuentes. Todo eso ya lo bajó la página, así que el service worker lo
 * toma de la caché HTTP del navegador y se activa en segundos (Workbox guarda un archivo a la vez).
 *
 * @param {Record<string, { type: string, fileName: string, isEntry?: boolean, facadeModuleId?: string | null, imports?: string[], viteMetadata?: { importedCss: Set<string>, importedAssets: Set<string> } }>} paquete  el bundle de Rollup
 * @param {RegExp} pantallasAdelantadas  módulos de las pantallas que el inicio adelanta
 */
export function archivosEsenciales(paquete, pantallasAdelantadas = /\/pantallas\/(Grupos|Camino)\.tsx$/) {
  const esenciales = new Set(['index.html', 'manifest.webmanifest', 'favicon.svg']);
  const porNombre = new Map(Object.values(paquete).map((p) => [p.fileName, p]));
  const visitar = (nombre) => {
    if (esenciales.has(nombre)) return;
    esenciales.add(nombre);
    const p = porNombre.get(nombre);
    if (p?.type !== 'chunk') return;
    for (const i of p.imports ?? []) visitar(i);
    for (const c of p.viteMetadata?.importedCss ?? []) visitar(c);
    for (const a of p.viteMetadata?.importedAssets ?? []) visitar(a);
  };
  for (const p of Object.values(paquete)) {
    if (p.type === 'chunk' && (p.isEntry || pantallasAdelantadas.test(p.facadeModuleId ?? ''))) visitar(p.fileName);
    // Las fuentes las pide el CSS (woff2; los .woff de respaldo no los usa ningún navegador actual).
    if (p.fileName.endsWith('.woff2') || p.fileName.endsWith('.css')) esenciales.add(p.fileName);
  }
  return esenciales;
}
