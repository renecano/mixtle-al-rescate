/**
 * Todo lo que Caco dice y lo que se lee en pantalla. Se puede cambiar aquí sin tocar la lógica.
 * Frases cortas: el público es de 6 a 8 años y muchos todavía leen con dificultad.
 */
export const TEXTOS = {
  inicio: {
    titulo: 'Caco\nal rescate',
    jugar: '¡Jugar!',
  },
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
    bienvenida: '¡Bonus! Muéstrale a Caco una basura de verdad y juntos la separamos.',
    privacidad: 'La cámara solo se usa aquí, en este aparato. No se guarda ni se envía ninguna imagen.',
    botonCamara: 'Muéstrale a Caco',
    botonDiploma: 'Ir al diploma',
    pidiendoPermiso: 'Si aparece un aviso, toca "Permitir" para que Caco pueda ver.',
    cargando: 'Caco se está poniendo sus lentes…',
    listo: 'Pon la basura frente a la cámara y toca el botón.',
    botonAdivinar: '¡Adivina, Caco!',
    pensando: 'Mmm… déjame ver…',
    creoQueEs: (nombre: string) => `¡Creo que es ${nombre}! ¿A qué bote va?`,
    meAyudas: '¿Me ayudas? ¿A qué bote va?',
    gracias: '¡Gracias por enseñarme! Muéstrame otra cosa.',
    acierto: (bote: string) => `¡Muy bien! Va en ${bote}.`,
    sinCamara: {
      denegada: 'No tengo permiso para usar la cámara. ¡Juguemos con dibujos!',
      'sin-camara': 'No encontré una cámara. ¡Juguemos con dibujos!',
      'sin-soporte': 'Aquí no puedo usar la cámara. ¡Juguemos con dibujos!',
      ocupada: 'La cámara está ocupada en otro programa. ¡Juguemos con dibujos!',
      'sin-respuesta': 'No pude abrir la cámara. ¡Juguemos con dibujos!',
      error: 'La cámara no funcionó. ¡Juguemos con dibujos!',
    },
    sinModelo: 'No pude ponerme mis lentes. ¡Juguemos con dibujos!',
    botonDibujos: 'Usar dibujos',
    conDibujos: '¡Muy bien! Juguemos con dibujos.',
  },
  diploma: {
    titulo: 'Guardianes del parque',
    para: 'Diploma para todo el grupo',
    residuos: (n: number) => (n === 1 ? 'residuo bien separado' : 'residuos bien separados'),
    animales: (n: number) => (n === 1 ? 'animal ayudado' : 'animales ayudados'),
    narracion: (residuos: number, animales: number) =>
      `¡Felicidades, guardianes del parque! Separaron bien ${residuos} ${residuos === 1 ? 'residuo' : 'residuos'} y ayudaron a ${animales} ${animales === 1 ? 'animal' : 'animales'}.`,
    firma: 'Caco, el cacomixtle',
    fecha: 'Fecha',
    pie: 'Caco al rescate · Eco Urban A.C.',
    jugarOtraVez: 'Jugar otra vez',
  },
  seguir: '¡Sigamos!',
} as const;
