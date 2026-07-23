import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { eliminarUsuario, getUsuarios } from '../../lib/usuarios';
import CrearUsuarioForm from './CrearUsuarioForm';
import EliminarUsuarioModal from './EliminarUsuarioModal';
import type { Usuario } from '../../types';

export default function UsuariosPage() {
  const queryClient = useQueryClient();
  const [mostrarForm, setMostrarForm] = useState(false);
  const [usuarioAEliminar, setUsuarioAEliminar] = useState<Usuario | null>(null);
  const [errorEliminar, setErrorEliminar] = useState<string | null>(null);

  const { data: usuarios = [], isLoading, isError } = useQuery({
    queryKey: ['usuarios'],
    queryFn: getUsuarios,
  });

  const mutacionEliminar = useMutation({
    mutationFn: ({ id, clave }: { id: string; clave?: string }) => eliminarUsuario(id, clave),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      setUsuarioAEliminar(null);
      setErrorEliminar(null);
    },
    onError: () => setErrorEliminar('No se pudo eliminar — revisa la clave maestra o tus permisos.'),
  });

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Usuarios</h1>
        <button
          onClick={() => setMostrarForm((v) => !v)}
          className="flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
        >
          <Plus size={16} /> Nuevo usuario
        </button>
      </div>

      {mostrarForm && <CrearUsuarioForm onCreado={() => setMostrarForm(false)} />}

      {isLoading && <p className="text-sm text-gray-500">Cargando usuarios...</p>}
      {isError && <p className="text-sm text-red-600">No tienes permiso para ver esta sección.</p>}

      {!isLoading && !isError && (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-gray-500">Nombre</th>
                <th className="px-4 py-2 text-left font-medium text-gray-500">Correo</th>
                <th className="px-4 py-2 text-left font-medium text-gray-500">Tipo</th>
                <th className="px-4 py-2 text-left font-medium text-gray-500">Rol</th>
                <th className="px-4 py-2 text-left font-medium text-gray-500">Creado</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {usuarios.map((u) => (
                <tr key={u.id}>
                  <td className="px-4 py-2 font-medium text-gray-900">{u.nombre}</td>
                  <td className="px-4 py-2 text-gray-500">{u.correo}</td>
                  <td className="px-4 py-2 text-gray-700">{u.tipoUsuario === 'PLATAFORMA' ? 'Plataforma' : 'Clínica'}</td>
                  <td className="px-4 py-2 text-gray-700">{u.rolPlataforma ?? u.rolClinica}</td>
                  <td className="px-4 py-2 text-gray-400">{new Date(u.createdAt).toLocaleDateString('es-PE')}</td>
                  <td className="px-4 py-2 text-right">
                    <button
                      onClick={() => {
                        setErrorEliminar(null);
                        setUsuarioAEliminar(u);
                      }}
                      className="text-xs font-medium text-red-600 hover:underline"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
              {usuarios.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-gray-400">
                    Sin usuarios registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {usuarioAEliminar && (
        <EliminarUsuarioModal
          usuario={usuarioAEliminar}
          error={errorEliminar}
          onCancelar={() => setUsuarioAEliminar(null)}
          onConfirmar={(clave) => mutacionEliminar.mutate({ id: usuarioAEliminar.id, clave })}
        />
      )}
    </div>
  );
}
