import Phaser from 'phaser';
import { ALTO, ANCHO, PALETA, hex } from '../config';
import { ANIMALES } from '../data/animales';
import { CATEGORIAS } from '../data/categorias';
import { TEXTOS } from '../data/textos';
import { animalesDelDiploma, progreso, reiniciarProgreso, resumenDiploma } from '../logica/progreso';
import { sonido } from '../servicios/sonido';
import { Colibri, Mariposa } from '../ui/animales';
import { Boton } from '../ui/Boton';
import { agregarBotonSonido } from '../ui/BotonSonido';
import { Caco } from '../ui/Caco';
import { chispas, confeti } from '../ui/efectos';
import { agregarParque } from '../ui/fondo';
import { Narrador } from '../ui/Narrador';
import { estiloTexto } from '../ui/texto';
import { entrar, salirDeAventura } from '../ui/transicion';

/** El diploma se dibuja en las capas 450-452: encima del confeti (400) y debajo del globo de Caco (500). */
const DIPLOMA = { x: 1100, y: 440, ancho: 1160, alto: 740 };

/** Diploma "Guardianes del parque" para el grupo, con lo que lograron en la partida. */
export class FinalScene extends Phaser.Scene {
  constructor() {
    super('Final');
  }

  create(): void {
    entrar(this);
    agregarParque(this);
    this.add.rectangle(ANCHO / 2, ALTO / 2, ANCHO, ALTO, hex(PALETA.verde), 0.35).setDepth(-50);

    const resumen = resumenDiploma(progreso(), ANIMALES);
    this.dibujarDiploma();
    const izquierda = DIPLOMA.x - 270;
    const derecha = DIPLOMA.x + 270;
    const yDato = DIPLOMA.y + 70;

    // Residuos: los botes del juego, en miniatura.
    CATEGORIAS.forEach((c, i) => {
      const paso = 80;
      const x = izquierda - ((CATEGORIAS.length - 1) * paso) / 2 + i * paso;
      this.add.image(x, yDato - 120, `bote-${c.id}`).setScale(0.3 / 1.2).setDepth(452);
    });
    const numResiduos = this.numero(izquierda, yDato, PALETA.azul);
    this.add.text(izquierda, yDato + 90, TEXTOS.diploma.residuos(resumen.residuosSeparados), estiloTexto(40, PALETA.tinta)).setOrigin(0.5).setDepth(452);

    // Animales: un dibujo por cada animal contado, que aparece mientras sube el número.
    const figuras = this.figurasAnimales(derecha, yDato - 120);
    const numAnimales = this.numero(derecha, yDato, PALETA.naranja);
    this.add.text(derecha, yDato + 90, TEXTOS.diploma.animales(resumen.animalesAyudados), estiloTexto(40, PALETA.tinta)).setOrigin(0.5).setDepth(452);

    const caco = new Caco(this, 230, ALTO - 20, 0.85).setDepth(30);
    caco.ponerFeliz(true);
    const narrador = new Narrador(this, caco, { x: 440, y: 845, ancho: 890, apuntaA: { x: 260, y: 860 }, tamanoTexto: 38 });

    new Colibri(this, 1810, 560, 0.6, true).setDepth(30);
    [
      [560, 120],
      [1790, 170],
      [1820, 780],
    ].forEach(([x, y]) => {
      const m = new Mariposa(this, x!, y!, 0.42, true).setDepth(30);
      this.tweens.add({ targets: m, y: y! - 30, duration: 1500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    });

    const otraVez = new Boton(this, ANCHO - 290, ALTO - 95, {
      texto: TEXTOS.diploma.jugarOtraVez,
      icono: 'icono-repetir',
      ancho: 520,
      alto: 130,
      tamanoTexto: 48,
      color: PALETA.naranja,
      nombre: 'jugar-otra-vez',
      alPresionar: () => {
        reiniciarProgreso();
        salirDeAventura(this);
      },
    }).setDepth(800);
    otraVez.setVisible(false);

    agregarBotonSonido(this);

    // Los números suben contando, luego la gran celebración.
    this.time.delayedCall(600, () => {
      this.contar(numResiduos, resumen.residuosSeparados, null, () => {
        const mostrarHasta = (n: number) => figuras.forEach((f, i) => f.setVisible(i < n));
        this.contar(numAnimales, resumen.animalesAyudados, mostrarHasta, () => {
          sonido.tocar('fanfarria');
          confeti(this, 120);
          caco.celebrar();
          chispas(this, DIPLOMA.x, DIPLOMA.y - 250, 16, 300);
          narrador.decir(TEXTOS.diploma.narracion(resumen.residuosSeparados, resumen.animalesAyudados));
          otraVez.setVisible(true).latir();
        });
      });
    });
  }

  private dibujarDiploma(): void {
    const { x, y, ancho, alto } = DIPLOMA;
    const g = this.add.graphics().setDepth(450);
    g.fillStyle(0x000000, 0.18).fillRoundedRect(x - ancho / 2 + 10, y - alto / 2 + 16, ancho, alto, 36);
    g.fillStyle(hex(PALETA.crema), 1).fillRoundedRect(x - ancho / 2, y - alto / 2, ancho, alto, 36);
    g.lineStyle(14, hex(PALETA.verde), 1).strokeRoundedRect(x - ancho / 2 + 22, y - alto / 2 + 22, ancho - 44, alto - 44, 26);
    g.lineStyle(4, hex(PALETA.naranja), 1).strokeRoundedRect(x - ancho / 2 + 44, y - alto / 2 + 44, ancho - 88, alto - 88, 18);
    for (const [ex, ey] of [
      [x - ancho / 2 + 44, y - alto / 2 + 44],
      [x + ancho / 2 - 44, y - alto / 2 + 44],
      [x - ancho / 2 + 44, y + alto / 2 - 44],
      [x + ancho / 2 - 44, y + alto / 2 - 44],
    ]) {
      this.add.image(ex!, ey!, 'icono-estrella').setScale(0.7).setDepth(451);
    }

    this.add
      .text(x, y - alto / 2 + 130, TEXTOS.diploma.titulo, estiloTexto(92, PALETA.blanco, { stroke: PALETA.verde, strokeThickness: 18 }))
      .setOrigin(0.5)
      .setDepth(452);
    this.add.text(x, y - alto / 2 + 230, TEXTOS.diploma.para, estiloTexto(44, PALETA.morado)).setOrigin(0.5).setDepth(452);

    const fecha = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());
    const yPie = y + alto / 2 - 100;
    const pie = this.add.graphics().setDepth(451);
    pie.lineStyle(4, hex(PALETA.tinta), 0.5);
    pie.lineBetween(x - 470, yPie, x - 90, yPie).lineBetween(x + 90, yPie, x + 470, yPie);
    // Arriba de cada línea va el dato; abajo, qué es.
    this.add.text(x - 280, yPie - 30, fecha, estiloTexto(34, PALETA.tinta)).setOrigin(0.5).setDepth(452);
    this.add.text(x - 280, yPie + 30, TEXTOS.diploma.fecha, estiloTexto(26, PALETA.tinta)).setOrigin(0.5).setDepth(452);
    this.add.text(x + 280, yPie - 30, TEXTOS.diploma.firma, estiloTexto(36, PALETA.verde, { fontStyle: 'italic bold' })).setOrigin(0.5).setDepth(452);
    this.add.text(x + 280, yPie + 30, TEXTOS.diploma.pie, estiloTexto(26, PALETA.tinta)).setOrigin(0.5).setDepth(452);
    this.add.image(x, yPie, 'icono-corazon').setScale(0.8).setDepth(452);
  }

  private numero(x: number, y: number, color: string): Phaser.GameObjects.Text {
    return this.add
      .text(x, y, '0', estiloTexto(130, color, { stroke: PALETA.blanco, strokeThickness: 12 }))
      .setOrigin(0.5)
      .setDepth(452)
      .setName(`numero-${color}`);
  }

  /**
   * Una cuadrícula con un dibujo por cada animal contado (ocultos hasta que el número los alcance).
   * Así "10 animales ayudados" muestra 10 animales.
   */
  private figurasAnimales(cx: number, cy: number): Phaser.GameObjects.Image[] {
    const figuras = animalesDelDiploma(progreso(), ANIMALES);
    const porFila = 9;
    const paso = 52;
    const filas = Math.ceil(figuras.length / porFila);
    return figuras.map((f, i) => {
      const fila = Math.floor(i / porFila);
      const enFila = Math.min(porFila, figuras.length - fila * porFila);
      const x = cx - ((enFila - 1) * paso) / 2 + (i % porFila) * paso;
      const y = cy - ((filas - 1) * paso) / 2 + fila * paso;
      const img = this.add.image(x, y, `${f}-feliz`).setDepth(452).setVisible(false);
      img.setScale(Math.min(48 / img.width, 46 / img.height));
      return img;
    });
  }

  private contar(texto: Phaser.GameObjects.Text, hasta: number, alPaso: ((n: number) => void) | null, alTerminar: () => void): void {
    if (hasta <= 0) {
      texto.setText('0');
      alPaso?.(0);
      alTerminar();
      return;
    }
    const contador = { valor: 0 };
    let anterior = 0;
    this.tweens.add({
      targets: contador,
      valor: hasta,
      duration: Math.min(1600, 140 * hasta),
      ease: 'Linear',
      onUpdate: () => {
        const v = Math.round(contador.valor);
        if (v !== anterior) {
          anterior = v;
          texto.setText(String(v));
          alPaso?.(v);
          sonido.tocar('toque');
        }
      },
      onComplete: () => {
        texto.setText(String(hasta));
        alPaso?.(hasta);
        sonido.tocar('acierto');
        this.tweens.add({ targets: texto, scale: 1.25, duration: 160, yoyo: true });
        this.time.delayedCall(350, alTerminar);
      },
    });
  }
}
