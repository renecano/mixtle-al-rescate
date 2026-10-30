import type { Locucion } from '../voz/locucion';

/**
 * Todo lo que Mixtle dice y lo que se lee en pantalla. Se puede cambiar aquí sin tocar la lógica.
 * Frases cortas: el público es de 6 a 8 años y muchos todavía leen con dificultad.
 */
export const TEXTOS = {
  inicio: {
    titulo: 'Mixtle\nal rescate',
    /** Lema del juego, debajo del nombre. */
    lema: 'Guardianes del parque',
    jugar: '¡Jugar!',
  },
  intro: [
    '¡Hola! Soy Mixtle, el cacomixtle del parque.',
    'El parque está lleno de basura y los animales están tristes.',
    '¿Me ayudas a rescatarlos?',
  ],
  nivel1: {
    instruccion: 'Toca la basura para guardarla en mi bolsa.',
    pista: '¡Todavía hay basura! Tócala para guardarla en mi bolsa.',
    fin: '¡Lo lograste! El parque está limpio. Ahora vamos a separar la basura.',
  },
  nivel2: {
    instruccion: 'Ahora arrastra cada basura a su bote.',
    pregunta: (nombre: string) => `¿A qué bote va ${nombre}?`,
    celebraciones: ['¡Muy bien!', '¡Excelente!', '¡Eso es!', '¡Bravo!', '¡Así se hace!'],
    fin: '¡Separaste toda la basura! Ahora vamos a darles un hogar a los animales.',
  },
  nivel3: {
    instruccion: 'Donde había basura, ahora podemos sembrar. Toca la tierra.',
    pista: 'Toca la tierra para sembrar un árbol o unas flores.',
    llegaMariposa: '¡Mira! Llegó una mariposa monarca a las flores.',
    llegaColibri: '¡El colibrí encontró un árbol nuevo!',
    llegaArdilla: '¡A la ardilla le encanta su árbol nuevo!',
    fin: '¡El parque es otra vez un hogar para los animales!',
  },
  bonus: {
    bienvenida: '¡Bonus! ¡Lluvia de basura! Toca el bote correcto antes de que la basura llegue al suelo.',
    seCayo: '¡Uy, llegó al suelo! No pasa nada, ahí viene otra vez.',
    fin: '¡Separaron toda la lluvia de basura! Vamos por su diploma.',
    botonDiploma: 'Ir al diploma',
  },
  diploma: {
    titulo: 'Guardianes del parque',
    para: 'Diploma para todo el grupo',
    residuos: (n: number) => (n === 1 ? 'residuo bien separado' : 'residuos bien separados'),
    animales: (n: number) => (n === 1 ? 'animal ayudado' : 'animales ayudados'),
    /** Se narra en piezas: los números se encadenan como audios aparte (0 a 100). */
    narracion: (residuos: number, animales: number): Locucion => [
      '¡Felicidades, guardianes del parque! Separaron bien',
      { numero: residuos, antesDeSustantivo: true },
      residuos === 1 ? 'residuo y ayudaron a' : 'residuos y ayudaron a',
      { numero: animales, antesDeSustantivo: true },
      animales === 1 ? 'animal.' : 'animales.',
    ],
    firma: 'Mixtle, el cacomixtle',
    fecha: 'Fecha',
    pie: 'Mixtle al rescate · Eco Urban A.C.',
    jugarOtraVez: 'Volver al camino',
  },
  seguir: '¡Sigamos!',
} as const;
