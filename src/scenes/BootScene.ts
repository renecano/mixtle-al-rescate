import Phaser from 'phaser';
import { ALTO, ANCHO, PALETA, hex } from '../config';
import { catalogoArte } from '../arte/catalogo';
import { claveImagenResiduo, esArchivo } from '../arte/residuos';
import { aDataUri } from '../arte/svg';
import { CATEGORIAS } from '../data/categorias';
import { RESIDUOS } from '../data/residuos';
import { validarConfiguracion } from '../logica/clasificacion';
import { ORDEN_ESCENAS } from '../logica/flujo';
import { estiloTexto } from '../ui/texto';

/** Rasteriza las ilustraciones SVG, carga imágenes propias de residuos y muestra una barra de carga. */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload(): void {
    this.cameras.main.setBackgroundColor(PALETA.verde);
    const ancho = 760;
    const marco = this.add.graphics();
    marco.fillStyle(0xffffff, 0.25).fillRoundedRect(ANCHO / 2 - ancho / 2, ALTO / 2 - 24, ancho, 48, 24);
    const barra = this.add.graphics();
    this.add.text(ANCHO / 2, ALTO / 2 - 90, 'Caco al rescate', estiloTexto(72, PALETA.blanco)).setOrigin(0.5);

    this.load.on('progress', (p: number) => {
      barra.clear();
      barra.fillStyle(hex(PALETA.crema), 1);
      barra.fillRoundedRect(ANCHO / 2 - ancho / 2 + 6, ALTO / 2 - 18, Math.max(36, (ancho - 12) * p), 36, 18);
    });

    for (const a of catalogoArte()) {
      this.load.svg(a.clave, aDataUri(a.svg), { width: a.ancho, height: a.alto });
    }
    // Imágenes propias de residuos (archivos en /public), si Eco Urban agrega alguna.
    for (const r of RESIDUOS) {
      if (esArchivo(r.imagen)) this.load.image(claveImagenResiduo(r.imagen), r.imagen);
    }

    const errores = validarConfiguracion(CATEGORIAS, RESIDUOS);
    if (errores.length) console.error('Revisa src/data/categorias.ts y src/data/residuos.ts:\n' + errores.join('\n'));
  }

  create(): void {
    const params = new URLSearchParams(window.location.search);
    if (params.has('galeria')) {
      this.scene.start('Galeria');
      return;
    }
    // Atajo para revisar una pantalla directamente (solo en desarrollo o pruebas): ?escena=Nivel2
    const escena = params.get('escena');
    const permitido = import.meta.env.DEV || params.has('e2e');
    if (permitido && escena && (ORDEN_ESCENAS as readonly string[]).includes(escena)) {
      this.scene.start(escena);
      return;
    }
    this.scene.start('Inicio');
  }
}
