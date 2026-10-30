// Reproduce el camino de actualización: una laptop con una versión anterior guardada por su service
// worker abre el juego cuando ya se publicó una versión nueva en la misma dirección.
//   1. Sirve la versión ANTERIOR, deja que su service worker se active y guarde todo, y siembra un grupo
//      con avance (como una laptop que ya se usó en un taller).
//   2. Cambia lo que sirve el servidor a la versión NUEVA (como un push a main), y vuelve a abrir el link.
//   3. Mide: qué versión se ve al abrir, si la nueva toma el control sola, si el juego se recarga a la
//      nueva al estar en el inicio, y si el grupo y su avance siguen ahí.
// Uso: node scripts/probar-actualizacion.mjs --antes=<dist anterior> --despues=<dist nueva> [--diagnostico]
//      [--abierta --pantalla=inicio|camino|leccion]   la pestaña ya estaba abierta en esa pantalla al publicar
//   Sin --diagnostico termina con error si la nueva no toma el control sola (es una prueba).
//   Las dos carpetas son builds (npm run build); la anterior se construye aparte, por ejemplo:
//   git archive --format=zip -o antes.zip <commit>; descomprimir; npx vite build ahí.
import { chromium } from '@playwright/test';
import { createReadStream, existsSync, statSync } from 'node:fs';
import http from 'node:http';
import { extname, join, normalize } from 'node:path';
import { esperarPantalla, tocarBoton, tocarSelector } from './demo/jugar.mjs';
import { fragmento, grupoConCofre } from './demo/sembrar.mjs';

const arg = (n) => process.argv.find((a) => a.startsWith(`--${n}=`))?.slice(n.length + 3);
const ANTES = arg('antes');
const DESPUES = arg('despues');
const DIAGNOSTICO = process.argv.includes('--diagnostico');
/**
 * --abierta: la pestaña ya estaba abierta cuando se publicó la versión nueva (no se cierra ni se vuelve
 * a abrir), en la pantalla que diga --pantalla=inicio|camino|leccion. El navegador solo busca versiones
 * nuevas al navegar; el juego lo hace además al volver a la pestaña (al menos un minuto después de la
 * última vez) y cada 15 min: se espera ese minuto y se simula volver a la pestaña. A media lección no
 * debe recargar; al salir al camino, sí.
 */
const ABIERTA = process.argv.includes('--abierta');
const PANTALLA = arg('pantalla') ?? 'inicio';
if (!ANTES || !DESPUES) {
  console.error('Uso: node scripts/probar-actualizacion.mjs --antes=<dist> --despues=<dist> [--diagnostico]');
  process.exit(2);
}

const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png', '.mp3': 'audio/mpeg', '.woff2': 'font/woff2', '.woff': 'font/woff' };

/** Servidor estático cuya carpeta se puede cambiar en caliente, con las cabeceras de vercel.json. */
function servidorCambiable(carpetaInicial) {
  const estado = { carpeta: carpetaInicial };
  const servidor = http.createServer((req, res) => {
    const ruta = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^[\\/]+/, '') || 'index.html';
    let archivo = join(estado.carpeta, ruta);
    if (!existsSync(archivo) || statSync(archivo).isDirectory()) archivo = join(estado.carpeta, 'index.html');
    const cabeceras = { 'Content-Type': TIPOS[extname(archivo)] ?? 'application/octet-stream', 'Content-Length': statSync(archivo).size };
    if (ruta.startsWith('assets/')) cabeceras['Cache-Control'] = 'public, max-age=31536000, immutable';
    if (/^(sw\.js|registerSW\.js|workbox-.*\.js|manifest\.webmanifest|sin-internet\.json)$/.test(ruta)) cabeceras['Cache-Control'] = 'public, max-age=0, must-revalidate';
    res.writeHead(200, cabeceras);
    createReadStream(archivo).pipe(res);
  });
  return { servidor, estado };
}

const { servidor, estado } = servidorCambiable(ANTES);
await new Promise((r) => servidor.listen(0, '127.0.0.1', r));
const URL_JUEGO = `http://localhost:${servidor.address().port}/`;
const navegador = await chromium.launch({ channel: 'chrome', headless: true });
const contexto = await navegador.newContext({ viewport: { width: 1280, height: 800 } });
let pagina = await contexto.newPage();
pagina.setDefaultTimeout(60000);
const errores = [];
const vigilarErrores = (p) => {
  p.on('pageerror', (e) => errores.push(e.message));
  p.on('console', (m) => m.type() === 'error' && errores.push(`consola: ${m.text().slice(0, 160)}`));
};
vigilarErrores(pagina);
const grupo = grupoConCofre();
const resultado = { antes: ANTES, despues: DESPUES };

const version = () => pagina.evaluate(() => [...document.scripts].map((s) => s.src.match(/index-[\w-]+\.js/)?.[0]).find(Boolean) ?? 'sin script de la app');
// Las dos versiones se distinguen por lo que guarda su service worker al instalarse (precache):
// la anterior, todo el juego (centenas de archivos); la nueva, solo lo esencial.
const estadoSw = (p = pagina) =>
  p.evaluate(async () => {
    const r = await navigator.serviceWorker.getRegistration();
    const estado = (sw) => sw?.state ?? null;
    const precache = (await caches.keys()).find((k) => k.startsWith('workbox-precache'));
    return { controla: !!navigator.serviceWorker.controller, activo: estado(r?.active), esperando: estado(r?.waiting), instalando: estado(r?.installing), precache: precache ? (await (await caches.open(precache)).keys()).length : 0 };
  });
const esperar = async (listo, maxS, que) => {
  const t0 = Date.now();
  while (Date.now() - t0 < maxS * 1000) {
    if (await listo().catch(() => false)) return Number(((Date.now() - t0) / 1000).toFixed(1));
    await pagina.waitForTimeout(500);
  }
  console.log(`  (no pasó en ${maxS} s: ${que})`);
  return null;
};

try {
  // 1. La versión anterior, con su service worker activo, todo guardado y un grupo con avance.
  await pagina.goto(`${URL_JUEGO}?e2e${fragmento([grupo])}`);
  await esperarPantalla(pagina, 'inicio');
  resultado.versionAnterior = await version();
  await pagina.evaluate(() => navigator.serviceWorker.ready.then(() => undefined));
  // Con el service worker activo, se recarga para que controle la página (como en una visita siguiente).
  await pagina.reload();
  await esperarPantalla(pagina, 'inicio');
  await esperar(async () => (await estadoSw()).controla, 30, 'que el service worker anterior controle la página');
  await tocarBoton(pagina, /¡Jugar!/);
  await esperarPantalla(pagina, 'grupos');
  await tocarSelector(pagina, `button:has-text("${grupo.etiqueta}")`);
  await esperarPantalla(pagina, 'camino');
  resultado.avanceAntes = await pagina.locator('[data-nodo][data-estado="hecho"]').count();
  if (!ABIERTA || PANTALLA === 'inicio') {
    await tocarBoton(pagina, 'Cambiar de grupo');
    await esperarPantalla(pagina, 'grupos');
    await pagina.goto(URL_JUEGO);
    await esperarPantalla(pagina, 'inicio');
    await pagina.waitForLoadState('load');
  } else if (PANTALLA === 'leccion') {
    // Una lección ya hecha se puede volver a jugar: así se entra a una a media lección.
    await pagina.locator('[data-nodo^="leccion:"][data-estado="hecho"]').first().click({ force: true });
    await esperarPantalla(pagina, 'leccion');
  }
  resultado.swAnterior = await estadoSw();
  console.log(`Versión anterior lista: ${resultado.versionAnterior}, service worker ${JSON.stringify(resultado.swAnterior)}, grupo "${grupo.etiqueta}" con ${resultado.avanceAntes} paradas hechas.`);

  if (ABIERTA) {
    // 2b. La pestaña sigue abierta en `PANTALLA` cuando se publica la versión nueva.
    estado.carpeta = DESPUES;
    resultado.abierta = PANTALLA;
    let recargas = 0;
    pagina.on('framenavigated', (f) => f === pagina.mainFrame() && recargas++);
    console.log(`Versión nueva publicada con la pestaña abierta en "${PANTALLA}". Se espera un minuto y se vuelve a la pestaña…`);
    await pagina.waitForTimeout(62000);
    await pagina.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
    const tVolver = Date.now();
    const limiteS = PANTALLA === 'leccion' ? 25 : 60;
    const linea = [];
    let ultima = '';
    while (Date.now() - tVolver < limiteS * 1000) {
      const v = await version().catch(() => '(recargando)');
      const s = await estadoSw().catch(() => null);
      const ahora = `${v} · ${s ? `controla=${s.controla} activo=${s.activo} esperando=${s.esperando} instalando=${s.instalando} precache=${s.precache}` : '…'} · recargas=${recargas}`;
      if (ahora !== ultima) {
        ultima = ahora;
        linea.push(`${((Date.now() - tVolver) / 1000).toFixed(1)} s: ${ahora}`);
      }
      if (PANTALLA !== 'leccion' && recargas > 0 && v !== resultado.versionAnterior && v !== '(recargando)') break;
      await pagina.waitForTimeout(500);
    }
    for (const l of linea) console.log(`  ${l}`);
    if (PANTALLA === 'leccion') {
      resultado.recargoAMediaLeccion = recargas > 0;
      console.log(resultado.recargoAMediaLeccion ? 'FALLA: recargó a media lección.' : 'A media lección no recargó (bien). Se sale de la lección…');
      await tocarBoton(pagina, 'Salir');
      await tocarBoton(pagina, /Sí, salir/);
      const tSalir = Date.now();
      while (Date.now() - tSalir < 30000 && !(recargas > 0 && (await version().catch(() => '')) !== resultado.versionAnterior)) await pagina.waitForTimeout(500);
      resultado.recargaTrasSalirS = recargas > 0 ? Number(((Date.now() - tSalir) / 1000).toFixed(1)) : null;
    }
    if (recargas > 0) await esperar(async () => ['inicio', 'camino', 'grupos'].includes(await pagina.evaluate(() => document.querySelector('[data-pantalla]')?.dataset.pantalla)), 60, 'que termine de recargar');
    resultado.versionFinal = await version();
    resultado.swFinal = await estadoSw();
    resultado.recargaSolaS = recargas > 0 && resultado.versionFinal !== resultado.versionAnterior ? Number(((Date.now() - tVolver) / 1000).toFixed(1)) : null;
    resultado.tomaElControlSola = resultado.versionFinal !== resultado.versionAnterior && !resultado.recargoAMediaLeccion;
    console.log(resultado.tomaElControlSola ? `Se recargó sola a ${resultado.versionFinal} a los ${resultado.recargaSolaS} s de volver a la pestaña${resultado.recargaTrasSalirS !== null && resultado.recargaTrasSalirS !== undefined ? ` (${resultado.recargaTrasSalirS} s después de salir de la lección)` : ''}.` : `Se queda en ${resultado.versionFinal}; service worker ${JSON.stringify(resultado.swFinal)}.`);
    if (resultado.tomaElControlSola) {
      // El grupo y su avance siguen ahí. (La recarga lleva al inicio: se espera a que termine de entrar.)
      const pantallaAhora = await pagina.evaluate(() => document.querySelector('[data-pantalla]')?.dataset.pantalla);
      await esperarPantalla(pagina, pantallaAhora);
      if (pantallaAhora !== 'camino') {
        if (pantallaAhora === 'inicio') {
          await tocarBoton(pagina, /¡Jugar!/);
          await esperarPantalla(pagina, 'grupos');
        }
        await tocarSelector(pagina, `button:has-text("${grupo.etiqueta}")`);
        await esperarPantalla(pagina, 'camino');
      }
      resultado.avanceDespues = await pagina.locator('[data-nodo][data-estado="hecho"]').count();
      console.log(`Grupo "${grupo.etiqueta}" en la versión nueva: ${resultado.avanceDespues} paradas hechas (antes ${resultado.avanceAntes}).`);
    }
    resultado.erroresDePagina = errores;
    await navegador.close();
    servidor.close();
    console.log(JSON.stringify(resultado));
    process.exit(!DIAGNOSTICO && (!resultado.tomaElControlSola || resultado.avanceDespues !== resultado.avanceAntes || errores.length) ? 1 : 0);
  }
  // La laptop se cierra con la versión anterior guardada.
  await pagina.close();

  // 2. Se publica la versión nueva en la misma dirección (con la laptop cerrada) y se vuelve a abrir el link.
  estado.carpeta = DESPUES;
  pagina = await contexto.newPage();
  pagina.setDefaultTimeout(60000);
  vigilarErrores(pagina);
  // Se cuentan las navegaciones DESPUÉS de la primera (la de abrir el link): cualquier otra es el juego
  // recargándose solo. Lo que se ve "al abrir" se lee en cuanto llega el documento, antes de esperar nada.
  let recargas = -1;
  pagina.on('framenavigated', (f) => f === pagina.mainFrame() && recargas++);
  const t0 = Date.now();
  await pagina.goto(URL_JUEGO, { waitUntil: 'commit' });
  resultado.alAbrir = await version();
  resultado.swAlAbrir = await estadoSw();
  await esperarPantalla(pagina, 'inicio');
  console.log(`Al abrir con la nueva publicada se ve: ${resultado.alAbrir} (${resultado.alAbrir === resultado.versionAnterior ? 'la ANTERIOR, servida por su service worker' : 'la nueva'}); service worker ${JSON.stringify(resultado.swAlAbrir)}.`);

  // 3. ¿La nueva toma el control sola y el juego se recarga a la nueva? (Lo que pase en 60 s, cada medio segundo.)
  const linea = [];
  let ultima = '';
  while (Date.now() - t0 < 60000) {
    const v = await version().catch(() => '(recargando)');
    const s = await estadoSw().catch(() => null);
    const ahora = `${v} · ${s ? `controla=${s.controla} activo=${s.activo} esperando=${s.esperando} instalando=${s.instalando} precache=${s.precache}` : '…'} · recargas=${recargas}`;
    if (ahora !== ultima) {
      ultima = ahora;
      linea.push(`${((Date.now() - t0) / 1000).toFixed(1)} s: ${ahora}`);
    }
    if (recargas > 0 && v !== resultado.versionAnterior && v !== '(recargando)') break;
    await pagina.waitForTimeout(500);
  }
  for (const l of linea) console.log(`  ${l}`);
  if (recargas > 0) await esperarPantalla(pagina, 'inicio');
  resultado.versionFinal = await version();
  resultado.swFinal = await estadoSw();
  resultado.recargaSolaS = recargas > 0 && resultado.versionFinal !== resultado.versionAnterior ? Number(((Date.now() - t0) / 1000).toFixed(1)) : null;
  resultado.tomaElControlSola = resultado.versionFinal !== resultado.versionAnterior;
  console.log(resultado.tomaElControlSola ? `La nueva tomó el control sola: el juego quedó en ${resultado.versionFinal}${resultado.recargaSolaS !== null ? ` recargándose a los ${resultado.recargaSolaS} s de abrir` : ' sin recargar'}.` : `Se queda en ${resultado.versionFinal}; service worker ${JSON.stringify(resultado.swFinal)}.`);

  // Lo que haría una persona si se queda la vieja: cerrar las pestañas y volver a abrir.
  if (!resultado.tomaElControlSola) {
    await pagina.close();
    pagina = await contexto.newPage();
    await pagina.goto(URL_JUEGO);
    await esperarPantalla(pagina, 'inicio');
    resultado.trasCerrarPestanas = await version();
    console.log(`Tras cerrar la pestaña y volver a abrir: ${resultado.trasCerrarPestanas}.`);
  } else {
    // 4. El grupo y su avance siguen ahí.
    await tocarBoton(pagina, /¡Jugar!/);
    await esperarPantalla(pagina, 'grupos');
    await tocarSelector(pagina, `button:has-text("${grupo.etiqueta}")`);
    await esperarPantalla(pagina, 'camino');
    resultado.avanceDespues = await pagina.locator('[data-nodo][data-estado="hecho"]').count();
    console.log(`Grupo "${grupo.etiqueta}" en la versión nueva: ${resultado.avanceDespues} paradas hechas (antes ${resultado.avanceAntes}).`);
  }
  resultado.erroresDePagina = errores;
} finally {
  await navegador.close();
  servidor.close();
}
console.log(JSON.stringify(resultado));
if (!DIAGNOSTICO && (!resultado.tomaElControlSola || resultado.avanceDespues !== resultado.avanceAntes || errores.length)) process.exit(1);
