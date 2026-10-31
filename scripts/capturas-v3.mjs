// Capturas de la v3 para el README y la reunión (docs/capturas/v3-*), a tamaño proyector (1920×1080)
// y tablet (1024×768): inicio, grupos, camino con ambientes, acierto en una lección, fin de lección,
// cofre, estampa y fin de unidad, diploma, vestidor y vitrina.
// Uso: npm run build && node scripts/capturas-v3.mjs   (un solo navegador a la vez: laptop de 8 GB)
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { preview } from 'vite';
import { ejercicioEnPantalla, entrarConGrupoNuevo, esperarPantalla, resolver, seguir, tocarBoton, tocarSelector } from './demo/jugar.mjs';
import { fragmento, grupoConCofre, grupoUnidadCompleta, UNIDADES } from './demo/sembrar.mjs';

const PUERTO = 4196;
const URL = `http://localhost:${PUERTO}`;
const CARPETA = join(process.cwd(), 'docs', 'capturas');
const TAMANOS = [
  { nombre: 'proyector-1920x1080', width: 1920, height: 1080, tactil: false },
  { nombre: 'tablet-1024x768', width: 1024, height: 768, tactil: true },
];
mkdirSync(CARPETA, { recursive: true });

/** Con hojitas para cualquier accesorio: así el vestidor se ve con todos los íconos a color (no al 50 %). */
const conHojitasParaTodo = (g) => ({ ...g, progreso: { ...g.progreso, hojitas: g.progreso.hojitas + 60 } });

const servidor = await preview({ preview: { port: PUERTO, strictPort: true }, logLevel: 'silent' });
const navegador = await chromium.launch({ channel: 'chrome' });
const errores = [];
try {
  for (const t of TAMANOS) {
    const contexto = await navegador.newContext({ viewport: { width: t.width, height: t.height }, hasTouch: t.tactil });
    // Con todas las animaciones (como en un equipo con tarjeta de video).
    await contexto.addInitScript(() => localStorage.setItem('mixtle-al-rescate:suave', 'no'));
    const p = await contexto.newPage();
    p.on('pageerror', (e) => errores.push(`${t.nombre}: ${e.message}`));
    const foto = (nombre) => p.screenshot({ path: join(CARPETA, `${t.nombre}-v3-${nombre}.png`) });

    // Inicio, grupos, camino y una lección con tres aciertos.
    await p.goto(`${URL}/?e2e`);
    await esperarPantalla(p, 'inicio');
    await p.waitForTimeout(1200);
    await foto('1-inicio');
    await entrarConGrupoNuevo(p, 'ajolote');
    await p.waitForTimeout(1500);
    await foto('3-camino');
    await tocarSelector(p, '[data-nodo^="leccion:"]');
    await esperarPantalla(p, 'leccion');
    // El acierto se captura en el segundo ejercicio (tarjetas a la vista con el banner); el tercero es "Al bote" y
    // al acertar el residuo ya se fue al bote.
    for (let i = 0; i < 2; i++) {
      await resolver(p, await ejercicioEnPantalla(p));
      await p.waitForTimeout(900);
      if (i < 1) await seguir(p);
    }
    await foto('4-acierto');

    // Grupos de ejemplo: cofre listo y unidad 1 completa (con accesorios).
    await p.goto(`${URL}/?e2e&demo=v3${fragmento([conHojitasParaTodo(grupoConCofre()), grupoUnidadCompleta()])}`);
    await esperarPantalla(p, 'inicio');
    await tocarBoton(p, /¡Jugar!/);
    await esperarPantalla(p, 'grupos');
    await p.waitForTimeout(600);
    await foto('2-grupos');
    await tocarSelector(p, 'button:has-text("Ardilla 2°B")');
    await esperarPantalla(p, 'camino');
    await tocarSelector(p, '[data-nodo="cofre:u1"]');
    await p.waitForTimeout(1000);
    await p.locator('[data-fase-cofre] button').click({ force: true });
    await p.waitForTimeout(1500);
    await foto('5-cofre');
    await tocarBoton(p, /¡Sigamos!/);
    await tocarBoton(p, 'Vestidor');
    await p.waitForTimeout(900);
    await foto('8-vestidor');
    await tocarBoton(p, /¡Listo!/);
    await tocarBoton(p, 'Cambiar de grupo');
    await esperarPantalla(p, 'grupos');
    await tocarSelector(p, 'button:has-text("Ajolote 1°A")');
    await esperarPantalla(p, 'camino');
    await p.evaluate((id) => window.__mixtle.estampaNueva(id), UNIDADES[0].estampa.id);
    await p.waitForTimeout(2000);
    await foto('6-unidad-terminada');
    await tocarBoton(p, /Ver su diploma/);
    await p.waitForTimeout(800);
    await foto('7-diploma');

    // Vitrina: el parque que se transforma.
    await p.goto(`${URL}/?vitrina=parque`);
    await p.waitForSelector('[data-vitrina="parque"]');
    await p.waitForTimeout(5000);
    await foto('9-vitrina');
    await contexto.close();
    console.log(`${t.nombre}: 9 capturas`);
  }
} finally {
  await navegador.close();
  await servidor.close();
}
console.log(errores.length ? `Errores: ${errores.join(' | ')}` : 'Sin errores en la página.');
