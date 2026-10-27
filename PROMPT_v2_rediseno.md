# Prompt para Claude Code — "Caco al rescate" v2: rediseño tipo app de aprendizaje

## Contexto

Este repositorio ya tiene la v1 de **"Caco al rescate"**, un prototipo jugable para **Eco Urban A.C.** (Toluca, Estado de México). Antes de empezar, lee el `README.md`, `src/` y las pruebas para entender lo que ya existe.

**Lo que no cambia:**
- **Público:** niñas y niños de 1º a 3º de primaria (6 a 8 años). Muchos todavía no leen bien, así que todo se entiende por voz e imagen.
- **Dónde se juega:** en la laptop de Eco Urban proyectada en el salón (juega el grupo entero) y en tablets.
- **Privacidad:** no se guarda nada personal de los niños.
- **Personaje:** Caco, el cacomixtle, sigue siendo el guía.
- **Nivel:** sigue siendo un prototipo para que Eco Urban lo vea y dé su visto bueno, pero ahora más completo y pulido.

**Qué cambia en la v2:**
1. Se corrigen los errores de la v1.
2. Música de fondo.
3. Una voz de Caco cálida y amigable, ya no robótica.
4. Un rediseño completo con la mecánica de las apps de aprendizaje de idiomas como Duolingo: un camino de lecciones cortas, ejercicios variados, retroalimentación inmediata, recompensas y progreso. Solo que en vez de un idioma, se aprende lo que enseña Eco Urban.
5. Muchos más niveles, organizados en unidades temáticas.

**Identidad propia.** Toma de Duolingo solo la mecánica y los patrones de experiencia (camino de lecciones, barra de progreso, banner de respuesta, recompensas). No copies su búho, su logo, sus ilustraciones, sus nombres de funciones ni su paleta exacta. La identidad visual es la de Eco Urban y Caco.

---

## Paso 0 — Corregir la v1 (antes que nada)

1. **Pista del bote.** En `src/logica/clasificacion.ts`, la pista dice "Busca el bote naranja de el botecito".
   - Usa la contracción "del".
   - Cambia `NOMBRE_DEL_ICONO.basura` por algo que un niño entienda al ver el ícono, por ejemplo "el bote de basura".
   - Revisa que las tres pistas suenen naturales en voz alta.
2. **Pista de "No reciclable".** Hoy dice "Ya está sucio o no se puede aprovechar", pero eso no es cierto para todos sus residuos: la envoltura de frituras no está sucia, es de varias capas. Usa algo cierto para todos, como "Este ya no se puede reciclar".
3. **Diploma.** Dice "10 animales ayudados", pero en pantalla solo se ven 5. Haz que la cifra coincida con lo que el niño ve, o muestra a todos los animales que cuenta.
4. **Captura del README.** `docs/capturas/proyector-1920x1080-1-inicio.png` se tomó a media animación: el título sale cortado y la pantalla oscura. Haz que `scripts/captura.mjs` espere a que terminen las animaciones de entrada.
5. **Prueba de redacción.** Agrega una prueba que revise la redacción de las pistas: sin "de el" ni "a el", y que nombren el color y el ícono.

Haz un commit solo con estas correcciones. Los siguientes pasos parten de aquí.

---

## Paso 1 — Arquitectura nueva

La v2 es mayormente interfaz (camino, ejercicios, botones, pantallas), así que la estructura cambia. Phaser se queda para las "aventuras", que son los minijuegos con escena, como los niveles actuales.

**Stack:**
- **Vite + React 18 + TypeScript** como base de la app.
- **Tailwind CSS** para los estilos y **Motion** (framer-motion) para las animaciones de la interfaz.
- **Phaser 3** solo para las aventuras: se monta dentro de un componente de React. Reutiliza y adapta las escenas actuales; no las reescribas desde cero.
- **Howler.js** para todo el audio (música, voz y efectos): ducking, desbloqueo de audio en tablets y precarga.
- **Zustand** para el estado. El progreso se guarda en IndexedDB con `idb-keyval`, siempre dentro de `try/catch`. El juego debe funcionar aunque falle el almacenamiento.
- **vite-plugin-pwa** para que funcione sin internet después de la primera carga, incluidos los audios.
- **Fuente:** Nunito (licencia OFL), autoalojada con `@fontsource`. Nada de Google Fonts en tiempo de ejecución.
- **Pruebas:** Vitest + Testing Library para la lógica y los componentes; Playwright para los recorridos.

**Restricciones:**
- Debe correr en Windows en una laptop de 8 GB de RAM: Playwright con un solo worker en local y nada de scripts que dependan de bash.
- Mantén el despliegue estático en Vercel. El único paso con servidor es la generación de voz, que corre en tu máquina, no en producción.

---

## Paso 2 — Audio: voz de Caco y música

### Voz de Caco

La Web Speech API suena robótica. La v2 usa **audios pregenerados**: se generan una vez en la laptop de René, se guardan en el repo y el juego solo los reproduce. No hay síntesis en el navegador ni servicios de pago.

**Proveedores de voz.** Solo gratuitos, sin cuenta y sin tarjeta:
- **Piper:** corre local y sin internet. Tiene voces con acento mexicano: `es_MX-ald` y `es_MX-claude`. Revisa la licencia de cada voz en su ficha (MODEL_CARD) y anótala en `CREDITOS.md`.
- **Kokoro:** corre local; el modelo tiene licencia Apache-2.0. Tiene voces en español: `ef_dora`, `em_alex` y `em_santa`. Usa la variante que funcione en Windows con CPU y 8 GB de RAM; la versión ONNX suele ser la más ligera. Verifica qué dependencias necesita para español (por ejemplo, espeak-ng) antes de instalar.
- **edge-tts:** usa las voces neuronales de Microsoft con acento mexicano (`es-MX-DaliaNeural`, `es-MX-JorgeNeural`), gratis y sin cuenta. Necesita internet al generar. Documenta en el README que usa un servicio no oficial que podría dejar de funcionar.

**Pasos:**

1. **Entorno de Python.** Instala lo necesario en un entorno virtual dentro del repo, `.venv-voz/`, ignorado por git. Todo debe funcionar en Windows desde PowerShell, sin bash. Si falta algo que René deba instalar a mano (Python, espeak-ng, ffmpeg), **detente y dile exactamente qué instalar y cómo**.
2. **Script de generación.** Crea `npm run voz:generar` (Node que llama a Python). Debe:
   - Juntar automáticamente todas las frases que dice Caco desde los archivos de contenido.
   - Generarlas con el proveedor, la voz y los ajustes elegidos, todos configurables en `voz.config.json`.
   - Guardar los archivos en `public/voz/<hash-del-texto>.mp3`, en mono a 64 kbps, con volumen normalizado entre frases (usa ffmpeg si está disponible) y crear `public/voz/manifiesto.json`.
   - Regenerar solo las frases nuevas o cambiadas, comparando el hash del texto y de la configuración.
   - Subir los audios al repo para que Vercel no tenga que generar nada.
3. **Muestras antes de decidir.** Genera en `docs/muestras-voz/` las mismas 3 frases de prueba de Caco: un saludo, una felicitación y una pista amable.
   - Usa cada proveedor con 2 voces y 2 ajustes cada una: uno normal, y otro un poco más lento y más agudo para que suene amigable para niños. Usa los parámetros que cada herramienta tenga: `--rate` y `--pitch` en edge-tts, `length_scale` en Piper, `speed` en Kokoro.
   - Crea `docs/muestras-voz/index.html`, una página sencilla para escucharlas lado a lado con el nombre de cada opción.
   
   **Detente y deja que René escoja.** No sigas hasta que elija.
4. **Lista de frases para grabar.** Exporta todas las frases a `docs/frases-caco.csv` con las columnas: id, archivo, texto, unidad y lección. Sirve para regrabarlas después con una voz humana o con otra herramienta (por ejemplo, Canva) usando los mismos nombres de archivo. Agrega `npm run voz:lista` para regenerar el CSV.
5. **Frases con números** ("Separaron bien 13 residuos"): no generes una frase por cada número. Pregenera los números del 0 al 100 por separado y encadena los clips.
5. **Reproducción:**
   - Si una frase no tiene audio, se usa la Web Speech API de la v1 como respaldo y se avisa en la consola en modo desarrollo.
   - Botón visible para repetir lo que dijo Caco.
   - Subtítulo en pantalla mientras habla.
6. **Voz humana a futuro:** que el mismo sistema acepte grabaciones reales con los mismos nombres de archivo. Documenta en el README cómo reemplazar los audios generados por grabaciones de una persona de Eco Urban.

### Música de fondo

1. **Tres pistas:**
   - Una tranquila para el menú y el camino.
   - Una alegre y suave para las lecciones.
   - Un jingle corto de celebración al terminar una lección o unidad.
2. **Licencias:** solo música **CC0**, por ejemplo de OpenGameArt filtrando por CC0, o los jingles de Kenney.
   - Descarga 2 o 3 candidatas por pista en `docs/muestras-musica/` con su fuente y licencia.
   - **Detente y deja que René escoja.**
   - Registra cada pista final en `CREDITOS.md` con su enlace y licencia.
3. **Volumen:**
   - Música baja por defecto (alrededor de 25%).
   - Ducking automático: la música baja a cerca de 8% mientras habla Caco y sube suave al terminar.
   - Transiciones con fundido entre pistas.
4. **Controles:** música y voz con botones separados, recordados en el dispositivo.
5. **Arranque:** la música solo empieza después del primer toque, por las reglas de autoplay de los navegadores.

---

## Paso 3 — Rediseño tipo app de aprendizaje

### Grupos, no niños

Como se juega en salón, el progreso es **por grupo**, no por niño.

- **Pantalla de inicio:** elegir o crear un grupo. Cada grupo tiene:
  - Un animal mascota de una lista (colibrí, ardilla, monarca, ajolote, etc.).
  - Un color.
  - Una etiqueta opcional corta, como "1°A".
- **Nunca se piden nombres de niños.** Agrega un aviso que diga que no se escriban.
- El progreso de cada grupo se guarda solo en ese dispositivo.
- **Modo facilitador:** se abre con un gesto que un niño no hará por accidente, como mantener presionado el logo 3 segundos. Permite:
  - Reiniciar un grupo.
  - Desbloquear lecciones para saltar directo a una.
  - Activar el modo proyector, con todo más grande.

### El camino de aprendizaje

- **Pantalla principal:** un camino serpenteante con burbujas de lección, dividido en unidades.
- **Cada unidad tiene:**
  - Su color.
  - Su encabezado con el tema.
  - Sus 4 a 5 lecciones.
  - Un cofre de recompensa a la mitad.
  - Una **aventura** al final: un minijuego con escena hecho en Phaser.
- Caco aparece junto a la siguiente lección disponible y la señala.
- **Lecciones:** se desbloquean en orden. Las ya completadas se pueden repetir.
- **El parque del grupo:** arriba del camino hay un parque que empieza gris y con basura. Se va limpiando y llenando de árboles y animales conforme el grupo avanza. Es la meta visible: "estamos salvando nuestro parque".

### Las lecciones

Cada lección dura unos 3 minutos y tiene de 6 a 8 ejercicios.

- **Barra de progreso** arriba.
- **Botón para salir**, con confirmación amable.
- Caco narra cada consigna.
- **Retroalimentación al instante** con un banner abajo:
  - **Correcto:** banner verde, Caco feliz, un sonido y una frase corta de ánimo variada.
  - **Incorrecto:** banner naranja, Caco amable, la pista y "Intentar otra vez".
- **Sin castigos:**
  - Nada de vidas ni corazones que se pierden.
  - Los ejercicios fallados vuelven al final de la lección para repasar.
  - Ningún mensaje hace sentir mal al niño.
- **Pantalla final de lección:**
  - Hojitas ganadas (el equivalente a puntos de experiencia).
  - Cuántos ejercicios salieron a la primera.
  - El parque creciendo.
  - El jingle de celebración.

### Tipos de ejercicio

Construye un motor de ejercicios genérico en el que cada lección sea **solo datos**. Todos los ejercicios funcionan con toque y con mouse, con zonas de toque de 64 px o más.

1. **Elige la imagen:** Caco pregunta y el niño toca una de 2 a 4 tarjetas ilustradas. Ejemplo: "¿Cuál va en el bote verde?"
2. **Al bote:** arrastrar un residuo al bote correcto. Reutiliza la lógica de la v1.
3. **Parejas:** unir pares tocando uno y luego el otro. Ejemplos: residuo con bote, animal con lo que come, animal con su casa.
4. **¿Sí o no?:** Caco describe una acción con una ilustración y el niño toca la carita feliz o la carita triste. Ejemplo: "¿Está bien darle papitas a la ardilla?" Las caritas son ilustraciones propias, no emoji.
5. **Ordena los pasos:** poner 3 o 4 imágenes en orden. Ejemplo: cómo plantar un árbol.
6. **Encuentra el error:** una escena con 1 a 3 cosas que están mal y el niño las toca. Ejemplos: basura en el pasto, una llave goteando, alguien quemando basura.
7. **Escucha y toca:** Caco nombra algo y el niño toca la imagen correcta, sin texto. Sirve para los que todavía no leen.
8. **Muéstrale a Caco:** el ejercicio de cámara de la v1. Es opcional y solo aparece en la unidad 1. Si no hay cámara, se cambia por "Elige la imagen".

### Recompensas

- **Hojitas por lección**, que hacen crecer el parque.
- **Álbum de animales de Toluca:** cada unidad completada desbloquea una estampa con un dato curioso narrado.
- **Días jugados por el grupo:** una racha suave.
  - Nunca hay mensajes de culpa ni presión.
  - Si se rompe la racha, no pasa nada.
- **Al terminar una unidad:** diploma de unidad para el grupo, reutilizando el diploma de la v1.

---

## Paso 4 — Contenido: unidades y lecciones

Todo el contenido vive en `src/contenido/unidades/*.ts`, separado de la lógica, para que Eco Urban pueda revisarlo y cambiarlo.

### Las 5 unidades

Se basan en los hábitos que Eco Urban promueve: separar residuos, cuidar áreas verdes, no tirar basura, usar la bici y escuelas comprometidas.

1. **Separa tu basura:** orgánico, reciclable, no reciclable, y qué pasa si se revuelve.
   - Aventura final: los 3 niveles de la v1, adaptados.
2. **Los animales del parque:** el cacomixtle, la ardilla, el colibrí y la mariposa monarca. Cómo los lastima la basura, por qué no se les da comida chatarra y cómo convivir con ellos.
   - Aventura nueva: "Rescate en el parque", ayudar a animales atrapados en basura.
3. **Árboles y áreas verdes:** para qué sirven los árboles (sombra, aire, casa para animales), cómo se planta uno y cómo se cuida.
   - Aventura: sembrar y regar un bosquecito, ampliando el nivel 3 de la v1.
4. **Aire limpio:** caminar y usar la bici, no quemar basura, cuidar el aire en días de contingencia y qué es el humo.
   - Aventura nueva: "En bici a la escuela", un recorrido evitando el humo y recogiendo hojitas.
5. **Reduce y reutiliza:** botella y lonchera reutilizables, menos desechables en la escuela, y darle una segunda vida a las cosas.
   - Aventura nueva: "Mi lonchera sin basura", armar una lonchera con cosas reutilizables.

### Reglas del contenido

- **Volumen:** 4 o 5 lecciones por unidad, con 6 a 8 ejercicios cada una, y mezcla de tipos de ejercicio en cada lección.
- **Lenguaje:** español de México, frases cortas y vocabulario de niños de 6 a 8 años. Cada consigna se narra.
- **Datos verdaderos:** cada dato curioso debe ser cierto y verificable.
  - Anota la fuente de cada dato en `docs/fuentes-contenido.md`. Por ejemplo: qué come el cacomixtle, que la mariposa monarca hiberna en bosques del Estado de México y Michoacán, que quemar basura contamina el aire.
  - Si no puedes verificar un dato, no lo uses.
- **Fauna local:** usa especies reales del Valle de Toluca y verifícalas antes de incluirlas. Para el álbum, por ejemplo: el cacomixtle, el tlacuache, el colibrí, la mariposa monarca y el ajolote de montaña del Nevado de Toluca.
- **Validación:** marca todo el contenido con un `TODO(Eco Urban)` para que lo validen sus educadores.
- **Categorías de separación:** se mantienen configurables como en la v1.

### Arte

- Sigue el estilo de la v1: SVG plano generado en código, paleta de Eco Urban y personajes originales.
- Caco necesita más expresiones: feliz, pensando, sorprendido, celebrando y señalando.
- Cada ejercicio necesita ilustraciones claras que se entiendan sin texto.

---

## Paso 5 — Calidad y documentación

### Pruebas unitarias

- Cada lección tiene datos válidos: respuestas correctas existentes y sin ejercicios imposibles.
- Toda frase narrada tiene su audio en el manifiesto.
- El desbloqueo de lecciones funciona y el progreso se guarda y se recupera por grupo.
- El ducking de la música funciona.
- La aplicación no falla si IndexedDB está bloqueado.

### Recorridos con Playwright

Corre los recorridos a 1920×1080 y 1024×768:
- Crear un grupo.
- Completar una lección con un error.
- Ver la pantalla final.
- Ver crecer el parque.
- Jugar una aventura.
- Revisar que ninguna petición envíe datos.

Mantén el CI de GitHub Actions funcionando.

### Capturas

Regenera las capturas para el README, esperando a que terminen las animaciones de entrada.

### README

Actualízalo con:
- Qué cambió en la v2.
- Cómo generar las voces.
- Cómo cambiar la música.
- Cómo editar el contenido.
- Cómo grabar una voz humana.
- Las mediciones de peso y tiempo de carga.
- Las limitaciones honestas.

---

## Orden de trabajo

Haz un commit por paso. Al terminar cada uno, corre `npm run verificar`.

1. **Paso 0:** correcciones de la v1.
2. **Paso 1:** arquitectura nueva con la v1 funcionando dentro de ella. La aventura de la unidad 1 debe jugarse igual que antes.
3. **Paso 2:** muestras de voz y música. **Detente** para que René elija.
4. **Paso 2:** sistema de audio completo con lo elegido.
5. **Paso 3:** grupos, camino, motor de ejercicios con los 8 tipos y recompensas.
6. **Paso 4:** unidades 1 y 2 completas, con sus aventuras.
7. **Paso 4:** unidades 3, 4 y 5 completas, con sus aventuras.
8. **Paso 5:** pruebas, capturas y README.

**No despliegues todavía.** Al terminar, avísale a René. Él revisa el juego en local con `npm run dev` antes de publicarlo en Vercel.

**Revisión visual:** antes de cada paso, explica brevemente qué vas a hacer. Al final de cada paso con interfaz, abre el juego en el navegador, recórrelo a 1920×1080 y a 1024×768, y corrige lo que se vea mal.
