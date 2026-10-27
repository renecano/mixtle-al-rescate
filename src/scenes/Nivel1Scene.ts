import Phaser from 'phaser';
import { PALETA, hex } from '../config';
import { claveImagenResiduo } from '../arte/residuos';
import { ANIMALES } from '../data/animales';
import { RESIDUOS, type Residuo } from '../data/residuos';
import { TEXTOS } from '../data/textos';
import { escenaSiguiente } from '../logica/flujo';
import { progreso } from '../logica/progreso';
import { crearAleatorio, repartir } from '../logica/reparto';
import { sonido } from '../servicios/sonido';
import { AnimalesParque } from '../ui/animalesParque';
import { agregarBotonSonido } from '../ui/BotonSonido';
import { Caco } from '../ui/Caco';
import { botonSiguiente, chispas, confeti } from '../ui/efectos';
import { agregarParque } from '../ui/fondo';
import { BOLSA, CACO_NIVEL, GLOBO_NIVEL, ZONAS } from '../ui/layoutParque';
import { Narrador } from '../ui/Narrador';
import { estiloTexto } from '../ui/texto';
import { entrar, irA } from '../ui/transicion';

const TAMANO_RESIDUO = 124;
const ESPERA_PISTA_MS = 15000;

interface Pieza {
  residuo: Residuo;
  zona: number;
  imagen: Phaser.GameObjects.Image;
}

/** Nivel 1: tocar la basura para guardarla en la bolsa de Caco. */
export class Nivel1Scene extends Phaser.Scene {
  private piezas: Pieza[] = [];
  private caco!: Caco;
  private narrador!: Narrador;
  private animales!: AnimalesParque;
  private bolsa!: Phaser.GameObjects.Image;
  private contador!: Phaser.GameObjects.Text;
  private pista: Phaser.Time.TimerEvent | null = null;

  constructor() {
    super('Nivel1');
  }

  create(): void {
    entrar(this);
    agregarParque(this);
    this.animales = new AnimalesParque(this);
    this.caco = new Caco(this, CACO_NIVEL.x, CACO_NIVEL.y, CACO_NIVEL.escala).setDepth(30);
    this.narrador = new Narrador(this, this.caco, GLOBO_NIVEL);
    this.crearBolsa();
    this.crearBasura();
    agregarBotonSonido(this);

    this.time.delayedCall(450, () => this.narrador.decir(TEXTOS.nivel1.instruccion));
    this.reiniciarPista();
  }

  private crearBolsa(): void {
    this.bolsa = this.add.image(BOLSA.x, BOLSA.y, 'bolsa').setOrigin(0.5, 0.92).setScale(0.62 / 1.2).setDepth(31);
    const insignia = this.add.circle(BOLSA.x + 52, BOLSA.y - 118, 34, hex(PALETA.naranja)).setDepth(32);
    insignia.setStrokeStyle(6, 0xffffff);
    this.contador = this.add
      .text(insignia.x, insignia.y - 2, '0', estiloTexto(40, PALETA.blanco))
      .setOrigin(0.5)
      .setDepth(33);
  }

  private crearBasura(): void {
    const colocaciones = repartir(
      RESIDUOS,
      ZONAS.map((z) => z.reparto),
      crearAleatorio(Date.now()),
    );
    this.piezas = colocaciones.map((c) => {
      const imagen = this.add.image(c.x, c.y, claveImagenResiduo(c.item.imagen)).setAngle(c.angulo).setDepth(10 + c.y / 100);
      imagen.setScale(TAMANO_RESIDUO / Math.max(imagen.width, imagen.height));
      // Área de toque generosa (más grande que el dibujo) para dedos pequeños.
      const radio = Math.max(imagen.width, imagen.height) * 0.62;
      imagen.setInteractive({
        hitArea: new Phaser.Geom.Circle(imagen.width / 2, imagen.height / 2, radio),
        hitAreaCallback: Phaser.Geom.Circle.Contains,
        useHandCursor: true,
      });
      imagen.setName(`residuo-${c.item.id}`);
      const pieza: Pieza = { residuo: c.item, zona: c.zona, imagen };
      imagen.on('pointerdown', () => this.recoger(pieza));
      this.tweens.add({
        targets: imagen,
        angle: c.angulo + 6,
        duration: 900 + Math.random() * 500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
      return pieza;
    });
  }

  private recoger(pieza: Pieza): void {
    if (!this.piezas.includes(pieza)) return;
    this.piezas = this.piezas.filter((p) => p !== pieza);
    const { imagen } = pieza;
    imagen.disableInteractive();
    this.tweens.killTweensOf(imagen);
    sonido.tocar('recoger');
    progreso().recolectar(pieza.residuo.id);
    this.reiniciarPista();

    const destino = { x: this.bolsa.x, y: this.bolsa.y - 90 };
    imagen.setDepth(800);
    // Vuela en arco hasta la bolsa.
    this.tweens.add({ targets: imagen, x: destino.x, duration: 620, ease: 'Linear' });
    this.tweens.add({
      targets: imagen,
      y: Math.min(imagen.y, destino.y) - 220,
      duration: 300,
      ease: 'Quad.easeOut',
      onComplete: () => {
        this.tweens.add({ targets: imagen, y: destino.y, duration: 320, ease: 'Quad.easeIn' });
      },
    });
    this.tweens.add({
      targets: imagen,
      scale: imagen.scale * 0.35,
      angle: imagen.angle + 300,
      duration: 620,
      onComplete: () => {
        imagen.destroy();
        this.alGuardar(pieza);
      },
    });
  }

  private alGuardar(pieza: Pieza): void {
    sonido.tocar('bolsa');
    const total = progreso().recolectados.length;
    this.contador.setText(String(total));
    this.tweens.add({ targets: this.bolsa, scaleY: this.bolsa.scaleY * 0.88, duration: 90, yoyo: true });
    this.tweens.add({ targets: this.contador, scale: 1.5, duration: 120, yoyo: true });
    const masUno = this.add
      .text(this.bolsa.x, this.bolsa.y - 170, '+1', estiloTexto(54, PALETA.naranja, { stroke: PALETA.blanco, strokeThickness: 10 }))
      .setOrigin(0.5)
      .setDepth(850);
    this.tweens.add({ targets: masUno, y: masUno.y - 90, alpha: 0, duration: 900, ease: 'Quad.easeOut', onComplete: () => masUno.destroy() });

    const quedanEnZona = this.piezas.some((p) => p.zona === pieza.zona);
    const alFinal = this.piezas.length ? undefined : () => this.terminar();
    if (!quedanEnZona) this.zonaLimpia(pieza.zona, alFinal);
    else alFinal?.();
  }

  private zonaLimpia(zona: number, despues?: () => void): void {
    const id = ZONAS[zona]!.animal;
    const animal = ANIMALES.find((a) => a.id === id);
    if (!animal || this.animales.estaFeliz(id)) {
      despues?.();
      return;
    }
    progreso().ayudarAnimal(id);
    this.animales.ponerFeliz(id);
    sonido.tocar('feliz');
    if (id !== 'ardilla') this.time.delayedCall(250, () => sonido.tocar(id === 'colibri' ? 'pajaro' : 'aleteo'));
    const pos = this.animales.posicion(id);
    chispas(this, pos.x, pos.y, 12, 170);
    this.narrador.decir(animal.agradece, despues);
  }

  private terminar(): void {
    this.pista?.remove();
    this.caco.celebrar();
    confeti(this);
    sonido.tocar('fanfarria');
    this.narrador.decir(TEXTOS.nivel1.fin);
    botonSiguiente(this, () => irA(this, escenaSiguiente('Nivel1')), TEXTOS.seguir);
  }

  /** Si nadie toca nada por un rato, Caco ayuda (sin prisa y sin castigo). */
  private reiniciarPista(): void {
    this.pista?.remove();
    this.pista = this.time.addEvent({
      delay: ESPERA_PISTA_MS,
      loop: true,
      callback: () => {
        const pieza = this.piezas[0];
        if (!pieza) return;
        this.narrador.decir(TEXTOS.nivel1.pista);
        const escala = pieza.imagen.scale;
        this.tweens.add({ targets: pieza.imagen, scale: escala * 1.35, duration: 260, yoyo: true, repeat: 3 });
        chispas(this, pieza.imagen.x, pieza.imagen.y, 6, 90);
      },
    });
  }
}
