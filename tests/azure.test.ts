// @vitest-environment node
import { existsSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createServer, type IncomingMessage, type Server } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
// @ts-expect-error: módulos .mjs de los scripts (sin tipos)
import * as azure from '../scripts/voz/azure.mjs';
// @ts-expect-error: módulos .mjs de los scripts (sin tipos)
import { aplicadorDePronunciacion } from '../scripts/voz/comun.mjs';
// @ts-expect-error: módulos .mjs de los scripts (sin tipos)
import * as muestras from '../scripts/voz/muestras-azure.mjs';

const configVoz = JSON.parse(readFileSync(join(__dirname, '..', 'voz.config.json'), 'utf8'));
const pronunciar = aplicadorDePronunciacion(configVoz.pronunciacion) as (t: string) => string;

/** Voces como las devuelve /cognitiveservices/voices/list. */
const VOCES = [
  { ShortName: 'es-MX-JorgeNeural', LocalName: 'Jorge', Locale: 'es-MX', Gender: 'Male', VoiceType: 'Neural', StyleList: ['cheerful', 'chat'] },
  { ShortName: 'es-MX-DaliaNeural', LocalName: 'Dalia', Locale: 'es-MX', Gender: 'Female', VoiceType: 'Neural' },
  { ShortName: 'es-US-AlonsoNeural', LocalName: 'Alonso', Locale: 'es-US', Gender: 'Male', VoiceType: 'Neural' },
  { ShortName: 'en-US-JennyNeural', LocalName: 'Jenny', Locale: 'en-US', Gender: 'Female', VoiceType: 'Neural', StyleList: ['cheerful'] },
];
/** Un mp3 de mentira (el contenido no importa para estas pruebas). */
const MP3 = Buffer.from('ID3-mp3-de-prueba');

/** Servidor falso de Azure: lista de voces y síntesis, con un 429 al principio para probar los reintentos. */
let servidor: Server;
let endpoint = '';
const recibidos: { url: string; headers: IncomingMessage['headers']; cuerpo: string }[] = [];
let respuestas429 = 1;

beforeAll(async () => {
  servidor = createServer((req, res) => {
    let cuerpo = '';
    req.on('data', (c) => (cuerpo += c));
    req.on('end', () => {
      recibidos.push({ url: req.url ?? '', headers: req.headers, cuerpo });
      if (req.headers['ocp-apim-subscription-key'] !== 'llave-de-prueba') return void res.writeHead(401).end('sin llave');
      if (req.url === '/cognitiveservices/voices/list') return void res.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify(VOCES));
      if (req.url === '/cognitiveservices/v1' && req.method === 'POST') {
        if (respuestas429 > 0) {
          respuestas429 -= 1;
          return void res.writeHead(429, { 'Retry-After': '0.01' }).end('demasiadas');
        }
        return void res.writeHead(200, { 'Content-Type': 'audio/mpeg' }).end(MP3);
      }
      res.writeHead(404).end();
    });
  });
  await new Promise<void>((r) => servidor.listen(0, '127.0.0.1', r));
  const direccion = servidor.address();
  endpoint = `http://127.0.0.1:${typeof direccion === 'object' && direccion ? direccion.port : 0}`;
});

afterAll(() => new Promise<void>((r) => servidor.close(() => r())));

const entorno = () => ({ AZURE_SPEECH_ENDPOINT: endpoint });

describe('voz con Azure: SSML', () => {
  it('arma el SSML con voz, estilo, tono y velocidad, y escapa el texto', () => {
    const s = azure.ssml({ texto: 'Ana & "Mixtle" <3', voz: 'es-MX-JorgeNeural', estilo: 'cheerful', tono: '+5%', velocidad: 0.95 });
    expect(s).toContain('<voice name="es-MX-JorgeNeural">');
    expect(s).toContain('<mstts:express-as style="cheerful"><prosody pitch="+5%" rate="0.95">');
    expect(s).toContain('Ana &amp; &quot;Mixtle&quot; &lt;3');
    expect(s).toContain('xml:lang="es-MX"');
  });

  it('sin ajustes, la voz habla normal (sin prosody ni estilo)', () => {
    const s = azure.ssml({ texto: 'Hola', voz: 'es-MX-DaliaNeural' });
    expect(s).not.toContain('prosody');
    expect(s).not.toContain('express-as');
  });

  it('la pronunciación respeta las palabras: "cacomixtle" no se vuelve "cacoMíkstle"', () => {
    expect(pronunciar('¡Hola! Soy Mixtle, el cacomixtle del parque.')).toBe('¡Hola! Soy Míkstle, el cacomíkstle del parque.');
    expect(pronunciar('MIXTLE y mixtle')).toBe('Míkstle y míkstle');
  });

  it('las voces MAI-Voice (con ":" en el nombre) dan un nombre de archivo válido en Windows', () => {
    const archivo = muestras.archivoDe({ voz: 'es-MX-Alejo:MAI-Voice-2-Flash', variante: { id: 'normal' }, frase: 'saludo' });
    expect(archivo).toBe('es-MX-Alejo_MAI-Voice-2-Flash--normal--saludo.mp3');
    expect(archivo).not.toMatch(/[:\\/*?"<>|]/);
  });
});

describe('voz con Azure contra un servidor falso', () => {
  it('lista solo las voces es-MX y es-US', async () => {
    const voces = await azure.listarVoces({ region: 'x', llave: 'llave-de-prueba', idiomas: ['es-MX', 'es-US'], entorno: entorno() });
    expect(voces.map((v: { ShortName: string }) => v.ShortName)).toEqual(['es-MX-JorgeNeural', 'es-MX-DaliaNeural', 'es-US-AlonsoNeural']);
  });

  it('sintetiza con la llave en la cabecera, pide mp3 mono y reintenta un 429', async () => {
    respuestas429 = 1;
    const antes = recibidos.length;
    const mp3 = await azure.sintetizar({ texto: 'Hola, soy Míkstle', voz: 'es-MX-JorgeNeural', region: 'x', llave: 'llave-de-prueba', entorno: entorno() });
    expect(Buffer.compare(mp3, MP3)).toBe(0);
    const pedidos = recibidos.slice(antes);
    expect(pedidos).toHaveLength(2); // el 429 y el reintento
    expect(pedidos[1]!.headers['x-microsoft-outputformat']).toBe(azure.FORMATO_SALIDA);
    expect(String(azure.FORMATO_SALIDA)).toContain('mono-mp3');
    expect(pedidos[1]!.headers['content-type']).toBe('application/ssml+xml');
    expect(pedidos[1]!.cuerpo).toContain('Hola, soy Míkstle');
  });

  it('un error que no es 429 ni 5xx no se reintenta y explica qué pasó', async () => {
    await expect(azure.sintetizar({ texto: 'x', voz: 'v', region: 'x', llave: 'equivocada', entorno: entorno() })).rejects.toThrow(/401/);
  });

  it('las muestras: plan dentro de ~20,000 caracteres, mp3 por voz y variante, página para elegir', async () => {
    respuestas429 = 0;
    const raiz = mkdtempSync(join(tmpdir(), 'mixtle-azure-'));
    writeFileSync(join(raiz, '.env.local'), 'AZURE_SPEECH_KEY=llave-de-prueba\nAZURE_SPEECH_REGION=southcentralus\n');
    process.env.AZURE_SPEECH_ENDPOINT = endpoint;
    process.env.AZURE_ESPERA_MS = '0';
    try {
      await muestras.correr({
        raiz,
        aplicarPronunciacion: pronunciar,
        generarReferencia: (_carpeta: string, frases: { id: string }[]) => Object.fromEntries(frases.map((f) => [f.id, `referencia-kokoro--${f.id}.mp3`])),
      });
    } finally {
      delete process.env.AZURE_SPEECH_ENDPOINT;
      delete process.env.AZURE_ESPERA_MS;
    }
    const archivos = readdirSync(join(raiz, 'docs', 'muestras-voz', 'azure'));
    // Jorge: 5 variantes (con estilo alegre) × 4 frases + 2 del nombre; Dalia y Alonso: 4 × 4 + 2.
    expect(archivos).toHaveLength(5 * 4 + 2 + 2 * (4 * 4 + 2));
    expect(archivos).toContain('es-MX-JorgeNeural--estilo-cheerful--saludo.mp3');
    expect(archivos.some((a) => a.startsWith('en-US'))).toBe(false);
    const html = readFileSync(join(raiz, 'docs', 'muestras-voz', 'azure.html'), 'utf8');
    expect(html).toContain('Jorge');
    expect(html).toContain('referencia-kokoro--saludo.mp3');
    expect(html).toContain('TODO(Eco Urban)');
    const uso = JSON.parse(readFileSync(join(raiz, '.voz-uso.json'), 'utf8')) as Record<string, number>;
    const usados = Object.values(uso)[0]!;
    expect(usados).toBeGreaterThan(0);
    expect(usados).toBeLessThanOrEqual(muestras.PRESUPUESTO_MUESTRAS);
  });
});

describe('voz con Azure: no salirse del plan gratuito', () => {
  it('se detiene si el mes pasaría de 400,000 caracteres, salvo con --forzar', () => {
    expect(() => azure.revisarPresupuesto({ usados: 390_000, nuevos: 20_000 })).toThrow(/plan gratuito|--forzar/);
    expect(azure.revisarPresupuesto({ usados: 390_000, nuevos: 20_000, forzar: true })).toMatch(/410,000/);
    expect(azure.revisarPresupuesto({ usados: 0, nuevos: 50_000 })).toMatch(/50,000/);
  });

  it('el registro lleva el uso por mes (y empieza en cero cada mes)', () => {
    const ruta = join(mkdtempSync(join(tmpdir(), 'mixtle-uso-')), '.voz-uso.json');
    let hoy = new Date(2026, 9, 28);
    const r = new azure.RegistroUso(ruta, () => hoy);
    r.sumar(1200);
    r.sumar(300);
    expect(r.usados()).toBe(1500);
    hoy = new Date(2026, 10, 1);
    expect(r.usados()).toBe(0);
    expect(JSON.parse(readFileSync(ruta, 'utf8'))).toEqual({ '2026-10': 1500 });
  });

  it('el plan de muestras deja fuera voces si no caben en el presupuesto', () => {
    const muchas = Array.from({ length: 40 }, (_, i) => ({ ShortName: `es-MX-Voz${i}Neural`, Locale: 'es-MX', VoiceType: 'Neural', StyleList: i % 2 ? ['cheerful'] : [] }));
    const plan = muestras.planDeMuestras(muchas, pronunciar);
    expect(plan.caracteres).toBeLessThanOrEqual(muestras.PRESUPUESTO_MUESTRAS);
    expect(plan.fuera.length).toBeGreaterThan(0);
    // Primero entran las voces con estilos (más expresivas).
    expect(plan.voces[0].StyleList.length).toBeGreaterThan(0);
  });

  it('lee la llave de .env.local, sin el prefijo VITE_', () => {
    const raiz = mkdtempSync(join(tmpdir(), 'mixtle-env-'));
    writeFileSync(join(raiz, '.env.local'), 'VITE_OTRA=x\nAZURE_SPEECH_KEY="abc123"\nAZURE_SPEECH_REGION=southcentralus\n');
    expect(azure.credenciales(raiz, {})).toEqual({ llave: 'abc123', region: 'southcentralus', completas: true });
    expect(azure.credenciales(mkdtempSync(join(tmpdir(), 'mixtle-sin-')), {}).completas).toBe(false);
    expect(existsSync(join(raiz, '.env.local'))).toBe(true);
  });
});
