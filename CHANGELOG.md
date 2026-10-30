# Historial de versiones

Fechas de octubre de 2026. Las etiquetas de git marcan las versiones que vio Eco Urban.

## Entrega (30 de octubre)

- Repositorio limpio para compartirlo con Eco Urban: se quitó el material de trabajo interno, las mediciones pasaron a `docs/mediciones/`, el README se reescribió como documento de entrega y se agregó la licencia MIT.
- Cierres sobre la versión aprobada: el modo facilitador cabe en la tablet (1024×768) con "Cerrar" siempre a la vista; el paliacate se nota puesto en la mariposa monarca; la prueba de la aventura que una vez marcó "0 frases con audio" se explicó (era la comprobación de nombres de archivo, no la voz); se midió "Listo para usar sin internet" con red lenta en producción (3.8 min) y la corrida completa de recorridos contra producción (58 de 58).

## v3-demo (29 de octubre, noche) — la versión que Eco Urban aprobó el 30 de octubre

- Mixtle se ve igual en todas sus apariciones (los degradados del SVG en línea ya no se mezclan entre instancias); página `?mixtle` para revisarlo.
- Paliacate rediseñado como un paliacate mexicano anudado al cuello.
- El vestidor muestra a la mascota siempre dentro de su recuadro, con las seis mascotas y todos los accesorios, en seis tamaños de pantalla.
- Mixtle saluda al grupo nuevo si cambia el grupo con el camino en pantalla.

## v3-estable (29 de octubre)

- Voz de Mixtle con **Azure AI Speech** (Alejo, español de México, estilo «excited»), elegida entre muestras de 12 voces. Recorte del silencio de los audios (de 30 % a 16 %) y frases con números dichas de corrido.
- Carga rápida con red lenta: "¡Jugar!" → "¿Quién va a jugar?" de 5.2 s a 0.35 s (Slow 4G). El *service worker* guarda primero lo esencial y el resto baja en segundo plano; el modo facilitador muestra "Listo para usar sin internet".
- Las versiones nuevas se activan solas (también con la pestaña abierta) y la página se recarga en una pantalla segura, nunca a media lección; aviso en el inicio por si acaso.
- Recorrido guiado del camino la primera vez de cada grupo; vestidor que pregunta antes de comprar; grupo de demostración y borrar grupo en el modo facilitador.
- La música suena desde el primer toque en cualquier parte del inicio y ya no se calla sola en Chrome (contexto de audio propio); `?depurar-audio` para diagnosticar.

## v3 (28 de octubre)

- **Nuevo nombre y marca:** "Mixtle al rescate", lema "Guardianes del parque", logo en SVG, ícono de la app, pantalla de carga y hoja de personaje con 8 poses. Dirección visual "Parque de día", elegida entre tres propuestas.
- Inicio animado (parque en capas con el Nevado de Toluca, Mixtle que llega columpiándose), transición de marca entre pantallas y modo vitrina para ferias.
- Cada toque responde (botones que se aplastan, chispas, sonidos); lluvia de hojitas al acertar; racha dentro de la lección; cofre, estampa, parque "Antes → ¡Ahora!" y fin de unidad con celebración; diploma imprimible por unidad.
- Un ambiente y una paleta por unidad (parque, humedal, bosque del Nevado, calles de Toluca, escuela) que decora los lados del camino; el parque del grupo como protagonista.
- Vestidor: accesorios para la mascota del grupo a precio fijo en hojitas.
- Se quitó la racha de días y la comparación de hojitas entre grupos.
- Medido: 59–60 fps con tarjeta de video; en equipos sin ella el juego pasa solo a animaciones suaves. Primera pantalla por debajo de 250 KB.
- Revisión del 28 de octubre: cola anillada de Mixtle en todas sus poses, la mascota del grupo no tapa nada en el camino, el encabezado del camino cabe en una línea en la tablet.

## v2-eco-urban (27 de octubre) — primera versión que vio Eco Urban

- Arquitectura nueva: React para las pantallas y Phaser solo para las aventuras.
- Camino de aprendizaje con 5 unidades, lecciones de 6 a 8 ejercicios con 7 tipos de ejercicio dirigidos por datos, cofres y una aventura por unidad.
- Grupos de salón (animal, color y etiqueta), avance guardado en el aparato, álbum de estampas con animales de Toluca.
- Voz pregenerada del personaje, igual en todos los equipos, y música CC0 con *ducking*.
- Se quitó el módulo de cámara de la v1.
- Primeras mediciones en producción y recorridos automáticos en el navegador.

## v1 (26 de octubre)

- Prototipo "Caco al rescate" en Phaser: intro, tres niveles (limpiar el parque, ¿a qué bote va?, un hogar para los animales), bonus y diploma "Guardianes del parque". Arte original en SVG, voz del navegador, contenido configurable en archivos de datos.
