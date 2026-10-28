# Créditos y licencias

## Arte (original de este proyecto)

| Recurso | Dónde está | Fuente | Licencia |
|---|---|---|---|
| Caco el cacomixtle (cuerpo, expresiones y cola) | `src/arte/personajes.ts` | Dibujado en código SVG para este proyecto | Original, sin recursos de terceros. La licencia final la decide Eco Urban A.C. |
| Ardilla gris mexicana, colibrí y mariposa monarca | `src/arte/personajes.ts` | Dibujado en código SVG para este proyecto | Igual que arriba |
| Parque con el Nevado de Toluca, nubes, arbusto, árboles, flores, brote, tierra, bolsa | `src/arte/escenario.ts` | Dibujado en código SVG para este proyecto | Igual que arriba |
| 12 residuos | `src/arte/residuos.ts` | Dibujado en código SVG para este proyecto | Igual que arriba |
| Botes, tapas e íconos de categoría | `src/arte/botes.ts` | Dibujado en código SVG para este proyecto | Igual que arriba |
| Íconos de interfaz (voz, música, repetir, cámara, etc.) y de la app | `src/arte/iconos.ts`, `public/favicon.svg`, `public/iconos/` | Dibujado en código SVG para este proyecto | Igual que arriba |

Caco es un personaje original: se dibujó a partir de rasgos reales del cacomixtle (*Bassariscus astutus*): cuerpo esbelto gris-pardo, orejas grandes, anillos claros alrededor de los ojos y cola larga con anillos blancos y negros.

## Música (solo CC0)

Elegida por René en `docs/muestras-musica/` entre candidatas CC0 verificadas en su página. Los archivos del juego están en `public/musica/` (normalizados y recomprimidos con `npm run musica:instalar`).

| Pista del juego | Obra | Autor | Fuente | Licencia |
|---|---|---|---|---|
| `tranquila.mp3` (menú y camino) | Happy Lullaby (song17) | cynicmusic | <https://opengameart.org/content/happy-lullaby-song17> | CC0 |
| `lecciones.mp3` (lecciones y aventuras) | Children's March Theme | CleytonKauffman | <https://opengameart.org/content/childrens-march-theme> | CC0 |
| `celebracion.mp3` (al terminar) | Cozy Puzzle Jingle & Result — Clear (Jingle) | MintoDog | <https://opengameart.org/content/cozy-puzzle-jingle-result> | CC0 |

Las demás candidatas de `docs/muestras-musica/` también son CC0; sus fuentes están en `scripts/musica/candidatas.json`.

## Voz de Caco

| Qué | Detalle | Licencia |
|---|---|---|
| Audios de las frases (`public/voz/*.mp3`) | Generados en la laptop del equipo con **Kokoro** (voz `em_alex`, español latinoamericano), ver `voz.config.json` | Los audios son producto de este proyecto; el modelo Kokoro-82M y sus voces son Apache-2.0 |
| Modelo [Kokoro-82M](https://huggingface.co/hexgrad/Kokoro-82M) (versión ONNX de [kokoro-onnx](https://github.com/thewh1teagle/kokoro-onnx)) | Solo se usa para generar; no se incluye en el juego | Apache-2.0 (modelo y voces), MIT (kokoro-onnx) |
| espeak-ng (vía `espeakng-loader`) | Convierte texto a fonemas al generar; no se incluye en el juego | GPL-3.0 (herramienta de desarrollo) |
| Respaldo | Si a una frase le falta su audio, se usa la voz del navegador (Web Speech API) | Según el navegador |

Muestras que se compararon (`docs/muestras-voz/`, no se usan en el juego):

- Piper `es_MX-ald-medium`: datos [Ald Mexican Spanish](https://huggingface.co/datasets/rmcpantoja/Ald_Mexican_Spanish_speech_dataset) (Unlicense), afinado desde `es_ES-davefx` (datos CC0).
- Piper `es_MX-claude-high`: datos de [HirCoir/Piper-TTS-Spanish](https://huggingface.co/spaces/HirCoir/Piper-TTS-Spanish) (Apache-2.0).
- edge-tts (`es-MX-DaliaNeural`, `es-MX-JorgeNeural`): voces neuronales de Microsoft a través de un servicio no oficial.

Si Eco Urban graba la voz de una persona (ver README), sus grabaciones reemplazan a estas y se registran aquí.

## Efectos de sonido (originales de este proyecto)

`public/sonidos/*.mp3` se generan a partir de las recetas de `src/servicios/recetasSonido.ts` con un sintetizador propio (`npm run sonidos:generar`): osciladores, envolventes y ruido filtrado. No hay sonidos de terceros.

## Tipografía

[Nunito](https://fonts.google.com/specimen/Nunito) de Vernon Adams y colaboradores, **SIL Open Font License 1.1**, autoalojada con [@fontsource/nunito](https://fontsource.org/fonts/nunito) (solo el subconjunto latino). El juego no pide nada a Google Fonts.

## Bibliotecas de código (incluidas en el juego)

| Biblioteca | Uso | Licencia |
|---|---|---|
| [React](https://react.dev) 18 | Pantallas de la app | MIT |
| [Phaser 3](https://phaser.io) 3.90 | Motor de las aventuras | MIT |
| [Howler.js](https://howlerjs.com) 2.2 | Música, voz y efectos | MIT |
| [Motion](https://motion.dev) 14 | Animaciones de la interfaz | MIT |
| [Zustand](https://zustand.docs.pmnd.rs) 5 | Estado de la app | MIT |
| [Tailwind CSS](https://tailwindcss.com) 4 | Estilos | MIT |
| [TensorFlow.js](https://www.tensorflow.org/js) 4.22 | Clasificar la imagen de la cámara en el navegador | Apache-2.0 |
| [@tensorflow-models/mobilenet](https://github.com/tensorflow/tfjs-models/tree/master/mobilenet) 2.1 | Cargar MobileNet v2 | Apache-2.0 |
| Pesos de MobileNet v2 (ImageNet) | Se descargan al entrar al bonus (servidores de Google/Kaggle) | Apache-2.0 |
| Workbox (vía vite-plugin-pwa) | Funcionar sin internet | MIT |

Herramientas de desarrollo (no se incluyen en el juego publicado): Vite (MIT), TypeScript (Apache-2.0), Vitest (MIT), Testing Library (MIT), happy-dom (MIT), Playwright (Apache-2.0), ESLint y typescript-eslint (MIT), vite-plugin-pwa (MIT), Piper (GPL-3.0), edge-tts (LGPL-3.0), imageio-ffmpeg/ffmpeg (BSD-2/LGPL), soundfile (BSD-3).

## Contenido educativo

Los datos curiosos de `src/data/residuos.ts` y la clasificación de residuos siguen el criterio común en México (orgánico / reciclable / no reciclable). Deben revisarlos las educadoras y educadores de Eco Urban A.C. antes de usar el juego con grupos (ver `TODO` en `src/data/categorias.ts`).
