import { segun } from '../logica/diploma';
import type { Locucion } from '../voz/locucion';

/*
 * Lo que dice Mixtle en las aventuras de las unidades 2 a 5 (la de la unidad 1 está en src/data/textos.ts).
 * Las claves que empiezan con "boton" o "etiqueta" solo se muestran; todo lo demás se narra.
 * Todo se narra: npm run voz:generar junta estas frases solas.
 * TODO(Eco Urban): validar con las educadoras y educadores. Fuentes: docs/fuentes-contenido.md.
 *
 * Narraciones con números: los números se encadenan como audios aparte (y las que de verdad pueden
 * salir se graban completas). Antes de un sustantivo femenino van con `femenino` ("una hojita").
 * Nada de "Hojitas: doce": los dos puntos hacían que la voz dejara pausas largas.
 */

/** Diploma de una unidad: tema, qué cuenta cada columna y lo que narra Mixtle. */
export interface TextosDiploma {
  subtitulo: string;
  izquierda: (n: number) => string;
  derecha: (n: number) => string;
  narracion: (izquierda: number, derecha: number) => Locucion;
}

export const TEXTOS_AVENTURAS = {
  u2: {
    intro: '¡Hay animales atrapados en la basura! Toca la basura para liberarlos.',
    pista: 'Toca la basura que tiene atrapado a un animal.',
    // A7, A5, A10, A20
    agradece: {
      ardilla: '¡Gracias! Ahora puedo ir a buscar bellotas.',
      tlacuache: '¡Gracias! Ya puedo cargar a mis bebés en la espalda.',
      colibri: '¡Gracias! Ya puedo volar de flor en flor.',
      mariposa: '¡Gracias! Ya puedo buscar algodoncillo para mis huevitos.',
    },
    separar: 'Ahora separemos la basura que recogimos. Lleva cada una a su bote.',
    fin: '¡Rescataron a todos los animales y separaron la basura!',
    botonDiploma: 'Ver el diploma',
    diploma: {
      subtitulo: 'Los animales del parque',
      izquierda: (n) => segun(n, 'animal rescatado', 'animales rescatados'),
      derecha: (n) => segun(n, 'residuo separado', 'residuos separados'),
      narracion: (animales, residuos) => [
        '¡Felicidades, guardianes del parque! Rescataron a',
        { numero: animales, antesDeSustantivo: true },
        animales === 1 ? 'animal y separaron' : 'animales y separaron',
        { numero: residuos, antesDeSustantivo: true },
        residuos === 1 ? 'residuo.' : 'residuos.',
      ],
    } satisfies TextosDiploma,
  },
  u3: {
    intro: '¡Vamos a sembrar un bosquecito! Toca cada hoyo para plantar un arbolito.',
    regar: 'Ahora hay que regarlos. Toca cada arbolito para darle agua.',
    // B5
    otraVez: '¡Muy bien! Un arbolito necesita agua seguido. Riégalo otra vez.',
    pista: 'Toca el hoyo o el arbolito que brilla.',
    // B3, A10
    llegan: '¡Miren! Llegaron el colibrí, la ardilla y las mariposas. Los árboles son su casa.',
    // B1, B2
    fin: '¡Su bosquecito dará sombra y oxígeno! ¡Lo lograron!',
    botonDiploma: 'Ver el diploma',
    diploma: {
      subtitulo: 'Árboles y áreas verdes',
      izquierda: (n) => segun(n, 'árbol sembrado', 'árboles sembrados'),
      derecha: (n) => segun(n, 'riego', 'riegos'),
      narracion: (arboles, riegos) => [
        '¡Felicidades, guardianes del parque! Sembraron',
        { numero: arboles, antesDeSustantivo: true },
        arboles === 1 ? 'árbol y le dieron' : 'árboles y les dieron',
        { numero: riegos, antesDeSustantivo: true },
        riegos === 1 ? 'riego.' : 'riegos.',
      ],
    } satisfies TextosDiploma,
  },
  u4: {
    intro: '¡Vamos en bici a la escuela! Toca el carril de arriba o el de abajo para esquivar el humo y juntar hojitas.',
    // C3
    tos: '¡Cof, cof! El humo nos hace toser. ¡Cambiemos de carril!',
    hojita: '¡Una hojita!',
    // C1
    mitad: 'En bici no echamos humo. ¡Ya casi llegamos!',
    fin: '¡Llegamos a la escuela sin echar humo!',
    botonDiploma: 'Ver el diploma',
    diploma: {
      subtitulo: 'Aire limpio',
      izquierda: (n) => segun(n, 'hojita juntada', 'hojitas juntadas'),
      derecha: (n) => segun(n, 'nube de humo esquivada', 'nubes de humo esquivadas'),
      // De corrido y sin "cero": si no juntaron hojitas o no esquivaron humo, Mixtle anima para la
      // próxima vez (como el resumen de una lección).
      narracion: (hojitas, nubes) => {
        const juntaron = [{ numero: hojitas, femenino: true }, hojitas === 1 ? 'hojita' : 'hojitas'] as const;
        const esquivaron = [{ numero: nubes, femenino: true }, nubes === 1 ? 'nube de humo' : 'nubes de humo'] as const;
        const felicidades = '¡Felicidades, guardianes del aire!';
        if (hojitas && nubes) return [`${felicidades} Juntaron`, ...juntaron, 'y esquivaron', ...esquivaron, '. ¡Bravo!'];
        if (nubes) return [`${felicidades} Esquivaron`, ...esquivaron, '. ¡La próxima vez, a juntar muchas hojitas!'];
        if (hojitas) return [`${felicidades} Juntaron`, ...juntaron, '. ¡La próxima vez, a esquivar el humo!'];
        return [`${felicidades} Llegaron a la escuela en bici. ¡La próxima vez, a juntar hojitas y esquivar el humo!`];
      },
    } satisfies TextosDiploma,
  },
  u5: {
    intro: 'Vamos a armar una lonchera sin basura. Lleva cada cosa a la lonchera, o a "Mejor no".',
    pista: 'Arrastra la cosa, o toca la lonchera o "Mejor no".',
    // Lo que pregunta Mixtle al aparecer cada cosa.
    preguntas: {
      'botella-reutilizable': '¿Y esta botella que se rellena?',
      recipiente: '¿Y este recipiente con fruta?',
      'servilleta-tela': '¿Y la servilleta de tela?',
      cuchara: '¿Y la cuchara de metal?',
      fruta: '¿Y esta manzana?',
      jugo: '¿Y la cajita de jugo?',
      frituras: '¿Y la bolsita de papitas?',
      'tenedor-plastico': '¿Y el tenedor de plástico?',
      'vaso-desechable': '¿Y el vaso desechable?',
      'bolsa-plastico': '¿Y la bolsa de plástico?',
    },
    // Al acertar: por qué (D1, D2, D3, D4, D9).
    porque: {
      'botella-reutilizable': '¡Sí! La rellenas muchas veces y tiras menos botellas.',
      recipiente: '¡Sí! Se lava y se usa otra vez.',
      'servilleta-tela': '¡Sí! Se lava y no se vuelve basura.',
      cuchara: '¡Sí! Se lava y dura mucho.',
      fruta: '¡Sí! La manzana no trae envoltura, y su corazón va a la composta.',
      jugo: '¡Bien pensado! Mejor agua en tu botella; la cajita se vuelve basura.',
      frituras: '¡Bien pensado! Mejor fruta; la bolsita casi nunca se recicla.',
      'tenedor-plastico': '¡Bien pensado! Mejor tu cuchara de metal; el tenedor se usa una vez.',
      'vaso-desechable': '¡Bien pensado! Mejor tu taza o tu botella.',
      'bolsa-plastico': '¡Bien pensado! Mejor tu lonchera; la bolsa se usa una vez.',
    },
    casiReutilizable: '¡Ese sí sirve! Se usa muchas veces; llévalo en la lonchera.',
    casiDesechable: 'Mmm, eso se vuelve basura después de usarlo. Mejor no.',
    fin: '¡Su lonchera está lista y no deja basura!',
    etiquetaLonchera: 'Mi lonchera',
    etiquetaMejorNo: 'Mejor no',
    botonDiploma: 'Ver el diploma',
    diploma: {
      subtitulo: 'Reduce y reutiliza',
      izquierda: (n) => segun(n, 'objeto reutilizable', 'objetos reutilizables'),
      derecha: (n) => segun(n, 'desechable evitado', 'desechables evitados'),
      narracion: (reutilizables, evitados) => [
        '¡Felicidades, guardianes del parque! Su lonchera lleva',
        { numero: reutilizables, antesDeSustantivo: true },
        reutilizables === 1 ? 'objeto reutilizable, y evitaron' : 'objetos reutilizables, y evitaron',
        { numero: evitados, antesDeSustantivo: true },
        evitados === 1 ? 'desechable.' : 'desechables.',
      ],
    } satisfies TextosDiploma,
  },
} as const;

export type UnidadConAventura = keyof typeof TEXTOS_AVENTURAS;
