import { LEMA, logoSvg } from '../../arte/marca';

// Sufijo propio: el logo de la pantalla de carga (index.html, oculto al arrancar la app) usa los id sin sufijo.
const SVG = logoSvg({ atributos: 'width="100%" height="100%" aria-hidden="true" focusable="false"', sufijo: '-logo' });
const SVG_SIN_MIXTLE = logoSvg({ sinMixtle: true, atributos: 'width="100%" height="100%" aria-hidden="true" focusable="false"' });

interface Props {
  className?: string;
  /** Sin Mixtle, cuando Mixtle ya está en la escena. */
  sinMixtle?: boolean;
  /** Como título de la pantalla (h1); si no, una imagen con nombre. */
  comoTitulo?: boolean;
}

/** El logo "Mixtle al rescate" con el lema (SVG con las letras en trazos: no espera a ninguna fuente). */
export function Logo({ className = '', sinMixtle = false, comoTitulo = false }: Props) {
  const nombre = `Mixtle al rescate. ${LEMA}`;
  const svg = <div className="h-full w-full" dangerouslySetInnerHTML={{ __html: sinMixtle ? SVG_SIN_MIXTLE : SVG }} />;
  if (comoTitulo) {
    return (
      <h1 className={`logo ${className}`}>
        <span className="sr-only">{nombre}</span>
        {svg}
      </h1>
    );
  }
  return (
    <div className={`logo ${className}`} role="img" aria-label={nombre}>
      {svg}
    </div>
  );
}
