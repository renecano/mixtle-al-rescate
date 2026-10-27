import type { ImgHTMLAttributes } from 'react';
import { catalogoArte } from '../../arte/catalogo';
import { aDataUri } from '../../arte/svg';

/** Las mismas ilustraciones SVG de las aventuras, listas para usarse en React. */
const URLS = new Map(catalogoArte().map((a) => [a.clave, aDataUri(a.svg)]));

export function urlArte(clave: string): string {
  const url = URLS.get(clave);
  if (!url) throw new Error(`No existe el dibujo "${clave}"`);
  return url;
}

interface Props extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  clave: string;
}

/** Un dibujo del juego. Es decorativo salvo que se le dé un `alt`. */
export function Arte({ clave, alt = '', ...resto }: Props) {
  return <img src={urlArte(clave)} alt={alt} draggable={false} {...resto} />;
}
