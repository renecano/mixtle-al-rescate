import Phaser from 'phaser';
import { ANCHO, PALETA, hex } from '../config';
import { claveImagenResiduo } from '../arte/residuos';
import { CATEGORIAS, type Categoria } from '../data/categorias';
import { MAPEO_IMAGENET } from '../data/mapeoImagenet';
import { MODELO } from '../data/modelo';
import { RESIDUOS, type Residuo } from '../data/residuos';
import { TEXTOS } from '../data/textos';
import { categoriaDe, descripcionBote, textoPista } from '../logica/clasificacion';
import { enFila } from '../logica/disposicion';
import { escenaSiguiente } from '../logica/flujo';
import { interpretar } from '../logica/interpretacion';
import { progreso } from '../logica/progreso';
import { abrirCamara } from '../servicios/camara';
import { cargarClasificador, type Clasificador } from '../servicios/clasificador';
import { sonido } from '../servicios/sonido';
import { Boton } from '../ui/Boton';
import { agregarBotonSonido } from '../ui/BotonSonido';
import { Bote } from '../ui/Bote';
import { Caco } from '../ui/Caco';
import { chispas } from '../ui/efectos';
import { agregarParque } from '../ui/fondo';
import { CACO_NIVEL } from '../ui/layoutParque';
import { Narrador } from '../ui/Narrador';
import { estiloTexto } from '../ui/texto';
import { entrar, irA } from '../ui/transicion';

const VISTA = { x: 1150, y: 370, ancho: 560, alto: 420 };
const BOTES = { desde: 560, hasta: 1880, yBase: 975, anchoMaximo: 230 };

type Modo = 'menu' | 'camara' | 'dibujos';

/**
 * Bonus "Muéstrale a Caco". La cámara solo se pide al tocar el botón; el modelo se descarga
 * en ese momento. Sin cámara, sin permiso o sin modelo, se juega con dibujos y botones.
 */
export class BonusScene extends Phaser.Scene {
  private modo: Modo = 'menu';
  private activa = false;
  private caco!: Caco;
  private narrador!: Narrador;
  private botes: Bote[] = [];
  /** Bote que el niño debe elegir; null si Caco pidió ayuda (no se puede verificar). */
  private esperado: Categoria | null | undefined = undefined;
  private detenerCamara: (() => void) | null = null;
  private video: HTMLVideoElement | null = null;
  private clasificador: Clasificador | null = null;
  private menu: Phaser.GameObjects.GameObject[] = [];
  private vista: Phaser.GameObjects.GameObject[] = [];
  private botonAdivinar: Boton | null = null;
  private botonDibujos: Boton | null = null;
  private dibujos: Residuo[] = [];
  private dibujoActual: { residuo: Residuo; imagen: Phaser.GameObjects.Image } | null = null;
  private aciertosCamara = 0;

  constructor() {
    super('Bonus');
  }

  create(): void {
    entrar(this);
    this.modo = 'menu';
    this.activa = true;
    this.esperado = undefined;
    this.menu = [];
    this.vista = [];
    this.botonAdivinar = null;
    this.botonDibujos = null;
    this.dibujoActual = null;
    this.clasificador = null;
    this.aciertosCamara = 0;
    this.events.once('shutdown', () => this.limpiar());

    agregarParque(this);
    this.add.rectangle(ANCHO / 2, 540, ANCHO, 1080, 0xffffff, 0.25).setDepth(-50);
    this.caco = new Caco(this, CACO_NIVEL.x, CACO_NIVEL.y, CACO_NIVEL.escala).setDepth(30);
    this.narrador = new Narrador(this, this.caco, { x: 40, y: 280, ancho: 780, apuntaA: { x: 230, y: 900 }, tamanoTexto: 44 });
    this.crearBotes();
    agregarBotonSonido(this);

    new Boton(this, ANCHO - 560, 88, {
      texto: TEXTOS.bonus.botonDiploma,
      icono: 'icono-siguiente',
      ancho: 420,
      alto: 120,
      tamanoTexto: 42,
      color: PALETA.naranja,
      nombre: 'ir-al-diploma',
      alPresionar: () => irA(this, escenaSiguiente('Bonus')),
    }).setDepth(900);

    this.mostrarMenu();
  }

  // ─── Menú ────────────────────────────────────────────────────────────
  private mostrarMenu(): void {
    const boton = new Boton(this, VISTA.x, VISTA.y, {
      texto: TEXTOS.bonus.botonCamara,
      icono: 'icono-camara',
      ancho: 640,
      alto: 190,
      tamanoTexto: 60,
      color: PALETA.azul,
      nombre: 'muestrale-a-caco',
      alPresionar: () => void this.iniciarCamara(),
    }).setDepth(600);
    boton.latir();
    this.menu = [boton, this.textoPrivacidad(VISTA.y + 170)];
    this.time.delayedCall(450, () => this.narrador.decir(TEXTOS.bonus.bienvenida));
  }

  private textoPrivacidad(y: number): Phaser.GameObjects.Container {
    const texto = this.add.text(0, 0, TEXTOS.bonus.privacidad, estiloTexto(28, PALETA.tinta, { wordWrap: { width: 620 }, align: 'center' }));
    texto.setOrigin(0.5);
    const fondo = this.add.graphics();
    fondo.fillStyle(0xffffff, 0.92).fillRoundedRect(-texto.width / 2 - 24, -texto.height / 2 - 14, texto.width + 48, texto.height + 28, 22);
    return this.add.container(VISTA.x, y, [fondo, texto]).setDepth(600).setName('aviso-privacidad');
  }

  // ─── Cámara ──────────────────────────────────────────────────────────
  private async iniciarCamara(): Promise<void> {
    if (this.modo !== 'menu') return;
    this.modo = 'camara';
    this.menu.forEach((o) => o.destroy());
    this.menu = [];
    this.narrador.decir(TEXTOS.bonus.pidiendoPermiso);
    // Mientras se espera el permiso o el modelo, el facilitador puede pasar a dibujos.
    this.botonDibujos = new Boton(this, 1680, VISTA.y + 200, {
      texto: TEXTOS.bonus.botonDibujos,
      ancho: 380,
      alto: 120,
      tamanoTexto: 42,
      color: PALETA.verde,
      nombre: 'usar-dibujos',
      alPresionar: () => {
        this.cerrarCamara();
        this.modoDibujos(TEXTOS.bonus.conDibujos);
      },
    }).setDepth(600);
    const sigueEnCamara = () => this.activa && this.modo === 'camara';

    const cam = await abrirCamara(VISTA.ancho, VISTA.alto, () => !sigueEnCamara());
    if (!sigueEnCamara()) {
      if (cam.ok) cam.detener();
      return;
    }
    if (!cam.ok) {
      this.modoDibujos(TEXTOS.bonus.sinCamara[cam.motivo]);
      return;
    }
    this.detenerCamara = cam.detener;
    this.video = cam.video;
    const dom = this.add.dom(VISTA.x, VISTA.y, cam.video).setDepth(500);
    const aviso = this.textoPrivacidad(VISTA.y + VISTA.alto / 2 + 60);
    const giro = this.add.image(VISTA.x, VISTA.y, 'brillo').setScale(1.6).setDepth(510);
    this.tweens.add({ targets: giro, angle: 360, duration: 1200, repeat: -1 });
    this.vista = [dom, aviso, giro];
    this.narrador.decir(TEXTOS.bonus.cargando);

    try {
      this.clasificador = await cargarClasificador();
    } catch (e) {
      console.warn('No se pudo cargar el modelo de visión:', e);
      if (!sigueEnCamara()) return;
      this.cerrarCamara();
      this.modoDibujos(TEXTOS.bonus.sinModelo);
      return;
    }
    if (!sigueEnCamara()) return;
    this.vista = this.vista.filter((o) => o !== giro);
    giro.destroy();
    this.botonAdivinar = new Boton(this, 1680, VISTA.y, {
      texto: TEXTOS.bonus.botonAdivinar,
      ancho: 380,
      alto: 170,
      tamanoTexto: 46,
      color: PALETA.morado,
      nombre: 'adivina',
      alPresionar: () => void this.adivinar(),
    })
      .setDepth(600)
      .latir();
    this.narrador.decir(TEXTOS.bonus.listo);
  }

  private async adivinar(): Promise<void> {
    if (!this.clasificador || !this.video || this.esperado !== undefined) return;
    this.botonAdivinar?.habilitar(false);
    this.narrador.decir(TEXTOS.bonus.pensando);
    let interp;
    try {
      // Se clasifica el cuadro actual directamente desde el video, en memoria.
      const predicciones = await this.clasificador.clasificar(this.video);
      interp = interpretar(predicciones, MAPEO_IMAGENET, CATEGORIAS, MODELO.umbralConfianza);
    } catch (e) {
      console.warn('Error al clasificar:', e);
      interp = { tipo: 'duda' as const, mejor: null };
    }
    if (!this.activa) return;
    if (interp.tipo === 'seguro') {
      this.esperado = interp.categoria;
      this.narrador.decir(TEXTOS.bonus.creoQueEs(interp.nombre));
    } else {
      this.esperado = null;
      this.narrador.decir(TEXTOS.bonus.meAyudas);
    }
    this.activarBotes(true);
  }

  private cerrarCamara(): void {
    this.detenerCamara?.();
    this.detenerCamara = null;
    this.video = null;
    this.vista.forEach((o) => o.destroy());
    this.vista = [];
  }

  // ─── Dibujos (respaldo sin cámara) ───────────────────────────────────
  private modoDibujos(mensaje: string): void {
    if (this.modo === 'dibujos') return;
    this.modo = 'dibujos';
    this.esperado = undefined;
    this.activarBotes(false);
    this.botonAdivinar?.destroy();
    this.botonAdivinar = null;
    this.botonDibujos?.destroy();
    this.botonDibujos = null;
    this.dibujos = Phaser.Utils.Array.Shuffle(RESIDUOS.filter((r) => categoriaDe(r, CATEGORIAS)));
    this.add.circle(VISTA.x, VISTA.y, 178, 0xffffff, 0.5).setDepth(15);
    this.add.circle(VISTA.x, VISTA.y, 152, hex(PALETA.crema), 0.95).setDepth(15).setStrokeStyle(8, hex(PALETA.pasto));
    this.narrador.decir(mensaje, () => this.siguienteDibujo());
  }

  private siguienteDibujo(): void {
    if (!this.activa) return;
    if (!this.dibujos.length) this.dibujos = Phaser.Utils.Array.Shuffle(RESIDUOS.filter((r) => categoriaDe(r, CATEGORIAS)));
    const residuo = this.dibujos.shift()!;
    const imagen = this.add.image(VISTA.x, VISTA.y, claveImagenResiduo(residuo.imagen)).setDepth(20).setName(`dibujo-${residuo.id}`);
    // Tocar el dibujo hace que Caco repita la pregunta (igual que en el nivel 2).
    imagen.setInteractive({ useHandCursor: true }).on('pointerup', () => this.narrador.decir(TEXTOS.nivel2.pregunta(residuo.nombre)));
    const escala = 230 / Math.max(imagen.width, imagen.height);
    imagen.setScale(0);
    this.tweens.add({ targets: imagen, scale: escala, duration: 420, ease: 'Back.easeOut' });
    this.dibujoActual = { residuo, imagen };
    this.esperado = categoriaDe(residuo, CATEGORIAS);
    this.activarBotes(true);
    this.narrador.decir(TEXTOS.nivel2.pregunta(residuo.nombre));
  }

  // ─── Botes ───────────────────────────────────────────────────────────
  private crearBotes(): void {
    const fila = enFila(CATEGORIAS.length, BOTES.desde, BOTES.hasta, BOTES.anchoMaximo);
    this.botes = CATEGORIAS.map((c, i) => {
      const bote = new Bote(this, fila.xs[i]!, BOTES.yBase, c, fila.ancho).setDepth(20);
      bote.on('pointerup', () => this.elegir(bote));
      return bote;
    });
    this.activarBotes(false);
  }

  private activarBotes(si: boolean): void {
    for (const b of this.botes) {
      b.setAlpha(si ? 1 : 0.55);
      if (si) b.setInteractive();
      else b.disableInteractive();
    }
  }

  private elegir(bote: Bote): void {
    if (this.esperado === undefined) return;
    const esperado = this.esperado;
    if (esperado === null) {
      // Caco pidió ayuda: no hay forma de verificar, así que solo agradece (no suma al diploma).
      sonido.tocar('feliz');
      bote.celebrar();
      this.narrador.decir(TEXTOS.bonus.gracias);
      this.terminarRonda();
      return;
    }
    if (bote.categoria.id !== esperado.id) {
      sonido.tocar('otraVez');
      bote.sacudir();
      this.narrador.decir(textoPista(esperado));
      return;
    }
    sonido.tocar('acierto');
    bote.abrir();
    bote.celebrar();
    this.caco.celebrar();
    chispas(this, bote.boca.x, bote.boca.y - 80, 12, 160);
    if (this.modo === 'dibujos' && this.dibujoActual) {
      const { residuo, imagen } = this.dibujoActual;
      progreso().separarEnBonus(`dibujo-${residuo.id}`);
      this.dibujoActual = null;
      imagen.disableInteractive();
      this.tweens.add({ targets: imagen, x: bote.boca.x, y: bote.boca.y, scale: 0, duration: 500, ease: 'Quad.easeIn', onComplete: () => imagen.destroy() });
      this.esperado = undefined;
      this.activarBotes(false);
      this.narrador.decir([TEXTOS.bonus.acierto(descripcionBote(esperado)), residuo.dato], () => this.siguienteDibujo());
      return;
    }
    this.aciertosCamara += 1;
    progreso().separarEnBonus(`camara-${this.aciertosCamara}`);
    this.narrador.decir(TEXTOS.bonus.acierto(descripcionBote(esperado)));
    this.terminarRonda();
  }

  private terminarRonda(): void {
    this.esperado = undefined;
    this.activarBotes(false);
    this.botonAdivinar?.habilitar(true);
  }

  private limpiar(): void {
    this.activa = false;
    this.detenerCamara?.();
    this.detenerCamara = null;
    this.video = null;
  }
}
