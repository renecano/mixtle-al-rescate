import type { Ejercicio as Datos } from '../../contenido/tipos';
import { AlBote } from './AlBote';
import type { PropsEjercicio } from './comun';
import { EligeImagen } from './EligeImagen';
import { EncuentraError } from './EncuentraError';
import { Ordena } from './Ordena';
import { Parejas } from './Parejas';
import { SiNo } from './SiNo';

/** Muestra el ejercicio que toque según su tipo. */
export function Ejercicio({ ejercicio, ...resto }: PropsEjercicio<Datos>) {
  switch (ejercicio.tipo) {
    case 'elige-imagen':
    case 'escucha-toca':
      return <EligeImagen ejercicio={ejercicio} {...resto} />;
    case 'al-bote':
      return <AlBote ejercicio={ejercicio} {...resto} />;
    case 'parejas':
      return <Parejas ejercicio={ejercicio} {...resto} />;
    case 'si-no':
      return <SiNo ejercicio={ejercicio} {...resto} />;
    case 'ordena':
      return <Ordena ejercicio={ejercicio} {...resto} />;
    case 'encuentra-error':
      return <EncuentraError ejercicio={ejercicio} {...resto} />;
  }
}
