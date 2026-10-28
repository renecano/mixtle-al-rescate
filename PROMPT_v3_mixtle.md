# Prompt v3: "Mixtle al rescate". Nuevo nombre, más llamativo y voz con Azure

## Contexto

Eco Urban jugó la v2 y le gustó mucho. Vamos a tener otra reunión con ellos y queremos llegar con una versión que se sienta como un producto de marca. Pidieron tres cambios:

1. **Nombre:** el personaje ahora se llama **Mixtle** (antes Caco).
2. **Más llamativa:** que se vea más divertida y atractiva. Para lograrlo, aplica técnicas de marketing y de diseño de juegos.
3. **Voz más amigable:** pasar a **Azure AI Speech**.

**Lo que no cambia:**
- Lo pedagógico se queda igual: unidades, lecciones, ejercicios y aventuras. Solo cambia el nombre dentro del contenido.
- Siguen las mismas reglas:
  - sin backend y sin datos de niñas o niños;
  - debe correr en Windows con 8 GB de RAM;
  - contraste AA y zonas de toque de 64 px o más;
  - todo el contenido marcado con `TODO(Eco Urban)`.

**Forma de trabajo:**
- Un commit por paso.
- Antes de cada commit, corre `npm run verificar`.
- Las pruebas largas de Playwright solo al final, con un navegador a la vez.
- Antes de cada paso, dime en una o dos frases qué vas a hacer.

## Paso 0: Punto de partida

Confirma que el árbol de git está limpio y que `npm run verificar` pasa. Haz una etiqueta `v2-eco-urban` del estado actual, para poder volver a la versión que ya vio Eco Urban.

## Paso 1: Renombrar a Mixtle

- **Qué cambia de nombre:**
  - El personaje se llama **Mixtle** en todo lo que se ve y se escucha: textos de la app, contenido de las unidades, aventuras, frases de voz, `aria-label`, `<title>`, el manifiesto de la PWA (`name`, `short_name`), README, `CREDITOS.md` y `docs/`.
  - El juego pasa a llamarse **"Mixtle al rescate"**, con el lema **"Guardianes del parque"**.
- **Cuidado con el reemplazo:** "Caco" está dentro de "**caco**mixtle".
  - No hagas un reemplazo ciego. Usa límites de palabra, distingue mayúsculas y revisa el diff.
  - La palabra "cacomixtle" se queda donde nombra al animal (estampa del álbum, datos curiosos).
- **Nombres en el código:** renombra también los identificadores (`CacoGuia`, `CacoFigura`, `ui/Caco.ts`, el gancho `window.__caco`…) y actualiza las pruebas unitarias y las de e2e.
- **Avance guardado:** si alguna clave de IndexedDB o `localStorage` incluye "caco", migra los datos existentes. La laptop de Eco Urban ya tiene grupos creados y no deben perderse. Agrega una prueba para esa migración.
- **Pronunciación:** agrega "Mixtle" al diccionario de `voz.config.json`.
  - Confirmado por René: se pronuncia como "mix" + "tle" (con sonido "ks", como la palabra "mix"), igual que la segunda parte de "cacomixtle". Escríbelo como "Míkstle" en el diccionario o con fonemas SSML, lo que suene mejor.
  - "Cacomixtle" debe sonar igual en su segunda parte. Hoy el diccionario lo lee como "cacomistle", así que cámbialo para que suene consistente.
  - Verifica en las muestras del paso 2 que las dos palabras se oigan bien.
- **Repo y dominio:**
  - Renombra el repositorio de GitHub a `mixtle-al-rescate` (`gh repo rename`) y actualiza el remoto.
  - En Vercel, deja el proyecto respondiendo en `mixtle-al-rescate.vercel.app`.
  - **`caco-al-rescate.vercel.app` debe seguir funcionando**, redirigiendo a la nueva dirección, porque Eco Urban ya tiene ese link.
  - **No renombres la carpeta local**, porque estás trabajando en ella. Déjalo anotado en el README.
- **Prueba nueva:** ningún texto visible ni frase narrada contiene "Caco" como nombre (sí puede contener "cacomixtle").

## Paso 2: Voz con Azure, con muestras primero

Alguien del equipo va a crear una cuenta de Azure y un recurso **Speech** en el plan **gratuito (F0)**. René te va a dar `AZURE_SPEECH_KEY` y `AZURE_SPEECH_REGION` para `.env.local`.

**Seguridad de la llave:**
- Sin el prefijo `VITE_`, para que Vite nunca la mande al navegador.
- Confirma que `.gitignore` cubre `.env.local`.
- Agrega una prueba que revise que ni `dist/` ni el repositorio contienen la llave.
- La llave solo se usa al **generar** los audios en esta máquina. El juego publicado sigue reproduciendo mp3 pregenerados, sin llamar a Azure.

**Proveedor `azure` en `scripts/voz`:**
- Usa la API REST con `fetch` y SSML, sin SDK pesado. Sale en mp3 mono y pasa por la misma normalización de volumen que hoy.
- El hash de cada audio incluye proveedor, voz, estilo y ajustes, para que un cambio regenere solo lo necesario.
- Kokoro se queda como proveedor alterno en `voz.config.json`, y las grabaciones humanas de `voz-grabaciones/` siguen teniendo prioridad.

**No salirse del plan gratuito** (0.5 millones de caracteres al mes):
- Antes de cada corrida, cuenta los caracteres que vas a enviar y muestra la estimación.
- Lleva un registro local del uso del mes en `.voz-uso.json`, ignorado por git.
- Detente si el mes pasaría de 400,000 caracteres, salvo que se use `--forzar`.
- Respeta los límites de peticiones: espera entre peticiones y reintenta los errores 429 con espera creciente.

**Muestras** (`npm run voz:muestras -- --proveedor=azure`):
- Consulta la lista de voces de la región (`/cognitiveservices/voices/list`) y quédate con las de `es-MX` y `es-US`. Anota cuáles tienen estilos (`StyleList`).
- Con cada voz candidata, genera las mismas 4 frases: un saludo, un acierto, una pista amable y un dato curioso. Haz estas variantes:
  - normal;
  - con estilo alegre o amigable, si la voz lo tiene;
  - con el tono un poco más alto (+5 % y +10 %);
  - un poco más lenta (0.95).
- Incluye como referencia la voz actual (Kokoro `em_alex`) y una frase que diga "Mixtle" y "cacomixtle", para revisar la pronunciación.
- Arma una página `docs/muestras-voz/azure.html` con reproductores, el nombre de cada voz y sus variantes. Debe poder enviarse a Eco Urban para que elijan.
- Las muestras no deben pasar de unos 20,000 caracteres.

**Si todavía no está la llave:** implementa todo, pruébalo con un servidor falso y sigue con el paso 3. Las muestras se generan en cuanto René ponga la llave.

## Paso 3: Dirección visual, como propuesta antes de construir

**Objetivo:** que se vea como un producto de marca hecho con cariño, no como un prototipo ni como una plantilla genérica. René quiere algo original y llamativo, nada "básico".

Arma `docs/direccion-visual/index.html` con **2 o 3 direcciones visuales distintas**. Cada una muestra:
- el logo "Mixtle al rescate" (letrero propio + Mixtle integrado);
- la pantalla de inicio;
- una pantalla de lección;
- un momento de recompensa;
- su paleta y su tipografía.

Usa los componentes reales del juego donde se pueda.

**Detente aquí** y pídele a René que elija la dirección visual y la voz (paso 2). Con lo que elija, sigue al paso 4.

## Paso 4: Construir la dirección elegida

Técnicas de marketing y de diseño de juegos, aplicadas de forma ética para niñas y niños de 6 a 8 años.

**4a. Marca**
- Logo final en SVG, ícono de app (favicon y los íconos de la PWA), pantalla de carga con el logo y el lema.
- **Hoja de personaje de Mixtle:**
  - 8 expresiones o poses: saluda, feliz, celebra brincando, piensa, sorprendido, da ánimo, señala y duerme.
  - Animación en reposo: parpadeo, cola que se mece y orejas que se mueven.
  - Una personalidad clara y una frase propia, por ejemplo "¡Al rescate!".
  - Que siga siendo un personaje original, sin parecido con personajes con derechos de autor.
- Mini guía de marca en `docs/marca.md`: logo, colores, tipografía, usos correctos y tono de Mixtle.

**4b. Primera impresión**
- Pantalla de inicio animada:
  - parque con capas en paralaje y el Nevado de Toluca al fondo;
  - Mixtle entra colgándose de un árbol;
  - el logo aparece con un remate musical.
- Transición de marca entre pantallas: el logo o Mixtle "barre" la pantalla al cambiar de sección.
- **Modo vitrina:** si la pantalla de inicio se queda sin tocar 60 s en el proyector, muestra en bucle una demo corta del juego. Sirve para ferias y para la reunión.

**4c. Sensación de juego ("juice")**
- Cada toque responde: botones que se aplastan y rebotan, un sonido y partículas.
- Acierto: lluvia de hojitas y una celebración de Mixtle que varía. Las hojitas vuelan al contador y el número sube contando.
- Racha **dentro de la lección**, por ejemplo "¡3 seguidas!".
- Barra de avance con brillo y una pequeña celebración a la mitad.

**4d. Momentos de recompensa**
- **Cofre:** se sacude, brilla y se abre con un estallido. Su contenido se conoce de antemano. **Nada aleatorio tipo "caja de botín"**: la sorpresa está en la animación, no en el premio.
- **Estampa nueva:** se revela con brillo.
- **El parque:** se transforma en un momento antes y después, con su sonido.
- **Fin de unidad:** una minicelebración y un diploma que se puede imprimir.

**4e. Identidad por unidad.** Cada unidad tiene su ambiente y su paleta, y el fondo del camino cambia con ella:

| Unidad | Ambiente |
|---|---|
| 1 | Parque |
| 2 | Hogar de los animales |
| 3 | Bosque del Nevado de Toluca |
| 4 | Calles de Toluca |
| 5 | Escuela |

Incluye lugares de Toluca ilustrados de forma original (Nevado de Toluca, Cosmovitral, Portales), para generar orgullo local.

**4f. Personalización:**
- El animal del grupo se puede vestir con accesorios que se compran con hojitas: gorra, paliacate, lentes, mochila, etc.
- Se ve en el camino y en el diploma.
- Da sentido de pertenencia y le da uso a las hojitas.

**4g. Arte más rico:**
- Mismo estilo amable, pero con profundidad: degradados, luz, sombras suaves y textura.
- Trazo y paleta consistentes en todo el juego.

**Reglas técnicas:**
- 60 fps en la laptop de 8 GB, tanto en el proyector como en tablet.
- Respeta `prefers-reduced-motion` y agrega "animaciones suaves" al modo facilitador.
- Lo que se descarga antes de la primera pantalla no debe pasar de unos 250 KB comprimidos. Lo pesado se carga después.
- Sonidos CC0 o propios, anotados en `CREDITOS.md`.

**Ética (marketing para niñas y niños):**
- Sin anuncios ni compras.
- Sin premios aleatorios.
- Sin rachas diarias que se pierdan ni mensajes de culpa.
- Sin temporizadores que presionen y sin notificaciones.
- Se premia el esfuerzo, no la comparación entre grupos.

Documéntalo en el README, en una sección **"Diseño persuasivo responsable"**, que nombre cada técnica usada y por qué es apropiada para la edad.

## Paso 5: Material para la reunión

- **Tráiler de 30 a 45 s:**
  - Grábalo con Playwright a 1920×1080, con los mejores momentos: inicio, un acierto, el cofre, el parque transformándose y una aventura.
  - Ponle la música del juego con ffmpeg.
  - Guárdalo en `docs/trailer/mixtle-al-rescate.mp4`.
- **Capturas nuevas** en `docs/capturas/`, a tamaño proyector y tablet.

## Paso 6: Cierre

- Pruebas unitarias en verde y README al día. El README debe cubrir:
  - el nuevo nombre;
  - la sección de Azure: cómo poner la llave, cuánto cuesta, cómo cambiar la voz y cómo se protege la llave;
  - la guía de marca;
  - el diseño persuasivo responsable;
  - el tráiler.
- Push, que se publica solo.
- Después, corre las pruebas e2e contra producción (`$env:BASE_URL="https://mixtle-al-rescate.vercel.app"; npm run test:e2e`) y **repórtame las fallas sin corregirlas**.
- Al final, dame un resumen corto: qué quedó, qué falta confirmar con Eco Urban y las ligas.
