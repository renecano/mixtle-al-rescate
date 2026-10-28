// Exporta el arte real del juego (los mismos SVG que dibuja src/arte/) a docs/direccion-visual/arte/,
// para que las direcciones visuales de docs/direccion-visual/index.html usen exactamente a Mixtle,
// el parque, los residuos y los botes del juego, no imitaciones.
// Uso: npm run docs:direccion
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { runnerImport } from 'vite';

const CLAVES = [
  'mixtle', 'mixtle-feliz', 'mixtle-celebrando', 'mixtle-senalando', 'mixtle-pensando', 'mixtle-habla', 'mixtle-sorprendido',
  'parque', 'arbol', 'arbusto', 'nube', 'flores-naranja', 'flores-morada', 'flores-amarilla',
  'residuo-manzana', 'residuo-botella', 'residuo-frituras', 'bote-organico', 'bote-reciclable', 'bote-no-reciclable',
  'cofre', 'cofre-abierto', 'hojita', 'icono-estrella', 'icono-jugar', 'icono-sonido', 'icono-musica', 'icono-pantalla',
  'ajolote', 'colibri-feliz', 'mariposa-feliz', 'ardilla-feliz', 'tlacuache',
];

const { catalogoArte } = (await runnerImport('./src/arte/catalogo.ts')).module;
const porClave = new Map(catalogoArte().map((a) => [a.clave, a]));
const carpeta = join(process.cwd(), 'docs', 'direccion-visual', 'arte');
rmSync(carpeta, { recursive: true, force: true });
mkdirSync(carpeta, { recursive: true });
for (const clave of CLAVES) {
  const a = porClave.get(clave);
  if (!a) throw new Error(`No existe el arte "${clave}"`);
  writeFileSync(join(carpeta, `${clave}.svg`), a.svg);
}
console.log(`docs/direccion-visual/arte/: ${CLAVES.length} ilustraciones del juego`);
