import { CLAVES, guardarInterruptor, leerInterruptor } from './preferencias';

type Oyente = (activo: boolean) => void;

/** Un interruptor de audio recordado en el dispositivo, con aviso a quien lo escuche. */
export class Interruptor {
  private activo: boolean;
  private oyentes = new Set<Oyente>();

  constructor(private readonly clave: string) {
    this.activo = leerInterruptor(clave);
  }

  get estaActivo(): boolean {
    return this.activo;
  }

  alternar(): boolean {
    this.fijar(!this.activo);
    return this.activo;
  }

  fijar(activo: boolean): void {
    if (activo === this.activo) return;
    this.activo = activo;
    guardarInterruptor(this.clave, activo);
    this.oyentes.forEach((o) => o(activo));
  }

  escuchar(oyente: Oyente): () => void {
    this.oyentes.add(oyente);
    return () => {
      this.oyentes.delete(oyente);
    };
  }
}

/** Voz de Caco y efectos de sonido. */
export const estadoSonido = new Interruptor(CLAVES.sonido);
/** Música de fondo (botón aparte, como pide el diseño). */
export const estadoMusica = new Interruptor(CLAVES.musica);
