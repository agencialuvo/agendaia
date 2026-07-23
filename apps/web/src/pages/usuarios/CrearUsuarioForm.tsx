import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { crearUsuario } from '../../lib/usuarios';
import { getClinicas } from '../../lib/tenants';
import { useAuthStore } from '../../store/useAuthStore';
import type { RolClinica, RolPlataforma, TipoUsuario } from '../../types';

interface FormValues {
  nombre: string;
  correo: string;
  password: string;
  tipoUsuario: TipoUsuario;
  rolPlataforma?: RolPlataforma;
  rolClinica?: RolClinica;
  clinicaId?: string;
}

const ROLES_PLATAFORMA: RolPlataforma[] = ['ADMIN_MASTER', 'SUPERVISOR', 'SOPORTE'];
const ROLES_CLINICA: RolClinica[] = ['ADMIN_MASTER', 'ADMIN', 'ASESOR', 'DOCTOR', 'RECEPCION'];

export default function CrearUsuarioForm({ onCreado }: { onCreado: () => void }) {
  const usuario = useAuthStore((s) => s.usuario);
  const esPlataformaAdminMaster = usuario?.rolCanonico === 'PLATAFORMA:ADMIN_MASTER';
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const { data: clinicas = [] } = useQuery({ queryKey: ['clinicas'], queryFn: getClinicas, enabled: esPlataformaAdminMaster });

  const { register, handleSubmit, watch, formState: { isSubmitting } } = useForm<FormValues>({
    defaultValues: {
      tipoUsuario: esPlataformaAdminMaster ? 'PLATAFORMA' : 'CLINICA',
      clinicaId: esPlataformaAdminMaster ? undefined : (usuario?.clinicaId ?? undefined),
    },
  });

  const tipoUsuario = watch('tipoUsuario');

  const mutacion = useMutation({
    mutationFn: (values: FormValues) => crearUsuario(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      onCreado();
    },
    onError: () => setError('No se pudo crear el usuario — revisa los datos e intenta de nuevo.'),
  });

  return (
    <form
      onSubmit={handleSubmit((values) => mutacion.mutate(values))}
      className="mb-4 grid grid-cols-1 gap-3 rounded-lg border border-gray-200 bg-white p-4 sm:grid-cols-2"
    >
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-500">Nombre</label>
        <input {...register('nombre', { required: true })} className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm" />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-500">Correo</label>
        <input type="email" {...register('correo', { required: true })} className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm" />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-500">Contraseña</label>
        <input type="password" {...register('password', { required: true, minLength: 8 })} className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm" />
      </div>

      {esPlataformaAdminMaster && (
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Tipo de usuario</label>
          <select {...register('tipoUsuario')} className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm">
            <option value="PLATAFORMA">Plataforma (tu empresa)</option>
            <option value="CLINICA">Clínica</option>
          </select>
        </div>
      )}

      {tipoUsuario === 'PLATAFORMA' ? (
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Rol de plataforma</label>
          <select {...register('rolPlataforma')} className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm">
            {ROLES_PLATAFORMA.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
      ) : (
        <>
          {esPlataformaAdminMaster && (
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Clínica</label>
              <select {...register('clinicaId', { required: true })} className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm">
                {clinicas.map((c) => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Rol en la clínica</label>
            <select {...register('rolClinica')} className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm">
              {ROLES_CLINICA.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
        </>
      )}

      {error && <p className="col-span-full text-sm text-red-600">{error}</p>}

      <div className="col-span-full flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {isSubmitting ? 'Creando...' : 'Crear usuario'}
        </button>
      </div>
    </form>
  );
}
