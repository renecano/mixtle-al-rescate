import { ESCENARIO } from './escenario';
import { ICONOS } from './iconos';
import { PERSONAJES } from './personajes';
import { ARTE_RESIDUOS } from './residuos';
import type { ArteSvg } from './svg';

/** Todas las ilustraciones que BootScene rasteriza al iniciar. */
export function catalogoArte(): ArteSvg[] {
  return [...ICONOS, ...PERSONAJES, ...ESCENARIO, ...ARTE_RESIDUOS];
}
