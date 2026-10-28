import Phaser from 'phaser';
import { ALTO, ANCHO, PALETA, hex } from '../config';
import { ANIMALES } from '../data/animales';
import { CATEGORIAS } from '../data/categorias';
import { TEXTOS } from '../data/textos';
import { diplomaUnidad1, type ColumnaDiploma, type DatosDiploma } from '../logica/diploma';
import { progreso, reiniciarProgreso } from '../logica/progreso';
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

interface Columna {
  numero: Phaser.GameObjects.Text;
  datos: ColumnaDiploma;
  mostrarHasta: (n: number) => void;
}

/**
 * Diploma "Guardianes del parque" para el grupo, con lo que lograron en la aventura.
 * Es el diploma de la v1, reutilizado por todas las unidades: cada aventura le pasa sus datos
 * (`DatosDiploma`); sin datos, muestra los de la aventura de la unidad 1.
 */
export class FinalScene extends Phaser.Scene {
  constructor() {
    super('Final');
  }

  create(entrada?: Partial<DatosDiploma>): void {
    entrar(this);
    agregarParque(this);
    this.add.rectangle(ANCHO / 2, ALTO / 2, ANCHO, ALTO, hex(PALETA.verde), 0.35).setDepth(-50);

    const datos: DatosDiploma = entrada?.izquierda && entrada.derecha && entrada.narracion ? (entrada as DatosDiploma) : diplomaUnidad1(progreso(), ANIMALES, CATEGORIAS);
    this.dibujarDiploma(datos.subtitulo);
    const yDato = DIPLOMA.y + 70;
    const izquierda = this.columna(DIPLOMA.x - 270, yDato, datos.izquierda, PALETA.azul);
    const derecha = this.columna(DIPLOMA.x + 270, yDato, datos.derecha, PALETA.naranja);

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

    const terminar = new Boton(this, ANCHO - 290, ALTO - 95, {
      texto: TEXTOS.diploma.jugarOtraVez,
      icono: 'icono-casa',
      ancho: 520,
      alto: 130,
      tamanoTexto: 48,
      color: PALETA.naranja,
      nombre: 'terminar-aventura',
      alPresionar: () => {
        reiniciarProgreso();
        salirDeAventura(this);
      },
    }).setDepth(800);
    terminar.setVisible(false);

    agregarBotonSonido(this);

    // Los números suben contando, luego la gran celebración.
    this.time.delayedCall(600, () => {
      this.contar(izquierda, () => {
        this.contar(derecha, () => {
          sonido.celebrar();
          confeti(this, 120);
          caco.celebrar();
          chispas(this, DIPLOMA.x, DIPLOMA.y - 250, 16, 300);
          narrador.decir(datos.narracion);
          terminar.setVisible(true).latir();
        });
      });
    });
  }

  private dibujarDiploma(subtitulo?: string): void {
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
    // "Diploma para todo el grupo" y, en las unidades nuevas, el tema de la unidad.
    const para = subtitulo ? `${TEXTOS.diploma.para} · ${subtitulo}` : TEXTOS.diploma.para;
    const linea = this.add.text(x, y - alto / 2 + 230, para, estiloTexto(44, PALETA.morado)).setOrigin(0.5).setDepth(452);
    if (linea.width > ancho - 160) linea.setScale((ancho - 160) / linea.width);

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

  /** Una columna: dibujos arriba, el número (empieza en 0) y qué se contó. */
  private columna(cx: number, yDato: number, datos: ColumnaDiploma, color: string): Columna {
    const iconos = datos.iconos ?? [];
    iconos.forEach((clave, i) => {
      const paso = 90;
      const x = cx - ((iconos.length - 1) * paso) / 2 + i * paso;
      const img = this.add.image(x, yDato - 120, clave).setDepth(452);
      img.setScale(Math.min(80 / img.width, 96 / img.height));
    });
    const figuras = this.figuras(datos.figuras ?? [], cx, yDato - 120);
    const numero = this.add
      .text(cx, yDato, '0', estiloTexto(130, color, { stroke: PALETA.blanco, strokeThickness: 12 }))
      .setOrigin(0.5)
      .setDepth(452)
      .setName(`numero-${color}`);
    const etiqueta = this.add.text(cx, yDato + 90, datos.etiqueta, estiloTexto(40, PALETA.tinta)).setOrigin(0.5).setDepth(452);
    if (etiqueta.width > 520) etiqueta.setScale(520 / etiqueta.width);
    return { numero, datos, mostrarHasta: (n) => figuras.forEach((f, i) => f.setVisible(i < n)) };
  }

  /**
   * Una cuadrícula con un dibujo por cada cosa contada (ocultos hasta que el número los alcance).
   * Así "10 animales ayudados" muestra 10 animales.
   */
  private figuras(claves: string[], cx: number, cy: number): Phaser.GameObjects.Image[] {
    const porFila = 9;
    const paso = 52;
    const filas = Math.ceil(claves.length / porFila);
    return claves.map((clave, i) => {
      const fila = Math.floor(i / porFila);
      const enFila = Math.min(porFila, claves.length - fila * porFila);
      const x = cx - ((enFila - 1) * paso) / 2 + (i % porFila) * paso;
      const y = cy - ((filas - 1) * paso) / 2 + fila * paso;
      const img = this.add.image(x, y, clave).setDepth(452).setVisible(false);
      img.setScale(Math.min(48 / img.width, 46 / img.height));
      return img;
    });
  }

  private contar(columna: Columna, alTerminar: () => void): void {
    const { numero: texto, datos, mostrarHasta } = columna;
    const hasta = datos.numero;
    if (hasta <= 0) {
      texto.setText('0');
      mostrarHasta(0);
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
          mostrarHasta(v);
          sonido.tocar('toque');
        }
      },
      onComplete: () => {
        texto.setText(String(hasta));
        mostrarHasta(hasta);
        sonido.tocar('acierto');
        this.tweens.add({ targets: texto, scale: 1.25, duration: 160, yoyo: true });
        this.time.delayedCall(350, alTerminar);
      },
    });
  }
}
