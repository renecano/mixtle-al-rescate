import { expect, test } from '@playwright/test';
import { UNIDADES } from '../src/contenido/unidades';
import { abrirCofre, completarAventura, completarLeccion, nodosDelCamino, PROGRESO_VACIO } from '../src/logica/camino';
import { nuevoGrupo } from '../src/logica/grupos';
import { fragmentoDeMudanza } from '../src/servicios/mudanza';
import { esperarPantalla, tocarBoton } from './ayudas';

/** Un grupo con las primeras `k` paradas hechas: la siguiente cae en otro lugar del zigzag. */
function grupoEnParada(k: number) {
  let p = PROGRESO_VACIO;
  for (const n of nodosDelCamino(UNIDADES).slice(0, k)) {
    if (n.tipo === 'leccion') p = completarLeccion(p, n.leccion.id, { hojitas: 12, aLaPrimera: 2 }, '2026-10-28');
    else if (n.tipo === 'cofre') p = abrirCofre(p, n.unidad.id, '2026-10-28');
    else p = completarAventura(p, n.unidad, '2026-10-28');
  }
  return { ...nuevoGrupo({ mascota: 'tlacuache', color: '#6345A8', etiqueta: `P${k}` }, `e2e-parada-${k}`, 0), progreso: p };
}

// La mascota del grupo va en el camino junto a la siguiente parada: en ningún lugar del zigzag tapa
// etiquetas, botones ni a Mixtle, y no se sale de la pantalla (revisión de la v3, punto 2).
for (let k = 0; k < 9; k++) {
  test(`la mascota del grupo no tapa nada (siguiente parada ${k})`, async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('mixtle-al-rescate:suave', 'si'));
    await page.goto(`./?e2e&k=${k}${fragmentoDeMudanza({ v: 1, grupos: [grupoEnParada(k)], preferencias: {} })}`);
    await esperarPantalla(page, 'inicio');
    await tocarBoton(page, /¡Jugar!/);
    await esperarPantalla(page, 'grupos');
    await page.getByRole('button', { name: new RegExp(`P${k}`) }).click({ force: true });
    await esperarPantalla(page, 'camino');
    await expect(page.locator('[data-ficha-grupo]')).toBeVisible();
    await page.waitForTimeout(1200);
    const r = await page.evaluate(() => {
      const caja = (el: Element) => el.getBoundingClientRect();
      const f = caja(document.querySelector('[data-ficha-grupo]')!);
      const otros = [
        ...[...document.querySelectorAll<HTMLElement>('[data-nodo]')].map((e) => ({ que: `botón ${e.dataset.nodo}`, c: caja(e) })),
        ...[...document.querySelectorAll<HTMLElement>('[data-nodo]')].map((e) => ({ que: `etiqueta ${e.dataset.nodo}`, c: caja(e.nextElementSibling!) })),
        ...[...document.querySelectorAll('main [aria-label="Mixtle, el cacomixtle"]')].map((e) => ({ que: 'Mixtle', c: caja(e) })),
      ];
      const cruza = (a: DOMRect, b: DOMRect) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
      return { choques: otros.filter((o) => o.c.width && cruza(f, o.c)).map((o) => o.que), dentro: f.left >= 0 && f.right <= innerWidth };
    });
    expect(r.choques).toEqual([]);
    expect(r.dentro).toBe(true);
  });
}
