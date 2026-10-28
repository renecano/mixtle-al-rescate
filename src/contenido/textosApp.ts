import type { Locucion } from '../voz/locucion';

/*
 * Lo que dice Mixtle (y lo que se lee) en las pantallas de la app: grupos, camino, lecciones,
 * cofres y álbum. Todo se narra; npm run voz:generar lo junta solo.
 * TODO(Eco Urban): revisar redacción con las educadoras y educadores.
 */
export const TEXTOS_APP = {
  inicio: {
    /** La frase de Mixtle (marca): la dice al tocar "¡Jugar!". */
    alRescate: '¡Al rescate!',
  },
  grupos: {
    titulo: '¿Quién va a jugar?',
    bienvenida: '¿Quién va a jugar? Elijan su grupo o creen uno nuevo.',
    nuevo: 'Nuevo grupo',
    crear: 'Elijan un animal y un color para su grupo.',
    etiqueta: 'Etiqueta (opcional), por ejemplo 1°A',
    aviso: 'No escriban nombres de niñas ni niños.',
    listo: '¡Listo!',
    cancelar: 'Cancelar',
    soloAqui: 'El avance de cada grupo se guarda solo en este aparato.',
    sinGuardar: 'Este aparato no deja guardar: el avance se perderá al cerrar.',
  },
  camino: {
    hola: (mascota: string) => `¡Hola, grupo ${mascota}! Toquen la lección que señalo.`,
    terminaron: '¡Terminaron todo el camino! El parque está lleno de vida.',
    unidad: 'Unidad',
    encabezadoUnidad: (numero: number, titulo: string) => `Unidad ${numero}: ${titulo}.`,
    racha: (dias: number) => `(${dias} seguidos)`,
    hojitas: 'Hojitas',
    dias: 'Días jugados',
    album: 'Álbum',
    cambiarGrupo: 'Cambiar de grupo',
    bloqueada: 'Primero terminen la lección anterior.',
    aventura: (titulo: string) => `¡Aventura! ${titulo}.`,
  },
  cofre: {
    llegaron: '¡Un cofre! Tóquenlo para abrirlo.',
    abierto: (hojitas: number): Locucion => ['¡Sorpresa! Ganaron', { numero: hojitas, antesDeSustantivo: true }, 'hojitas.'],
    titulo: '¡Un cofre!',
    abrir: 'Abrir',
    seguir: '¡Sigamos!',
  },
  leccion: {
    animos: ['¡Muy bien!', '¡Excelente!', '¡Eso es!', '¡Bravo!', '¡Así se hace!', '¡Lo lograron!'],
    intentar: 'Intentar otra vez',
    seguir: '¡Sigamos!',
    salir: 'Salir',
    salirPregunta: '¿Quieren salir de la lección? Pueden volver cuando quieran.',
    salirSi: 'Sí, salir',
    salirNo: 'No, seguir jugando',
    repaso: 'Vamos a repasar uno que costó trabajo.',
    terminada: (hojitas: number, aLaPrimera: number, total: number): Locucion =>
      // Sin "cero de seis": si nada salió a la primera, Mixtle anima en lugar de contar.
      aLaPrimera === 0
        ? ['¡Lección terminada! Ganaron', { numero: hojitas, antesDeSustantivo: true }, 'hojitas. ¡Practicando, cada vez les sale mejor!']
        : [
            '¡Lección terminada! Ganaron',
            { numero: hojitas, antesDeSustantivo: true },
            'hojitas, y',
            { numero: aLaPrimera },
            'de',
            { numero: total, antesDeSustantivo: true },
            aLaPrimera === 1 ? 'ejercicios salió a la primera.' : 'ejercicios salieron a la primera.',
          ],
    parqueCrece: '¡Miren cómo crece su parque!',
    tituloFin: '¡Lección terminada!',
    aLaPrimera: (n: number, total: number) => `${n} de ${total} a la primera`,
    alCamino: 'Volver al camino',
    escucharOtraVez: 'Escuchar otra vez',
    siEstaBien: 'Sí, está bien',
    noEstaBien: 'No está bien',
  },
  album: {
    titulo: 'Álbum de animales de Toluca',
    bienvenida: 'Cada unidad que terminen les da una estampa nueva.',
    bloqueada: 'Terminen una unidad para ganar esta estampa.',
    nueva: (nombre: string) => `¡Ganaron una estampa nueva: ${nombre}!`,
  },
  facilitador: {
    titulo: 'Modo facilitador',
    reiniciar: 'Reiniciar este grupo',
    reiniciarConfirmar: '¿Seguro? Se borra todo el avance de este grupo en este aparato.',
    desbloquear: 'Desbloquear todas las lecciones',
    proyector: 'Modo proyector (todo más grande)',
    suave: 'Animaciones suaves (menos movimiento)',
    cerrar: 'Cerrar',
    ayuda: 'Mantén presionado el logo 3 segundos para abrir este panel.',
  },
} as const;
