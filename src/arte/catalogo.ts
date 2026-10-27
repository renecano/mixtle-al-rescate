import { ESCENARIO } from './escenario';
import { ICONOS } from './iconos';
import { PERSONAJES } from './personajes';
import type { ArteSvg } from './svg';

/** Todas las ilustraciones que BootScene rasteriza al iniciar. */
export function catalogoArte(): ArteSvg[] {
  return [...ICONOS, ...PERSONAJES, ...ESCENARIO];
}
