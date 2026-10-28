import Phaser from 'phaser';
import { ANCHO, ALTO, PALETA, hex } from '../config';
import { COSAS_LONCHERA, type IdCosa } from '../aventuras/datos';
import { TEXTOS_AVENTURAS } from '../contenido/aventuras';
import { figurasRepetidas, type DatosDiploma } from '../logica/diploma';
import { sonido } from '../servicios/sonido';
import { agregarBotonSonido } from '../ui/BotonSonido';
import { Caco } from '../ui/Caco';
import { Clasificador, pedestal, type Destino } from '../ui/clasificador';
import { botonSiguiente, chispas, confeti } from '../ui/efectos';
import { CACO_NIVEL, GLOBO_NIVEL } from '../ui/layoutParque';
import { Narrador } from '../ui/Narrador';
import { estiloTexto } from '../ui/texto';
import { entrar, irA } from '../ui/transicion';

const T = TEXTOS_AVENTURAS.u5;


const PEDESTAL = { x: 1240, y: 360 };
const CAJA = { ancho: 460, alto: 330, y: 800 };

/**
 * Aventura de la unidad 5: "Mi lonchera sin basura". Cada cosa se lleva a la lonchera (si se usa
 * muchas veces) o a "Mejor no" (si se vuelve basura al usarla). Se arrastra o se toca el destino.
 */
export class LoncheraScene extends Phaser.Scene {
  private caco!: Caco;
  private narrador!: Narrador;
  private reutilizables = 0;
  private evitados = 0;
  private dentro: Phaser.GameObjects.Image[] = [];

  constructor() {
    super('Lonchera');
  }

  create(): void {
    entrar(this);
    this.reutilizables = 0;
    this.evitados = 0;
    this.dentro = [];
    this.marcar();
    this.dibujarFondo();
    this.caco = new Caco(this, CACO_NIVEL.x, CACO_NIVEL.y, CACO_NIVEL.escala).setDepth(30);
    this.narrador = new Narrador(this, this.caco, GLOBO_NIVEL);
    const lonchera = this.caja(820, 'lonchera', T.etiquetaLonchera, PALETA.morado, 'destino-lonchera');
    const mejorNo = this.caja(1640, 'carita-triste', T.etiquetaMejorNo, PALETA.naranja, 'destino-mejor-no');
    pedestal(this, PEDESTAL.x, PEDESTAL.y);
    agregarBotonSonido(this);

    const clasificador = new Clasificador(this, {
      piezas: COSAS_LONCHERA.map((c) => ({ id: c.id, clave: c.clave })),
      destinos: [lonchera, mejorNo],
      pedestal: PEDESTAL,
      tamano: 230,
      esCorrecto: (p, d) => this.cosa(p.id).reutilizable === (d.id === 'lonchera'),
      alAparecer: (p) => this.narrador.decir(T.preguntas[p.id as IdCosa]),
      alAcertar: (p, d, seguir) => {
        const cosa = this.cosa(p.id);
        if (cosa.reutilizable) {
          this.reutilizables += 1;
          this.guardarEnLonchera(cosa.clave);
        } else this.evitados += 1;
        this.marcar();
        chispas(this, d.zona.centerX, d.zona.centerY - 60, 10, 140);
        this.caco.celebrar();
        this.narrador.decir(T.porque[cosa.id], seguir);
      },
      alFallar: (p) => this.narrador.decir(this.cosa(p.id).reutilizable ? T.casiReutilizable : T.casiDesechable),
      alTerminar: () => this.terminar(),
    });
    this.time.delayedCall(450, () => this.narrador.decir(T.intro, () => clasificador.empezar()));
  }

  private marcar(): void {
    this.registry.set('marcador', { reutilizables: this.reutilizables, evitados: this.evitados });
  }

  private cosa(id: string) {
    return COSAS_LONCHERA.find((c) => c.id === id)!;
  }

  /** Salón con una mesa: el lugar donde se arma la lonchera. */
  private dibujarFondo(): void {
    const g = this.add.graphics().setDepth(-10);
    g.fillStyle(hex(PALETA.crema), 1).fillRect(0, 0, ANCHO, ALTO);
    g.fillStyle(0xf4e3b5, 1).fillRect(0, 0, ANCHO, 120);
    // Ventana con el parque.
    g.fillStyle(0xcfeaf7, 1).fillRoundedRect(1460, 150, 360, 260, 20);
    g.fillStyle(0xa9d98b, 1).fillRoundedRect(1460, 320, 360, 90, { tl: 0, tr: 0, bl: 20, br: 20 });
    g.lineStyle(14, 0xa8925a, 1).strokeRoundedRect(1460, 150, 360, 260, 20).lineBetween(1640, 150, 1640, 410);
    // Mesa.
    g.fillStyle(0x9c6b3f, 1).fillRect(0, 640, ANCHO, ALTO - 640);
    g.fillStyle(0xb98552, 1).fillRect(0, 640, ANCHO, 40);
  }

  /** Un destino grande: caja con su dibujo y su nombre (dibujo + texto, nunca solo color). */
  private caja(x: number, clave: string, texto: string, color: string, nombre: string): Destino {
    const { ancho, alto, y } = CAJA;
    const fondo = this.add.graphics();
    fondo.fillStyle(0x000000, 0.15).fillRoundedRect(-ancho / 2 + 8, -alto / 2 + 12, ancho, alto, 36);
    fondo.fillStyle(0xffffff, 0.95).fillRoundedRect(-ancho / 2, -alto / 2, ancho, alto, 36);
    fondo.lineStyle(10, hex(color), 1).strokeRoundedRect(-ancho / 2, -alto / 2, ancho, alto, 36);
    const dibujo = this.add.image(0, -30, clave);
    dibujo.setScale(190 / Math.max(dibujo.width, dibujo.height));
    const etiqueta = this.add.text(0, alto / 2 - 50, texto, estiloTexto(48, color)).setOrigin(0.5);
    const contenedor = this.add.container(x, y, [fondo, dibujo, etiqueta]).setDepth(20).setSize(ancho, alto);
    // Phaser mide el área desde la esquina del tamaño (centrado en el origen).
    contenedor.setInteractive({ hitArea: new Phaser.Geom.Rectangle(0, 0, ancho, alto), hitAreaCallback: Phaser.Geom.Rectangle.Contains, useHandCursor: true });
    contenedor.setName(nombre);
    const resalte = this.add.graphics().setDepth(21);
    return {
      id: nombre === 'destino-lonchera' ? 'lonchera' : 'mejor-no',
      objeto: contenedor,
      zona: new Phaser.Geom.Rectangle(x - ancho / 2, y - alto / 2, ancho, alto),
      resaltar: (si) => {
        resalte.clear();
        if (si) resalte.lineStyle(14, hex(PALETA.crema), 1).strokeRoundedRect(x - ancho / 2 - 10, y - alto / 2 - 10, ancho + 20, alto + 20, 40);
      },
    };
  }

  /** Lo reutilizable se queda a la vista, en fila junto a la lonchera. */
  private guardarEnLonchera(clave: string): void {
    const i = this.dentro.length;
    const img = this.add.image(560 + (i % 5) * 64, 560 - Math.floor(i / 5) * 70, clave).setDepth(22);
    img.setScale(0);
    this.tweens.add({ targets: img, scale: 60 / Math.max(img.width, img.height), duration: 300, ease: 'Back.easeOut' });
    this.dentro.push(img);
  }

  private terminar(): void {
    this.caco.celebrar();
    confeti(this);
    sonido.celebrar();
    this.narrador.decir(T.fin);
    const datos: DatosDiploma = {
      subtitulo: T.diploma.subtitulo,
      izquierda: { numero: this.reutilizables, etiqueta: T.diploma.izquierda(this.reutilizables), iconos: ['lonchera', 'botella-reutilizable'] },
      derecha: { numero: this.evitados, etiqueta: T.diploma.derecha(this.evitados), figuras: figurasRepetidas('vaso-desechable', this.evitados) },
      narracion: T.diploma.narracion(this.reutilizables, this.evitados),
    };
    botonSiguiente(this, () => irA(this, 'Final', datos), T.botonDiploma, { x: ANCHO - 300, y: 300 });
  }
}
