import type { Clasificador, FuenteImagen } from './tipos';

export interface OpcionesMobileNet {
  version: 1 | 2;
  alpha: 0.25 | 0.5 | 0.75 | 1.0;
  modelUrl?: string;
}

/** MobileNet (ImageNet, 1000 clases). TensorFlow.js y el modelo se descargan aquí, no al inicio. */
export async function cargarMobileNet(op: OpcionesMobileNet): Promise<Clasificador> {
  const tf = await import('@tensorflow/tfjs');
  await tf.ready();
  const mobilenet = await import('@tensorflow-models/mobilenet');
  const modelo = await mobilenet.load({ version: op.version, alpha: op.alpha, ...(op.modelUrl ? { modelUrl: op.modelUrl } : {}) });
  return {
    nombre: `MobileNet v${op.version} (${tf.getBackend()})`,
    async clasificar(fuente: FuenteImagen) {
      const resultado = await modelo.classify(fuente, 5);
      return resultado.map((r) => ({ etiqueta: r.className, probabilidad: r.probability }));
    },
  };
}
