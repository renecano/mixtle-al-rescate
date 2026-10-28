import Phaser from 'phaser';
import { ANCHO, PALETA, hex } from '../config';
import { claveImagenResiduo } from '../arte/residuos';
import { CATEGORIAS } from '../data/categorias';
import { RESIDUOS, type Residuo } from '../data/residuos';
import { TEXTOS } from '../data/textos';
import { TEXTOS_AVENTURAS } from '../contenido/aventuras';
import { categoriaDe, esCorrecto, textoAcierto, textoPista } from '../logica/clasificacion';
import type { DatosDiploma } from '../logica/diploma';
import { enFila } from '../logica/disposicion';
import { sonido } from '../servicios/sonido';
import { Ardilla, Colibri, Mariposa } from '../ui/animales';
import { Bote } from '../ui/Bote';
import { agregarBotonSonido } from '../ui/BotonSonido';
import { Mixtle } from '../ui/Mixtle';
import { Clasificador, pedestal } from '../ui/clasificador';
import { botonSiguiente, chispas, confeti } from '../ui/efectos';
import { agregarParque } from '../ui/fondo';
import { BOLSA, MIXTLE_NIVEL, GLOBO_NIVEL } from '../ui/layoutParque';
import { Narrador } from '../ui/Narrador';
import { estiloTexto } from '../ui/texto';
import { entrar, irA } from '../ui/transicion';

const T = TEXTOS_AVENTURAS.u2;
const ESPERA_PISTA_MS = 15000;
const TAMANO_BASURA = 120;

type IdAnimal = keyof typeof T.agradece;

/** Cada animal atrapado y la basura que lo atrapa (la primera, encima de él). */
const ATRAPADOS: { id: IdAnimal; x: number; y: number; basura: { clave: string; residuo?: string; dx: number; dy: number }[] }[] = [
  { id: 'ardilla', x: 690, y: 820, basura: [{ clave: 'anillos', dx: 0, dy: -70 }, { clave: 'residuo-frituras', residuo: 'frituras', dx: 120, dy: 10 }] },
  { id: 'tlacuache', x: 1030, y: 900, basura: [{ clave: 'bolsa-plastico', dx: -10, dy: -60 }, { clave: 'residuo-lata', residuo: 'lata', dx: 150, dy: 0 }] },
  { id: 'colibri', x: 1340, y: 600, basura: [{ clave: 'residuo-popote', residuo: 'popote', dx: -60, dy: 230 }, { clave: 'residuo-botella', residuo: 'botella', dx: 70, dy: 250 }] },
  { id: 'mariposa', x: 1660, y: 760, basura: [{ clave: 'residuo-servilleta', residuo: 'servilleta', dx: -40, dy: 120 }, { clave: 'residuo-jugo', residuo: 'jugo', dx: 90, dy: 110 }] },
];

interface Animal {
  id: IdAnimal;
  objeto: Ardilla | Colibri | Mariposa | Phaser.GameObjects.Image;
  basura: Phaser.GameObjects.Image[];
  libre: boolean;
}

/**
 * Aventura de la unidad 2: "Rescate en el parque". Primero se libera a cada animal tocando
 * la basura que lo atrapa; luego esa basura se separa en sus botes. Nunca hay castigo.
 */
export class RescateScene extends Phaser.Scene {
  private animales: Animal[] = [];
  private mixtle!: Mixtle;
  private narrador!: Narrador;
  private contador!: Phaser.GameObjects.Text;
  private recogidos: Residuo[] = [];
  private rescatados = 0;
  private separados = 0;
  private pista: Phaser.Time.TimerEvent | null = null;
  private ocupado = false;

  constructor() {
    super('Rescate');
  }

  create(): void {
    entrar(this);
    this.animales = [];
    this.recogidos = [];
    this.rescatados = 0;
    this.separados = 0;
    this.ocupado = false;
    this.marcar();
    agregarParque(this);
    this.mixtle = new Mixtle(this, MIXTLE_NIVEL.x, MIXTLE_NIVEL.y, MIXTLE_NIVEL.escala).setDepth(30);
    this.narrador = new Narrador(this, this.mixtle, GLOBO_NIVEL);
    this.crearBolsa();
    this.crearAnimales();
    agregarBotonSonido(this);
    this.time.delayedCall(450, () => this.narrador.decir(T.intro));
    this.reiniciarPista();
  }

  private marcar(): void {
    this.registry.set('marcador', { rescatados: this.rescatados, separados: this.separados });
  }

  private crearBolsa(): void {
    this.add.image(BOLSA.x, BOLSA.y, 'bolsa').setOrigin(0.5, 0.92).setScale(0.62 / 1.2).setDepth(31);
    const insignia = this.add.circle(BOLSA.x + 52, BOLSA.y - 118, 34, hex(PALETA.naranja)).setDepth(32).setStrokeStyle(6, 0xffffff);
    this.contador = this.add.text(insignia.x, insignia.y - 2, '0', estiloTexto(40, PALETA.blanco)).setOrigin(0.5).setDepth(33);
  }

  private crearAnimales(): void {
    for (const a of ATRAPADOS) {
      const objeto =
        a.id === 'ardilla'
          ? new Ardilla(this, a.x, a.y, 0.62)
          : a.id === 'colibri'
            ? new Colibri(this, a.x, a.y, 0.62)
            : a.id === 'mariposa'
              ? new Mariposa(this, a.x, a.y, 0.5)
              : this.add.image(a.x, a.y, 'tlacuache').setOrigin(0.5, 0.9).setScale(0.75 / 1.2).setTint(0xb8b8b8);
      objeto.setDepth(10);
      const animal: Animal = { id: a.id, objeto, basura: [], libre: false };
      animal.basura = a.basura.map((b, i) => {
        const img = this.add.image(a.x + b.dx, a.y + b.dy, b.clave).setDepth(i === 0 ? 12 : 11).setAngle(Phaser.Math.Between(-12, 12));
        img.setScale(TAMANO_BASURA / Math.max(img.width, img.height));
        img.setInteractive({
          hitArea: new Phaser.Geom.Circle(img.width / 2, img.height / 2, Math.max(img.width, img.height) * 0.62),
          hitAreaCallback: Phaser.Geom.Circle.Contains,
          useHandCursor: true,
        });
        img.setName(`basura-${a.id}-${i}`);
        img.once('pointerdown', () => this.recoger(animal, img, b.residuo));
        this.tweens.add({ targets: img, angle: img.angle + 6, duration: 800 + i * 200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        return img;
      });
      this.animales.push(animal);
    }
  }

  private recoger(animal: Animal, img: Phaser.GameObjects.Image, residuo?: string): void {
    animal.basura = animal.basura.filter((b) => b !== img);
    img.disableInteractive();
    this.tweens.killTweensOf(img);
    sonido.tocar('recoger');
    this.reiniciarPista();
    const r = residuo ? RESIDUOS.find((x) => x.id === residuo) : undefined;
    if (r && categoriaDe(r, CATEGORIAS)) this.recogidos.push(r);
    img.setDepth(800);
    this.tweens.add({ targets: img, x: BOLSA.x, duration: 620, ease: 'Linear' });
    this.tweens.add({
      targets: img,
      y: Math.min(img.y, BOLSA.y - 90) - 200,
      duration: 300,
      ease: 'Quad.easeOut',
      onComplete: () => this.tweens.add({ targets: img, y: BOLSA.y - 90, duration: 320, ease: 'Quad.easeIn' }),
    });
    this.tweens.add({
      targets: img,
      scale: img.scale * 0.35,
      angle: img.angle + 300,
      duration: 620,
      onComplete: () => {
        img.destroy();
        sonido.tocar('bolsa');
        this.contador.setText(String(Number(this.contador.text) + 1));
        if (!animal.basura.length) this.liberar(animal);
      },
    });
  }

  private liberar(animal: Animal): void {
    animal.libre = true;
    this.rescatados += 1;
    this.marcar();
    const o = animal.objeto;
    if (o instanceof Phaser.GameObjects.Image && !(o instanceof Ardilla) && !(o instanceof Mariposa)) o.clearTint();
    if ('ponerFeliz' in o) o.ponerFeliz(true);
    sonido.tocar('feliz');
    if (animal.id !== 'ardilla' && animal.id !== 'tlacuache') this.time.delayedCall(250, () => sonido.tocar(animal.id === 'colibri' ? 'pajaro' : 'aleteo'));
    this.tweens.add({ targets: o, y: o.y - 50, duration: 220, yoyo: true, repeat: 1, ease: 'Quad.easeOut' });
    chispas(this, o.x, o.y - 60, 12, 170);
    const todos = this.animales.every((a) => a.libre);
    this.narrador.decir(T.agradece[animal.id], todos ? () => this.empezarASeparar() : undefined);
  }

  /** Segunda parte: la basura recogida se separa en sus botes (como el nivel 2 de la v1). */
  private empezarASeparar(): void {
    if (this.ocupado) return;
    this.ocupado = true;
    this.pista?.remove();
    const velo = this.add.rectangle(ANCHO / 2, 540, ANCHO, 1080, 0xffffff, 0).setDepth(14);
    this.tweens.add({ targets: velo, fillAlpha: 0.45, duration: 500 });
    const fila = enFila(CATEGORIAS.length, 620, 1880, 290);
    const botes = CATEGORIAS.map((c, i) => new Bote(this, fila.xs[i]!, 990, c, fila.ancho).setDepth(20));
    pedestal(this, 1240, 380);
    let aciertos = 0;
    const clasificador = new Clasificador(this, {
      piezas: this.recogidos.map((r) => ({ id: r.id, clave: claveImagenResiduo(r.imagen) })),
      destinos: botes.map((b) => ({ id: b.categoria.id, objeto: b, zona: b.zonaSoltar, resaltar: (si: boolean) => b.resaltar(si) })),
      pedestal: { x: 1240, y: 380 },
      tamano: 220,
      esCorrecto: (p, d) => esCorrecto(this.residuo(p.id), d.id, CATEGORIAS),
      alAparecer: (p) => this.narrador.decir(TEXTOS.nivel2.pregunta(this.residuo(p.id).nombre)),
      alAcertar: (p, d, seguir) => {
        const bote = botes.find((b) => b.categoria.id === d.id)!;
        bote.abrir();
        bote.celebrar();
        this.mixtle.celebrar();
        this.separados += 1;
        this.marcar();
        const lista = TEXTOS.nivel2.celebraciones;
        this.narrador.decir(textoAcierto(this.residuo(p.id), lista[aciertos++ % lista.length]!), seguir);
      },
      alFallar: (p) => this.narrador.decir(textoPista(categoriaDe(this.residuo(p.id), CATEGORIAS)!)),
      alTerminar: () => this.terminar(),
    });
    this.time.delayedCall(600, () => this.narrador.decir(T.separar, () => clasificador.empezar()));
  }

  private residuo(id: string): Residuo {
    return RESIDUOS.find((r) => r.id === id)!;
  }

  private terminar(): void {
    this.mixtle.celebrar();
    confeti(this);
    sonido.celebrar();
    this.narrador.decir(T.fin);
    const datos: DatosDiploma = {
      subtitulo: T.diploma.subtitulo,
      izquierda: { numero: this.rescatados, etiqueta: T.diploma.izquierda(this.rescatados), iconos: ['ardilla-feliz', 'tlacuache', 'colibri-feliz', 'mariposa-feliz'] },
      derecha: { numero: this.separados, etiqueta: T.diploma.derecha(this.separados), iconos: CATEGORIAS.map((c) => `bote-${c.id}`) },
      narracion: T.diploma.narracion(this.rescatados, this.separados),
    };
    botonSiguiente(this, () => irA(this, 'Final', datos), T.botonDiploma, { x: ANCHO - 300, y: 300 });
  }

  /** Si nadie toca nada por un rato, Mixtle ayuda (sin prisa y sin castigo). */
  private reiniciarPista(): void {
    this.pista?.remove();
    this.pista = this.time.addEvent({
      delay: ESPERA_PISTA_MS,
      loop: true,
      callback: () => {
        const basura = this.animales.flatMap((a) => a.basura)[0];
        if (!basura) return;
        this.narrador.decir(T.pista);
        const escala = basura.scale;
        this.tweens.add({ targets: basura, scale: escala * 1.35, duration: 260, yoyo: true, repeat: 3 });
        chispas(this, basura.x, basura.y, 6, 90);
      },
    });
  }
}
