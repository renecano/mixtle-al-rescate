# Prompt para Claude Code — "Caco al rescate" (prototipo para Eco Urban A.C.)

## Contexto

Construye un prototipo jugable de un videojuego educativo para **Eco Urban A.C.**, una asociación civil de Toluca, Estado de México. Hace educación ambiental en escuelas con su programa "Escuelas Comprometidas con el Medio Ambiente" y recupera espacios públicos como el Parque Vicente Guerrero y Paseo Colón.

- **Para qué es:** un prototipo para que Eco Urban lo vea, lo juegue y dé su visto bueno. No es un producto final. Prioriza que se vea bonito, se sienta bien al jugar y se pueda enseñar. Arquitectura simple, sin backend.
- **Público:** niñas y niños de 1º a 3º de primaria (6 a 8 años). Muchos todavía leen con dificultad.
- **Dónde se juega:** en la laptop de Eco Urban proyectada en el salón (todo el grupo participa) y en tablets táctiles.
- **Tema:** cuidar a los animales del parque y aprender a separar la basura. Las dos cosas van juntas: la basura mal tirada lastima a los animales.

## Stack

- **Vite + TypeScript + Phaser 3**, sitio estático.
- **TensorFlow.js** con `@tensorflow-models/mobilenet` para el módulo de cámara (opcional dentro del juego).
- **Vitest** para unos pocos tests.
- Debe correr en **Windows** (laptop de 8 GB de RAM): scripts de npm, nada que dependa de bash.
- Despliegue estático en **Vercel**; deja un `vercel.json` si hace falta.
- No uses backend, base de datos, cuentas ni analítica.

## El juego

**Personaje:** Caco, un cacomixtle simpático que vive en los árboles de un parque de Toluca. Es el guía y narrador de todo el juego.

**Animales del parque:** una ardilla, un colibrí y mariposas monarca. Empiezan tristes por la basura y se ponen felices cuando su zona queda limpia.

**Flujo:**

1. **Inicio.** Título "Caco al rescate", un botón grande "¡Jugar!" y un botón de sonido. Pantalla tipo póster, sin texto de más.
2. **Intro.** Caco se presenta en voz y con globo de texto: el parque está lleno de basura y los animales lo necesitan. Máximo 3 frases cortas y se avanza con un toque.
3. **Nivel 1 — Limpia el parque.** Hay basura regada junto a los animales. Al tocar un residuo, este va a la bolsa de Caco. Cuando una zona queda limpia, su animal reacciona contento con una animación y un sonido.
4. **Nivel 2 — ¿A qué bote va?** Los residuos recolectados aparecen uno por uno y el niño los arrastra al bote correcto.
   - Si acierta: celebración, y Caco dice un dato curioso corto.
   - Si se equivoca: el residuo regresa y Caco da una pista amable. Nunca hay castigo ni se pierden vidas.
5. **Nivel 3 — Un hogar para los animales.** En los lugares que quedaron limpios, el niño toca para plantar árboles y flores. Llegan las mariposas monarca a las flores y el colibrí al árbol.
6. **Bonus — "Muéstrale a Caco"** (ver la sección de cámara).
7. **Final.** Un diploma "Guardianes del parque" para el grupo, con cuántos residuos separaron bien y cuántos animales ayudaron. Botón para jugar otra vez.

## Contenido configurable

- Pon todo el contenido en archivos de datos (`src/data/residuos.ts`, `src/data/categorias.ts`) para cambiarlo sin tocar la lógica.
- **Categorías de separación:** por defecto usa 3, cada una con su color e ícono:
  - Orgánico
  - Reciclable
  - No reciclable
  
  Deja un comentario `TODO` indicando que hay que confirmar las categorías oficiales con Eco Urban. El juego debe funcionar con 2 a 4 categorías cambiando solo ese archivo.
- **Residuos:** unos 12, cotidianos para niños mexicanos: cáscara de plátano, envase de jugo, botella de plástico, lata, periódico, servilleta usada, envoltura de frituras, cáscara de huevo, caja de cartón, popote, hojas secas, corazón de manzana. Cada uno con nombre, categoría, imagen y un dato curioso de una sola frase, revisado para que sea cierto y apropiado para la edad.

## Diseño para niños de 6 a 8 años

- **Voz:** todas las instrucciones se narran con la Web Speech API en español de México (`es-MX`), con un botón para silenciar. El texto en pantalla acompaña, pero nunca es la única forma de entender qué hacer.
- **Controles:** zonas de toque grandes (mínimo 64 px). Funciona con toque y con mouse. Sin temporizadores que presionen.
- **Pantalla:** se ve bien proyectada a 1920×1080 y en tablet a 1024×768. Usa escalado de Phaser con relación 16:9.
- **Retroalimentación:** siempre positiva, con animaciones claras y sonidos alegres.
- **Accesibilidad:** buen contraste, y nada que dependa solo del color (cada categoría lleva color e ícono).

## Arte y sonido

- **Ilustraciones:** originales, en SVG con estilo plano y amable. Paleta base:
  - verde `#1F6B4A`
  - azul `#2459A6`
  - naranja `#B84A14`
  - morado `#6345A8`
  - tonos claros para el cielo y el pasto
- **Caco:** dibújalo como cacomixtle real: cuerpo esbelto, orejas grandes, cola larga con anillos blancos y negros, ojos grandes y amables. Debe ser un personaje original, sin parecido con personajes con derechos de autor.
- **Sonidos y recursos extra:** solo CC0 (por ejemplo, de Kenney.nl). Anota cada recurso con su fuente y licencia en `CREDITOS.md`.

## Módulo de cámara (bonus opcional)

- La cámara solo se pide cuando el niño o el facilitador toca "Muéstrale a Caco". Nunca al cargar el juego.
- El niño muestra un residuo real a la cámara y MobileNet lo clasifica en el propio dispositivo.
- Crea una tabla que traduzca las etiquetas de ImageNet a las categorías del juego (`src/data/mapeoImagenet.ts`), por ejemplo: banana → Orgánico, water bottle → Reciclable.
- **Si la confianza es baja o la etiqueta no está en la tabla:** Caco dice "¿Me ayudas? ¿A qué bote va?" y muestra los botes como botones.
- **Privacidad:** no guardes ni envíes ninguna imagen. Todo corre en el navegador. Muestra un aviso corto de esto en pantalla.
- **Sin cámara o con permiso negado:** el bonus muestra una imagen para clasificar con botones, y el juego no se rompe.
- **Modelo propio a futuro:** deja la carga del modelo detrás de una interfaz, para poder cambiar MobileNet por un modelo de Teachable Machine con solo poner su URL. Documenta cómo hacerlo.
- **Carga:** el modelo se descarga solo al entrar al bonus, para no hacer lento el inicio.

## Datos

- No se guarda nada de los niños.
- Solo usa `localStorage` para la preferencia de sonido, siempre dentro de `try/catch`.

## Calidad, a nivel prototipo

- **Tests con Vitest:** que todo residuo tenga una categoría válida, que el mapeo de ImageNet apunte solo a categorías existentes y que el conteo del diploma sea correcto.
- **README.md corto en español:**
  - qué es y para quién
  - cómo correrlo en Windows (`npm install`, `npm run dev`)
  - cómo desplegarlo en Vercel
  - cómo cambiar residuos y categorías
  - cómo cambiar a un modelo de Teachable Machine
  - limitaciones conocidas: el mapeo de MobileNet es aproximado, la voz depende del navegador y las categorías están por confirmar
  - créditos y licencias
- Código ordenado: una escena de Phaser por pantalla en `src/scenes/` y datos separados de la lógica.

## Orden de trabajo

Haz un commit por paso. Corre `npm run build` y `npm test` al terminar cada uno.

1. Proyecto base (Vite + TS + Phaser), escalado 16:9 y pantalla de inicio.
2. Arte de Caco, de los animales y del parque.
3. Intro con narración por voz.
4. Nivel 1.
5. Nivel 2, el núcleo educativo.
6. Nivel 3.
7. Diploma final.
8. Bonus de cámara con su respaldo sin cámara.
9. Pulido de animaciones y sonido, README, tests y `CREDITOS.md`.

Antes de cada paso, dime brevemente qué vas a hacer. Al final, abre el juego en el navegador, recórrelo completo a 1920×1080 y a 1024×768, y corrige lo que se vea mal.
