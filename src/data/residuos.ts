/*
 * Residuos del juego: cosas cotidianas para niñas y niños de Toluca.
 * Para agregar uno: copia una entrada, cambia el texto y pon en `imagen`:
 *  - el nombre de un dibujo incluido (ver src/arte/residuos.ts), o
 *  - la ruta a tu propia imagen dentro de /public, por ejemplo 'residuos/tapita.png'.
 *
 * Datos curiosos: una sola frase, verdadera y apropiada para 6 a 8 años.
 * La clasificación sigue el criterio común en México (orgánico / reciclable /
 * no reciclable); confirmar con Eco Urban (ver TODO en categorias.ts).
 */

/** Categoría base de cada residuo. Los botes de `categorias.ts` deciden cuáles aceptan. */
export type CategoriaBase = 'organico' | 'reciclable' | 'no-reciclable';

/** Material, por si Eco Urban quiere botes más finos (por ejemplo, papel aparte). */
export type Material = 'organico' | 'papel' | 'plastico' | 'metal' | 'vidrio' | 'multicapa' | 'sanitario';

export interface Residuo {
  id: string;
  /** Nombre con artículo, como lo diría Caco: "la cáscara de plátano". */
  nombre: string;
  categoria: CategoriaBase;
  material: Material;
  imagen: string;
  dato: string;
}

export const RESIDUOS: readonly Residuo[] = [
  {
    id: 'platano',
    nombre: 'la cáscara de plátano',
    categoria: 'organico',
    material: 'organico',
    imagen: 'platano',
    dato: 'La cáscara de plátano se convierte en composta, un abono que alimenta a las plantas.',
  },
  {
    id: 'jugo',
    nombre: 'el envase de jugo',
    categoria: 'reciclable',
    material: 'multicapa',
    imagen: 'jugo',
    dato: 'Las cajitas de jugo tienen cartón, plástico y aluminio; se pueden reciclar en un centro de acopio.',
  },
  {
    id: 'botella',
    nombre: 'la botella de plástico',
    categoria: 'reciclable',
    material: 'plastico',
    imagen: 'botella',
    dato: 'Con botellas de plástico recicladas se pueden hacer playeras y botellas nuevas.',
  },
  {
    id: 'lata',
    nombre: 'la lata',
    categoria: 'reciclable',
    material: 'metal',
    imagen: 'lata',
    dato: 'Una lata de aluminio se puede reciclar muchas veces y volver a ser lata.',
  },
  {
    id: 'periodico',
    nombre: 'el periódico',
    categoria: 'reciclable',
    material: 'papel',
    imagen: 'periodico',
    dato: 'Con papel reciclado se hace papel nuevo, y así se cortan menos árboles.',
  },
  {
    id: 'servilleta',
    nombre: 'la servilleta usada',
    categoria: 'no-reciclable',
    material: 'sanitario',
    imagen: 'servilleta',
    dato: 'Una servilleta sucia de comida ya no se puede reciclar; por eso usamos solo las que necesitamos.',
  },
  {
    id: 'frituras',
    nombre: 'la envoltura de frituras',
    categoria: 'no-reciclable',
    material: 'multicapa',
    imagen: 'frituras',
    dato: 'Las bolsitas de frituras tienen capas de plástico y metal pegadas, y casi nunca se reciclan.',
  },
  {
    id: 'huevo',
    nombre: 'la cáscara de huevo',
    categoria: 'organico',
    material: 'organico',
    imagen: 'huevo',
    dato: 'La cáscara de huevo tiene calcio; triturada en la composta, se lo da a la tierra.',
  },
  {
    id: 'carton',
    nombre: 'la caja de cartón',
    categoria: 'reciclable',
    material: 'papel',
    imagen: 'carton',
    dato: 'Si aplastas la caja de cartón, ocupa menos lugar en el bote.',
  },
  {
    id: 'popote',
    nombre: 'el popote',
    categoria: 'no-reciclable',
    material: 'plastico',
    imagen: 'popote',
    dato: 'Los popotes casi nunca se reciclan; puedes tomar tu agua sin popote.',
  },
  {
    id: 'hojas',
    nombre: 'las hojas secas',
    categoria: 'organico',
    material: 'organico',
    imagen: 'hojas',
    dato: 'Las hojas secas también sirven para hacer composta, que alimenta a las plantas.',
  },
  {
    id: 'manzana',
    nombre: 'el corazón de manzana',
    categoria: 'organico',
    material: 'organico',
    imagen: 'manzana',
    dato: 'Con restos de fruta como el corazón de manzana se hace composta para el jardín.',
  },
];
