import { ICONOS } from './iconos';
import type { ArteSvg } from './svg';

/** Todas las ilustraciones que BootScene rasteriza al iniciar. */
export function catalogoArte(): ArteSvg[] {
  return [...ICONOS];
}
