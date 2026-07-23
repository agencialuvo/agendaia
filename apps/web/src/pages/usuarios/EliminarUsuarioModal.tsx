import { useState } from 'react';
import type { Usuario } from '../../types';

const esAdminMaster = (u: Usuario) => u.rolPlataforma === 'ADMIN_MASTER' || u.rolClinica === 'ADMIN_MASTER';

export default function EliminarUsuarioModal({
  usuario,
  onConfirmar,
  onCancelar,
  error,
}: {
  usuario: Usuario;
  onConfirmar: (claveMaestraEliminacion?: string) => void;
  onCancelar: () => void;
  error?: string | null;
}) {
  const [clave, setClave] = useState('');
  const requiereClave = esAdminMaster(usuario);

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/30" onClick={onCancelar}>
      <div className="w-full max-w-sm rounded-lg bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="mb-2 text-base font-semibold text-gray-900">Eliminar usuario</h3>
        <p className="mb-3 text-sm text-gray-600">
          ¿Eliminar a <b>{usuario.nombre}</b> ({usuario.correo})?
        </p>

        {requiereClave && (
          <div className="mb-3">
            <p className="mb-1 text-xs font-medium text-amber-700">
              Este usuario es Admin Master — requiere la clave maestra de eliminación.
            </p>
            <input
              type="password"
              value={clave}
              onChange={(e) => setClave(e.target.value)}
              placeholder="Clave maestra de eliminación"
              className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
            />
          </div>
        )}

        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-2">
          <button
            onClick={onCancelar}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={() => onConfirmar(requiereClave ? clave : undefined)}
            className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}
