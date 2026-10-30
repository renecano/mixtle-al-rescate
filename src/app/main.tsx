import '@fontsource/nunito/latin-700.css';
import '@fontsource/nunito/latin-800.css';
import '@fontsource/nunito/latin-900.css';
import '@fontsource/baloo-2/latin-800.css';
import './estilos.css';
import './animaciones.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { esMomentoSeguro, vigilarActualizaciones } from '../servicios/actualizacion';
import { enDireccionAnterior } from '../servicios/mudanza';
import { mudarse } from '../servicios/mudarse';
import { vigilarAudio } from '../servicios/audio/motor';
import { pausarDescarga } from '../servicios/sinInternet';
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
// El audio (y la música) empiezan en cuanto el navegador deja: al entrar si ya lo permite (visita de
// regreso) o con el primer toque o tecla, sea donde sea. Cada toque o tecla también lo reanuda si el
// navegador lo pausó (al salir de la app o bloquear la tablet).
if (!mudando) vigilarAudio();
document.addEventListener('pointerdown', () => sonido.desbloquear(), { capture: true });
// Al cambiar de pantalla, la descarga para jugar sin internet espera un momento: lo que pide la
// pantalla nueva (su código, su voz) va primero.
useApp.subscribe((s, antes) => {
  if (s.pantalla !== antes.pantalla) pausarDescarga();
});
document.addEventListener('keydown', () => sonido.desbloquear(), { capture: true });

// Versión nueva publicada: la lista de audios se recarga ya (para que Mixtle use las voces nuevas) y la
// página se recarga en cuanto está en una pantalla segura (inicio, grupos, camino, álbum), nunca a
// media lección ni aventura. El avance está en IndexedDB. Ver servicios/actualizacion.ts.
vigilarActualizaciones(() => {
  void voz.cargarManifiesto();
  const recargar = () => window.location.reload();
  if (esMomentoSeguro(useApp.getState().pantalla)) return recargar();
  const dejar = useApp.subscribe((s) => {
    if (!esMomentoSeguro(s.pantalla)) return;
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
