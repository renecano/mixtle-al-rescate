import { useState } from 'react';
import { TEXTOS_APP } from '../../contenido/textosApp';
import { nombreDelGrupo, type Grupo } from '../../logica/grupos';
import { useApp } from '../estado/app';
import { useGrupos } from '../estado/grupos';
import { BotonGrande } from './BotonGrande';
import { Modal } from './Modal';

/**
 * Modo facilitador (para la persona de Eco Urban o el maestro): reiniciar el grupo, abrir todas las
 * lecciones para saltar a una, y el modo proyector. Se abre manteniendo presionado el logo 3 segundos.
 */
export function PanelFacilitador({ grupo, alCerrar, alRecorrido }: { grupo: Grupo; alCerrar: () => void; alRecorrido: () => void }) {
  const { reiniciar, desbloquearTodo } = useGrupos();
  const { proyector, alternarProyector, suave, alternarSuave } = useApp();
  const [confirmar, setConfirmar] = useState(false);
  const fila = 'flex w-full items-center justify-between gap-4 rounded-2xl bg-white px-5 py-3 text-left text-[clamp(1.1rem,2.4vmin,1.5rem)] font-extrabold';

  return (
    <Modal etiqueta={TEXTOS_APP.facilitador.titulo}>
      <h2 className="text-[clamp(1.6rem,4vmin,2.4rem)] font-black text-verde">{TEXTOS_APP.facilitador.titulo}</h2>
      <p className="font-bold">{nombreDelGrupo(grupo)}</p>
      <label className={fila}>
        {TEXTOS_APP.facilitador.desbloquear}
        <input type="checkbox" className="size-10 accent-verde" checked={grupo.desbloquearTodo} onChange={(e) => desbloquearTodo(grupo.id, e.target.checked)} />
      </label>
      <label className={fila}>
        {TEXTOS_APP.facilitador.proyector}
        <input type="checkbox" className="size-10 accent-verde" checked={proyector} onChange={alternarProyector} />
      </label>
      <label className={fila}>
        {TEXTOS_APP.facilitador.suave}
        <input type="checkbox" className="size-10 accent-verde" checked={suave} onChange={alternarSuave} />
      </label>
      <BotonGrande color="azul" className="h-16 text-[clamp(1.1rem,2.4vmin,1.5rem)]" onClick={alRecorrido}>
        {TEXTOS_APP.facilitador.recorrido}
      </BotonGrande>
      {confirmar ? (
        <div className="flex w-full flex-col items-center gap-3 rounded-2xl border-4 border-naranja bg-white p-4">
          <p className="font-bold">{TEXTOS_APP.facilitador.reiniciarConfirmar}</p>
          <div className="flex gap-3">
            <BotonGrande
              color="naranja"
              className="h-16 text-lg"
              onClick={() => {
                reiniciar(grupo.id);
                setConfirmar(false);
              }}
            >
              {TEXTOS_APP.facilitador.reiniciar}
            </BotonGrande>
            <BotonGrande color="gris" className="h-16 text-lg" onClick={() => setConfirmar(false)}>
              {TEXTOS_APP.grupos.cancelar}
            </BotonGrande>
          </div>
        </div>
      ) : (
        <BotonGrande color="naranja" className="h-16 text-[clamp(1.1rem,2.4vmin,1.5rem)]" onClick={() => setConfirmar(true)}>
          {TEXTOS_APP.facilitador.reiniciar}
        </BotonGrande>
      )}
      <BotonGrande color="verde" className="h-16 text-[clamp(1.1rem,2.4vmin,1.5rem)]" onClick={alCerrar}>
        {TEXTOS_APP.facilitador.cerrar}
      </BotonGrande>
    </Modal>
  );
}
