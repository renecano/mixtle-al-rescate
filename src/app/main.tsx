import '@fontsource/nunito/latin-700.css';
import '@fontsource/nunito/latin-800.css';
import '@fontsource/nunito/latin-900.css';
import './estilos.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { exponerParaPruebas } from '../servicios/pruebas';
import { sonido } from '../servicios/sonido';
import { voz } from '../servicios/voz';
import { App } from './App';

exponerParaPruebas();
void voz.cargarManifiesto();
// El audio (y la música) solo pueden empezar tras un toque: lo desbloqueamos con el primero, sea donde sea.
document.addEventListener('pointerdown', () => sonido.desbloquear(), { once: true, capture: true });

createRoot(document.getElementById('app')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
