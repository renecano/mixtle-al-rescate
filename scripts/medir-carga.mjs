// Mide cuánto tarda "¡Jugar!" → "¿Quién va a jugar?" en primera visita (sin caché, con service
// worker) y en la visita de regreso, con una red como el perfil "Slow 4G" de Chrome. También cuánto
// tarda el service worker en activarse y el juego en quedar "Listo para usar sin internet".
//
// Por qué no el throttling de DevTools/CDP: Network.emulateNetworkConditions se aplica a la página,
// pero no a lo que descarga el service worker (otro proceso), y el service worker es justo el que
// usaba la red en la primera visita. Aquí la red se limita en un proxy por el que pasa TODO el
// tráfico de Chrome (página y service worker): cada byte espera 281 ms de ida y 281 ms de vuelta
// (562 ms de ida y vuelta, como la latencia de "Slow 4G") y el ancho de banda total se reparte entre
// todas las conexiones: 1.44 Mbps de bajada y 675 kbps de subida. Al empezar se calibra: un archivo
// conocido bajado desde la página debe tardar lo que dice la red. (Que el service worker también
// pasa por el límite se vio midiendo: sus 22.7 MB tardaron ~18 min en pasar por el proxy.)
//
// Uso: npm run build && node scripts/medir-carga.mjs [--veces=3] [--salida=docs/mediciones/carga-despues.json]
//      [--dist=ruta]       servir otra carpeta construida (por ejemplo, la versión anterior)
//      [--url=https://…]  medir un sitio publicado en lugar de la versión local
//      [--solo-primera]   solo la primera visita (sin esperar al service worker ni a la descarga)
//      [--sin-calibrar]
// Cada corrida se agrega al archivo de salida en cuanto termina. Un navegador headless a la vez
// (laptop de 8 GB); si la memoria libre baja de ~1.5 GB, se para y guarda lo medido.
import { chromium } from '@playwright/test';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import http from 'node:http';
import net from 'node:net';
import { preview } from 'vite';
import { fragmento, grupoEnParada } from './demo/sembrar.mjs';

const arg = (n, def) => process.argv.find((a) => a.startsWith(`--${n}=`))?.split('=').slice(1).join('=') ?? def;
const VECES = Number(arg('veces', 3));
const SALIDA = arg('salida', null);
/** Solo la primera visita (la siguiente espera a que el service worker termine de instalarse). */
const SOLO_PRIMERA = process.argv.includes('--solo-primera');
/**
 * Además, abrir la primera lección: con un grupo recién creado (sembrado por la URL), del camino se toca
 * la primera lección y se mide hasta que el primer ejercicio está en pantalla y hasta que Mixtle se oye.
 */
const LECCION = process.argv.includes('--leccion');
/**
 * Con --leccion: tocar la lección cuando la descarga para jugar sin internet ya va a la mitad (como
 * en un aparato recién actualizado, el caso que se vio lento), en lugar de en cuanto se llega al camino.
 */
const CON_DESCARGA = process.argv.includes('--con-descarga');

/**
 * La versión local se sirve como http://mixtle.prueba:4310 (el proxy la resuelve a 127.0.0.1) y no
 * como localhost: Chrome manda lo de localhost directo, sin proxy, y lo del service worker se saltaba
 * el límite aunque se quitara esa excepción (lo detectó la calibración). Con
 * --unsafely-treat-insecure-origin-as-secure, el service worker funciona igual que en https.
 */
const HOST_LOCAL = 'mixtle.prueba';

/** Perfil "Slow 4G" de Chrome: 562.5 ms de latencia, 1.44 Mbps de bajada, 675 kbps de subida. */
export const SLOW_4G = { latenciaMs: 562.5, bajadaBps: (1.44e6 / 8) | 0, subidaBps: (675e3 / 8) | 0 };

/** Un sentido del enlace, compartido por todas las conexiones: cola por ancho de banda + retraso fijo. */
class Sentido {
  constructor(bytesPorSegundo, retrasoMs) {
    this.bps = bytesPorSegundo;
    this.retraso = retrasoMs;
    this.libreEn = 0;
    this.bytes = 0;
  }
  /** En cuántos ms debe entregarse este trozo (en orden, nunca antes que el anterior). */
  turno(bytes) {
    const ahora = performance.now();
    const empieza = Math.max(ahora, this.libreEn);
    this.libreEn = empieza + (bytes / this.bps) * 1000;
    this.bytes += bytes;
    return this.libreEn - ahora + this.retraso;
  }
}

/**
 * Entrega a un destino (socket o respuesta) en orden: cada trozo a su hora y el cierre siempre después
 * del último trozo. Con un temporizador por trozo, Node redondea los tiempos y el cierre podía ganarle
 * al último trozo (respuestas cortadas: ERR_CONTENT_LENGTH_MISMATCH).
 */
class Entregador {
  constructor(destino) {
    this.destino = destino;
    this.cola = [];
    this.reloj = null;
  }
  poner(cuando, trozo) {
    const ultimo = this.cola.at(-1)?.cuando ?? 0;
    this.cola.push({ cuando: Math.max(cuando, ultimo), trozo });
    this.programar();
  }
  cerrar() {
    this.poner(performance.now(), null);
  }
  programar() {
    if (this.reloj || !this.cola.length) return;
    this.reloj = setTimeout(() => {
      this.reloj = null;
      while (this.cola.length && this.cola[0].cuando <= performance.now() + 1) {
        const { trozo } = this.cola.shift();
        if (this.destino.destroyed) return;
        if (trozo === null) this.destino.end();
        else this.destino.write(trozo);
      }
      this.programar();
    }, Math.max(0, this.cola[0].cuando - performance.now()));
  }
}

const INICIO = performance.now();

function crearProxy() {
  const bajada = new Sentido(SLOW_4G.bajadaBps, SLOW_4G.latenciaMs / 2);
  const subida = new Sentido(SLOW_4G.subidaBps, SLOW_4G.latenciaMs / 2);
  const ahora = () => performance.now();
  const unir = (cliente, servidor) => {
    const alServidor = new Entregador(servidor);
    const alCliente = new Entregador(cliente);
    cliente.on('data', (t) => alServidor.poner(ahora() + subida.turno(t.length), t));
    servidor.on('data', (t) => alCliente.poner(ahora() + bajada.turno(t.length), t));
    cliente.on('end', () => alServidor.cerrar());
    servidor.on('end', () => alCliente.cerrar());
    cliente.on('error', () => servidor.destroy());
    servidor.on('error', () => cliente.destroy());
  };
  const proxy = http.createServer((req, res) => {
    // Pedido HTTP normal a través del proxy (la versión local).
    const destino = new URL(req.url);
    if (process.env.REGISTRO_RED) console.log(`  red ${((performance.now() - INICIO) / 1000).toFixed(1)} s ${req.method} ${destino.pathname}${destino.search}`);
    const sale = http.request({ host: destino.hostname === HOST_LOCAL ? '127.0.0.1' : destino.hostname, port: destino.port || 80, path: destino.pathname + destino.search, method: req.method, headers: req.headers }, (r) => {
      // La respuesta tarda lo que la ida y vuelta; el cuerpo, lo que el ancho de banda compartido.
      setTimeout(() => {
        res.writeHead(r.statusCode, r.headers);
        const alCliente = new Entregador(res);
        r.on('data', (t) => alCliente.poner(ahora() + bajada.turno(t.length), t));
        r.on('end', () => alCliente.cerrar());
      }, SLOW_4G.latenciaMs);
    });
    sale.on('error', () => res.destroy());
    req.pipe(sale);
  });
  // HTTPS (producción): un túnel, con la red limitada byte por byte en los dos sentidos.
  proxy.on('connect', (req, cliente, cabeza) => {
    const [host, puerto] = req.url.split(':');
    const servidor = net.connect(Number(puerto) || 443, host, () => {
      cliente.write('HTTP/1.1 200 Connection Established\r\n\r\n');
      if (cabeza?.length) servidor.write(cabeza);
      unir(cliente, servidor);
    });
    servidor.on('error', () => cliente.destroy());
  });
  return { proxy, bajada };
}

/** Sondas dentro de la página: cuándo se toca "¡Jugar!", cuándo aparece Grupos, cuándo suena la música. */
const SONDAS = () => {
  const c = (window.__carga = { inicioListo: null, jugar: null, gruposMontado: null, gruposVisible: null, musica: null, tocarLeccion: null, ejercicioVisible: null, narrando: null });
  const audios = (window.__audiosCarga = []);
  const play = HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play = function (...a) {
    audios.push(this);
    return play.apply(this, a);
  };
  const musicaSonando = () =>
    audios.some((a) => a.loop && !a.paused && a.currentTime > 0) ||
    (window.Howler?._howls ?? []).some((h) => h._loop && h.playing() && Number(h.seek()) > 0);
  document.addEventListener(
    'pointerdown',
    (e) => {
      if (!c.jugar && e.target.closest?.('button')?.textContent?.includes('¡Jugar!')) c.jugar = performance.now();
      if (!c.tocarLeccion && e.target.closest?.('[data-nodo^="leccion:"]')) c.tocarLeccion = performance.now();
    },
    true,
  );
  const vigilar = () => {
    const t = performance.now();
    if (!c.inicioListo && document.querySelector('[data-pantalla="inicio"][data-entrada-lista="true"]')) c.inicioListo = t;
    if (c.jugar && !c.gruposMontado && [...document.querySelectorAll('h1,h2')].some((h) => h.textContent.includes('¿Quién va a jugar?'))) c.gruposMontado = t;
    if (c.gruposMontado && !c.gruposVisible && !document.querySelector('.transicion-marca')) c.gruposVisible = t;
    if (c.jugar && !c.musica && musicaSonando()) c.musica = t;
    if (c.tocarLeccion && !c.ejercicioVisible && document.querySelector('[data-pantalla="leccion"] [data-ejercicio-id]')) c.ejercicioVisible = t;
    if (c.ejercicioVisible && !c.narrando && window.__mixtle?.narrando?.()) c.narrando = t;
    requestAnimationFrame(vigilar);
  };
  requestAnimationFrame(vigilar);
};

const ms = (a, b) => (a != null && b != null ? Math.round(b - a) : null);

/** Una visita: espera a que el inicio esté listo (lo que vería una persona), toca "¡Jugar!" y mide. */
async function visita(pagina, url) {
  const t0 = Date.now();
  await pagina.goto(url, { waitUntil: 'commit', timeout: 120000 });
  await pagina.waitForFunction(() => window.__carga?.inicioListo != null, null, { timeout: 120000, polling: 100 });
  const inicioListoS = (Date.now() - t0) / 1000;
  // El botón late (nunca está "quieto" para Playwright): se toca como lo haría una persona.
  await pagina.getByRole('button', { name: /¡Jugar!/ }).click({ timeout: 30000, force: true });
  await pagina.waitForFunction(() => window.__carga?.gruposVisible != null, null, { timeout: 120000, polling: 50 });
  await pagina.waitForFunction(() => window.__carga?.musica != null, null, { timeout: 20000, polling: 100 }).catch(() => undefined);
  if (LECCION) {
    // Elegir el grupo sembrado, y en el camino tocar la primera lección (la burbuja late: se toca como una persona).
    // Antes de cada toque se espera a que la transición de marca termine: su panel tapa los toques.
    const sinTransicion = () => pagina.waitForFunction(() => !document.querySelector('.transicion-marca'), null, { timeout: 60000, polling: 50 });
    await sinTransicion();
    await pagina.locator(`button:has-text("${GRUPO_LECCION.etiqueta}")`).click({ timeout: 30000, force: true });
    await pagina.locator('[data-pantalla="camino"]').waitFor({ timeout: 60000 });
    await sinTransicion();
    if (CON_DESCARGA) {
      // Espera a que la descarga en segundo plano vaya en curso (ya guardó algo y le falta mucho).
      const t = Date.now();
      for (;;) {
        const n = await pagina.evaluate(async () => (await caches.has('mixtle-sin-internet')) ? (await (await caches.open('mixtle-sin-internet')).keys()).length : 0).catch(() => 0);
        if (n >= 20) break;
        if (Date.now() - t > 180000) throw new Error('La descarga en segundo plano no empezó en 3 min');
        await pagina.waitForTimeout(1000);
      }
      console.log(`  (descarga en curso: ${((Date.now() - t) / 1000).toFixed(0)} s después de llegar al camino)`);
    }
    await pagina.locator('[data-nodo^="leccion:"][data-estado="disponible"]').first().click({ timeout: 30000, force: true });
    await pagina.waitForFunction(() => window.__carga?.narrando != null, null, { timeout: 120000, polling: 50 }).catch(() => undefined);
  }
  const c = await pagina.evaluate(() => window.__carga);
  // Si la música no sonó, cómo quedó su <audio>. Ojo: en la primera visita, a través del proxy la
  // música no avanza nunca (se queda en el segundo 0 con todos sus datos), incluso con el proxy sin
  // limitar la red; sin proxy suena 0.6 s después del toque. Es un efecto de esta forma de medir, no
  // del juego: por eso jugarAMusicaMs de la primera visita no se usa como medida.
  const musicaEstado =
    c.musica == null
      ? await pagina.evaluate(
          () =>
            `ctx=${window.Howler?.ctx?.state ?? '-'} · ` +
            ((window.__audiosCarga ?? []).map((a) => `${(a.currentSrc || a.src || '(sin src)').slice(-40)} paused=${a.paused} t=${a.currentTime.toFixed(2)} ready=${a.readyState} net=${a.networkState} err=${a.error?.code ?? '-'}`).join('; ') || 'sin <audio>'),
        )
      : undefined;
  return {
    ...(musicaEstado ? { musicaEstado } : {}),
    inicioListoS: Number(inicioListoS.toFixed(1)),
    jugarAGruposMs: ms(c.jugar, c.gruposMontado),
    jugarAGruposSinCubiertaMs: ms(c.jugar, c.gruposVisible),
    jugarAMusicaMs: ms(c.jugar, c.musica),
    ...(LECCION ? { tocarLeccionAEjercicioMs: ms(c.tocarLeccion, c.ejercicioVisible), tocarLeccionANarrandoMs: ms(c.tocarLeccion, c.narrando) } : {}),
  };
}

/** El grupo recién creado con el que se abre la primera lección (lo siembra la URL en la primera visita). */
const GRUPO_LECCION = grupoEnParada(0);

/** ¿Queda poca memoria libre? (laptop de 8 GB: por debajo de ~1.5 GB se para y se guarda lo medido.) */
const MEMORIA_MINIMA = 1.5e9;
const memoriaBaja = () => os.freemem() < MEMORIA_MINIMA;
class MemoriaBaja extends Error {}
const revisarMemoria = () => {
  if (memoriaBaja()) throw new MemoriaBaja(`Memoria libre ${(os.freemem() / 1e9).toFixed(2)} GB (< 1.5 GB): se para y se guarda lo medido.`);
};

/** Espera (revisando la memoria) hasta que `listo()` diga que sí. Devuelve los segundos desde `desde`. */
async function esperar(listo, desde, que, limiteS = 1200) {
  let ultimoAviso = Date.now();
  for (;;) {
    revisarMemoria();
    if (await listo()) return Number(((Date.now() - desde) / 1000).toFixed(1));
    if ((Date.now() - desde) / 1000 > limiteS) return null;
    if (Date.now() - ultimoAviso > 30000) {
      ultimoAviso = Date.now();
      console.log(`  … ${que}: ${((Date.now() - desde) / 1000).toFixed(0)} s, ${(bajadaGlobal.bytes / 1e6).toFixed(1)} MB por el proxy, ${(os.freemem() / 1e9).toFixed(1)} GB libres`);
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
}

const servicioActivo = (p) => () => p.evaluate(async () => !!(await navigator.serviceWorker.getRegistration())?.active).catch(() => false);

/** ¿Ya está todo lo de sin-internet.json guardado con su revisión? (solo existe en la versión nueva) */
const listoSinInternet = (p, lista) => () =>
  p
    .evaluate(async (l) => {
      const cache = await caches.open('mixtle-sin-internet');
      let n = 0;
      for (const a of l) if ((await cache.match(new URL(a.ruta, location.href).href))?.headers.get('x-mixtle-rev') === a.rev) n++;
      return n === l.length;
    }, lista)
    .catch(() => false);

const DIST = arg('dist', null);
const local = !arg('url', null);
let servidor = null;
let URL_JUEGO = arg('url', null);
if (local) {
  servidor = await preview({
    build: DIST ? { outDir: DIST } : {},
    preview: { port: 4310, strictPort: true, host: '127.0.0.1', allowedHosts: [HOST_LOCAL] },
    logLevel: 'silent',
    // Las mismas cabeceras que vercel.json en producción: /assets/ es inmutable (nombres con huella),
    // así que el service worker toma de la caché del navegador lo que la página ya bajó.
    plugins: [
      {
        name: 'cabeceras-como-vercel',
        configurePreviewServer(s) {
          s.middlewares.use((req, res, next) => {
            if (req.url?.startsWith('/assets/')) res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
            next();
          });
        },
      },
    ],
  });
  URL_JUEGO = `http://${HOST_LOCAL}:4310/`;
}
const { proxy, bajada } = crearProxy();
const bajadaGlobal = bajada;
await new Promise((r) => proxy.listen(0, '127.0.0.1', r));
const PROXY = `http://127.0.0.1:${proxy.address().port}`;
// Headless y uno a la vez (laptop de 8 GB).
const lanzar = () =>
  chromium.launch({
    channel: 'chrome',
    headless: true,
    args: [`--proxy-server=${PROXY}`, ...(local ? [`--unsafely-treat-insecure-origin-as-secure=${URL_JUEGO.replace(/\/$/, '')}`] : [])],
  });

const mediana = (xs) => {
  const v = xs.filter((x) => x != null).sort((a, b) => a - b);
  return v.length ? v[Math.floor((v.length - 1) / 2)] : null;
};
// Si el archivo de salida ya existe, se le agregan las corridas nuevas (cada corrida se guarda al terminar).
const resultado =
  SALIDA && existsSync(SALIDA)
    ? JSON.parse(readFileSync(SALIDA, 'utf8'))
    : { url: URL_JUEGO, red: SLOW_4G, metodo: 'proxy que limita todo el tráfico de Chrome (página y service worker)', calibracion: {}, visitas: [] };
function guardar() {
  const campos = ['inicioListoS', 'jugarAGruposMs', 'jugarAGruposSinCubiertaMs', 'jugarAMusicaMs', 'tocarLeccionAEjercicioMs', 'tocarLeccionANarrandoMs'];
  resultado.mediana = {
    primera: Object.fromEntries(campos.map((m) => [m, mediana(resultado.visitas.map((v) => v.primera?.[m]))])),
    regreso: Object.fromEntries(campos.map((m) => [m, mediana(resultado.visitas.map((v) => v.regreso?.[m]))])),
    serviceWorkerActivoS: mediana(resultado.visitas.map((v) => v.serviceWorkerActivoS)),
    listoSinInternetS: mediana(resultado.visitas.map((v) => v.listoSinInternetS)),
  };
  resultado.actualizado = new Date().toISOString();
  if (SALIDA) writeFileSync(SALIDA, `${JSON.stringify(resultado, null, 2)}\n`);
}

let navegador = null;
try {
  // Calibración: un archivo conocido bajado desde la página debe tardar lo que dice la red.
  if (!process.argv.includes('--sin-calibrar')) {
    revisarMemoria();
    navegador = await lanzar();
    const p = await (await navegador.newContext()).newPage();
    await p.goto(URL_JUEGO, { waitUntil: 'commit', timeout: 120000 });
    const prueba = await p.evaluate(async () => {
      const t0 = performance.now();
      const r = await fetch('musica/tranquila.mp3', { cache: 'no-store' });
      const n = (await r.arrayBuffer()).byteLength;
      return { bytes: n, ms: Math.round(performance.now() - t0) };
    });
    const esperado = Math.round(SLOW_4G.latenciaMs + (prueba.bytes / SLOW_4G.bajadaBps) * 1000);
    resultado.calibracion.archivoDesdeLaPagina = { ...prueba, esperadoMs: esperado };
    console.log(`Calibración: ${prueba.bytes} bytes desde la página en ${prueba.ms} ms (la red dice ≥ ${esperado} ms).`);
    await navegador.close();
    navegador = null;
    guardar();
  }

  for (let i = 0; i < VECES; i++) {
    revisarMemoria();
    navegador = await lanzar();
    const contexto = await navegador.newContext({ viewport: { width: 1280, height: 800 } });
    await contexto.addInitScript(SONDAS);
    const p = await contexto.newPage();
    const t = Date.now();
    // Con --leccion, la URL siembra el grupo y lleva ?e2e (sin recorrido guiado, y con los ganchos de prueba).
    const urlPrimera = LECCION ? `${URL_JUEGO}?e2e&m=${i}${fragmento([GRUPO_LECCION])}` : URL_JUEGO;
    const urlRegreso = LECCION ? `${URL_JUEGO}?e2e&r=${i}` : URL_JUEGO;
    const corrida = { fecha: new Date().toISOString(), cabecerasComoVercel: true, leccion: LECCION, conDescarga: CON_DESCARGA, primera: await visita(p, urlPrimera) };
    console.log(`#${resultado.visitas.length + 1} primera visita:`, JSON.stringify(corrida.primera));
    if (!SOLO_PRIMERA) {
      corrida.serviceWorkerActivoS = await esperar(servicioActivo(p), t, 'esperando a que se active el service worker');
      console.log(`  service worker activo a los ${corrida.serviceWorkerActivoS} s`);
      const lista = await p.evaluate(async () => (await fetch('sin-internet.json', { cache: 'no-store' })).json()).catch(() => null);
      if (lista) {
        corrida.listoSinInternetS = await esperar(listoSinInternet(p, lista), t, 'esperando "Listo para usar sin internet"');
        corrida.bytesSinInternet = lista.reduce((n, a) => n + a.bytes, 0);
        console.log(`  listo para usar sin internet a los ${corrida.listoSinInternetS} s (${(corrida.bytesSinInternet / 1e6).toFixed(1)} MB)`);
      }
      await p.waitForTimeout(1500);
      corrida.regreso = await visita(p, urlRegreso);
      console.log('  visita de regreso:', JSON.stringify(corrida.regreso));
    }
    resultado.visitas.push(corrida);
    guardar();
    await navegador.close();
    navegador = null;
  }
} catch (e) {
  if (!(e instanceof MemoriaBaja)) throw e;
  console.log(`MEMORIA BAJA: ${e.message}`);
  process.exitCode = 3;
} finally {
  guardar();
  await navegador?.close().catch(() => undefined);
  proxy.close();
  servidor?.httpServer.close();
}
console.log('Mediana:', JSON.stringify(resultado.mediana));
