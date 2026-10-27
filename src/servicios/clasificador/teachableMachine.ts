import type { Clasificador, FuenteImagen } from './tipos';

interface MetadatosTeachable {
  labels: string[];
  imageSize?: number;
}

/** Une la URL base con un archivo, aceptando URLs con o sin "/" final. */
export function urlArchivoModelo(base: string, archivo: string): string {
  return `${base.endsWith('/') ? base : `${base}/`}${archivo}`;
}

/**
 * Modelo de imagen exportado de Teachable Machine (model.json + metadata.json).
 * Recorta al centro, redimensiona y normaliza a [-1, 1], igual que la biblioteca oficial.
 */
export async function cargarTeachableMachine(url: string): Promise<Clasificador> {
  const tf = await import('@tensorflow/tfjs');
  await tf.ready();
  const [modelo, meta] = await Promise.all([
    tf.loadLayersModel(urlArchivoModelo(url, 'model.json')),
    fetch(urlArchivoModelo(url, 'metadata.json')).then((r) => {
      if (!r.ok) throw new Error(`metadata.json: ${r.status}`);
      return r.json() as Promise<MetadatosTeachable>;
    }),
  ]);
  const tam = meta.imageSize ?? 224;

  return {
    nombre: `Teachable Machine (${meta.labels.length} clases)`,
    async clasificar(fuente: FuenteImagen) {
      const probabilidades = tf.tidy(() => {
        const img = tf.browser.fromPixels(fuente);
        const [alto, ancho] = img.shape;
        const lado = Math.min(alto, ancho);
        const recorte = img.slice([Math.floor((alto - lado) / 2), Math.floor((ancho - lado) / 2), 0], [lado, lado, 3]);
        const entrada = tf.image.resizeBilinear(recorte, [tam, tam]).toFloat().div(127.5).sub(1).expandDims(0);
        return (modelo.predict(entrada) as import('@tensorflow/tfjs').Tensor).dataSync();
      });
      return meta.labels
        .map((etiqueta, i) => ({ etiqueta, probabilidad: probabilidades[i] ?? 0 }))
        .sort((a, b) => b.probabilidad - a.probabilidad);
    },
  };
}
