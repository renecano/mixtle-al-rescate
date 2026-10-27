/**
 * Acceso a la cámara para el bonus. Solo se pide cuando alguien toca "Muéstrale a Caco".
 * El video se muestra en pantalla y se clasifica en memoria; nunca se graba ni se envía.
 */
export type MotivoSinCamara = 'sin-soporte' | 'denegada' | 'sin-camara' | 'ocupada' | 'sin-respuesta' | 'error';

/** Flujos de cámara abiertos ahora mismo (para comprobar que se apagan al salir del bonus). */
const activos = new Set<MediaStream>();

export function camarasActivas(): number {
  return [...activos].filter((f) => f.getTracks().some((t) => t.readyState === 'live')).length;
}

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

/** Si nadie responde el aviso de permiso en este tiempo, se sigue sin cámara. */
const ESPERA_PERMISO_MS = 30_000;

/**
 * Pide la cámara. `cancelada` permite abandonar la espera (por ejemplo, si el facilitador
 * elige jugar con dibujos); si la cámara llega tarde, se apaga en ese momento.
 */
export async function abrirCamara(
  ancho: number,
  alto: number,
  cancelada: () => boolean = () => false,
  esperaMaxMs = ESPERA_PERMISO_MS,
): Promise<ResultadoCamara> {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) return { ok: false, motivo: 'sin-soporte' };
  const pedido = navigator.mediaDevices.getUserMedia({
    audio: false,
    // En tablet preferimos la cámara de atrás (se apunta al objeto); en laptop se usa la que haya.
    video: { facingMode: { ideal: 'environment' }, width: { ideal: 640 }, height: { ideal: 480 } },
  });
  let flujo: MediaStream | 'tiempo';
  try {
    flujo = await Promise.race([pedido, new Promise<'tiempo'>((r) => window.setTimeout(() => r('tiempo'), esperaMaxMs))]);
  } catch (e) {
    return { ok: false, motivo: motivoDeError(e) };
  }
  if (flujo === 'tiempo' || cancelada()) {
    // Si el permiso se concede después, se apaga de inmediato: nadie está mirando.
    void pedido.then((tarde) => tarde.getTracks().forEach((t) => t.stop())).catch(() => undefined);
    if (flujo !== 'tiempo') flujo.getTracks().forEach((t) => t.stop());
    return { ok: false, motivo: 'sin-respuesta' };
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

  activos.add(flujo);
  const detener = () => {
    flujo.getTracks().forEach((t) => t.stop());
    activos.delete(flujo);
    video.srcObject = null;
  };
  try {
    await video.play();
  } catch {
    // Algunos navegadores reproducen solos al estar en pantalla; no es un error.
  }
  return { ok: true, video, espejo, detener };
}
