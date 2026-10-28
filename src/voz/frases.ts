import { ANIMALES } from '../data/animales';
import { CATEGORIAS } from '../data/categorias';
import { MAPEO_IMAGENET } from '../data/mapeoImagenet';
import { RESIDUOS } from '../data/residuos';
import { TEXTOS } from '../data/textos';
import { descripcionBote, textoPista } from '../logica/clasificacion';
import { archivoDeFrase } from './hash';
import { NUMERO_MAXIMO, normalizarFrase, piezasDeTexto, type Locucion } from './locucion';

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

  const b = TEXTOS.bonus;
  for (const clave of ['bienvenida', 'pidiendoPermiso', 'cargando', 'listo', 'pensando', 'meAyudas', 'gracias', 'sinModelo', 'conDibujos'] as const) {
    u1('aventura-bonus', `bonus.${clave}`, b[clave]);
  }
  for (const [motivo, texto] of Object.entries(b.sinCamara)) u1('aventura-bonus', `bonus.sinCamara.${motivo}`, texto);
  CATEGORIAS.forEach((c) => u1('aventura-bonus', `bonus.acierto.${c.id}`, b.acierto(descripcionBote(c))));
  [...new Set(Object.values(MAPEO_IMAGENET).map((e) => e.nombre))].forEach((nombre, i) =>
    u1('aventura-bonus', `bonus.creoQueEs.${i + 1}`, b.creoQueEs(nombre)),
  );

  // Diploma: las piezas fijas; los números se encadenan desde la lista común.
  for (const residuos of [1, 2]) for (const animales of [1, 2]) u1('aventura-diploma', 'diploma', TEXTOS.diploma.narracion(residuos, animales));

  // Números del 0 al 100 (y "un", "veintiún"… antes de un sustantivo), para encadenar.
  for (let n = 0; n <= NUMERO_MAXIMO; n++) {
    agregar('comun', 'numeros', `numero.${n}`, [{ numero: n }]);
    agregar('comun', 'numeros', `numero.${n}.ante-sustantivo`, [{ numero: n, antesDeSustantivo: true }]);
  }
  return lista;
}
