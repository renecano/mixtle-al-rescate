import { MotionConfig } from 'motion/react';
import { lazy, Suspense } from 'react';
import { PantallaCarga } from './componentes/PantallaCarga';
import { PanelTransicion, useTransicionMarca } from './componentes/TransicionMarca';
import { useApp, type Pantalla as NombrePantalla } from './estado/app';
import { cargarAlbum, cargarAventura, cargarCamino, cargarGrupos, cargarLeccion } from './pantallas/cargadores';
import { Inicio } from './pantallas/Inicio';

/*
 * La pantalla de inicio viene con la app; las demás se descargan al necesitarlas (así lo que baja
 * antes de la primera pantalla se queda en ~250 KB). Mientras baja una, se ve la pantalla de carga.
 */
const Grupos = lazy(() => cargarGrupos().then((m) => ({ default: m.Grupos })));
const Camino = lazy(() => cargarCamino().then((m) => ({ default: m.Camino })));
const Leccion = lazy(() => cargarLeccion().then((m) => ({ default: m.Leccion })));
const Aventura = lazy(() => cargarAventura().then((m) => ({ default: m.Aventura })));
const Album = lazy(() => cargarAlbum().then((m) => ({ default: m.Album })));

function Pantalla({ pantalla }: { pantalla: NombrePantalla }) {
  switch (pantalla) {
    case 'grupos':
      return <Grupos />;
    case 'camino':
      return <Camino />;
    case 'leccion':
      return <Leccion />;
    case 'aventura':
      return <Aventura />;
    case 'album':
      return <Album />;
    default:
      return <Inicio />;
  }
}

export function App() {
  const suave = useApp((s) => s.suave);
  const { mostrada, fase } = useTransicionMarca();
  return (
    // Movimiento reducido: el del sistema ("user") o, con "animaciones suaves", siempre.
    <MotionConfig reducedMotion={suave ? 'always' : 'user'}>
      <Suspense fallback={<PantallaCarga />}>
        <Pantalla pantalla={mostrada} />
      </Suspense>
      <PanelTransicion fase={fase} />
    </MotionConfig>
  );
}
