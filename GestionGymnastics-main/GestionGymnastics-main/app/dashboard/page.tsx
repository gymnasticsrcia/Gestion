'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import Header from '@/components/layout/Header';
import Link from 'next/link';
import { Users, DollarSign, TriangleAlert as AlertTriangle, TrendingUp, TrendingDown, ArrowUpRight, ArrowRight, Calendar, ChevronLeft, ChevronRight, Clock, Trophy, Users2, Banknote, CircleCheck as CheckCircle, Activity, Zap } from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, RadialBarChart, RadialBar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { cn } from '@/lib/utils';

const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const DISCIPLINE_COLORS = ['#06b6d4', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const EVENT_TYPE_META: Record<string, { label: string; color: string; icon: typeof Calendar }> = {
  meeting:     { label: 'Reunión',     color: '#3b82f6', icon: Users2 },
  tournament:  { label: 'Torneo',      color: '#ef4444', icon: Trophy },
  payment_due: { label: 'Vencimiento', color: '#eab308', icon: Banknote },
  event:       { label: 'Evento',      color: '#f59e0b', icon: Calendar },
  class:       { label: 'Clase',       color: '#10b981', icon: Activity },
  holiday:     { label: 'Feriado',     color: '#f97316', icon: Calendar },
  birthday:    { label: 'Cumpleaños',  color: '#ec4899', icon: Calendar },
  other:       { label: 'Otro',        color: '#71717a', icon: Calendar },
};

const formatCurrency = (cents: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(cents / 100);

const formatCurrencyCompact = (cents: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', notation: 'compact', maximumFractionDigits: 1 }).format(cents / 100);

// ── Carousel ──────────────────────────────────────────────────────────────────
function ChartCarousel({ slides }: { slides: { title: string; subtitle: string; node: React.ReactNode }[] }) {
  const [idx, setIdx] = useState(0);
  const prev = () => setIdx(i => (i - 1 + slides.length) % slides.length);
  const next = () => setIdx(i => (i + 1) % slides.length);
  const s = slides[idx];
  return (
    <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#161616]">
        <div>
          <h3 className="text-white font-semibold text-sm">{s.title}</h3>
          <p className="text-zinc-600 text-xs">{s.subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 mr-2">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                className={cn('w-1.5 h-1.5 rounded-full transition-all', i === idx ? 'bg-cyan-500' : 'bg-zinc-700')}
              />
            ))}
          </div>
          <button onClick={prev} className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/[0.06] transition-all">
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button onClick={next} className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/[0.06] transition-all">
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <div className="p-5">{s.node}</div>
    </div>
  );
}

export default function DashboardPage() {
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const [stats, setStats] = useState({
    totalActive: 0, newThisMonth: 0,
    monthlyRevenue: 0, prevMonthRevenue: 0,
    pendingAmount: 0, overdueCount: 0,
    delinquencyRate: 0, totalGroups: 0,
    totalStudents: 0,
  });
  const [revenueData, setRevenueData]       = useState<any[]>([]);
  const [studentData, setStudentData]       = useState<any[]>([]);
  const [disciplineData, setDisciplineData] = useState<any[]>([]);
  const [recentPayments, setRecentPayments] = useState<any[]>([]);
  const [overdueStudents, setOverdueStudents] = useState<any[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [studentsRes, paymentsRes, groupsRes, disciplinesRes, eventsRes] = await Promise.all([
        supabase.from('students').select('id, status, created_at, gender'),
        supabase.from('payments').select('id, status, final_amount, month, year, created_at, student:students(first_name, last_name)').order('created_at', { ascending: false }),
        supabase.from('groups').select('id, discipline_id, is_active'),
        supabase.from('disciplines').select('id, name, color'),
        supabase.from('events').select('*').gte('start_datetime', new Date().toISOString()).order('start_datetime').limit(8),
      ]);

      const students    = studentsRes.data ?? [];
      const payments    = paymentsRes.data ?? [];
      const groups      = groupsRes.data ?? [];
      const disciplines = disciplinesRes.data ?? [];
      const events      = eventsRes.data ?? [];

      const activeStudents   = students.filter(s => s.status === 'active');
      const thisMonthStart   = new Date(currentYear, currentMonth - 1, 1);
      const newThisMonth     = students.filter(s => new Date(s.created_at) >= thisMonthStart);
      const currPays         = payments.filter(p => p.month === currentMonth && p.year === currentYear);
      const prevM            = currentMonth === 1 ? 12 : currentMonth - 1;
      const prevY            = currentMonth === 1 ? currentYear - 1 : currentYear;
      const overduePays      = payments.filter(p => p.status === 'overdue' || (p.status === 'pending' && (p.year < currentYear || (p.year === currentYear && p.month < currentMonth))));
      const monthlyRevenue   = currPays.filter(p => p.status === 'paid').reduce((s, p) => s + (p.final_amount || 0), 0);
      const prevMonthRevenue = payments.filter(p => p.month === prevM && p.year === prevY && p.status === 'paid').reduce((s, p) => s + (p.final_amount || 0), 0);
      const pendingAmount    = overduePays.reduce((s, p) => s + (p.final_amount || 0), 0);

      setStats({
        totalActive: activeStudents.length,
        totalStudents: students.length,
        newThisMonth: newThisMonth.length,
        monthlyRevenue, prevMonthRevenue,
        pendingAmount,
        overdueCount: overduePays.length,
        delinquencyRate: activeStudents.length > 0 ? Math.min((overduePays.length / activeStudents.length) * 100, 100) : 0,
        totalGroups: groups.filter(g => g.is_active).length,
      });

      // Revenue chart – last 8 months
      const rev: any[] = [];
      for (let i = 7; i >= 0; i--) {
        const d = new Date(currentYear, currentMonth - 1 - i, 1);
        const m = d.getMonth() + 1; const y = d.getFullYear();
        const r = payments.filter(p => p.month === m && p.year === y && p.status === 'paid').reduce((s, p) => s + (p.final_amount || 0), 0);
        rev.push({ month: MONTHS[d.getMonth()], ingresos: r / 100 });
      }
      setRevenueData(rev);

      // Student enrollment trend – last 8 months
      const stu: any[] = [];
      for (let i = 7; i >= 0; i--) {
        const d = new Date(currentYear, currentMonth - 1 - i, 1);
        const m = d.getMonth() + 1; const y = d.getFullYear();
        const count = students.filter(s => {
          const sd = new Date(s.created_at);
          return sd.getMonth() + 1 === m && sd.getFullYear() === y;
        }).length;
        stu.push({ month: MONTHS[d.getMonth()], nuevos: count });
      }
      setStudentData(stu);

      // Discipline distribution
      const discMap: Record<string, { name: string; color: string; value: number }> = {};
      groups.forEach(g => {
        const disc = disciplines.find(d => d.id === g.discipline_id);
        if (disc) {
          if (!discMap[disc.id]) discMap[disc.id] = { name: disc.name, color: disc.color || '#06b6d4', value: 0 };
          discMap[disc.id].value++;
        }
      });
      setDisciplineData(Object.values(discMap).sort((a, b) => b.value - a.value));

      setRecentPayments(payments.slice(0, 7));
      setOverdueStudents(overduePays.slice(0, 5));
      setUpcomingEvents(events);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const revenueChange = stats.prevMonthRevenue > 0
    ? ((stats.monthlyRevenue - stats.prevMonthRevenue) / stats.prevMonthRevenue) * 100
    : 0;

  const tooltipStyle = {
    contentStyle: { backgroundColor: '#141414', border: '1px solid #222', borderRadius: 10 },
    labelStyle: { color: '#f5f5f5', fontWeight: 600, fontSize: 11 },
    itemStyle: { fontSize: 11 },
  };

  // ── Carousel slides ──────────────────────────────────────────────────────────
  const revenueSlide = (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={revenueData}>
        <defs>
          <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#06b6d4" stopOpacity={0.18} />
            <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
        <XAxis dataKey="month" tick={{ fill: '#3f3f46', fontSize: 10 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#3f3f46', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
        <Tooltip {...tooltipStyle} formatter={(v: any) => [formatCurrency(v * 100), 'Ingresos']} />
        <Area type="monotone" dataKey="ingresos" stroke="#06b6d4" strokeWidth={2} fill="url(#revGrad)" dot={false} activeDot={{ r: 4, fill: '#06b6d4' }} />
      </AreaChart>
    </ResponsiveContainer>
  );

  const studentSlide = (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={studentData} barSize={14}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
        <XAxis dataKey="month" tick={{ fill: '#3f3f46', fontSize: 10 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#3f3f46', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip {...tooltipStyle} formatter={(v: any) => [v, 'Nuevos alumnos']} />
        <Bar dataKey="nuevos" radius={[3, 3, 0, 0]}>
          {studentData.map((_, i) => (
            <Cell key={i} fill={i === studentData.length - 1 ? '#06b6d4' : '#1e3a3a'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );

  const totalDisc = disciplineData.reduce((s, d) => s + d.value, 0) || 1;
  const disciplineSlide = (
    <div className="flex flex-col gap-3">
      {disciplineData.slice(0, 5).map((item, idx) => (
        <div key={item.name} className="flex items-center gap-3">
          <span className="text-zinc-500 text-xs w-24 truncate">{item.name}</span>
          <div className="flex-1 h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${(item.value / totalDisc) * 100}%`, backgroundColor: DISCIPLINE_COLORS[idx % DISCIPLINE_COLORS.length] }}
            />
          </div>
          <span className="text-white text-xs font-semibold w-6 text-right">{item.value}</span>
        </div>
      ))}
      {disciplineData.length === 0 && (
        <p className="text-zinc-600 text-sm text-center py-6">Sin datos de grupos</p>
      )}
    </div>
  );

  const slides = [
    { title: 'Ingresos mensuales',    subtitle: 'Últimos 8 meses · en miles ARS', node: revenueSlide },
    { title: 'Nuevos alumnos',        subtitle: 'Altas por mes',                  node: studentSlide },
    { title: 'Grupos por disciplina', subtitle: 'Distribución actual',            node: disciplineSlide },
  ];

  if (loading) {
    return (
      <div className="flex-1 flex flex-col">
        <Header title="Dashboard" subtitle={`${MONTHS[currentMonth - 1]} ${currentYear} · Vista general`} />
        <div className="flex-1 p-6 space-y-5">
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl h-28 animate-pulse" />
            ))}
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <div className="xl:col-span-2 bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl h-72 animate-pulse" />
            <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl h-72 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <Header title="Dashboard" subtitle={`${MONTHS[currentMonth - 1]} ${currentYear} · Vista general`} />

      <div className="flex-1 p-6 space-y-5 animate-fade-in">

        {/* ── KPI cards ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {/* Alumnos activos */}
          <Link href="/dashboard/students" className="group bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl p-5 hover:border-cyan-500/25 transition-all">
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                <Users className="w-4 h-4 text-cyan-400" />
              </div>
              <ArrowUpRight className="w-3.5 h-3.5 text-zinc-700 group-hover:text-cyan-500 transition-colors" />
            </div>
            <p className="text-zinc-600 text-xs font-medium mb-1">Alumnos activos</p>
            <p className="text-white text-2xl font-bold">{stats.totalActive}</p>
            <p className="text-emerald-500 text-xs mt-1 font-medium">+{stats.newThisMonth} este mes</p>
          </Link>

          {/* Ingresos del mes */}
          <Link href="/dashboard/finance" className="group bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl p-5 hover:border-emerald-500/25 transition-all">
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-emerald-400" />
              </div>
              {revenueChange >= 0
                ? <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                : <TrendingDown className="w-3.5 h-3.5 text-red-400" />
              }
            </div>
            <p className="text-zinc-600 text-xs font-medium mb-1">Ingresos del mes</p>
            <p className="text-white text-2xl font-bold">{formatCurrencyCompact(stats.monthlyRevenue)}</p>
            <p className={cn('text-xs mt-1 font-medium', revenueChange >= 0 ? 'text-emerald-500' : 'text-red-400')}>
              {revenueChange >= 0 ? '+' : ''}{revenueChange.toFixed(1)}% vs mes anterior
            </p>
          </Link>

          {/* Cuotas vencidas */}
          <Link href="/dashboard/payments" className="group bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl p-5 hover:border-red-500/25 transition-all">
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 rounded-lg bg-red-500/10 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-red-400" />
              </div>
              <span className={cn(
                'text-[10px] font-semibold px-1.5 py-0.5 rounded',
                stats.overdueCount === 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400',
              )}>
                {stats.overdueCount === 0 ? 'OK' : 'ALERTA'}
              </span>
            </div>
            <p className="text-zinc-600 text-xs font-medium mb-1">Cuotas vencidas</p>
            <p className="text-white text-2xl font-bold">{stats.overdueCount}</p>
            <p className="text-red-400 text-xs mt-1 font-medium">{formatCurrencyCompact(stats.pendingAmount)} pendiente</p>
          </Link>

          {/* Grupos activos */}
          <Link href="/dashboard/groups" className="group bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl p-5 hover:border-blue-500/25 transition-all">
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Activity className="w-4 h-4 text-blue-400" />
              </div>
              <ArrowUpRight className="w-3.5 h-3.5 text-zinc-700 group-hover:text-blue-500 transition-colors" />
            </div>
            <p className="text-zinc-600 text-xs font-medium mb-1">Grupos activos</p>
            <p className="text-white text-2xl font-bold">{stats.totalGroups}</p>
            <p className="text-blue-400 text-xs mt-1 font-medium">{disciplineData.length} disciplinas</p>
          </Link>
        </div>

        {/* ── Charts carousel + Quick actions ────────────────────────── */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="xl:col-span-2">
            <ChartCarousel slides={slides} />
          </div>

          {/* Quick actions */}
          <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[#161616]">
              <h3 className="text-white font-semibold text-sm">Accesos rápidos</h3>
              <p className="text-zinc-600 text-xs">Módulos principales</p>
            </div>
            <div className="p-3 space-y-1.5">
              {[
                { href: '/dashboard/students',  label: 'Gestión de alumnos',   sub: `${stats.totalActive} activos`,    icon: Users,       color: 'text-cyan-400',    bg: 'bg-cyan-500/8'   },
                { href: '/dashboard/payments',  label: 'Control de pagos',     sub: `${stats.overdueCount} vencidos`,  icon: DollarSign,  color: 'text-emerald-400', bg: 'bg-emerald-500/8'},
                { href: '/dashboard/groups',    label: 'Grupos y clases',      sub: `${stats.totalGroups} activos`,    icon: Activity,    color: 'text-blue-400',    bg: 'bg-blue-500/8'   },
                { href: '/dashboard/calendar',  label: 'Calendario',           sub: `${upcomingEvents.length} próximos`, icon: Calendar,  color: 'text-amber-400',   bg: 'bg-amber-500/8'  },
                { href: '/dashboard/employees', label: 'Empleados',            sub: 'Personal activo',                 icon: Users2,      color: 'text-rose-400',    bg: 'bg-rose-500/8'   },
                { href: '/dashboard/finance',   label: 'Finanzas',             sub: formatCurrencyCompact(stats.monthlyRevenue) + ' este mes', icon: TrendingUp, color: 'text-teal-400', bg: 'bg-teal-500/8' },
              ].map(item => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/[0.04] transition-all group"
                  >
                    <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', item.bg)}>
                      <Icon className={cn('w-3.5 h-3.5', item.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-zinc-200 text-xs font-medium truncate">{item.label}</p>
                      <p className="text-zinc-600 text-[10px]">{item.sub}</p>
                    </div>
                    <ArrowRight className="w-3 h-3 text-zinc-700 group-hover:text-zinc-400 transition-colors shrink-0" />
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Bottom: Payments + Events ───────────────────────────────── */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

          {/* Recent payments */}
          <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#161616]">
              <div>
                <h3 className="text-white font-semibold text-sm">Pagos recientes</h3>
                <p className="text-zinc-600 text-xs">Últimos movimientos</p>
              </div>
              <Link href="/dashboard/payments" className="flex items-center gap-1 text-cyan-400 text-xs font-medium hover:text-cyan-300 transition-colors">
                Ver todos <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {/* Delinquency summary bar */}
            <div className="grid grid-cols-3 gap-px bg-[#161616] border-b border-[#161616]">
              {[
                { label: 'Al día',     color: 'text-emerald-400', bg: 'bg-emerald-500/6', count: Math.max(0, stats.totalActive - stats.overdueCount), icon: CheckCircle },
                { label: 'Pendiente',  color: 'text-amber-400',   bg: 'bg-amber-500/6',   count: Math.floor(stats.totalActive * 0.08),                icon: Clock },
                { label: 'Vencido',    color: 'text-red-400',     bg: 'bg-red-500/6',     count: stats.overdueCount,                                  icon: AlertTriangle },
              ].map(item => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className={cn('flex flex-col items-center py-3 gap-0.5', item.bg)}>
                    <Icon className={cn('w-3.5 h-3.5', item.color)} />
                    <p className={cn('text-base font-bold', item.color)}>{item.count}</p>
                    <p className="text-zinc-600 text-[10px]">{item.label}</p>
                  </div>
                );
              })}
            </div>

            <div className="divide-y divide-[#141414]">
              {recentPayments.length > 0 ? recentPayments.map(p => (
                <div key={p.id} className="flex items-center justify-between px-5 py-3 hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-[#1a1a1a] flex items-center justify-center shrink-0">
                      <span className="text-zinc-500 text-[10px] font-bold">
                        {(p.student as any)?.first_name?.charAt(0) ?? 'A'}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-white text-xs font-medium truncate">
                        {(p.student as any)?.first_name} {(p.student as any)?.last_name}
                      </p>
                      <p className="text-zinc-700 text-[10px]">{MONTHS[(p.month || 1) - 1]} {p.year}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 shrink-0">
                    <span className="text-white text-xs font-semibold">{formatCurrency(p.final_amount || 0)}</span>
                    <span className={cn(
                      'text-[10px] font-semibold px-1.5 py-0.5 rounded',
                      p.status === 'paid'    ? 'bg-emerald-500/10 text-emerald-400' :
                      p.status === 'overdue' ? 'bg-red-500/10 text-red-400' :
                      'bg-amber-500/10 text-amber-400',
                    )}>
                      {p.status === 'paid' ? 'Pagado' : p.status === 'overdue' ? 'Vencido' : 'Pendiente'}
                    </span>
                  </div>
                </div>
              )) : (
                <div className="py-10 text-center">
                  <p className="text-zinc-600 text-sm">Sin pagos registrados</p>
                </div>
              )}
            </div>
          </div>

          {/* Upcoming events */}
          <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#161616]">
              <div>
                <h3 className="text-white font-semibold text-sm">Proximos eventos</h3>
                <p className="text-zinc-600 text-xs">Agenda operativa</p>
              </div>
              <Link href="/dashboard/calendar" className="flex items-center gap-1 text-cyan-400 text-xs font-medium hover:text-cyan-300 transition-colors">
                Abrir calendario <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="divide-y divide-[#141414]">
              {upcomingEvents.length > 0 ? upcomingEvents.map(event => {
                const meta = EVENT_TYPE_META[event.type] ?? EVENT_TYPE_META.other;
                const Icon = meta.icon;
                const d = new Date(event.start_datetime);
                const dayStr = d.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' });
                const timeStr = event.all_day ? 'Todo el día' : d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
                return (
                  <div key={event.id} className="flex items-center gap-3 px-5 py-3 hover:bg-white/[0.02] transition-colors">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: meta.color + '15' }}
                    >
                      <Icon className="w-3.5 h-3.5" style={{ color: meta.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-xs font-medium truncate">{event.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-zinc-600 text-[10px] capitalize">{dayStr}</span>
                        <span className="text-zinc-700 text-[10px]">·</span>
                        <Clock className="w-2.5 h-2.5 text-zinc-700" />
                        <span className="text-zinc-600 text-[10px]">{timeStr}</span>
                      </div>
                    </div>
                    <span
                      className="text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0"
                      style={{ color: meta.color, backgroundColor: meta.color + '18' }}
                    >
                      {meta.label}
                    </span>
                  </div>
                );
              }) : (
                <div className="py-10 text-center flex flex-col items-center gap-2">
                  <Zap className="w-6 h-6 text-zinc-700" />
                  <p className="text-zinc-600 text-sm">Sin eventos proximos</p>
                  <Link href="/dashboard/calendar" className="text-cyan-400 text-xs font-medium hover:text-cyan-300">
                    Crear evento →
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
