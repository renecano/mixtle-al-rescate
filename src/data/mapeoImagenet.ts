import type { CategoriaBase, Material } from './residuos';

/*
 * Traducción de etiquetas de ImageNet (las que reconoce MobileNet) a las categorías del juego.
 *
 * - La clave es el nombre EXACTO de la clase de ImageNet, tal como lo devuelve MobileNet
 *   (por ejemplo 'pop bottle, soda bottle'). Las pruebas revisan que exista.
 * - `nombre` es cómo lo dice Caco ("¡Creo que es una botella!").
 * - `categoria` y `material` funcionan igual que en residuos.ts, así que el mapeo sigue
 *   sirviendo si Eco Urban cambia los botes en categorias.ts.
 *
 * IMPORTANTE: MobileNet no fue entrenado para basura. Este mapeo es aproximado: solo
 * incluye objetos que se reconocen razonablemente bien y cuya clasificación es clara.
 * Lo dudoso (bolsas de plástico, vasos, platos, libros) se deja fuera a propósito para
 * que Caco pida ayuda en lugar de adivinar mal.
 */
export interface EntradaMapeo {
  nombre: string;
  categoria: CategoriaBase;
  material?: Material;
}

const organico = (nombre: string): EntradaMapeo => ({ nombre, categoria: 'organico', material: 'organico' });
const reciclable = (nombre: string, material: Material): EntradaMapeo => ({ nombre, categoria: 'reciclable', material });
const noReciclable = (nombre: string, material: Material): EntradaMapeo => ({ nombre, categoria: 'no-reciclable', material });

export const MAPEO_IMAGENET: Readonly<Record<string, EntradaMapeo>> = {
  // Orgánico: frutas, verduras, restos de comida y plantas.
  banana: organico('un plátano'),
  'Granny Smith': organico('una manzana'),
  orange: organico('una naranja'),
  lemon: organico('un limón'),
  strawberry: organico('una fresa'),
  'pineapple, ananas': organico('una piña'),
  pomegranate: organico('una granada'),
  fig: organico('un higo'),
  'custard apple': organico('una chirimoya'),
  'cucumber, cuke': organico('un pepino'),
  'bell pepper': organico('un pimiento'),
  broccoli: organico('un brócoli'),
  cauliflower: organico('una coliflor'),
  'head cabbage': organico('una col'),
  'zucchini, courgette': organico('una calabacita'),
  corn: organico('un elote'),
  acorn: organico('una bellota'),
  hay: organico('pasto seco'),
  mushroom: organico('un hongo'),
  'French loaf': organico('un pan'),
  'bagel, beigel': organico('un pan'),
  pretzel: organico('un pan'),
  'mashed potato': organico('restos de comida'),
  'pizza, pizza pie': organico('un pedazo de pizza'),
  daisy: organico('una flor'),

  // Reciclable: botellas, latas, papel y cartón.
  'water bottle': reciclable('una botella de plástico', 'plastico'),
  'pop bottle, soda bottle': reciclable('una botella de refresco', 'plastico'),
  'water jug': reciclable('un garrafón de plástico', 'plastico'),
  'pill bottle': reciclable('un frasco de plástico', 'plastico'),
  bottlecap: reciclable('una tapita', 'plastico'),
  'beer bottle': reciclable('una botella de vidrio', 'vidrio'),
  'wine bottle': reciclable('una botella de vidrio', 'vidrio'),
  'milk can': reciclable('una lata', 'metal'),
  carton: reciclable('una caja de cartón', 'papel'),
  envelope: reciclable('un sobre de papel', 'papel'),
  'crossword puzzle, crossword': reciclable('un periódico', 'papel'),
  'comic book': reciclable('una revista', 'papel'),
  menu: reciclable('una hoja de papel', 'papel'),

  // No reciclable: papel sanitario y envolturas.
  'paper towel': noReciclable('una toalla de papel', 'sanitario'),
  'toilet tissue, toilet paper, bathroom tissue': noReciclable('papel de baño', 'sanitario'),
  'diaper, nappy, napkin': noReciclable('una servilleta', 'sanitario'),
  'handkerchief, hankie, hanky, hankey': noReciclable('un pañuelo desechable', 'sanitario'),
  'Band Aid': noReciclable('una curita', 'sanitario'),
  packet: noReciclable('una envoltura', 'multicapa'),
};
