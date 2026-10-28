import { ANIMALES } from '../data/animales';
import { CATEGORIAS } from '../data/categorias';
import { RESIDUOS } from '../data/residuos';
import { TEXTOS } from '../data/textos';
import { TEXTOS_AVENTURAS } from '../contenido/aventuras';
import { TEXTOS_APP } from '../contenido/textosApp';
import type { Ejercicio } from '../contenido/tipos';
import { UNIDADES } from '../contenido/unidades';
import { HOJITAS_COFRE } from '../logica/camino';
import { textoPista } from '../logica/clasificacion';
import { MASCOTAS } from '../logica/grupos';
import { archivoDeFrase } from './hash';
import { COSAS_LONCHERA, RECORRIDO_BICI } from '../aventuras/datos';
import { HOJITAS_POR_LECCION } from '../logica/leccion';
import { NUMERO_MAXIMO, normalizarFrase, piezasDeTexto, textoHablado, type Locucion } from './locucion';

/** Una frase que Caco dice en voz alta, con dónde aparece (para el CSV de grabación). */
export interface FraseNarrada {
  id: string;
  texto: string;
  archivo: string;
  unidad: string;
  leccion: string;
}

/**
 * Junta todas las frases que dice Caco a partir de los archivos de contenido.
 * Al agregar un residuo, una categoría o un texto narrado, su frase aparece aquí sola.
 * Las frases repetidas se graban una sola vez (se queda el primer id).
 */
export function todasLasFrases(): FraseNarrada[] {
  const lista: FraseNarrada[] = [];
  const vistos = new Set<string>();
  const agregar = (unidad: string, leccion: string, id: string, locucion: Locucion) => {
    piezasDeTexto(locucion).forEach((pieza, i, piezas) => {
      const texto = normalizarFrase(pieza);
      const archivo = archivoDeFrase(texto);
      if (!texto || vistos.has(archivo)) return;
      vistos.add(archivo);
      lista.push({ id: piezas.length > 1 ? `${id}.${i + 1}` : id, texto, archivo, unidad, leccion });
    });
  };

  // Unidad 1 — aventura (los niveles de la v1).
  const u1 = (leccion: string, id: string, l: Locucion) => agregar('1', leccion, id, l);
  TEXTOS.intro.forEach((f, i) => u1('aventura-intro', `intro.${i + 1}`, f));
  u1('aventura-nivel1', 'nivel1.instruccion', TEXTOS.nivel1.instruccion);
  u1('aventura-nivel1', 'nivel1.pista', TEXTOS.nivel1.pista);
  ANIMALES.forEach((a) => u1('aventura-nivel1', `nivel1.agradece.${a.id}`, a.agradece));
  u1('aventura-nivel1', 'nivel1.fin', TEXTOS.nivel1.fin);
  u1('aventura-nivel2', 'nivel2.instruccion', TEXTOS.nivel2.instruccion);
  RESIDUOS.forEach((r) => u1('aventura-nivel2', `nivel2.pregunta.${r.id}`, TEXTOS.nivel2.pregunta(r.nombre)));
  TEXTOS.nivel2.celebraciones.forEach((c, i) => u1('aventura-nivel2', `celebracion.${i + 1}`, c));
  RESIDUOS.forEach((r) => u1('aventura-nivel2', `dato.${r.id}`, r.dato));
  CATEGORIAS.forEach((c) => u1('aventura-nivel2', `pista.${c.id}`, textoPista(c)));
  u1('aventura-nivel2', 'nivel2.fin', TEXTOS.nivel2.fin);
  for (const [clave, texto] of Object.entries(TEXTOS.nivel3)) u1('aventura-nivel3', `nivel3.${clave}`, texto);

  // Bonus "Lluvia de basura": las preguntas, aciertos y pistas son las del nivel 2.
  const b = TEXTOS.bonus;
  for (const clave of ['bienvenida', 'seCayo', 'fin'] as const) u1('aventura-bonus', `bonus.${clave}`, b[clave]);

  // Camino de aprendizaje: cada unidad, lección y ejercicio (src/contenido/unidades/).
  for (const unidad of UNIDADES) {
    const enUnidad = (leccion: string, id: string, l: Locucion) => agregar(String(unidad.numero), leccion, id, l);
    enUnidad('camino', `${unidad.id}.encabezado`, [TEXTOS_APP.camino.encabezadoUnidad(unidad.numero, unidad.titulo), unidad.tema]);
    enUnidad('album', `${unidad.id}.estampa`, [TEXTOS_APP.album.nueva(unidad.estampa.nombre), unidad.estampa.dato]);
    enUnidad('album', `${unidad.id}.estampa.nombre`, unidad.estampa.nombre);
    for (const leccion of unidad.lecciones) {
      const enLeccion = (id: string, l: Locucion) => enUnidad(leccion.id, id, l);
      enLeccion(`${leccion.id}.bienvenida`, leccion.bienvenida);
      for (const e of todosLosEjercicios(leccion.ejercicios)) {
        enLeccion(`${e.id}.consigna`, e.consigna);
        enLeccion(`${e.id}.pista`, e.pista);
        if (e.tipo === 'si-no') enLeccion(`${e.id}.porque`, e.porque);
      }
    }
  }

  // Aventuras de las unidades 2 a 5 (src/contenido/aventuras.ts). Los textos de botones no se narran;
  // del diploma se narran las piezas fijas (los números se encadenan desde la lista común).
  for (const [unidadId, textos] of Object.entries(TEXTOS_AVENTURAS)) {
    const numero = unidadId.replace('u', '');
    const visitar = (valor: unknown, ruta: string) => {
      if (typeof valor === 'string') agregar(numero, 'aventura', `${unidadId}.${ruta}`, valor);
      else if (Array.isArray(valor)) valor.forEach((v, i) => visitar(v, `${ruta}.${i + 1}`));
      else if (valor && typeof valor === 'object')
        for (const [clave, v] of Object.entries(valor)) {
          if (clave === 'diploma' || clave.startsWith('boton') || clave.startsWith('etiqueta')) continue;
          visitar(v, ruta ? `${ruta}.${clave}` : clave);
        }
    };
    visitar(textos, '');
    for (const a of [1, 2]) for (const b of [1, 2]) agregar(numero, 'aventura-diploma', `${unidadId}.diploma`, textos.diploma.narracion(a, b));
  }

  // Pantallas de la app: grupos, camino, cofre, lección, álbum.
  const app = (leccion: string, id: string, l: Locucion) => agregar('app', leccion, id, l);
  const t = TEXTOS_APP;
  app('grupos', 'grupos.bienvenida', t.grupos.bienvenida);
  app('grupos', 'grupos.crear', [t.grupos.crear, t.grupos.aviso]);
  MASCOTAS.forEach((m) => app('camino', `camino.hola.${m.id}`, t.camino.hola(m.nombre)));
  app('camino', 'camino.terminaron', t.camino.terminaron);
  app('camino', 'camino.bloqueada', t.camino.bloqueada);
  app('cofre', 'cofre.llegaron', t.cofre.llegaron);
  app('cofre', 'cofre.abierto', t.cofre.abierto(HOJITAS_COFRE));
  t.leccion.animos.forEach((a, i) => app('leccion', `leccion.animo.${i + 1}`, a));
  app('leccion', 'leccion.casi', '¡Casi!');
  app('leccion', 'leccion.salirPregunta', t.leccion.salirPregunta);
  app('leccion', 'leccion.repaso', t.leccion.repaso);
  app('leccion', 'leccion.terminada', t.leccion.terminada(12, 5, 6));
  app('leccion', 'leccion.parqueCrece', t.leccion.parqueCrece);
  app('album', 'album.bienvenida', t.album.bienvenida);
  app('album', 'album.bloqueada', t.album.bloqueada);

  // Diploma: las piezas fijas; los números se encadenan desde la lista común.
  for (const residuos of [1, 2]) for (const animales of [1, 2]) u1('aventura-diploma', 'diploma', TEXTOS.diploma.narracion(residuos, animales));

  // Frases con números que de verdad pueden salir, grabadas COMPLETAS para que Caco las diga de
  // corrido (encadenar piezas suena entrecortado). Las piezas sueltas quedan como respaldo.
  for (const n of narracionesCompletas()) agregar(n.unidad, n.leccion, n.id, textoHablado(n.locucion));

  // Números del 0 al 100 (y "un", "veintiún"… antes de un sustantivo), para encadenar.
  for (let n = 0; n <= NUMERO_MAXIMO; n++) {
    agregar('comun', 'numeros', `numero.${n}`, [{ numero: n }]);
    agregar('comun', 'numeros', `numero.${n}.ante-sustantivo`, [{ numero: n, antesDeSustantivo: true }]);
  }
  return lista;
}

/** Cuenta de 0 a n. */
const hasta = (n: number) => Array.from({ length: n + 1 }, (_, i) => i);

/**
 * Las narraciones con números que pueden salir en el juego, cada una completa: el resumen de cada
 * lección (para cada largo de lección y cada cantidad de aciertos a la primera), el cofre y los
 * diplomas de las aventuras con los resultados posibles.
 */
export function narracionesCompletas(): { id: string; unidad: string; leccion: string; locucion: Locucion }[] {
  const lista: { id: string; unidad: string; leccion: string; locucion: Locucion }[] = [];
  const largos = [...new Set(UNIDADES.flatMap((u) => u.lecciones.map((l) => l.ejercicios.length)))].sort();
  for (const total of largos)
    for (const a of hasta(total))
      lista.push({ id: `leccion.terminada.${total}.${a}`, unidad: 'app', leccion: 'leccion', locucion: TEXTOS_APP.leccion.terminada(HOJITAS_POR_LECCION + a, a, total) });
  lista.push({ id: 'cofre.abierto.completa', unidad: 'app', leccion: 'cofre', locucion: TEXTOS_APP.cofre.abierto(HOJITAS_COFRE) });

  // Unidad 1: 12 residuos del nivel 2 + hasta 5 de la lluvia de basura; animales de 4 a 10.
  for (const r of hasta(RESIDUOS.length + 5).filter((x) => x >= RESIDUOS.length))
    for (const a of hasta(10).filter((x) => x >= 4)) lista.push({ id: `diploma.${r}.${a}`, unidad: '1', leccion: 'aventura-diploma', locucion: TEXTOS.diploma.narracion(r, a) });
  const t = TEXTOS_AVENTURAS;
  // Unidad 2: siempre se rescata a los 4 animales y se separan sus 6 residuos para llegar al diploma.
  lista.push({ id: 'u2.diploma.completa', unidad: '2', leccion: 'aventura-diploma', locucion: t.u2.diploma.narracion(4, 6) });
  // Unidad 3: 6 arbolitos, 2 riegos cada uno.
  lista.push({ id: 'u3.diploma.completa', unidad: '3', leccion: 'aventura-diploma', locucion: t.u3.diploma.narracion(6, 12) });
  // Unidad 4: varía según el carril que elija el grupo.
  const hojitas = RECORRIDO_BICI.filter((c) => c.tipo === 'hojita').length;
  const nubes = RECORRIDO_BICI.filter((c) => c.tipo === 'humo').length;
  for (const h of hasta(hojitas)) for (const n of hasta(nubes)) lista.push({ id: `u4.diploma.${h}.${n}`, unidad: '4', leccion: 'aventura-diploma', locucion: t.u4.diploma.narracion(h, n) });
  // Unidad 5: todas las cosas se acomodan para terminar.
  const reutilizables = COSAS_LONCHERA.filter((c) => c.reutilizable).length;
  lista.push({ id: 'u5.diploma.completa', unidad: '5', leccion: 'aventura-diploma', locucion: t.u5.diploma.narracion(reutilizables, COSAS_LONCHERA.length - reutilizables) });
  return lista;
}

/** Los ejercicios de una lección (una lista plana, para revisarlos y narrarlos). */
export function todosLosEjercicios(ejercicios: readonly Ejercicio[]): Ejercicio[] {
  return [...ejercicios];
}
