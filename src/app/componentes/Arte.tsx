import type { ImgHTMLAttributes } from 'react';
import { catalogoArte } from '../../arte/catalogo';
import { ARTE_ESCENAS } from '../../arte/escenas';
import { aDataUri, type ArteSvg } from '../../arte/svg';

/** Las ilustraciones listas para usarse en React (como data URI). */
const URLS = new Map<string, string>();

/**
 * Agrega dibujos al registro. Los que se ven desde el inicio vienen aquí mismo; los de otras
 * pantallas (accesorios, ambientes de las unidades) los registra su módulo al cargarse, así no
 * pesan en lo que se descarga antes de la primera pantalla.
 */
export function registrarArte(lista: readonly ArteSvg[]): void {
  for (const a of lista) if (!URLS.has(a.clave)) URLS.set(a.clave, aDataUri(a.svg));
}

// Las mismas ilustraciones SVG de las aventuras, más las del inicio (solo React).
registrarArte([...catalogoArte(), ...ARTE_ESCENAS]);

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
