// Muestras de voces de Azure para elegir la voz de Mixtle.
// Uso: npm run voz:muestras -- --proveedor=azure     (necesita AZURE_SPEECH_KEY y AZURE_SPEECH_REGION en .env.local)
//
// Consulta las voces es-MX y es-US de la región, genera con cada una las mismas frases en varias
// variantes (normal, con estilo alegre si lo tiene, tono +5 % y +10 %, más lenta) y arma
// docs/muestras-voz/azure.html para escucharlas y elegir. Incluye la voz actual (Kokoro em_alex) como
// referencia. No pasa de ~20,000 caracteres de Azure (el plan gratuito da 500,000 al mes).
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import * as azure from './azure.mjs';

export const PRESUPUESTO_MUESTRAS = 20_000;
export const IDIOMAS = ['es-MX', 'es-US'];
/** Estilos "alegres o amigables", en orden de preferencia. */
export const ESTILOS_ALEGRES = ['cheerful', 'friendly', 'excited', 'hopeful'];

/** Las mismas frases para todas las voces (salen del juego). */
export const FRASES = [
  { id: 'saludo', nombre: 'Saludo', texto: '¡Hola! Soy Mixtle, el cacomixtle del parque. ¡Vamos a ayudar a los animales!' },
  { id: 'acierto', nombre: 'Acierto', texto: '¡Muy bien! La lata se puede reciclar muchas veces y volver a ser lata.' },
  { id: 'pista', nombre: 'Pista amable', texto: '¡Casi! Este casi nunca se puede reciclar. Busca el bote naranja de no reciclable.' },
  { id: 'dato', nombre: 'Dato curioso', texto: 'Muchas mariposas monarca vuelan miles de kilómetros para pasar el invierno en el Estado de México.' },
];
/** Para revisar cómo dice "Mixtle" y "cacomixtle": tal cual y con el diccionario de pronunciación. */
export const FRASE_NOMBRE = 'Me llamo Mixtle y soy un cacomixtle. ¡Mixtle, el cacomixtle, al rescate!';

/** Variantes de una voz. La de estilo solo si la voz tiene un estilo alegre o amigable. */
export function variantesDe(voz) {
  const estilo = ESTILOS_ALEGRES.find((e) => (voz.StyleList ?? []).includes(e));
  return [
    { id: 'normal', nombre: 'Normal', ajustes: {} },
    ...(estilo ? [{ id: `estilo-${estilo}`, nombre: `Estilo «${estilo}»`, ajustes: { estilo } }] : []),
    { id: 'tono-5', nombre: 'Tono +5 %', ajustes: { tono: '+5%' } },
    { id: 'tono-10', nombre: 'Tono +10 %', ajustes: { tono: '+10%' } },
    { id: 'lenta', nombre: 'Un poco más lenta (0.95)', ajustes: { velocidad: 0.95 } },
  ];
}

/** Pedidos de una voz: cada variante con las 4 frases y, en la normal, las dos del nombre. */
export function pedidosDe(voz, aplicarPronunciacion) {
  const pedidos = [];
  for (const v of variantesDe(voz)) {
    for (const f of FRASES) pedidos.push({ voz: voz.ShortName, variante: v, frase: f.id, texto: aplicarPronunciacion(f.texto) });
  }
  pedidos.push({ voz: voz.ShortName, variante: variantesDe(voz)[0], frase: 'nombre-tal-cual', texto: FRASE_NOMBRE });
  pedidos.push({ voz: voz.ShortName, variante: variantesDe(voz)[0], frase: 'nombre-diccionario', texto: aplicarPronunciacion(FRASE_NOMBRE) });
  return pedidos;
}

/**
 * Qué voces caben en el presupuesto: primero las que tienen estilos (más expresivas), luego es-MX,
 * y se agregan voces completas mientras no se pase de `presupuesto` caracteres.
 */
export function planDeMuestras(voces, aplicarPronunciacion, presupuesto = PRESUPUESTO_MUESTRAS) {
  const candidatas = voces
    .filter((v) => IDIOMAS.includes(v.Locale) && (v.VoiceType ?? 'Neural') === 'Neural')
    .sort(
      (a, b) =>
        Number(!!b.StyleList?.length) - Number(!!a.StyleList?.length) ||
        IDIOMAS.indexOf(a.Locale) - IDIOMAS.indexOf(b.Locale) ||
        a.ShortName.localeCompare(b.ShortName),
    );
  const elegidas = [];
  const pedidos = [];
  let total = 0;
  const fuera = [];
  for (const voz of candidatas) {
    const propios = pedidosDe(voz, aplicarPronunciacion);
    const costo = propios.reduce((n, p) => n + azure.caracteres(p.texto), 0);
    if (total + costo > presupuesto) {
      fuera.push(voz.ShortName);
      continue;
    }
    elegidas.push(voz);
    pedidos.push(...propios);
    total += costo;
  }
  return { voces: elegidas, pedidos, caracteres: total, fuera };
}

const escapar = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
/**
 * Nombre del mp3. Las voces nuevas (MAI-Voice) traen ":" en el nombre ("es-MX-Alejo:MAI-Voice-2-Flash"),
 * y en Windows un ":" en un archivo no crea el archivo: lo esconde en un flujo alterno de otro.
 */
export const archivoDe = (p) => `${p.voz.replace(/[:\\/*?"<>|]/g, '_')}--${p.variante.id}--${p.frase}.mp3`;

/** Página para escuchar y elegir (se puede mandar a Eco Urban junto con la carpeta azure/). */
export function paginaDeMuestras({ voces, region, fecha, referencia }) {
  const columnas = FRASES.map((f) => `<th scope="col">${escapar(f.nombre)}</th>`).join('');
  const reproductor = (archivo) => `<audio controls preload="none" src="azure/${escapar(archivo)}"></audio>`;
  const bloques = voces
    .map((voz) => {
      const filas = variantesDe(voz)
        .map((v) => `<tr><th scope="row">${escapar(v.nombre)}</th>${FRASES.map((f) => `<td>${reproductor(archivoDe({ voz: voz.ShortName, variante: v, frase: f.id }))}</td>`).join('')}</tr>`)
        .join('');
      const normal = variantesDe(voz)[0];
      return `<section>
  <h2>${escapar(voz.LocalName ?? voz.DisplayName)} <small>${escapar(voz.ShortName)} · ${escapar(voz.Locale)} · ${voz.Gender === 'Female' ? 'mujer' : 'hombre'}</small></h2>
  <p>${voz.StyleList?.length ? `Estilos: ${escapar(voz.StyleList.join(', '))}` : 'Sin estilos.'}</p>
  <table><thead><tr><th></th>${columnas}</tr></thead><tbody>${filas}</tbody></table>
  <p class="nombre">«Mixtle» y «cacomixtle»: tal cual ${reproductor(archivoDe({ voz: voz.ShortName, variante: normal, frase: 'nombre-tal-cual' }))}
  con el diccionario ${reproductor(archivoDe({ voz: voz.ShortName, variante: normal, frase: 'nombre-diccionario' }))}</p>
</section>`;
    })
    .join('\n');
  return `<!doctype html>
<html lang="es-MX"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Voces para Mixtle (Azure)</title>
<style>
  body { font: 16px/1.5 system-ui, sans-serif; margin: 24px auto; max-width: 1200px; padding: 0 16px; color: #1d2b24; background: #fff8e7; }
  h1 { color: #1f6b4a; } h2 { margin-bottom: 0; } h2 small { font-weight: 400; color: #555; font-size: 0.6em; }
  section { background: #fff; border-radius: 16px; padding: 12px 16px 16px; margin: 16px 0; box-shadow: 0 2px 0 #0002; }
  table { border-collapse: collapse; width: 100%; } th, td { padding: 6px; text-align: left; vertical-align: middle; }
  thead th { font-size: 0.9em; color: #444; } tbody th { font-weight: 600; white-space: nowrap; }
  audio { width: 100%; min-width: 180px; height: 36px; } .nombre audio { width: 240px; vertical-align: middle; }
  .referencia { border: 3px solid #1f6b4a; }
</style></head><body>
<h1>¿Qué voz le queda a Mixtle?</h1>
<p>Las mismas frases del juego, dichas por cada voz de Azure en español de México y de Estados Unidos, en varias formas: normal, con un estilo alegre (si la voz lo tiene), con el tono un poco más alto y un poco más lenta. Arriba está la voz que usa el juego hoy, para comparar. Al final de cada voz se escucha cómo dice «Mixtle» y «cacomixtle».</p>
<p><small>Generado el ${escapar(fecha)} con Azure AI Speech (región ${escapar(region)}). TODO(Eco Urban): elegir la voz y la variante.</small></p>
<section class="referencia">
  <h2>Voz actual <small>Kokoro em_alex · local</small></h2>
  <table><thead><tr>${columnas}</tr></thead><tbody><tr>${FRASES.map((f) => `<td><audio controls preload="none" src="azure/${escapar(referencia[f.id])}"></audio></td>`).join('')}</tr></tbody></table>
  <p class="nombre">«Mixtle» y «cacomixtle» <audio controls preload="none" src="azure/${escapar(referencia.nombre)}"></audio></p>
</section>
${bloques}
</body></html>
`;
}

/** Corre las muestras (solo cuando se ejecuta como script). */
export async function correr({ raiz, aplicarPronunciacion, generarReferencia }) {
  const { llave, region, completas } = azure.credenciales(raiz);
  if (!completas) {
    console.error('Falta la llave de Azure: pon AZURE_SPEECH_KEY y AZURE_SPEECH_REGION en .env.local (sin VITE_).');
    process.exit(1);
  }
  const voces = await azure.listarVoces({ region, llave, idiomas: IDIOMAS });
  console.log(`Voces en ${region}: ${voces.length} (${voces.filter((v) => v.StyleList?.length).length} con estilos)`);
  const plan = planDeMuestras(voces, aplicarPronunciacion);
  if (plan.fuera.length) console.log(`Fuera por presupuesto: ${plan.fuera.join(', ')}`);
  const registro = new azure.RegistroUso(join(raiz, '.voz-uso.json'));
  console.log(azure.revisarPresupuesto({ usados: registro.usados(), nuevos: plan.caracteres, forzar: process.argv.includes('--forzar') }));

  const carpeta = join(raiz, 'docs', 'muestras-voz', 'azure');
  mkdirSync(carpeta, { recursive: true });
  for (const [i, p] of plan.pedidos.entries()) {
    const mp3 = await azure.sintetizar({ texto: p.texto, voz: p.voz, idioma: p.voz.slice(0, 5), ...p.variante.ajustes, region, llave });
    registro.sumar(azure.caracteres(p.texto));
    writeFileSync(join(carpeta, archivoDe(p)), mp3);
    console.log(`[${i + 1}/${plan.pedidos.length}] ${p.voz} ${p.variante.id} ${p.frase}`);
    if (i < plan.pedidos.length - 1) await new Promise((r) => setTimeout(r, Number(process.env.AZURE_ESPERA_MS ?? azure.ESPERA_ENTRE_PETICIONES_MS)));
  }
  const referencia = generarReferencia(carpeta, [...FRASES.map((f) => ({ id: f.id, texto: f.texto })), { id: 'nombre', texto: FRASE_NOMBRE }]);
  const fecha = new Intl.DateTimeFormat('es-MX', { dateStyle: 'long' }).format(new Date());
  writeFileSync(join(raiz, 'docs', 'muestras-voz', 'azure.html'), paginaDeMuestras({ voces: plan.voces, region, fecha, referencia }));
  console.log(`Listo: docs/muestras-voz/azure.html (${plan.voces.length} voces, ${plan.caracteres.toLocaleString('es-MX')} caracteres).`);
}
