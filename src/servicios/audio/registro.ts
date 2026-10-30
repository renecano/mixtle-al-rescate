/*
 * Registro de audio para depurar (se activa con `?depurar-audio` en la dirección). Anota, con hora, lo
 * que pasa con la música y la voz: intentos de play(), rechazos, pausas, cambios de pista, ducking,
 * el estado del AudioContext, visibilitychange y recargas. Se ve en la consola y en un recuadro en la
 * esquina de la pantalla, con un botón para copiarlo y mandarlo. Sin `?depurar-audio` no hace nada.
 */

export interface EntradaRegistro {
  /** Hora local (HH:MM:SS.mmm). */
  hora: string;
  /** Segundos desde que cargó la página. */
  t: number;
  evento: string;
  datos?: Record<string, unknown>;
}

const MAXIMO = 400;
const entradas: EntradaRegistro[] = [];
let activo = false;
let recuadro: HTMLElement | null = null;

export function depuracionDeAudioActiva(): boolean {
  return activo;
}

/** Activa el registro (lo hace main.tsx si la dirección trae `?depurar-audio`). */
export function activarDepuracionDeAudio(): void {
  if (activo || typeof document === 'undefined') return;
  activo = true;
  (window as unknown as Record<string, unknown>).__registroAudio = () => [...entradas];
  registrarAudio('registro activado', { agente: navigator.userAgent.slice(0, 80), url: location.href.slice(0, 120) });
  document.addEventListener('visibilitychange', () => registrarAudio('visibilitychange', { visible: document.visibilityState === 'visible' }));
  window.addEventListener('pagehide', () => registrarAudio('pagehide (se va la página)'));
  window.addEventListener('beforeunload', () => registrarAudio('beforeunload (recarga o cierre)'));
  dibujarRecuadro();
}

/** Anota un evento (con `?depurar-audio`; sin él, no cuesta nada). */
export function registrarAudio(evento: string, datos?: Record<string, unknown>): void {
  if (!activo) return;
  const ahora = new Date();
  const entrada: EntradaRegistro = {
    hora: `${ahora.toTimeString().slice(0, 8)}.${String(ahora.getMilliseconds()).padStart(3, '0')}`,
    t: Number((performance.now() / 1000).toFixed(2)),
    evento,
    ...(datos ? { datos } : {}),
  };
  entradas.push(entrada);
  if (entradas.length > MAXIMO) entradas.shift();
  console.log(`[audio ${entrada.hora}] ${evento}`, datos ?? '');
  actualizarRecuadro();
}

/** El registro como texto, para mandarlo. */
export function textoDelRegistro(): string {
  return entradas.map((e) => `${e.hora} ${e.evento}${e.datos ? ' ' + JSON.stringify(e.datos) : ''}`).join('\n');
}

function dibujarRecuadro(): void {
  recuadro = document.createElement('div');
  recuadro.setAttribute('data-registro-audio', '');
  recuadro.style.cssText =
    'position:fixed;left:8px;bottom:8px;z-index:9999;width:min(46rem,70vw);max-height:38vh;overflow:auto;background:rgba(0,0,0,.78);color:#dfe;font:12px/1.35 Consolas,monospace;padding:8px 10px;border-radius:10px;white-space:pre-wrap;pointer-events:auto';
  const boton = document.createElement('button');
  boton.type = 'button';
  boton.textContent = 'Copiar registro';
  boton.style.cssText = 'position:sticky;top:0;float:right;margin:0 0 6px 8px;font:bold 12px system-ui;padding:4px 8px;border-radius:6px;border:0;background:#ffd23f;color:#123d2b;cursor:pointer';
  boton.addEventListener('click', () => {
    void navigator.clipboard?.writeText(textoDelRegistro()).then(
      () => (boton.textContent = 'Copiado'),
      () => (boton.textContent = 'Selecciona y copia el texto'),
    );
  });
  const lineas = document.createElement('div');
  lineas.setAttribute('data-lineas', '');
  recuadro.append(boton, lineas);
  document.body.appendChild(recuadro);
  actualizarRecuadro();
}

function actualizarRecuadro(): void {
  const lineas = recuadro?.querySelector('[data-lineas]');
  if (!lineas) return;
  lineas.textContent = entradas
    .slice(-40)
    .map((e) => `${e.hora} ${e.evento}${e.datos ? ' ' + JSON.stringify(e.datos) : ''}`)
    .join('\n');
  lineas.scrollTop = lineas.scrollHeight;
}
