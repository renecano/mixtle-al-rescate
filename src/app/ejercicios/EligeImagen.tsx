import { useState } from 'react';
import type { EligeImagen as Datos, EscuchaToca } from '../../contenido/tipos';
import { Tarjeta, type PropsEjercicio } from './comun';

/**
 * 1. Elige la imagen y 7. Escucha y toca (la misma mecánica; en "escucha y toca" no hay texto:
 * solo la voz de Caco y los dibujos, para quienes todavía no leen).
 */
export function EligeImagen({ ejercicio, responder, bloqueado }: PropsEjercicio<Datos | EscuchaToca>) {
  const [acertada, setAcertada] = useState<string | null>(null);
  const [error, setError] = useState<{ id: string; vez: number } | null>(null);
  const conTexto = ejercicio.tipo === 'elige-imagen' && !!ejercicio.conTexto;

  return (
    <div className="flex flex-wrap items-center justify-center gap-[clamp(1rem,3vmin,2.5rem)]" data-ejercicio={ejercicio.tipo}>
      {ejercicio.opciones.map((op) => (
        <Tarjeta
          key={op.id}
          tarjeta={op}
          conTexto={conTexto}
          estado={acertada === op.id ? 'bien' : acertada ? 'apagada' : error?.id === op.id ? 'mal' : 'normal'}
          sacudir={error?.id === op.id ? error.vez : 0}
          onClick={() => {
            if (bloqueado || acertada) return;
            if (op.id === ejercicio.correcta) {
              setAcertada(op.id);
              responder({ correcto: true, terminado: true });
            } else {
              setError((e) => ({ id: op.id, vez: (e?.vez ?? 0) + 1 }));
              responder({ correcto: false, terminado: false });
            }
          }}
        />
      ))}
    </div>
  );
}
