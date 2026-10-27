import Phaser from 'phaser';
import { ANCHO, PALETA, hex } from '../config';
import { claveImagenResiduo } from '../arte/residuos';
import { CATEGORIAS } from '../data/categorias';
import { RESIDUOS, type Residuo } from '../data/residuos';
import { TEXTOS } from '../data/textos';
import { categoriaDe, esCorrecto, textoAcierto, textoPista } from '../logica/clasificacion';
import { enFila } from '../logica/disposicion';
import { escenaSiguiente } from '../logica/flujo';
import { progreso } from '../logica/progreso';
import { sonido } from '../servicios/sonido';
import { Bote } from '../ui/Bote';
import { agregarBotonSonido } from '../ui/BotonSonido';
import { Caco } from '../ui/Caco';
import { botonSiguiente, chispas, confeti } from '../ui/efectos';
import { agregarParque } from '../ui/fondo';
import { BOLSA, CACO_NIVEL } from '../ui/layoutParque';
import { Narrador } from '../ui/Narrador';
import { estiloTexto } from '../ui/texto';
import { entrar, irA } from '../ui/transicion';

const PEDESTAL = { x: 1220, y: 390 };
const TAMANO_RESIDUO = 230;
const BOTES = { desde: 560, hasta: 1880, yBase: 975, anchoMaximo: 300 };

type Estado = 'esperando' | 'animando' | 'fin';

/** Nivel 2: arrastrar cada residuo recolectado a su bote. Nunca hay castigo. */
export class Nivel2Scene extends Phaser.Scene {
  private cola: Residuo[] = [];
  private actual: { residuo: Residuo; imagen: Phaser.GameObjects.Image } | null = null;
  private botes: Bote[] = [];
  private caco!: Caco;
  private narrador!: Narrador;
  private contador!: Phaser.GameObjects.Text;
  private estado: Estado = 'animando';
  private aciertos = 0;
  private finArrastre = 0;

  constructor() {
    super('Nivel2');
  }

  create(): void {
    entrar(this);
    agregarParque(this);
    this.add.rectangle(ANCHO / 2, 540, ANCHO, 1080, 0xffffff, 0.22).setDepth(-50);

    this.cola = this.residuosRecolectados();
    this.estado = 'animando';
    this.aciertos = 0;
    this.actual = null;

    this.caco = new Caco(this, CACO_NIVEL.x, CACO_NIVEL.y, CACO_NIVEL.escala).setDepth(30);
    this.narrador = new Narrador(this, this.caco, { x: 40, y: 300, ancho: 820, apuntaA: { x: 230, y: 900 }, tamanoTexto: 46 });
    this.crearBolsa();
    this.crearBotes();
    this.crearPedestal();
    this.configurarArrastre();
    agregarBotonSonido(this);

    this.time.delayedCall(450, () => this.narrador.decir(TEXTOS.nivel2.instruccion, () => this.siguienteResiduo()));
  }

  /** Lo que se recogió en el nivel 1. Si se entra directo (pruebas), se usan todos. */
  private residuosRecolectados(): Residuo[] {
    const p = progreso();
    if (!p.recolectados.length) RESIDUOS.forEach((r) => p.recolectar(r.id));
    return p.recolectados
      .map((id) => RESIDUOS.find((r) => r.id === id))
      .filter((r): r is Residuo => !!r && !!categoriaDe(r, CATEGORIAS) && !p.separados.has(r.id));
  }

  private crearBolsa(): void {
    this.add.image(BOLSA.x, BOLSA.y, 'bolsa').setOrigin(0.5, 0.92).setScale(0.62 / 1.2).setDepth(31);
    const insignia = this.add.circle(BOLSA.x + 52, BOLSA.y - 118, 34, hex(PALETA.naranja)).setDepth(32);
    insignia.setStrokeStyle(6, 0xffffff);
    this.contador = this.add
      .text(insignia.x, insignia.y - 2, String(this.cola.length), estiloTexto(40, PALETA.blanco))
      .setOrigin(0.5)
      .setDepth(33);
  }

  private crearBotes(): void {
    const fila = enFila(CATEGORIAS.length, BOTES.desde, BOTES.hasta, BOTES.anchoMaximo);
    this.botes = CATEGORIAS.map((c, i) => {
      const bote = new Bote(this, fila.xs[i]!, BOTES.yBase, c, fila.ancho).setDepth(20);
      bote.on('pointerup', () => {
        // Tocar un bote también sirve (mouse del facilitador o si cuesta arrastrar).
        if (this.time.now - this.finArrastre < 250) return;
        if (this.actual && this.estado === 'esperando') this.soltarEn(bote);
      });
      return bote;
    });
  }

  private crearPedestal(): void {
    const brillo = this.add.circle(PEDESTAL.x, PEDESTAL.y, 178, 0xffffff, 0.5).setDepth(15);
    this.add.circle(PEDESTAL.x, PEDESTAL.y, 152, hex(PALETA.crema), 0.95).setDepth(15).setStrokeStyle(8, hex(PALETA.pasto));
    this.tweens.add({ targets: brillo, scale: 1.08, alpha: 0.35, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }

  private configurarArrastre(): void {
    this.input.on('dragstart', (_p: Phaser.Input.Pointer, obj: Phaser.GameObjects.Image) => {
      if (this.estado !== 'esperando' || obj !== this.actual?.imagen) return;
      this.tweens.killTweensOf(obj);
      obj.setScale(this.escalaResiduo(obj) * 1.08).setAngle(0);
      sonido.tocar('toque');
    });
    this.input.on('drag', (_p: Phaser.Input.Pointer, obj: Phaser.GameObjects.Image, x: number, y: number) => {
      if (this.estado !== 'esperando' || obj !== this.actual?.imagen) return;
      obj.setPosition(x, y);
      this.botes.forEach((b) => b.resaltar(b.zonaSoltar.contains(x, y)));
    });
    this.input.on('dragend', (p: Phaser.Input.Pointer, obj: Phaser.GameObjects.Image) => {
      if (this.estado !== 'esperando' || obj !== this.actual?.imagen) return;
      this.finArrastre = this.time.now;
      this.botes.forEach((b) => b.resaltar(false));
      const movio = Phaser.Math.Distance.Between(p.downX, p.downY, p.upX, p.upY) > 20;
      const bote = this.botes.find((b) => b.zonaSoltar.contains(obj.x, obj.y));
      if (bote) this.soltarEn(bote);
      else {
        this.regresar(obj);
        // Un toque sin arrastrar: Caco repite la pregunta.
        if (!movio) this.narrador.decir(TEXTOS.nivel2.pregunta(this.actual.residuo.nombre));
      }
    });
  }

  private escalaResiduo(img: Phaser.GameObjects.Image): number {
    return TAMANO_RESIDUO / Math.max(img.width, img.height);
  }

  private siguienteResiduo(): void {
    const residuo = this.cola.shift();
    this.contador.setText(String(this.cola.length));
    if (!residuo) {
      this.terminar();
      return;
    }
    // Sale de la bolsa de Caco y llega al centro.
    const imagen = this.add.image(BOLSA.x, BOLSA.y - 90, claveImagenResiduo(residuo.imagen)).setDepth(700);
    imagen.setScale(this.escalaResiduo(imagen) * 0.3).setName(`residuo-${residuo.id}`);
    this.actual = { residuo, imagen };
    sonido.tocar('recoger');
    this.tweens.add({
      targets: imagen,
      x: PEDESTAL.x,
      y: PEDESTAL.y,
      scale: this.escalaResiduo(imagen),
      duration: 650,
      ease: 'Back.easeOut',
      onComplete: () => {
        const radio = Math.max(imagen.width, imagen.height) * 0.6;
        imagen.setInteractive({
          hitArea: new Phaser.Geom.Circle(imagen.width / 2, imagen.height / 2, radio),
          hitAreaCallback: Phaser.Geom.Circle.Contains,
          draggable: true,
          useHandCursor: true,
        });
        this.flotar(imagen);
        this.estado = 'esperando';
        this.narrador.decir(TEXTOS.nivel2.pregunta(residuo.nombre));
      },
    });
  }

  private flotar(img: Phaser.GameObjects.Image): void {
    this.tweens.add({ targets: img, y: PEDESTAL.y - 14, angle: 4, duration: 1100, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }

  private regresar(img: Phaser.GameObjects.Image, alTerminar?: () => void): void {
    this.tweens.killTweensOf(img);
    this.tweens.add({
      targets: img,
      x: PEDESTAL.x,
      y: PEDESTAL.y,
      angle: 0,
      scale: this.escalaResiduo(img),
      duration: 520,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.flotar(img);
        alTerminar?.();
      },
    });
  }

  private soltarEn(bote: Bote): void {
    const actual = this.actual;
    if (!actual) return;
    if (esCorrecto(actual.residuo, bote.categoria.id, CATEGORIAS)) this.acierto(actual.residuo, actual.imagen, bote);
    else this.otraVez(actual.residuo, actual.imagen, bote);
  }

  private acierto(residuo: Residuo, img: Phaser.GameObjects.Image, bote: Bote): void {
    this.estado = 'animando';
    img.disableInteractive();
    this.tweens.killTweensOf(img);
    progreso().separar(residuo.id);
    bote.abrir();
    const boca = bote.boca;
    this.tweens.add({
      targets: img,
      x: boca.x,
      y: boca.y - 120,
      scale: this.escalaResiduo(img) * 0.6,
      angle: 0,
      duration: 260,
      ease: 'Quad.easeOut',
      onComplete: () => {
        img.setDepth(19); // detrás del bote para que "entre"
        this.tweens.add({
          targets: img,
          y: boca.y + 40,
          scale: this.escalaResiduo(img) * 0.35,
          duration: 280,
          ease: 'Quad.easeIn',
          onComplete: () => {
            img.destroy();
            bote.celebrar();
            sonido.tocar('acierto');
            chispas(this, boca.x, boca.y - 80, 12, 160);
            this.caco.celebrar();
            const lista = TEXTOS.nivel2.celebraciones;
            const celebracion = lista[this.aciertos % lista.length]!;
            this.aciertos += 1;
            this.actual = null;
            this.narrador.decir(textoAcierto(residuo, celebracion), () => this.siguienteResiduo());
          },
        });
      },
    });
  }

  private otraVez(residuo: Residuo, img: Phaser.GameObjects.Image, bote: Bote): void {
    this.estado = 'animando';
    bote.sacudir();
    sonido.tocar('otraVez');
    const correcta = categoriaDe(residuo, CATEGORIAS)!;
    this.narrador.decir(textoPista(correcta));
    // Si se tocó el bote, primero se asoma hacia él y luego regresa.
    if (Phaser.Math.Distance.Between(img.x, img.y, PEDESTAL.x, PEDESTAL.y) < 40) {
      this.tweens.killTweensOf(img);
      this.tweens.add({
        targets: img,
        x: Phaser.Math.Linear(PEDESTAL.x, bote.x, 0.3),
        y: Phaser.Math.Linear(PEDESTAL.y, bote.boca.y, 0.3),
        duration: 200,
        yoyo: true,
        onComplete: () => this.regresar(img, () => (this.estado = 'esperando')),
      });
    } else {
      this.regresar(img, () => (this.estado = 'esperando'));
    }
  }

  private terminar(): void {
    if (this.estado === 'fin') return;
    this.estado = 'fin';
    this.caco.celebrar();
    confeti(this);
    sonido.tocar('fanfarria');
    this.narrador.decir(TEXTOS.nivel2.fin);
    botonSiguiente(this, () => irA(this, escenaSiguiente('Nivel2')), TEXTOS.seguir);
  }
}
