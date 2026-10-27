import type { Prediccion } from '../../logica/interpretacion';

export type FuenteImagen = HTMLVideoElement | HTMLCanvasElement | HTMLImageElement;

/**
 * Cualquier modelo que clasifique una imagen. Cambiar MobileNet por otro modelo
 * (por ejemplo, Teachable Machine) es implementar esta interfaz.
 * La imagen se procesa en memoria, en el propio dispositivo; no se guarda ni se envía.
 */
export interface Clasificador {
  readonly nombre: string;
  clasificar(fuente: FuenteImagen): Promise<Prediccion[]>;
}
