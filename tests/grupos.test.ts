import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useGrupos, usarAlmacen } from '../src/app/estado/grupos';
import { UNIDADES } from '../src/contenido/unidades';
import { COLORES_GRUPO, gruposValidos, limpiarEtiqueta, MASCOTAS, nombreDelGrupo, nuevoGrupo } from '../src/logica/grupos';
import { almacenEnMemoria, almacenIndexedDb, type Almacen } from '../src/servicios/almacen';

beforeEach(() => {
  useGrupos.setState({ grupos: [], actualId: null, cargado: false, guardadoOk: true });
});

/** Espera a que terminen los guardados pendientes (son asíncronos). */
const esperar = () => new Promise((r) => setTimeout(r, 20));

describe('grupos', () => {
  it('la etiqueta es corta y sin símbolos raros', () => {
    expect(limpiarEtiqueta('1°A')).toBe('1°A');
    expect(limpiarEtiqueta('  3ro B <script>')).toBe('3ro B sc');
    expect(limpiarEtiqueta('Grupo de la tarde').length).toBeLessThanOrEqual(8);
    expect(limpiarEtiqueta('😀👍')).toBe('');
  });

  it('el nombre del grupo es su animal y su etiqueta: nunca nombres de niños', () => {
    const g = nuevoGrupo({ mascota: 'ajolote', color: COLORES_GRUPO[0], etiqueta: '2°B' }, 'x', 0);
    expect(nombreDelGrupo(g)).toBe('Ajolote 2°B');
    expect(nombreDelGrupo({ ...g, etiqueta: '' })).toBe('Ajolote');
    expect(Object.keys(g).sort()).toEqual(['color', 'creado', 'desbloquearTodo', 'etiqueta', 'id', 'mascota', 'progreso']);
  });

  it('hay al menos 6 mascotas de fauna local y 6 colores con contraste para texto blanco', () => {
    expect(MASCOTAS.length).toBeGreaterThanOrEqual(6);
    const lum = (hex: string) => {
      const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
      return 0.2126 * c[0]! + 0.7152 * c[1]! + 0.0722 * c[2]!;
    };
    for (const c of COLORES_GRUPO) expect(1.05 / (lum(c) + 0.05), c).toBeGreaterThanOrEqual(4.5);
  });

  it('descarta datos dañados del almacenamiento en lugar de romper la app', () => {
    const bueno = nuevoGrupo({ mascota: 'colibri', color: COLORES_GRUPO[1], etiqueta: '' }, 'a', 0);
    expect(gruposValidos([bueno, null, { id: 3 }, { ...bueno, mascota: 'dragón' }, 'texto'])).toEqual([bueno]);
    expect(gruposValidos('nada')).toEqual([]);
  });
});

describe('progreso por grupo, guardado en el dispositivo', () => {
  it('se guarda y se recupera por grupo', async () => {
    const almacen = almacenEnMemoria();
    usarAlmacen(almacen);
    const a = useGrupos.getState().crear({ mascota: 'colibri', color: COLORES_GRUPO[0], etiqueta: '1°A' });
    const b = useGrupos.getState().crear({ mascota: 'ardilla', color: COLORES_GRUPO[1], etiqueta: '1°B' });
    useGrupos.getState().elegir(a.id);
    useGrupos.getState().terminarLeccion('u1-l1', { hojitas: 14, aLaPrimera: 4 });
    useGrupos.getState().elegir(b.id);
    useGrupos.getState().abrirCofre('u1');
    await esperar();

    // "Otro día": se borra la memoria y se lee lo guardado.
    useGrupos.setState({ grupos: [], actualId: null, cargado: false });
    await useGrupos.getState().cargar();
    const [ga, gb] = useGrupos.getState().grupos;
    expect(ga!.progreso.lecciones['u1-l1']).toEqual({ hojitas: 14, aLaPrimera: 4, veces: 1 });
    expect(ga!.progreso.hojitas).toBe(14);
    expect(gb!.progreso.cofres).toEqual(['u1']);
    expect(gb!.progreso.lecciones).toEqual({});
  });

  it('funciona también con IndexedDB real (fake-indexeddb)', async () => {
    usarAlmacen(almacenIndexedDb);
    const g = useGrupos.getState().crear({ mascota: 'tlacuache', color: COLORES_GRUPO[2], etiqueta: '' });
    useGrupos.getState().terminarAventura(UNIDADES[0]!);
    await esperar();
    useGrupos.setState({ grupos: [], actualId: null, cargado: false });
    await useGrupos.getState().cargar();
    expect(useGrupos.getState().grupos.find((x) => x.id === g.id)?.progreso.estampas).toEqual([UNIDADES[0]!.estampa.id]);
  });

  it('si IndexedDB está bloqueado, la app sigue funcionando en memoria y lo avisa', async () => {
    const roto: Almacen = {
      leer: () => Promise.reject(new Error('bloqueado')).catch(() => undefined),
      guardar: () => Promise.resolve(false),
    };
    usarAlmacen(roto);
    await useGrupos.getState().cargar();
    expect(useGrupos.getState().cargado).toBe(true);
    const g = useGrupos.getState().crear({ mascota: 'monarca', color: COLORES_GRUPO[3], etiqueta: '' });
    useGrupos.getState().terminarLeccion('u1-l1', { hojitas: 12, aLaPrimera: 2 });
    await esperar();
    expect(useGrupos.getState().guardadoOk).toBe(false);
    expect(useGrupos.getState().grupos.find((x) => x.id === g.id)?.progreso.hojitas).toBe(12);
  });

  it('el almacén de IndexedDB nunca lanza aunque el navegador lo bloquee', async () => {
    // Módulo nuevo: sin conexión guardada de pruebas anteriores.
    vi.resetModules();
    const original = globalThis.indexedDB;
    Object.defineProperty(globalThis, 'indexedDB', {
      configurable: true,
      get() {
        throw new DOMException('bloqueado', 'SecurityError');
      },
    });
    try {
      const { almacenIndexedDb: fresco } = await import('../src/servicios/almacen');
      await expect(fresco.guardar([1])).resolves.toBe(false);
      await expect(fresco.leer()).resolves.toBeUndefined();
    } finally {
      Object.defineProperty(globalThis, 'indexedDB', { configurable: true, value: original });
    }
  });

  it('el modo facilitador reinicia un grupo y abre todas las lecciones', () => {
    usarAlmacen(almacenEnMemoria());
    const g = useGrupos.getState().crear({ mascota: 'ajolote', color: COLORES_GRUPO[4], etiqueta: '' });
    useGrupos.getState().terminarLeccion('u1-l1', { hojitas: 12, aLaPrimera: 2 });
    useGrupos.getState().desbloquearTodo(g.id, true);
    expect(useGrupos.getState().grupos[0]!.desbloquearTodo).toBe(true);
    useGrupos.getState().reiniciar(g.id);
    expect(useGrupos.getState().grupos[0]!.progreso.hojitas).toBe(0);
    expect(useGrupos.getState().grupos[0]!.desbloquearTodo).toBe(false);
  });
});
