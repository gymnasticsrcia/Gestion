'use client';

import { Bell } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
  const { profile } = useAuth();

  return (
    <header className="h-14 border-b border-[#141414] bg-[#080808]/90 backdrop-blur-sm flex items-center justify-between px-6 shrink-0 sticky top-0 z-20">
      <div>
        <h1 className="text-white font-semibold text-base leading-none">{title}</h1>
        {subtitle && <p className="text-zinc-600 text-xs mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-2">
        <button className="relative w-9 h-9 rounded-lg border border-[#1a1a1a] flex items-center justify-center text-zinc-600 hover:text-white hover:border-[#222] transition-all">
          <Bell className="w-4 h-4" />
          <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-cyan-500" />
        </button>

        <div className="flex items-center gap-2 h-9 px-3 rounded-lg border border-[#1a1a1a] hover:border-[#222] transition-all cursor-pointer">
          <div className="w-5 h-5 rounded-full bg-cyan-500/15 flex items-center justify-center">
            <span className="text-cyan-400 text-[10px] font-bold">
              {profile?.full_name?.charAt(0)?.toUpperCase() ?? 'U'}
            </span>
          </div>
          <span className="text-white text-xs font-medium hidden sm:block">
            {profile?.full_name?.split(' ')[0] ?? 'Usuario'}
          </span>
        </div>
      </div>
    </header>
  );
}
