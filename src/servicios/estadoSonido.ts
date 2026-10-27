import { guardarSonidoActivo, leerSonidoActivo } from './preferencias';

type Oyente = (activo: boolean) => void;

/** Estado único de "sonido activo": controla efectos y voz a la vez. */
class EstadoSonido {
  private activo = leerSonidoActivo();
  private oyentes = new Set<Oyente>();

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
    guardarSonidoActivo(activo);
    this.oyentes.forEach((o) => o(activo));
  }

  escuchar(oyente: Oyente): () => void {
    this.oyentes.add(oyente);
    return () => this.oyentes.delete(oyente);
  }
}

export const estadoSonido = new EstadoSonido();
