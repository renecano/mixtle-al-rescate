import { MODELO } from '../../data/modelo';
import { cargarMobileNet } from './mobilenet';
import { cargarTeachableMachine } from './teachableMachine';
import type { Clasificador } from './tipos';

export type { Clasificador } from './tipos';

let cargando: Promise<Clasificador> | null = null;

/**
 * Carga el clasificador configurado en src/data/modelo.ts (una sola vez por sesión).
 * Si hay URL de Teachable Machine se usa ese modelo; si no, MobileNet.
 */
export function cargarClasificador(): Promise<Clasificador> {
  cargando ??= (MODELO.teachableMachineUrl ? cargarTeachableMachine(MODELO.teachableMachineUrl) : cargarMobileNet(MODELO.mobilenet)).catch(
    (e: unknown) => {
      cargando = null; // permite reintentar más tarde (por ejemplo, si regresó el internet)
      throw e;
    },
  );
  return cargando;
}
