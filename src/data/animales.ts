/**
 * Los animales del parque. `cantidad` cuenta para el diploma ("animales que ayudaron").
 * Las frases se narran cuando su zona queda limpia.
 */
export interface Animal {
  id: 'ardilla' | 'colibri' | 'mariposas';
  nombre: string;
  cantidad: number;
  agradece: string;
}

export const ANIMALES: readonly Animal[] = [
  { id: 'ardilla', nombre: 'la ardilla', cantidad: 1, agradece: '¡La ardilla está feliz! Ya puede jugar en su árbol.' },
  { id: 'colibri', nombre: 'el colibrí', cantidad: 1, agradece: '¡El colibrí está feliz! Ya puede volar sin peligro.' },
  { id: 'mariposas', nombre: 'las mariposas monarca', cantidad: 3, agradece: '¡Las mariposas están felices! Ya pueden descansar.' },
];
