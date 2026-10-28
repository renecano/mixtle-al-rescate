import { claveImagenResiduo } from '../arte/residuos';
import { TEXTOS_AVENTURAS } from '../contenido/aventuras';

/*
 * Datos de juego de las aventuras (sin Phaser), para poder revisarlos y probarlos aparte.
 */

/** Cuántas basuras caen en el bonus "Lluvia de basura" de la aventura 1. */
export const BASURAS_BONUS = 5;

export type Carril = 'arriba' | 'abajo';
export type IdCosa = keyof typeof TEXTOS_AVENTURAS.u5.preguntas;

/**
 * Lo que va apareciendo en el camino, en segundos desde que arranca la bici.
 * Nunca hay humo en los dos carriles a la vez: siempre se puede esquivar.
 */
export const RECORRIDO_BICI: { t: number; tipo: 'hojita' | 'humo'; carril: Carril }[] = [
  { t: 1.5, tipo: 'hojita', carril: 'abajo' },
  { t: 3.5, tipo: 'humo', carril: 'abajo' },
  { t: 5.5, tipo: 'hojita', carril: 'arriba' },
  { t: 7.5, tipo: 'humo', carril: 'arriba' },
  { t: 9.0, tipo: 'hojita', carril: 'abajo' },
  { t: 11.0, tipo: 'humo', carril: 'abajo' },
  { t: 12.5, tipo: 'hojita', carril: 'arriba' },
  { t: 14.0, tipo: 'hojita', carril: 'arriba' },
  { t: 16.0, tipo: 'humo', carril: 'arriba' },
  { t: 18.0, tipo: 'hojita', carril: 'abajo' },
  { t: 20.0, tipo: 'humo', carril: 'abajo' },
  { t: 21.5, tipo: 'hojita', carril: 'arriba' },
  { t: 23.5, tipo: 'humo', carril: 'arriba' },
  { t: 25.0, tipo: 'hojita', carril: 'abajo' },
  { t: 27.0, tipo: 'humo', carril: 'abajo' },
  { t: 28.5, tipo: 'hojita', carril: 'arriba' },
  { t: 30.0, tipo: 'hojita', carril: 'arriba' },
  { t: 32.0, tipo: 'humo', carril: 'arriba' },
  { t: 33.5, tipo: 'hojita', carril: 'abajo' },
];

/** Las cosas para la lonchera, en el orden en que aparecen. `reutilizable`: va en la lonchera. */
export const COSAS_LONCHERA: { id: IdCosa; clave: string; reutilizable: boolean }[] = [
  { id: 'botella-reutilizable', clave: 'botella-reutilizable', reutilizable: true },
  { id: 'jugo', clave: claveImagenResiduo('jugo'), reutilizable: false },
  { id: 'recipiente', clave: 'recipiente', reutilizable: true },
  { id: 'frituras', clave: claveImagenResiduo('frituras'), reutilizable: false },
  { id: 'servilleta-tela', clave: 'servilleta-tela', reutilizable: true },
  { id: 'tenedor-plastico', clave: 'tenedor-plastico', reutilizable: false },
  { id: 'cuchara', clave: 'cuchara', reutilizable: true },
  { id: 'vaso-desechable', clave: 'vaso-desechable', reutilizable: false },
  { id: 'fruta', clave: 'fruta', reutilizable: true },
  { id: 'bolsa-plastico', clave: 'bolsa-plastico', reutilizable: false },
];
