import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { archivosEsenciales, listaSinInternet } from '../scripts/lista-sin-internet.mjs';
import { CABECERA_REVISION, descargar, porcentaje, SIMULTANEAS, type ArchivoSinInternet, type EstadoDescarga } from '../src/servicios/sinInternet';

const BASE = 'https://mixtle.test/';
const url = (ruta: string) => BASE + ruta;

/** Una caché en memoria con la misma forma que Cache Storage. */
function cacheFalsa(inicial: Record<string, string | null> = {}) {
  const datos = new Map<string, Response>();
  for (const [ruta, rev] of Object.entries(inicial)) datos.set(url(ruta), new Response('viejo', { headers: rev ? { [CABECERA_REVISION]: rev } : {} }));
  return {
    datos,
    keys: async () => [...datos.keys()].map((u) => new Request(u)),
    match: async (p: Request | string) => datos.get(typeof p === 'string' ? p : p.url)?.clone(),
    put: async (p: Request | string, r: Response) => void datos.set(typeof p === 'string' ? p : p.url, r),
    delete: async (p: Request | string) => datos.delete(typeof p === 'string' ? p : p.url),
  };
}

const LISTA: ArchivoSinInternet[] = [
  { ruta: 'musica/tranquila.mp3', bytes: 500, rev: 'm1' },
  { ruta: 'voz/a.mp3', bytes: 100, rev: 'a1' },
  { ruta: 'voz/b.mp3', bytes: 100, rev: 'b1' },
  { ruta: 'sonidos/toque.mp3', bytes: 50, rev: 't1' },
  { ruta: 'voz/c.mp3', bytes: 100, rev: 'c1' },
  { ruta: 'assets/Leccion-abc.js', bytes: 30, rev: 'l1' },
];
const TOTAL = 880;

/** La red falsa: cuenta cuántas descargas van a la vez y en qué orden se pidieron. */
function redFalsa(op: { fallaEn?: string } = {}) {
  let aLaVez = 0;
  const red = { pedidos: [] as string[], urls: [] as string[], maximoALaVez: 0 };
  const traer = async (u: string) => {
    red.urls.push(u);
    red.pedidos.push(u.replace(BASE, '').replace(/\?.*$/, ''));
    aLaVez++;
    red.maximoALaVez = Math.max(red.maximoALaVez, aLaVez);
    await new Promise((r) => setTimeout(r, 1));
    aLaVez--;
    if (op.fallaEn && u.replace(/\?.*$/, '').endsWith(op.fallaEn)) throw new TypeError('Failed to fetch');
    return new Response(new Blob(['mp3']), { headers: { 'content-type': 'audio/mpeg', 'content-encoding': 'gzip' } });
  };
  return { red, traer };
}

describe('descarga para jugar sin internet', () => {
  it('baja varios a la vez (sin pasar de 4), primero el código, luego efectos y voces, y al final la música', async () => {
    const cache = cacheFalsa();
    const { red, traer } = redFalsa();
    const avances: EstadoDescarga[] = [];
    const fin = await descargar({ lista: LISTA, cache, traer, url, alAvanzar: (e) => avances.push(e) });
    expect(fin).toEqual({ fase: 'listo', bytesListos: TOTAL, bytesTotales: TOTAL });
    expect(red.maximoALaVez).toBeGreaterThan(1);
    expect(red.maximoALaVez).toBeLessThanOrEqual(SIMULTANEAS);
    expect(red.pedidos[0]).toBe('assets/Leccion-abc.js');
    expect(red.pedidos.at(-1)).toBe('musica/tranquila.mp3');
    expect(cache.datos.size).toBe(LISTA.length);
    // El avance solo sube y termina en 100 %.
    const porcentajes = avances.map(porcentaje);
    expect([...porcentajes].sort((a, b) => a - b)).toEqual(porcentajes);
    expect(porcentajes.at(-1)).toBe(100);
  });

  it('guarda cada archivo con su revisión y sin "content-encoding" (el cuerpo ya viene sin comprimir)', async () => {
    const cache = cacheFalsa();
    await descargar({ lista: LISTA, cache, traer: redFalsa().traer, url });
    const r = cache.datos.get(url('voz/a.mp3'))!;
    expect(r.headers.get(CABECERA_REVISION)).toBe('a1');
    expect(r.headers.get('content-encoding')).toBeNull();
    expect(r.headers.get('content-type')).toBe('audio/mpeg');
  });

  it('solo baja lo nuevo o lo que cambió, y borra lo que ya no se usa', async () => {
    // a está al día; b cambió (otra voz); "viejo" ya no está en la lista; uno guardado sin revisión se vuelve a bajar.
    const cache = cacheFalsa({ 'voz/a.mp3': 'a1', 'voz/b.mp3': 'b0', 'voz/viejo.mp3': 'v1', 'voz/c.mp3': null });
    const { red, traer } = redFalsa();
    await descargar({ lista: LISTA, cache, traer, url });
    expect(red.pedidos.sort()).toEqual(['assets/Leccion-abc.js', 'musica/tranquila.mp3', 'sonidos/toque.mp3', 'voz/b.mp3', 'voz/c.mp3']);
    expect(cache.datos.has(url('voz/viejo.mp3'))).toBe(false);
    expect(cache.datos.get(url('voz/b.mp3'))!.headers.get(CABECERA_REVISION)).toBe('b1');
  });

  it('si ya está todo, no baja nada y dice "listo" de inmediato', async () => {
    const cache = cacheFalsa(Object.fromEntries(LISTA.map((a) => [a.ruta, a.rev])));
    const traer = vi.fn();
    expect(await descargar({ lista: LISTA, cache, traer, url })).toEqual({ fase: 'listo', bytesListos: TOTAL, bytesTotales: TOTAL });
    expect(traer).not.toHaveBeenCalled();
  });

  it('si se cae la red, para y dice "sin-conexion"; lo bajado se queda y la siguiente vez sigue', async () => {
    const cache = cacheFalsa();
    const fin = await descargar({ lista: LISTA, cache, traer: redFalsa({ fallaEn: 'voz/b.mp3' }).traer, url, simultaneas: 1 });
    expect(fin.fase).toBe('sin-conexion');
    expect(fin.bytesListos).toBeLessThan(fin.bytesTotales);
    const guardados = cache.datos.size;
    expect(guardados).toBeGreaterThan(0);
    const { red, traer } = redFalsa();
    expect((await descargar({ lista: LISTA, cache, traer, url })).fase).toBe('listo');
    expect(red.pedidos).toHaveLength(LISTA.length - guardados);
  });

  it('pide cada archivo con ?rev=… (así el service worker no responde con una copia vieja) y lo guarda sin el ?rev', async () => {
    const cache = cacheFalsa();
    const { red, traer } = redFalsa();
    await descargar({ lista: LISTA, cache, traer, url });
    expect(red.urls).toContain(`${BASE}voz/b.mp3?rev=b1`);
    expect(red.urls.every((u) => /\?rev=\w+$/.test(u))).toBe(true);
    expect([...cache.datos.keys()].every((u) => !u.includes('?'))).toBe(true);
  });

  it('antes de cada archivo espera su turno (la pausa al cambiar de pantalla)', async () => {
    const turnos: number[] = [];
    let abierta = false;
    const esperarTurno = async () => {
      turnos.push(Date.now());
      // La primera vez, como si la pantalla acabara de cambiar: no se pide nada mientras tanto.
      if (!abierta) await new Promise((r) => setTimeout(r, 20));
      abierta = true;
    };
    const { red, traer } = redFalsa();
    await descargar({ lista: LISTA, cache: cacheFalsa(), traer, url, esperarTurno, simultaneas: 1 });
    expect(turnos.length).toBe(LISTA.length + 1);
    expect(red.pedidos).toHaveLength(LISTA.length);
  });

  it('el porcentaje no llega a 100 antes de terminar', () => {
    expect(porcentaje({ bytesListos: 0, bytesTotales: 0 })).toBe(0);
    expect(porcentaje({ bytesListos: 999, bytesTotales: 1000 })).toBe(99);
    expect(porcentaje({ bytesListos: 1000, bytesTotales: 1000 })).toBe(100);
  });
});

describe('la lista para jugar sin internet (sin-internet.json)', () => {
  it('tiene los mp3 de efectos, voces y música con su tamaño y una revisión que cambia con el contenido', () => {
    const dir = mkdtempSync(join(tmpdir(), 'mixtle-lista-'));
    for (const c of ['sonidos', 'voz', 'musica']) mkdirSync(join(dir, c));
    writeFileSync(join(dir, 'voz', 'a.mp3'), 'uno');
    writeFileSync(join(dir, 'voz', 'b.mp3'), 'dos');
    writeFileSync(join(dir, 'voz', 'manifiesto.json'), '{}');
    writeFileSync(join(dir, 'musica', 'tranquila.mp3'), 'musica');
    const lista = listaSinInternet(dir);
    expect(lista.map((a) => a.ruta)).toEqual(['voz/a.mp3', 'voz/b.mp3', 'musica/tranquila.mp3']);
    expect(lista[0]).toMatchObject({ bytes: 3 });
    expect(lista[0]!.rev).not.toBe(lista[1]!.rev);
    writeFileSync(join(dir, 'voz', 'a.mp3'), 'otro');
    expect(listaSinInternet(dir)[0]!.rev).not.toBe(lista[0]!.rev);
  });

  it('incluye el código que no va en el precache y las imágenes, con su revisión', () => {
    const dir = mkdtempSync(join(tmpdir(), 'mixtle-lista-'));
    mkdirSync(join(dir, 'iconos'));
    writeFileSync(join(dir, 'iconos', 'icono-192.png'), 'png');
    const lista = listaSinInternet(dir, [{ ruta: 'assets/phaser-x.js', contenido: 'código' }]);
    expect(lista.map((a) => a.ruta)).toEqual(['assets/phaser-x.js', 'iconos/icono-192.png']);
    expect(lista[0]!.bytes).toBe(Buffer.byteLength('código'));
  });

  it('lo esencial (precache) es el código del inicio con sus importaciones, Grupos y Camino, el CSS y las fuentes', () => {
    const chunk = (fileName: string, extra: Record<string, unknown> = {}) => ({ type: 'chunk', fileName, imports: [], ...extra });
    const paquete = {
      a: chunk('assets/index-1.js', { isEntry: true, imports: ['assets/react-1.js'], viteMetadata: { importedCss: new Set(['assets/index-1.css']), importedAssets: new Set() } }),
      b: chunk('assets/react-1.js'),
      c: chunk('assets/Grupos-1.js', { facadeModuleId: '/src/app/pantallas/Grupos.tsx', imports: ['assets/MascotaVestida-1.js'] }),
      d: chunk('assets/MascotaVestida-1.js'),
      e: chunk('assets/Camino-1.js', { facadeModuleId: '/src/app/pantallas/Camino.tsx' }),
      f: chunk('assets/phaser-1.js'),
      g: chunk('assets/Leccion-1.js', { facadeModuleId: '/src/app/pantallas/Leccion.tsx' }),
      h: { type: 'asset', fileName: 'assets/nunito-1.woff2' },
      i: { type: 'asset', fileName: 'assets/nunito-1.woff' },
      j: { type: 'asset', fileName: 'assets/index-1.css' },
    };
    const e = archivosEsenciales(paquete);
    for (const f of ['index.html', 'assets/index-1.js', 'assets/react-1.js', 'assets/index-1.css', 'assets/Grupos-1.js', 'assets/MascotaVestida-1.js', 'assets/Camino-1.js', 'assets/nunito-1.woff2']) expect(e).toContain(f);
    for (const f of ['assets/phaser-1.js', 'assets/Leccion-1.js', 'assets/nunito-1.woff']) expect(e).not.toContain(f);
  });

  it('la lista del juego tiene todas las voces del manifiesto, los 22 efectos y las 3 pistas', async () => {
    const lista = listaSinInternet(join(process.cwd(), 'public'));
    const { readFileSync } = await import('node:fs');
    const manifiesto = JSON.parse(readFileSync(join(process.cwd(), 'public', 'voz', 'manifiesto.json'), 'utf8')) as { frases: Record<string, unknown> };
    const rutas = new Set(lista.map((a) => a.ruta));
    for (const archivo of Object.keys(manifiesto.frases)) expect(rutas).toContain(`voz/${archivo}`);
    expect(lista.filter((a) => a.ruta.startsWith('sonidos/'))).toHaveLength(22);
    expect(lista.filter((a) => a.ruta.startsWith('musica/'))).toHaveLength(3);
    // Calcula la huella de ~36 MB de audio: tarda más que el límite normal de una prueba.
  }, 60000);
});
