// Cambia el proveedor de voz activo: npm run voz:usar -- azure   (o kokoro)
// El activo pasa a "alternos" y el elegido queda como proveedor/voz/ajustes. Después: npm run voz:generar.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ruta = join(import.meta.dirname, '..', '..', 'voz.config.json');
const config = JSON.parse(readFileSync(ruta, 'utf8'));
const elegido = process.argv[2];
const alternos = config.alternos ?? {};
if (!elegido || !alternos[elegido]) {
  console.error(`Uso: npm run voz:usar -- <${Object.keys(alternos).join(' | ') || 'proveedor'}>  (activo ahora: ${config.proveedor})`);
  process.exit(1);
}
const { $comentario: comentarioElegido, ...nuevo } = alternos[elegido];
const resto = { ...alternos };
delete resto[elegido];
const siguiente = {
  $comentario: config.$comentario,
  proveedor: elegido,
  voz: nuevo.voz,
  ajustes: nuevo.ajustes,
  alternos: { ...resto, [config.proveedor]: { voz: config.voz, ajustes: config.ajustes } },
  pronunciacion: config.pronunciacion,
};
if (comentarioElegido) siguiente.alternos[config.proveedor].$comentario = `Antes era el activo.`;
writeFileSync(ruta, `${JSON.stringify(siguiente, null, 2)}\n`);
console.log(`Voz activa: ${elegido} (${nuevo.voz}). Ahora corre: npm run voz:generar`);
