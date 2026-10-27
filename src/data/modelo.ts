/*
 * Configuración del modelo de visión del bonus "Muéstrale a Caco".
 *
 * Por defecto se usa MobileNet (reconoce 1000 objetos de ImageNet y se traduce a las
 * categorías con src/data/mapeoImagenet.ts).
 *
 * Para usar un modelo propio de Teachable Machine (https://teachablemachine.withgoogle.com):
 *  1. Entrena un proyecto de "Imagen" con una clase por bote. Nombra cada clase igual que
 *     el `id` de su categoría en categorias.ts (por ejemplo: organico, reciclable, no-reciclable).
 *     Puedes agregar una clase "nada" para cuando no se muestra ningún residuo.
 *  2. Exporta el modelo → "Subir mi modelo" (o descárgalo y ponlo en /public/modelo/).
 *  3. Pega aquí la URL que termina en "/" (o la ruta "modelo/"), o define la variable de
 *     entorno VITE_TEACHABLE_URL en Vercel. No hay que tocar nada más.
 */
export const MODELO = {
  teachableMachineUrl: (import.meta.env.VITE_TEACHABLE_URL as string | undefined) ?? '',
  mobilenet: {
    version: 2 as const,
    alpha: 1.0 as const,
    /** Opcional: URL de una copia propia del modelo (por ejemplo, para usarlo sin internet). */
    modelUrl: (import.meta.env.VITE_MOBILENET_URL as string | undefined) || undefined,
  },
  /** Confianza mínima (0 a 1) para que Caco se anime a decir qué es. Si no, pide ayuda. */
  umbralConfianza: 0.3,
};
