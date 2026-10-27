import { useApp } from './estado/app';
import { Aventura } from './pantallas/Aventura';
import { Inicio } from './pantallas/Inicio';

export function App() {
  const pantalla = useApp((s) => s.pantalla);
  return pantalla === 'aventura' ? <Aventura /> : <Inicio />;
}
