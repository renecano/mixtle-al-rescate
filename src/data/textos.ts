/**
 * Todo lo que Caco dice y lo que se lee en pantalla. Se puede cambiar aquí sin tocar la lógica.
 * Frases cortas: el público es de 6 a 8 años y muchos todavía leen con dificultad.
 */
export const TEXTOS = {
  intro: [
    '¡Hola! Soy Caco, el cacomixtle del parque.',
    'El parque está lleno de basura y los animales están tristes.',
    '¿Me ayudas a rescatarlos?',
  ],
  nivel1: {
    instruccion: 'Toca la basura para guardarla en mi bolsa.',
    pista: '¡Todavía hay basura! Tócala para guardarla en mi bolsa.',
    fin: '¡Lo lograste! El parque está limpio. Ahora vamos a separar la basura.',
  },
  seguir: '¡Sigamos!',
} as const;
