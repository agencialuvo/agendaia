import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppState {
  clinicaActivaId: string | null;
  setClinicaActiva: (id: string) => void;
  sidebarExpandido: boolean;
  toggleSidebar: () => void;
}

// Estado global mínimo — filtros de UI, clínica activa (para cuentas multi-clínica), etc.
export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      clinicaActivaId: null,
      setClinicaActiva: (id) => set({ clinicaActivaId: id }),
      sidebarExpandido: true,
      toggleSidebar: () => set((state) => ({ sidebarExpandido: !state.sidebarExpandido })),
    }),
    { name: 'velia-ui-preferencias', partialize: (state) => ({ sidebarExpandido: state.sidebarExpandido }) },
  ),
);
