import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type RolCanonico =
  | 'PLATAFORMA:ADMIN_MASTER'
  | 'PLATAFORMA:SUPERVISOR'
  | 'PLATAFORMA:SOPORTE'
  | 'CLINICA:ADMIN_MASTER'
  | 'CLINICA:ADMIN'
  | 'CLINICA:ASESOR'
  | 'CLINICA:DOCTOR'
  | 'CLINICA:RECEPCION';

export interface UsuarioSesion {
  id: string;
  nombre: string;
  correo: string;
  tipoUsuario: 'PLATAFORMA' | 'CLINICA';
  rolCanonico: RolCanonico;
  clinicaId: string | null;
}

interface AuthState {
  accessToken: string | null;
  usuario: UsuarioSesion | null;
  setSesion: (accessToken: string, usuario: UsuarioSesion) => void;
  logout: () => void;
}

// Sesión del usuario logueado — persistida para no perderla al recargar la página.
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      usuario: null,
      setSesion: (accessToken, usuario) => set({ accessToken, usuario }),
      logout: () => set({ accessToken: null, usuario: null }),
    }),
    { name: 'velia-sesion' },
  ),
);
