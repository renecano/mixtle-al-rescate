import '@fontsource/nunito/latin-700.css';
import '@fontsource/nunito/latin-800.css';
import '@fontsource/nunito/latin-900.css';
import '@fontsource/baloo-2/latin-800.css';
import './estilos.css';
import './animaciones.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { vigilarActualizaciones } from '../servicios/actualizacion';
import { enDireccionAnterior } from '../servicios/mudanza';
import { mudarse } from '../servicios/mudarse';
import { vigilarRendimiento } from '../servicios/rendimiento';
import { exponerParaPruebas } from '../servicios/pruebas';
import { sonido } from '../servicios/sonido';
import { voz } from '../servicios/voz';
import { App } from './App';
import { useApp } from './estado/app';

// En la dirección anterior (caco-al-rescate.vercel.app) el juego se muda a la nueva con su avance.
const mudando = enDireccionAnterior();
if (mudando) {
  document.getElementById('app')!.textContent = 'Mixtle al rescate tiene nueva dirección. Llevando su avance…';
  void mudarse();
}

exponerParaPruebas();
// Si este equipo no sostiene las animaciones, se calman solas (ver servicios/rendimiento.ts).
if (!mudando) vigilarRendimiento(() => useApp.getState().suavizarPorRendimiento());
if (!mudando) void voz.cargarManifiesto();
// El audio (y la música) solo pueden empezar tras un toque: lo desbloqueamos con el primero, sea donde sea.
document.addEventListener('pointerdown', () => sonido.desbloquear(), { once: true, capture: true });

// Versión nueva publicada: la lista de audios se recarga ya (para que Mixtle use las voces nuevas) y la
// página se recarga en la pantalla de inicio, nunca a media lección. El avance está en IndexedDB.
vigilarActualizaciones(() => {
  void voz.cargarManifiesto();
  const recargar = () => window.location.reload();
  if (useApp.getState().pantalla === 'inicio') return recargar();
  const dejar = useApp.subscribe((s) => {
    if (s.pantalla !== 'inicio') return;
    dejar();
    recargar();
  });
});

if (!mudando) {
  createRoot(document.getElementById('app')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
