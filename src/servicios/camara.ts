/**
 * Acceso a la cámara para el bonus. Solo se pide cuando alguien toca "Muéstrale a Caco".
 * El video se muestra en pantalla y se clasifica en memoria; nunca se graba ni se envía.
 */
export type MotivoSinCamara = 'sin-soporte' | 'denegada' | 'sin-camara' | 'ocupada' | 'error';

export type ResultadoCamara =
  | { ok: true; video: HTMLVideoElement; espejo: boolean; detener: () => void }
  | { ok: false; motivo: MotivoSinCamara };

/** Traduce el error del navegador a un motivo que el juego sabe explicar. */
export function motivoDeError(error: unknown): MotivoSinCamara {
  const nombre = (error as { name?: string } | null)?.name ?? '';
  if (nombre === 'NotAllowedError' || nombre === 'SecurityError' || nombre === 'PermissionDeniedError') return 'denegada';
  if (nombre === 'NotFoundError' || nombre === 'OverconstrainedError' || nombre === 'DevicesNotFoundError') return 'sin-camara';
  if (nombre === 'NotReadableError' || nombre === 'TrackStartError' || nombre === 'AbortError') return 'ocupada';
  return 'error';
}

export async function abrirCamara(ancho: number, alto: number): Promise<ResultadoCamara> {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) return { ok: false, motivo: 'sin-soporte' };
  let flujo: MediaStream;
  try {
    flujo = await navigator.mediaDevices.getUserMedia({
      audio: false,
      // En tablet preferimos la cámara de atrás (se apunta al objeto); en laptop se usa la que haya.
      video: { facingMode: { ideal: 'environment' }, width: { ideal: 640 }, height: { ideal: 480 } },
    });
  } catch (e) {
    return { ok: false, motivo: motivoDeError(e) };
  }

  const video = document.createElement('video');
  video.setAttribute('playsinline', '');
  video.setAttribute('aria-label', 'Vista de la cámara');
  video.muted = true;
  video.autoplay = true;
  video.srcObject = flujo;
  Object.assign(video.style, {
    width: `${ancho}px`,
    height: `${alto}px`,
    objectFit: 'cover',
    borderRadius: '32px',
    border: '10px solid #FFFFFF',
    boxShadow: '0 12px 0 rgba(18, 61, 43, 0.35)',
    background: '#123d2b',
  });
  const ajustes = flujo.getVideoTracks()[0]?.getSettings();
  // La cámara frontal (o una webcam sin dato) se ve como espejo, que es más natural.
  const espejo = ajustes?.facingMode !== 'environment';
  if (espejo) video.style.transform = 'scaleX(-1)';

  const detener = () => {
    flujo.getTracks().forEach((t) => t.stop());
    video.srcObject = null;
  };
  try {
    await video.play();
  } catch {
    // Algunos navegadores reproducen solos al estar en pantalla; no es un error.
  }
  return { ok: true, video, espejo, detener };
}
