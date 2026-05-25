'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Users, Layers3, CreditCard, DollarSign, Calendar, ChartBar as BarChart3, Settings, LogOut, ChevronLeft, ChevronRight, UserCog } from 'lucide-react';
import GCLogo from '@/components/GCLogo';

const navSections = [
  {
    label: 'Principal',
    items: [
      { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['super_admin', 'admin', 'teacher', 'reception'] },
    ],
  },
  {
    label: 'Academia',
    items: [
      { href: '/dashboard/students', icon: Users, label: 'Alumnos', roles: ['super_admin', 'admin', 'teacher', 'reception'] },
      { href: '/dashboard/groups', icon: Layers3, label: 'Grupos', roles: ['super_admin', 'admin', 'teacher', 'reception'] },
    ],
  },
  {
    label: 'Finanzas',
    items: [
      { href: '/dashboard/payments', icon: CreditCard, label: 'Pagos & Morosidad', roles: ['super_admin', 'admin', 'reception'] },
      { href: '/dashboard/finance', icon: DollarSign, label: 'Caja & Finanzas', roles: ['super_admin', 'admin'] },
    ],
  },
  {
    label: 'Gestión',
    items: [
      { href: '/dashboard/employees', icon: UserCog, label: 'Empleados', roles: ['super_admin', 'admin'] },
      { href: '/dashboard/calendar', icon: Calendar, label: 'Calendario', roles: ['super_admin', 'admin', 'teacher', 'reception'] },
      { href: '/dashboard/stats', icon: BarChart3, label: 'Estadísticas', roles: ['super_admin', 'admin'] },
    ],
  },
  {
    label: 'Sistema',
    items: [
      { href: '/dashboard/settings', icon: Settings, label: 'Configuración', roles: ['super_admin', 'admin'] },
    ],
  },
];

const roleColors: Record<string, string> = {
  super_admin: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  admin: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  teacher: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  reception: 'text-zinc-400 bg-zinc-500/10 border-zinc-500/15',
};

const roleLabels: Record<string, string> = {
  super_admin: 'Super Admin',
  admin: 'Administración',
  teacher: 'Profesor',
  reception: 'Recepción',
};

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const { profile, signOut } = useAuth();

  const userRole = profile?.role ?? 'reception';

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  const canAccess = (roles: string[]) => roles.includes(userRole);

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 bottom-0 z-30 flex flex-col',
        'bg-[#080808] border-r border-[#141414]',
        'transition-all duration-300 ease-in-out',
        collapsed ? 'w-[60px]' : 'w-[220px]'
      )}
    >
      {/* Logo */}
      <div className={cn(
        'flex items-center border-b border-[#141414] shrink-0',
        collapsed ? 'h-14 justify-center px-2' : 'h-14 px-4'
      )}>
        <GCLogo size={30} showText={!collapsed} />
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
        {navSections.map((section) => {
          const visibleItems = section.items.filter(item => canAccess(item.roles));
          if (visibleItems.length === 0) return null;

          return (
            <div key={section.label}>
              {!collapsed && (
                <p className="text-[10px] font-semibold text-zinc-700 uppercase tracking-wider px-3 mb-1.5">
                  {section.label}
                </p>
              )}
              <div className="space-y-0.5">
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={collapsed ? item.label : undefined}
                      className={cn(
                        'flex items-center rounded-lg text-sm font-medium transition-all duration-150',
                        collapsed ? 'h-9 w-9 justify-center mx-auto' : 'gap-3 px-3 py-2',
                        active
                          ? 'text-cyan-400 bg-cyan-500/10 border border-cyan-500/15'
                          : 'text-zinc-500 hover:text-white hover:bg-white/[0.04] border border-transparent'
                      )}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* User profile */}
      <div className="border-t border-[#141414] p-2 shrink-0">
        {!collapsed ? (
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg bg-white/[0.02]">
              <div className="w-7 h-7 rounded-full bg-cyan-500/15 flex items-center justify-center shrink-0">
                <span className="text-cyan-400 text-xs font-bold">
                  {profile?.full_name?.charAt(0)?.toUpperCase() ?? 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs font-medium truncate">{profile?.full_name ?? 'Usuario'}</p>
                <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded border', roleColors[userRole])}>
                  {roleLabels[userRole]}
                </span>
              </div>
            </div>
            <button
              onClick={signOut}
              className="flex items-center gap-2.5 px-3 py-2 w-full rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-500/5 transition-all text-xs font-medium"
            >
              <LogOut className="w-3.5 h-3.5" />
              Cerrar sesión
            </button>
          </div>
        ) : (
          <button
            onClick={signOut}
            title="Cerrar sesión"
            className="flex items-center justify-center w-9 h-9 mx-auto rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-500/5 transition-all"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#141414] border border-[#222] flex items-center justify-center text-zinc-600 hover:text-white transition-colors z-10"
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>
    </aside>
  );
}
