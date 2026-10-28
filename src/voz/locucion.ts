/**
 * Lo que dice Caco. Puede ser una frase completa o una secuencia de piezas que se encadenan
 * (por ejemplo, "Separaron bien" + 13 + "residuos"), para no grabar una frase por cada número.
 */
export type Pieza = string | { numero: number; antesDeSustantivo?: boolean };
export type Locucion = string | readonly Pieza[];

const UNIDADES = ['cero', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
const DIEZ_A_VEINTINUEVE = [
  'diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve',
  'veinte', 'veintiuno', 'veintidós', 'veintitrés', 'veinticuatro', 'veinticinco', 'veintiséis', 'veintisiete', 'veintiocho', 'veintinueve',
];
const DECENAS = ['', '', '', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];

export const NUMERO_MAXIMO = 100;

/**
 * El número en palabras (0 a 100). Antes de un sustantivo masculino, "uno" se apocopa:
 * "un residuo", "veintiún animales", "treinta y un residuos".
 */
export function numeroEnPalabras(n: number, antesDeSustantivo = false): string {
  if (!Number.isInteger(n) || n < 0 || n > NUMERO_MAXIMO) throw new RangeError(`Número fuera de 0–${NUMERO_MAXIMO}: ${n}`);
  let palabra: string;
  if (n < 10) palabra = UNIDADES[n]!;
  else if (n < 30) palabra = DIEZ_A_VEINTINUEVE[n - 10]!;
  else if (n === 100) palabra = 'cien';
  else palabra = n % 10 === 0 ? DECENAS[n / 10]! : `${DECENAS[Math.floor(n / 10)]} y ${UNIDADES[n % 10]}`;
  if (antesDeSustantivo) palabra = palabra.replace(/uno$/, 'un').replace(/^veintiun$/, 'veintiún');
  return palabra;
}

/** Las piezas de una locución como textos (los números ya en palabras). */
export function piezasDeTexto(l: Locucion): string[] {
  const piezas = typeof l === 'string' ? [l] : l;
  return piezas.map((p) => (typeof p === 'string' ? p : numeroEnPalabras(p.numero, p.antesDeSustantivo)));
}

/**
 * La locución entera como UNA frase hablada (números en palabras): "¡Lección terminada! Ganaron quince
 * hojitas, y cinco de seis ejercicios salieron a la primera." Si esta frase tiene su propio audio, se
 * reproduce de corrido, con entonación natural, en lugar de encadenar piezas.
 */
export function textoHablado(l: Locucion): string {
  return normalizarFrase(piezasDeTexto(l).join(' ').replace(/\s+([.,!?;:])/g, '$1'));
}

/** Lo que se lee en pantalla (subtítulo): con cifras, que se entienden mejor que las palabras. */
export function textoDeLocucion(l: Locucion): string {
  const piezas = typeof l === 'string' ? [l] : l;
  return piezas
    .map((p) => (typeof p === 'string' ? p : String(p.numero)))
    .join(' ')
    .replace(/\s+([.,!?;:])/g, '$1')
    .trim();
}

/** Normaliza un texto antes de buscar su audio: espacios simples, sin espacios en los bordes. */
export function normalizarFrase(texto: string): string {
  return texto.replace(/\s+/g, ' ').trim();
}
