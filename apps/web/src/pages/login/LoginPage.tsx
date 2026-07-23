import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { login } from '../../lib/auth';
import { useAuthStore } from '../../store/useAuthStore';

interface LoginForm {
  correo: string;
  password: string;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const setSesion = useAuthStore((s) => s.setSesion);
  const [errorLogin, setErrorLogin] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>();

  async function onSubmit(datos: LoginForm) {
    setErrorLogin(null);
    try {
      const { accessToken, usuario } = await login(datos.correo, datos.password);
      setSesion(accessToken, usuario);
      navigate('/kanban', { replace: true });
    } catch {
      setErrorLogin('Correo o contraseña incorrectos.');
    }
  }

  return (
    <div className="flex h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="mb-1 text-lg font-semibold text-indigo-700">AGENDA IA</h1>
        <p className="mb-4 text-sm text-gray-500">Ingresa con tu correo y contraseña.</p>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Correo</label>
            <input
              type="email"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              {...register('correo', { required: 'El correo es requerido' })}
            />
            {errors.correo && <p className="mt-1 text-xs text-red-600">{errors.correo.message}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Contraseña</label>
            <input
              type="password"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              {...register('password', { required: 'La contraseña es requerida' })}
            />
            {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
          </div>

          {errorLogin && <p className="text-sm text-red-600">{errorLogin}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  );
}
