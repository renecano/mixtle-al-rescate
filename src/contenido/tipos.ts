/*
 * Forma del contenido de las lecciones. Cada lección es SOLO DATOS: el motor de ejercicios
 * (src/logica/leccion.ts y src/app/ejercicios/) sabe mostrar y calificar cada tipo.
 *
 * Todo texto que aparece aquí se narra con la voz de Caco (npm run voz:generar lo junta solo).
 * `arte` es la clave de un dibujo de src/arte (ver la galería: ?galeria).
 */

/** Una tarjeta ilustrada. `nombre` es cómo la dice Caco (y su texto de apoyo, si se muestra). */
export interface Tarjeta {
  id: string;
  arte: string;
  nombre: string;
}

interface Base {
  id: string;
  /** Lo que Caco pide (se narra y se muestra como subtítulo). */
  consigna: string;
  /** Pista amable si se equivoca (se narra). */
  pista: string;
}

/** 1. Elige la imagen: tocar la tarjeta correcta entre 2 y 4. */
export interface EligeImagen extends Base {
  tipo: 'elige-imagen';
  opciones: Tarjeta[];
  correcta: string;
  /** Se muestra el nombre bajo cada tarjeta (false para quienes aún no leen: solo dibujo). */
  conTexto?: boolean;
  /**
   * Si la pregunta es sobre un bote ("¿Cuál va en el bote verde de orgánico?"), su id en
   * src/data/categorias.ts: el bote se muestra con su nombre arriba de las tarjetas.
   */
  bote?: string;
}

/** 2. Al bote: arrastrar (o tocar el bote) cada residuo a su bote. Usa la lógica de la v1. */
export interface AlBote extends Base {
  tipo: 'al-bote';
  /** ids de src/data/residuos.ts */
  residuos: string[];
}

/** 3. Parejas: unir cada tarjeta de la izquierda con su pareja de la derecha. */
export interface Parejas extends Base {
  tipo: 'parejas';
  /** Mostrar el nombre bajo cada tarjeta (por ejemplo, el de cada bote). */
  conTexto?: boolean;
  pares: { izquierda: Tarjeta; derecha: Tarjeta }[];
}

/** 4. ¿Sí o no?: Caco describe una acción ilustrada y se toca la carita feliz o la triste. */
export interface SiNo extends Base {
  tipo: 'si-no';
  arte: string;
  /** Un segundo dibujo junto al primero, para mostrar la acción (la ardilla y las papitas). */
  junto?: string;
  /** true: carita feliz (está bien); false: carita triste (no está bien). */
  respuesta: boolean;
  /** Por qué, dicho al acertar (una frase corta). */
  porque: string;
}

/** 5. Ordena los pasos: tocar las tarjetas en el orden correcto (3 o 4). */
export interface Ordena extends Base {
  tipo: 'ordena';
  /** En el orden correcto; el juego las revuelve. */
  pasos: Tarjeta[];
}

/** 6. Encuentra el error: una escena con 1 a 3 cosas mal; se tocan. */
export interface EncuentraError extends Base {
  tipo: 'encuentra-error';
  /** Fondo de la escena. */
  escena: string;
  /** Cosas en la escena. `mal: true` son las que hay que encontrar. x, y, ancho en % de la escena. */
  objetos: { id: string; arte: string; nombre: string; x: number; y: number; ancho: number; mal: boolean }[];
}

/** 7. Escucha y toca: Caco nombra algo y se toca su dibujo, sin texto en pantalla. */
export interface EscuchaToca extends Base {
  tipo: 'escucha-toca';
  opciones: Tarjeta[];
  correcta: string;
}

export type Ejercicio = EligeImagen | AlBote | Parejas | SiNo | Ordena | EncuentraError | EscuchaToca;
export type TipoEjercicio = Ejercicio['tipo'];

export interface Leccion {
  id: string;
  titulo: string;
  /** Dibujo de la burbuja en el camino. */
  arte: string;
  /** Lo que dice Caco al empezar (corto). */
  bienvenida: string;
  ejercicios: Ejercicio[];
}

export interface Unidad {
  id: string;
  numero: number;
  titulo: string;
  /** Una frase que explica el tema (se narra al llegar a la unidad). */
  tema: string;
  /** Color de la unidad en el camino (contraste AA con texto blanco). */
  color: string;
  lecciones: Leccion[];
  /** El cofre aparece después de esta lección (índice desde 0), a la mitad de la unidad. */
  cofreTrasLeccion: number;
  /** Estampa del álbum que se gana al completar la unidad. */
  estampa: { id: string; arte: string; nombre: string; dato: string };
  /** Minijuego final con escena (Phaser). */
  aventura: { id: string; titulo: string; arte: string };
}
