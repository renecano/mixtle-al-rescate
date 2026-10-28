import type { Unidad } from '../tipos';

/*
 * Unidad 1 — Separa tu basura.
 * TODO(Eco Urban): validar consignas, pistas y clasificación con las educadoras y educadores.
 * Las categorías siguen src/data/categorias.ts (orgánico / reciclable / no reciclable).
 */
export const U1: Unidad = {
  id: 'u1',
  numero: 1,
  titulo: 'Separa tu basura',
  tema: 'Aprendemos a separar la basura en orgánica, reciclable y no reciclable.',
  color: '#1F6B4A',
  cofreTrasLeccion: 0,
  estampa: {
    id: 'cacomixtle',
    arte: 'caco',
    nombre: 'El cacomixtle',
    dato: 'El cacomixtle sale de noche y tiene una cola larga con anillos blancos y negros.',
  },
  aventura: { id: 'u1-aventura', titulo: 'Limpia el parque', arte: 'bolsa' },
  lecciones: [
    {
      id: 'u1-l1',
      titulo: 'Los tres botes',
      arte: 'bote-organico',
      bienvenida: '¡Vamos a conocer los tres botes!',
      ejercicios: [
        {
          tipo: 'escucha-toca',
          id: 'u1-l1-e1',
          consigna: 'Toca la cáscara de plátano.',
          pista: 'Es amarilla y viene de una fruta.',
          opciones: [
            { id: 'platano', arte: 'residuo-platano', nombre: 'la cáscara de plátano' },
            { id: 'lata', arte: 'residuo-lata', nombre: 'la lata' },
            { id: 'popote', arte: 'residuo-popote', nombre: 'el popote' },
          ],
          correcta: 'platano',
        },
        {
          tipo: 'elige-imagen',
          id: 'u1-l1-e2',
          consigna: '¿Cuál va en el bote verde?',
          pista: 'En el bote verde va lo que viene de plantas o animales.',
          opciones: [
            { id: 'manzana', arte: 'residuo-manzana', nombre: 'el corazón de manzana' },
            { id: 'botella', arte: 'residuo-botella', nombre: 'la botella' },
            { id: 'frituras', arte: 'residuo-frituras', nombre: 'la envoltura de frituras' },
          ],
          correcta: 'manzana',
          conTexto: true,
        },
        {
          tipo: 'al-bote',
          id: 'u1-l1-e3',
          consigna: 'Lleva cada basura a su bote.',
          pista: 'Fíjate en el dibujo de cada bote.',
          residuos: ['hojas', 'lata', 'servilleta'],
        },
        {
          tipo: 'si-no',
          id: 'u1-l1-e4',
          consigna: '¿Está bien tirar la lata en el bote azul?',
          pista: 'La lata se puede convertir en una lata nueva.',
          arte: 'residuo-lata',
          respuesta: true,
          porque: 'La lata se recicla en el bote azul.',
        },
        {
          tipo: 'parejas',
          id: 'u1-l1-e5',
          consigna: 'Une cada basura con su bote.',
          pista: 'Busca el bote con el mismo dibujo que le toca.',
          pares: [
            { izquierda: { id: 'huevo', arte: 'residuo-huevo', nombre: 'la cáscara de huevo' }, derecha: { id: 'organico', arte: 'bote-organico', nombre: 'el bote verde' } },
            { izquierda: { id: 'periodico', arte: 'residuo-periodico', nombre: 'el periódico' }, derecha: { id: 'reciclable', arte: 'bote-reciclable', nombre: 'el bote azul' } },
            { izquierda: { id: 'popote', arte: 'residuo-popote', nombre: 'el popote' }, derecha: { id: 'no-reciclable', arte: 'bote-no-reciclable', nombre: 'el bote naranja' } },
          ],
        },
        {
          tipo: 'muestrale',
          id: 'u1-l1-e6',
          consigna: 'Muéstrale a Caco una basura de verdad.',
          pista: 'Ponla cerca de la cámara para que Caco la vea.',
          respaldo: {
            tipo: 'elige-imagen',
            id: 'u1-l1-e6-respaldo',
            consigna: '¿Cuál va en el bote azul?',
            pista: 'En el bote azul va lo que se puede reciclar.',
            opciones: [
              { id: 'carton', arte: 'residuo-carton', nombre: 'la caja de cartón' },
              { id: 'hojas', arte: 'residuo-hojas', nombre: 'las hojas secas' },
              { id: 'servilleta', arte: 'residuo-servilleta', nombre: 'la servilleta usada' },
            ],
            correcta: 'carton',
            conTexto: true,
          },
        },
      ],
    },
    {
      id: 'u1-l2',
      titulo: 'Basura en su lugar',
      arte: 'bote-reciclable',
      bienvenida: '¡A buscar la basura que está fuera de su lugar!',
      ejercicios: [
        {
          tipo: 'encuentra-error',
          id: 'u1-l2-e1',
          consigna: 'Toca la basura que está tirada en el parque.',
          pista: 'Busca cosas que no deberían estar en el pasto.',
          escena: 'parque',
          objetos: [
            { id: 'lata', arte: 'residuo-lata', nombre: 'la lata', x: 30, y: 78, ancho: 9, mal: true },
            { id: 'frituras', arte: 'residuo-frituras', nombre: 'la envoltura', x: 72, y: 84, ancho: 9, mal: true },
            { id: 'arbusto', arte: 'arbusto', nombre: 'el arbusto', x: 55, y: 68, ancho: 16, mal: false },
            { id: 'flores', arte: 'flores-morada', nombre: 'las flores', x: 88, y: 76, ancho: 10, mal: false },
          ],
        },
        {
          tipo: 'ordena',
          id: 'u1-l2-e2',
          consigna: 'Ordena cómo crece una planta, del principio al final.',
          pista: 'Primero va la tierra, luego algo pequeñito.',
          pasos: [
            { id: 'tierra', arte: 'hoyo', nombre: 'la tierra' },
            { id: 'brote', arte: 'brote', nombre: 'el brote' },
            { id: 'arbol', arte: 'arbolito', nombre: 'el árbol' },
          ],
        },
        {
          tipo: 'si-no',
          id: 'u1-l2-e3',
          consigna: '¿Está bien tirar la envoltura de frituras en el pasto?',
          pista: 'La basura en el pasto lastima a los animales.',
          arte: 'residuo-frituras',
          respuesta: false,
          porque: 'La basura va en su bote, no en el pasto.',
        },
        {
          tipo: 'escucha-toca',
          id: 'u1-l2-e4',
          consigna: 'Toca el bote azul.',
          pista: 'Es el bote con las flechas.',
          opciones: [
            { id: 'organico', arte: 'bote-organico', nombre: 'el bote verde' },
            { id: 'reciclable', arte: 'bote-reciclable', nombre: 'el bote azul' },
            { id: 'no-reciclable', arte: 'bote-no-reciclable', nombre: 'el bote naranja' },
          ],
          correcta: 'reciclable',
        },
        {
          tipo: 'al-bote',
          id: 'u1-l2-e5',
          consigna: 'Ayuda a Caco a separar esta basura.',
          pista: 'Mira el dibujo de cada bote.',
          residuos: ['botella', 'platano', 'frituras'],
        },
        {
          tipo: 'elige-imagen',
          id: 'u1-l2-e6',
          consigna: '¿Cuál va en el bote naranja?',
          pista: 'En el bote naranja va lo que casi nunca se recicla.',
          opciones: [
            { id: 'servilleta', arte: 'residuo-servilleta', nombre: 'la servilleta usada' },
            { id: 'lata', arte: 'residuo-lata', nombre: 'la lata' },
            { id: 'manzana', arte: 'residuo-manzana', nombre: 'el corazón de manzana' },
          ],
          correcta: 'servilleta',
          conTexto: true,
        },
      ],
    },
  ],
};
