import { useState } from 'react';
import { TEXTOS_APP } from '../../contenido/textosApp';
import { nombreDelGrupo, type Grupo } from '../../logica/grupos';
import { useApp } from '../estado/app';
import { porcentaje, useDescargaSinInternet } from '../../servicios/sinInternet';
import { useGrupos } from '../estado/grupos';
import { BotonGrande } from './BotonGrande';
import { Modal } from './Modal';

/**
 * Modo facilitador (para la persona de Eco Urban o el maestro): reiniciar el grupo, abrir todas las
 * lecciones para saltar a una, y el modo proyector. Se abre manteniendo presionado el logo 3 segundos.
 */
export function PanelFacilitador({ grupo, alCerrar, alRecorrido }: { grupo: Grupo; alCerrar: () => void; alRecorrido: () => void }) {
  const { reiniciar, desbloquearTodo, crearDemo, borrar } = useGrupos();
  const { proyector, alternarProyector, suave, alternarSuave } = useApp();
  /** Qué acción está pidiendo confirmación (reiniciar o borrar el grupo). */
  const [confirmar, setConfirmar] = useState<'reiniciar' | 'borrar' | null>(null);
  const t = TEXTOS_APP.facilitador;
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
      <EstadoSinInternet />
      <BotonGrande color="azul" className="h-16 text-[clamp(1.1rem,2.4vmin,1.5rem)]" onClick={alRecorrido}>
        {TEXTOS_APP.facilitador.recorrido}
      </BotonGrande>
      {/* Grupo de demostración: para enseñar el juego completo sin jugarlo (queda elegido). */}
      <BotonGrande
        color="morado"
        className="h-16 text-[clamp(1.1rem,2.4vmin,1.5rem)]"
        onClick={() => {
          crearDemo();
          alCerrar();
        }}
      >
        {t.demo}
      </BotonGrande>
      <p className="-mt-3 text-[clamp(0.95rem,2vmin,1.2rem)] font-bold opacity-80">{t.demoAyuda}</p>
      {confirmar ? (
        <div className="flex w-full flex-col items-center gap-3 rounded-2xl border-4 border-naranja bg-white p-4" data-confirmar={confirmar}>
          <p className="font-bold">{confirmar === 'borrar' ? t.borrarConfirmar : t.reiniciarConfirmar}</p>
          <div className="flex gap-3">
            <BotonGrande
              color="naranja"
              className="h-16 text-lg"
              onClick={() => {
                if (confirmar === 'borrar') {
                  borrar(grupo.id);
                  alCerrar();
                } else reiniciar(grupo.id);
                setConfirmar(null);
              }}
            >
              {confirmar === 'borrar' ? t.borrar : t.reiniciar}
            </BotonGrande>
            <BotonGrande color="gris" className="h-16 text-lg" onClick={() => setConfirmar(null)}>
              {TEXTOS_APP.grupos.cancelar}
            </BotonGrande>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap justify-center gap-3">
          <BotonGrande color="naranja" className="h-16 text-[clamp(1.1rem,2.4vmin,1.5rem)]" onClick={() => setConfirmar('reiniciar')}>
            {t.reiniciar}
          </BotonGrande>
          {/* Borrar vale para cualquier grupo (también el de demostración). */}
          <BotonGrande color="gris" className="h-16 text-[clamp(1.1rem,2.4vmin,1.5rem)]" onClick={() => setConfirmar('borrar')}>
            {t.borrar}
          </BotonGrande>
        </div>
      )}
      <BotonGrande color="verde" className="h-16 text-[clamp(1.1rem,2.4vmin,1.5rem)]" onClick={alCerrar}>
        {TEXTOS_APP.facilitador.cerrar}
      </BotonGrande>
    </Modal>
  );
}

/** ¿Ya se puede usar sin internet? Y si no, cuánto va de la descarga (voces, música y efectos). */
function EstadoSinInternet() {
  const descarga = useDescargaSinInternet();
  const t = TEXTOS_APP.facilitador.sinInternet;
  const n = porcentaje(descarga);
  const texto =
    descarga.fase === 'listo' ? t.listo : descarga.fase === 'descargando' ? t.descargando(n) : descarga.fase === 'sin-conexion' ? t.sinConexion(n) : descarga.fase === 'no-disponible' ? t.noDisponible : t.esperando;
  return (
    <div className="flex w-full flex-col gap-2 rounded-2xl bg-white px-5 py-3 text-left" role="status" data-sin-internet={descarga.fase}>
      <p className="text-[clamp(1.05rem,2.3vmin,1.4rem)] font-extrabold">{texto}</p>
      {descarga.fase !== 'listo' && descarga.bytesTotales > 0 && (
        <div className="h-3 overflow-hidden rounded-full bg-verde/15" aria-hidden="true">
          <div className="h-full rounded-full bg-verde" style={{ width: `${n}%` }} />
        </div>
      )}
    </div>
  );
}
