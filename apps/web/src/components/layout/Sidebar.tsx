import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Kanban,
  CalendarDays,
  Users,
  BarChart3,
  UserCog,
  LogOut,
  type LucideIcon,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useAuthStore, type RolCanonico } from '../../store/useAuthStore';

interface NavHijo {
  label: string;
  path: string;
}

interface NavItem {
  label: string;
  path?: string;
  icon: LucideIcon;
  hijos?: NavHijo[];
  roles?: RolCanonico[]; // si se define, el ítem solo se muestra a estos roles
}

// Ítems de navegación principal. Los que traen `hijos` se muestran como grupo
// expandible: el ítem padre lleva ícono + texto, los hijos solo texto (sangrados).
const NAV_ITEMS: NavItem[] = [
  { label: 'Embudo', path: '/kanban', icon: Kanban },
  { label: 'Calendario', path: '/calendario', icon: CalendarDays },
  { label: 'Leads', path: '/leads', icon: Users },
  { label: 'Reportes', path: '/reportes', icon: BarChart3 },
  {
    label: 'Usuarios',
    path: '/usuarios',
    icon: UserCog,
    roles: ['PLATAFORMA:ADMIN_MASTER', 'PLATAFORMA:SUPERVISOR', 'PLATAFORMA:SOPORTE', 'CLINICA:ADMIN_MASTER', 'CLINICA:ADMIN'],
  },
];

function linkClasses(activo: boolean) {
  return `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
    activo ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
  }`;
}

function GrupoConHijos({ item, expandido }: { item: NavItem; expandido: boolean }) {
  const [abierto, setAbierto] = useState(false);
  const Icono = item.icon;

  return (
    <div>
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900"
        title={!expandido ? item.label : undefined}
      >
        <Icono size={20} className="shrink-0" />
        {expandido && <span className="flex-1 truncate text-left">{item.label}</span>}
      </button>
      {expandido && abierto && (
        <div className="ml-8 flex flex-col gap-1 border-l border-gray-200 pl-3">
          {item.hijos?.map((hijo) => (
            <NavLink
              key={hijo.path}
              to={hijo.path}
              className={({ isActive }) =>
                `rounded px-2 py-1.5 text-sm ${isActive ? 'text-indigo-700 font-medium' : 'text-gray-500 hover:text-gray-900'}`
              }
            >
              {hijo.label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Sidebar() {
  const expandido = useAppStore((s) => s.sidebarExpandido);
  const toggleSidebar = useAppStore((s) => s.toggleSidebar);
  const usuario = useAuthStore((s) => s.usuario);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  function cerrarSesion() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <aside
      className={`flex h-screen shrink-0 flex-col border-r border-gray-200 bg-white transition-all duration-200 ${
        expandido ? 'w-60' : 'w-16'
      }`}
    >
      <div className="flex h-14 items-center justify-between border-b border-gray-200 px-3">
        <span className="truncate text-lg font-bold tracking-tight text-indigo-700">
          {expandido ? 'AGENDA IA' : 'A'}
        </span>
        <button
          type="button"
          onClick={toggleSidebar}
          className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
          aria-label={expandido ? 'Contraer menú' : 'Expandir menú'}
        >
          {expandido ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </button>
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-2">
        {NAV_ITEMS.filter((item) => !item.roles || (usuario && item.roles.includes(usuario.rolCanonico))).map((item) => {
          if (item.hijos) {
            return <GrupoConHijos key={item.label} item={item} expandido={expandido} />;
          }
          const Icono = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path as string}
              className={({ isActive }) => linkClasses(isActive)}
              title={!expandido ? item.label : undefined}
            >
              <Icono size={20} className="shrink-0" />
              {expandido && <span className="truncate">{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      <div className="border-t border-gray-200 p-2">
        {expandido && usuario && (
          <div className="mb-1 truncate px-2 text-xs text-gray-500">
            <p className="truncate font-medium text-gray-700">{usuario.nombre}</p>
            <p className="truncate">{usuario.rolCanonico}</p>
          </div>
        )}
        <button
          type="button"
          onClick={cerrarSesion}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-red-600"
          title={!expandido ? 'Cerrar sesión' : undefined}
        >
          <LogOut size={20} className="shrink-0" />
          {expandido && <span>Cerrar sesión</span>}
        </button>
      </div>
    </aside>
  );
}
