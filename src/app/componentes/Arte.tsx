import type { ImgHTMLAttributes } from 'react';
import { catalogoArte } from '../../arte/catalogo';
import { ARTE_ACCESORIOS } from '../../arte/accesorios';
import { ARTE_ESCENAS } from '../../arte/escenas';
import { aDataUri } from '../../arte/svg';

/** Las mismas ilustraciones SVG de las aventuras, más las que solo usa React (escenas), listas para usarse. */
const URLS = new Map([...catalogoArte(), ...ARTE_ESCENAS, ...ARTE_ACCESORIOS].map((a) => [a.clave, aDataUri(a.svg)]));

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
