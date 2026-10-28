// Proveedor de voz "azure": Azure AI Speech por su API REST (fetch + SSML), sin SDK.
//
// La llave SOLO se usa aquí, al GENERAR los audios en la computadora de quien prepara el juego.
// El juego publicado reproduce mp3 pregenerados y nunca llama a Azure. Por eso las variables NO
// llevan el prefijo VITE_ (Vite jamás las manda al navegador) y se leen de .env.local (ignorado por git).
//
// Plan gratuito (F0): 0.5 millones de caracteres al mes. Este módulo cuenta los caracteres antes de
// cada corrida, lleva el uso del mes en .voz-uso.json y se detiene si el mes pasaría de 400,000.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

/** mp3 mono; después pasa por la misma normalización de volumen que el resto de las voces. */
export const FORMATO_SALIDA = 'audio-24khz-48kbitrate-mono-mp3';
export const LIMITE_MENSUAL = 400_000;
/** F0 admite pocas peticiones por minuto: se espera entre una y otra (AZURE_ESPERA_MS la cambia, p. ej. en pruebas). */
export const ESPERA_ENTRE_PETICIONES_MS = Number(process.env.AZURE_ESPERA_MS ?? 3100);

/** AZURE_SPEECH_KEY y AZURE_SPEECH_REGION de las variables de entorno o de .env.local. */
export function credenciales(raiz, entorno = process.env) {
  const archivo = join(raiz, '.env.local');
  const local = {};
  if (existsSync(archivo)) {
    for (const linea of readFileSync(archivo, 'utf8').split(/\r?\n/)) {
      const m = linea.match(/^\s*(AZURE_SPEECH_KEY|AZURE_SPEECH_REGION)\s*=\s*"?([^"\r\n]*)"?\s*$/);
      if (m) local[m[1]] = m[2].trim();
    }
  }
  const llave = entorno.AZURE_SPEECH_KEY || local.AZURE_SPEECH_KEY || '';
  const region = entorno.AZURE_SPEECH_REGION || local.AZURE_SPEECH_REGION || '';
  return { llave, region, completas: !!llave && !!region };
}

/** Dirección del servicio. AZURE_SPEECH_ENDPOINT permite apuntar a un servidor falso en las pruebas. */
export function base(region, entorno = process.env) {
  return (entorno.AZURE_SPEECH_ENDPOINT || `https://${region}.tts.speech.microsoft.com`).replace(/\/$/, '');
}

export function escaparXml(texto) {
  return texto.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

/**
 * SSML de una frase. `estilo` (por ejemplo "cheerful"), `tono` ("+5%") y `velocidad` (0.95) son
 * opcionales; sin ellos, la voz habla con su forma normal.
 */
export function ssml({ texto, voz, idioma = 'es-MX', estilo = '', tono = '', velocidad = 1 }) {
  let cuerpo = escaparXml(texto);
  const prosodia = [];
  if (tono && tono !== '+0%' && tono !== '0%') prosodia.push(`pitch="${tono}"`);
  if (velocidad && Number(velocidad) !== 1) prosodia.push(`rate="${Number(velocidad)}"`);
  if (prosodia.length) cuerpo = `<prosody ${prosodia.join(' ')}>${cuerpo}</prosody>`;
  if (estilo) cuerpo = `<mstts:express-as style="${escaparXml(estilo)}">${cuerpo}</mstts:express-as>`;
  return (
    `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="${idioma}">` +
    `<voice name="${escaparXml(voz)}">${cuerpo}</voice></speak>`
  );
}

/** Caracteres que cobra Azure por una frase (el texto que se lee; las etiquetas SSML no cuentan). */
export const caracteres = (texto) => [...texto].length;

const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

/** Petición con reintentos: 429 y errores 5xx esperan cada vez más (o lo que diga Retry-After). */
async function conReintentos(hacer, { reintentos = 5, esperaBase = 2000, esperar = dormir } = {}) {
  for (let intento = 0; ; intento++) {
    const r = await hacer();
    if (r.ok) return r;
    const reintentable = r.status === 429 || r.status >= 500;
    if (!reintentable || intento >= reintentos) {
      const detalle = await r.text().catch(() => '');
      throw new Error(`Azure respondió ${r.status}${detalle ? `: ${detalle.slice(0, 200)}` : ''}`);
    }
    const retryAfter = Number(r.headers.get('retry-after'));
    await esperar(Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : esperaBase * 2 ** intento);
  }
}

/** Voces de la región. Con `idiomas`, solo esas (por ejemplo ["es-MX", "es-US"]). */
export async function listarVoces({ region, llave, idiomas, fetch: f = globalThis.fetch, entorno, ...op }) {
  const r = await conReintentos(() => f(`${base(region, entorno)}/cognitiveservices/voices/list`, { headers: { 'Ocp-Apim-Subscription-Key': llave } }), op);
  const voces = await r.json();
  return idiomas ? voces.filter((v) => idiomas.includes(v.Locale)) : voces;
}

/** Sintetiza una frase y devuelve el mp3 (Buffer). */
export async function sintetizar({ texto, voz, idioma, estilo, tono, velocidad, region, llave, fetch: f = globalThis.fetch, entorno, ...op }) {
  const cuerpo = ssml({ texto, voz, idioma, estilo, tono, velocidad });
  const r = await conReintentos(
    () =>
      f(`${base(region, entorno)}/cognitiveservices/v1`, {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': llave,
          'Content-Type': 'application/ssml+xml',
          'X-Microsoft-OutputFormat': FORMATO_SALIDA,
          'User-Agent': 'mixtle-al-rescate-voz',
        },
        body: cuerpo,
      }),
    op,
  );
  return Buffer.from(await r.arrayBuffer());
}

/** Uso del mes en .voz-uso.json (ignorado por git): { "2026-10": 12345, … }. */
export class RegistroUso {
  constructor(ruta, hoy = () => new Date()) {
    this.ruta = ruta;
    this.hoy = hoy;
  }
  get mes() {
    const d = this.hoy();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }
  leer() {
    try {
      return existsSync(this.ruta) ? JSON.parse(readFileSync(this.ruta, 'utf8')) : {};
    } catch {
      return {};
    }
  }
  usados() {
    return this.leer()[this.mes] ?? 0;
  }
  sumar(n) {
    const datos = this.leer();
    datos[this.mes] = (datos[this.mes] ?? 0) + n;
    writeFileSync(this.ruta, `${JSON.stringify(datos, null, 2)}\n`);
  }
}

/**
 * ¿Cabe la corrida en el mes? Devuelve el resumen; lanza si pasaría del límite (salvo con forzar).
 */
export function revisarPresupuesto({ usados, nuevos, limite = LIMITE_MENSUAL, forzar = false }) {
  const total = usados + nuevos;
  const resumen = `Azure: esta corrida envía ${nuevos.toLocaleString('es-MX')} caracteres; este mes van ${usados.toLocaleString('es-MX')}; quedarían ${total.toLocaleString('es-MX')} de ${limite.toLocaleString('es-MX')} (plan gratuito: 500,000).`;
  if (total > limite && !forzar) throw new Error(`${resumen}\nSe detiene para no salir del plan gratuito. Si de verdad hace falta, agrega --forzar.`);
  return resumen;
}
