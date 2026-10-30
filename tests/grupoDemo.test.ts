import { beforeEach, describe, expect, it } from 'vitest';
import { useGrupos, usarAlmacen } from '../src/app/estado/grupos';
import { UNIDADES } from '../src/contenido/unidades';
import { ACCESORIOS, hojitasDisponibles } from '../src/logica/accesorios';
import { estadosDelCamino, etapaParque, MAXIMOS_PARQUE, nodosDelCamino, unidadCompleta } from '../src/logica/camino';
import { ETIQUETA_DEMO, grupoDemo, progresoCompleto } from '../src/logica/demo';
import { datosDiplomaUnidad } from '../src/logica/diplomaUnidad';
import { COLORES_GRUPO, nombreDelGrupo } from '../src/logica/grupos';
import { almacenEnMemoria } from '../src/servicios/almacen';

/*
 * Grupo de demostración (modo facilitador): un grupo "Demo" como si hubiera terminado las 5 unidades,
 * para enseñar el juego completo sin jugarlo. No toca a los grupos reales y se borra como cualquiera.
 */

const HOY = '2026-10-29';
const esperar = () => new Promise((r) => setTimeout(r, 20));

beforeEach(() => {
  usarAlmacen(almacenEnMemoria());
  useGrupos.setState({ grupos: [], actualId: null, cargado: true, guardadoOk: true });
});

describe('el progreso de demostración', () => {
  const p = progresoCompleto(HOY);

  it('tiene todas las lecciones, cofres y aventuras hechos, y las 5 unidades completas', () => {
    const nodos = nodosDelCamino(UNIDADES);
    expect(estadosDelCamino(nodos, p).every((e) => e === 'hecho')).toBe(true);
    expect(UNIDADES.every((u) => unidadCompleta(u, p))).toBe(true);
  });

  it('tiene las 5 estampas y el parque lleno', () => {
    expect([...p.estampas].sort()).toEqual(UNIDADES.map((u) => u.estampa.id).sort());
    expect(etapaParque(p, UNIDADES)).toEqual({ avance: 1, basura: 0, arboles: MAXIMOS_PARQUE.arboles, flores: MAXIMOS_PARQUE.flores });
  });

  it('tiene hojitas para comprar todos los accesorios y los 5 diplomas disponibles', () => {
    expect(hojitasDisponibles(p)).toBeGreaterThanOrEqual(ACCESORIOS.reduce((s, a) => s + a.precio, 0));
    const g = grupoDemo('demo', 0, HOY);
    for (const u of UNIDADES) expect(datosDiplomaUnidad(g, u, new Date()), u.id).not.toBeNull();
  });

  it('el grupo se llama "Cacomixtle Demo" y no tiene nada desbloqueado a la fuerza', () => {
    const g = grupoDemo('demo', 123, HOY);
    expect(g.etiqueta).toBe(ETIQUETA_DEMO);
    expect(nombreDelGrupo(g)).toBe('Cacomixtle Demo');
    expect(COLORES_GRUPO).toContain(g.color);
    expect(g.desbloquearTodo).toBe(false);
    expect(g.creado).toBe(123);
  });
});

describe('crear y borrar el grupo de demostración', () => {
  it('se agrega sin tocar el avance de los grupos reales, queda elegido y se guarda', async () => {
    const real = useGrupos.getState().crear({ mascota: 'ardilla', color: COLORES_GRUPO[0], etiqueta: '2°B' });
    useGrupos.getState().elegir(real.id);
    useGrupos.getState().terminarLeccion('u1-l1', { hojitas: 14, aLaPrimera: 4 });
    const avanceReal = structuredClone(useGrupos.getState().grupos[0]!.progreso);

    const demo = useGrupos.getState().crearDemo();
    expect(demo.etiqueta).toBe(ETIQUETA_DEMO);
    expect(useGrupos.getState().grupos.map((g) => g.id)).toEqual([real.id, demo.id]);
    expect(useGrupos.getState().actualId).toBe(demo.id);
    expect(useGrupos.getState().grupos[0]!.progreso).toEqual(avanceReal);

    await esperar();
    useGrupos.setState({ grupos: [], actualId: null, cargado: false });
    await useGrupos.getState().cargar();
    expect(useGrupos.getState().grupos.map((g) => g.etiqueta)).toEqual(['2°B', ETIQUETA_DEMO]);
  });

  it('se borra como cualquier grupo: solo él, y si era el elegido ya no hay grupo elegido', async () => {
    const real = useGrupos.getState().crear({ mascota: 'colibri', color: COLORES_GRUPO[1], etiqueta: '1°A' });
    const demo = useGrupos.getState().crearDemo();
    useGrupos.getState().borrar(demo.id);
    expect(useGrupos.getState().grupos.map((g) => g.id)).toEqual([real.id]);
    expect(useGrupos.getState().actualId).toBeNull();

    // Borrar un grupo real también funciona (y no toca a los demás).
    const otro = useGrupos.getState().crear({ mascota: 'ajolote', color: COLORES_GRUPO[2], etiqueta: '3°C' });
    useGrupos.getState().borrar(real.id);
    expect(useGrupos.getState().grupos.map((g) => g.id)).toEqual([otro.id]);
    await esperar();
    useGrupos.setState({ grupos: [], actualId: null, cargado: false });
    await useGrupos.getState().cargar();
    expect(useGrupos.getState().grupos.map((g) => g.etiqueta)).toEqual(['3°C']);
  });
});
