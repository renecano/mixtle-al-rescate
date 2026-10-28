import { useApp } from './estado/app';
import { Album } from './pantallas/Album';
import { Aventura } from './pantallas/Aventura';
import { Camino } from './pantallas/Camino';
import { Grupos } from './pantallas/Grupos';
import { Inicio } from './pantallas/Inicio';
import { Leccion } from './pantallas/Leccion';

export function App() {
  const pantalla = useApp((s) => s.pantalla);
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
