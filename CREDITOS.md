# Créditos y licencias

## Arte y sonido (originales de este proyecto)

| Recurso | Dónde está | Fuente | Licencia |
|---|---|---|---|
| Caco el cacomixtle (cuerpo, expresiones y cola) | `src/arte/personajes.ts` | Dibujado en código SVG para este proyecto | Original, sin recursos de terceros. La licencia final la decide Eco Urban A.C. |
| Ardilla gris mexicana, colibrí y mariposa monarca | `src/arte/personajes.ts` | Dibujado en código SVG para este proyecto | Igual que arriba |
| Parque con el Nevado de Toluca, nubes, arbusto, árboles, flores, brote, tierra, bolsa | `src/arte/escenario.ts` | Dibujado en código SVG para este proyecto | Igual que arriba |
| 12 residuos | `src/arte/residuos.ts` | Dibujado en código SVG para este proyecto | Igual que arriba |
| Botes, tapas e íconos de categoría | `src/arte/botes.ts` | Dibujado en código SVG para este proyecto | Igual que arriba |
| Íconos de interfaz (sonido, repetir, cámara, etc.) | `src/arte/iconos.ts`, `public/favicon.svg` | Dibujado en código SVG para este proyecto | Igual que arriba |
| Efectos de sonido (toque, recoger, acierto, "casi", sembrar, aleteo, fanfarria…) | `src/servicios/recetasSonido.ts` | Sintetizados en el navegador con Web Audio (osciladores y ruido filtrado); no hay archivos de audio | Igual que arriba |
| Voz de Caco | — | Voces del sistema operativo o del navegador (Web Speech API); el juego no incluye grabaciones | Según el navegador del equipo |
| Tipografía | — | Fuentes del sistema (Arial Rounded MT Bold, Segoe UI, Trebuchet MS…). No se distribuye ningún archivo de fuente | Las del sistema operativo |

No se usaron recursos gráficos ni sonoros de terceros. Si en el futuro se agregan (por ejemplo, sonidos de [Kenney.nl](https://kenney.nl/assets)), deben ser **CC0** y anotarse en esta tabla con su enlace.

Caco es un personaje original: se dibujó a partir de rasgos reales del cacomixtle (*Bassariscus astutus*): cuerpo esbelto gris-pardo, orejas grandes, anillos claros alrededor de los ojos y cola larga con anillos blancos y negros.

## Bibliotecas de código

| Biblioteca | Uso | Licencia |
|---|---|---|
| [Phaser 3](https://phaser.io) 3.90 | Motor del juego | MIT |
| [TensorFlow.js](https://www.tensorflow.org/js) 4.22 | Clasificar la imagen de la cámara en el navegador | Apache-2.0 |
| [@tensorflow-models/mobilenet](https://github.com/tensorflow/tfjs-models/tree/master/mobilenet) 2.1 | Cargar MobileNet v2 | Apache-2.0 |
| Pesos de MobileNet v2 (ImageNet) | Modelo que se descarga al entrar al bonus (desde los servidores de Google/Kaggle) | Apache-2.0 |

Herramientas de desarrollo (no se incluyen en el juego publicado): Vite (MIT), TypeScript (Apache-2.0), Vitest (MIT), happy-dom (MIT), Playwright (Apache-2.0), ESLint y typescript-eslint (MIT).

## Contenido educativo

Los datos curiosos de `src/data/residuos.ts` y la clasificación de residuos siguen el criterio común en México (orgánico / reciclable / no reciclable). Deben revisarlos las educadoras y educadores de Eco Urban A.C. antes de usar el juego con grupos (ver `TODO` en `src/data/categorias.ts`).
