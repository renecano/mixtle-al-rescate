import type { CategoriaBase, Material } from './residuos';

/*
 * TODO(Eco Urban): confirmar las categorías oficiales de separación que usan en
 * "Escuelas Comprometidas con el Medio Ambiente" (nombres, colores e íconos de los botes).
 *
 * El juego funciona con 2, 3 o 4 categorías cambiando SOLO este archivo:
 *  - Cada bote dice qué acepta en `acepta`: una categoría base de los residuos
 *    ('organico', 'reciclable', 'no-reciclable') o un material ('papel', 'plastico',
 *    'metal', 'vidrio', 'multicapa', 'sanitario', 'organico').
 *  - Si un residuo coincide por material con un bote, ese bote gana sobre uno que
 *    coincide solo por categoría base. Así se puede separar, por ejemplo, "Papel y cartón".
 *  - Cada residuo debe ir a exactamente un bote (las pruebas lo revisan).
 *
 * Ejemplos al final del archivo.
 */

export type IconoCategoria = 'hoja' | 'reciclaje' | 'basura' | 'papel' | 'botella' | 'lata';

/**
 * Cómo nombra Caco el dibujo de cada ícono en voz alta, con su artículo:
 * "Busca el bote naranja de no reciclable, con el dibujo del bote de basura". El "de" + artículo
 * se contrae solo ("de el" → "del").
 */
export const NOMBRE_DEL_ICONO: Record<IconoCategoria, string> = {
  hoja: 'la hojita',
  reciclaje: 'las flechas',
  basura: 'el bote de basura',
  papel: 'la hoja de papel',
  botella: 'la botella',
  lata: 'la lata',
};

export interface Categoria {
  id: string;
  /** Nombre corto que se lee en el bote. */
  nombre: string;
  /** Color del bote (con buen contraste para texto blanco). */
  color: string;
  /** Cómo se dice el color en voz alta, para las pistas ("el bote verde"). */
  nombreColor: string;
  icono: IconoCategoria;
  /** Pista amable (una frase) que da Caco si un residuo de este bote se fue a otro. */
  pista: string;
  acepta: readonly (CategoriaBase | Material)[];
}

export const CATEGORIAS: readonly Categoria[] = [
  {
    id: 'organico',
    nombre: 'Orgánico',
    color: '#1F6B4A',
    nombreColor: 'verde',
    icono: 'hoja',
    pista: 'Viene de una planta o de un animal y se puede volver tierra.',
    acepta: ['organico'],
  },
  {
    id: 'reciclable',
    nombre: 'Reciclable',
    color: '#2459A6',
    nombreColor: 'azul',
    icono: 'reciclaje',
    pista: 'Se puede convertir en algo nuevo.',
    acepta: ['reciclable'],
  },
  {
    id: 'no-reciclable',
    nombre: 'No reciclable',
    color: '#B84A14',
    nombreColor: 'naranja',
    icono: 'basura',
    pista: 'Este casi nunca se puede reciclar.',
    acepta: ['no-reciclable'],
  },
];

/*
 * Ejemplo con 2 botes:
 *   { id: 'organico', nombre: 'Orgánico', ..., acepta: ['organico'] },
 *   { id: 'inorganico', nombre: 'Inorgánico', color: '#6345A8', nombreColor: 'morado',
 *     icono: 'basura', ..., acepta: ['reciclable', 'no-reciclable'] },
 *
 * Ejemplo con 4 botes (papel aparte):
 *   orgánico ['organico'], { id: 'papel', nombre: 'Papel y cartón', color: '#6345A8',
 *   nombreColor: 'morado', icono: 'papel', ..., acepta: ['papel'] },
 *   reciclable ['reciclable'], no reciclable ['no-reciclable'].
 */
