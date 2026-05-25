'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Users, CreditCard, ChartBar as BarChart3, Calendar, Building2, FileText, Zap, Globe, Shield, Eye, EyeOff, X, ArrowRight, ChevronRight, TrendingUp, Activity, CircleCheck as CheckCircle2, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import GCLogo from '@/components/GCLogo';

// ─── Mini chart data for hero preview ───────────────────────────────────────
const revenueSparkline = [42, 58, 51, 67, 73, 69, 85, 91, 88, 96, 102, 98];
const MAX_SPARK = 102;

// ─── Feature cards ────────────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: Users,
    title: 'Gestión de alumnos',
    description: 'Padrón completo con historial, guardianes, documentos y estados de membresía.',
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/8',
    border: 'border-cyan-500/15',
    glow: 'group-hover:shadow-cyan-500/10',
  },
  {
    icon: CreditCard,
    title: 'Pagos y morosidad',
    description: 'Sistema semáforo, cuotas mensuales, becas, descuentos y recargos automáticos.',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/8',
    border: 'border-emerald-500/15',
    glow: 'group-hover:shadow-emerald-500/10',
  },
  {
    icon: BarChart3,
    title: 'Estadísticas avanzadas',
    description: 'Dashboards en tiempo real con KPIs, distribución por disciplina, edad y género.',
    color: 'text-blue-400',
    bg: 'bg-blue-500/8',
    border: 'border-blue-500/15',
    glow: 'group-hover:shadow-blue-500/10',
  },
  {
    icon: Calendar,
    title: 'Calendario y eventos',
    description: 'Agenda integral: clases, torneos, cumpleaños, reuniones y alquileres.',
    color: 'text-violet-400',
    bg: 'bg-violet-500/8',
    border: 'border-violet-500/15',
    glow: 'group-hover:shadow-violet-500/10',
  },
  {
    icon: Building2,
    title: 'Control financiero',
    description: 'Caja diaria, ingresos vs egresos, categorías y balance mensual detallado.',
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/8',
    border: 'border-cyan-500/15',
    glow: 'group-hover:shadow-cyan-500/10',
  },
  {
    icon: Users,
    title: 'Gestión de empleados',
    description: 'Instructores, administración y recepción con roles y permisos diferenciados.',
    color: 'text-amber-400',
    bg: 'bg-amber-500/8',
    border: 'border-amber-500/15',
    glow: 'group-hover:shadow-amber-500/10',
  },
  {
    icon: FileText,
    title: 'Reportes y PDFs',
    description: 'Generación automática de recibos, informes de deuda y resúmenes mensuales.',
    color: 'text-rose-400',
    bg: 'bg-rose-500/8',
    border: 'border-rose-500/15',
    glow: 'group-hover:shadow-rose-500/10',
  },
  {
    icon: Zap,
    title: 'Automatizaciones',
    description: 'Recordatorios de pago por WhatsApp y notificaciones automáticas configurables.',
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/8',
    border: 'border-yellow-500/15',
    glow: 'group-hover:shadow-yellow-500/10',
  },
  {
    icon: Globe,
    title: 'Multi-sede y roles',
    description: 'Arquitectura escalable para múltiples sedes con control de acceso por rol.',
    color: 'text-teal-400',
    bg: 'bg-teal-500/8',
    border: 'border-teal-500/15',
    glow: 'group-hover:shadow-teal-500/10',
  },
];

const STATS = [
  { value: '98%', label: 'Uptime garantizado', sub: 'infraestructura cloud' },
  { value: '<1s', label: 'Tiempo de respuesta', sub: 'consultas en tiempo real' },
  { value: '360°', label: 'Visibilidad total', sub: 'de tu institución' },
  { value: '∞', label: 'Escalabilidad', sub: 'crece con tu negocio' },
];

// ─── Dashboard Preview Component ─────────────────────────────────────────────
function DashboardPreview() {
  return (
    <div className="relative w-full max-w-xl mx-auto lg:mx-0 lg:ml-auto">
      {/* Outer glow */}
      <div className="absolute -inset-4 bg-gradient-to-r from-cyan-500/5 via-blue-500/5 to-transparent rounded-3xl blur-2xl" />

      {/* Main card */}
      <div className="relative bg-[#0e0e0e] border border-[#1e1e1e] rounded-2xl overflow-hidden shadow-2xl">
        {/* Window chrome */}
        <div className="flex items-center gap-1.5 px-4 py-3 border-b border-[#1a1a1a] bg-[#0c0c0c]">
          <div className="w-3 h-3 rounded-full bg-[#2a2a2a]" />
          <div className="w-3 h-3 rounded-full bg-[#2a2a2a]" />
          <div className="w-3 h-3 rounded-full bg-[#2a2a2a]" />
          <div className="mx-auto flex items-center gap-2 bg-[#161616] rounded-md px-3 py-1">
            <div className="w-2 h-2 rounded-full bg-cyan-500/60" />
            <span className="text-zinc-500 text-xs font-mono">app.gc.com/dashboard</span>
          </div>
        </div>

        <div className="p-4 space-y-3">
          {/* KPI row */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Alumnos activos', val: '247', delta: '+12', color: 'text-cyan-400' },
              { label: 'Ingresos mes', val: '$182K', delta: '+8%', color: 'text-emerald-400' },
              { label: 'Morosidad', val: '6.2%', delta: '-2%', color: 'text-rose-400' },
            ].map((k) => (
              <div key={k.label} className="bg-[#141414] border border-[#1e1e1e] rounded-xl p-3">
                <p className="text-zinc-600 text-[10px] font-medium mb-1">{k.label}</p>
                <p className={cn('text-sm font-bold', k.color)}>{k.val}</p>
                <p className="text-zinc-600 text-[10px] mt-0.5">{k.delta}</p>
              </div>
            ))}
          </div>

          {/* Revenue chart */}
          <div className="bg-[#141414] border border-[#1e1e1e] rounded-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-zinc-400 text-xs font-medium">Evolución ingresos</span>
              <span className="text-cyan-400 text-[10px] font-medium bg-cyan-500/10 px-2 py-0.5 rounded-full">+18% vs anterior</span>
            </div>
            <div className="flex items-end gap-1 h-16">
              {revenueSparkline.map((v, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-sm transition-all"
                  style={{
                    height: `${(v / MAX_SPARK) * 100}%`,
                    background: i === revenueSparkline.length - 1
                      ? 'linear-gradient(to top, #06b6d4, #0891b2)'
                      : i >= revenueSparkline.length - 3
                        ? 'rgba(6,182,212,0.4)'
                        : 'rgba(6,182,212,0.15)',
                  }}
                />
              ))}
            </div>
          </div>

          {/* Recent payments mini list */}
          <div className="bg-[#141414] border border-[#1e1e1e] rounded-xl p-3 space-y-2">
            <span className="text-zinc-400 text-xs font-medium">Últimos pagos</span>
            {[
              { name: 'Valentina L.', amount: '$10.800', status: 'paid' },
              { name: 'Lucas P.', amount: '$13.000', status: 'paid' },
              { name: 'Tomás M.', amount: '$15.000', status: 'overdue' },
            ].map((p) => (
              <div key={p.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-[#1e1e1e] flex items-center justify-center">
                    <span className="text-zinc-500 text-[8px] font-bold">{p.name.charAt(0)}</span>
                  </div>
                  <span className="text-zinc-400 text-[11px]">{p.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-zinc-300 text-[11px] font-medium">{p.amount}</span>
                  <div className={cn(
                    'w-1.5 h-1.5 rounded-full',
                    p.status === 'paid' ? 'bg-emerald-400' : 'bg-rose-400'
                  )} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Floating badge */}
      <div className="absolute -bottom-4 -left-4 bg-[#0e0e0e] border border-[#1e1e1e] rounded-xl px-4 py-3 shadow-xl flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center">
          <TrendingUp className="w-4 h-4 text-emerald-400" />
        </div>
        <div>
          <p className="text-white text-xs font-semibold">Ingresos este mes</p>
          <p className="text-emerald-400 text-xs">↑ 18% respecto al anterior</p>
        </div>
      </div>

      {/* Floating activity badge */}
      <div className="absolute -top-4 -right-4 bg-[#0e0e0e] border border-[#1e1e1e] rounded-xl px-4 py-2.5 shadow-xl flex items-center gap-2.5">
        <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
        <span className="text-zinc-300 text-xs font-medium">Sistema activo</span>
      </div>
    </div>
  );
}

// ─── Login Modal ──────────────────────────────────────────────────────────────
function LoginModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const overlayRef = useRef<HTMLDivElement>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError('Credenciales incorrectas. Verificá tu email y contraseña.');
      setLoading(false);
      return;
    }
    router.replace('/dashboard');
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)' }}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="relative w-full max-w-md animate-slide-up">
        {/* Glow */}
        <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-cyan-500/20 to-transparent pointer-events-none" />

        <div className="relative bg-[#0d0d0d] border border-[#1f1f1f] rounded-2xl p-8 shadow-2xl">
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-7 h-7 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center text-zinc-500 hover:text-zinc-300 transition-all"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Logo */}
          <div className="mb-8">
            <GCLogo size={36} showText={true} />
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-bold text-white">Iniciar sesión</h2>
            <p className="text-zinc-500 text-sm mt-1">Accedé con tus credenciales</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@empresa.com"
                required
                className="w-full h-11 rounded-xl bg-[#111111] border border-[#252525] px-4 text-white text-sm placeholder:text-zinc-700 focus:outline-none focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/15 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Contraseña</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full h-11 rounded-xl bg-[#111111] border border-[#252525] px-4 pr-11 text-white text-sm placeholder:text-zinc-700 focus:outline-none focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/15 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/8 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-white font-semibold text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 mt-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Ingresando...
                </>
              ) : (
                <>
                  Ingresar al sistema
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-zinc-700 text-xs mt-6">
            Sistema privado · Solo personal autorizado
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Main Landing Page ────────────────────────────────────────────────────────
export default function LandingPage() {
  const router = useRouter();
  const [showLogin, setShowLogin] = useState(false);
  const [checking, setChecking] = useState(true);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.replace('/dashboard');
      } else {
        setChecking(false);
      }
    });
  }, [router]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (checking) {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080808] text-white overflow-x-hidden">
      {/* Background gradients */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/[0.04] rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-blue-500/[0.03] rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-cyan-400/[0.02] rounded-full blur-3xl" />
      </div>

      {/* Subtle grid */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.02]"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '80px 80px',
        }}
      />

      {/* ── HEADER ── */}
      <header className={cn(
        'fixed top-0 left-0 right-0 z-40 transition-all duration-300',
        scrolled
          ? 'bg-[#080808]/90 backdrop-blur-xl border-b border-[#161616]'
          : 'bg-transparent'
      )}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <GCLogo size={34} showText={true} />

          {/* Nav right */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowLogin(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-white text-sm font-semibold transition-all duration-200 shadow-lg shadow-cyan-500/20"
            >
              Acceder
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="relative pt-32 pb-24 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-16">

            {/* Left content */}
            <div className="flex-1 max-w-xl">
              <div className="inline-flex items-center gap-2 bg-cyan-500/[0.08] border border-cyan-500/20 rounded-full px-3 py-1.5 mb-6">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                <span className="text-cyan-400 text-xs font-medium">Plataforma de gestión inteligente</span>
              </div>

              <h1 className="text-5xl lg:text-6xl font-bold leading-[1.08] tracking-tight mb-5">
                Control total de{' '}
                <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                  tu institución
                </span>
                <br />en un solo lugar.
              </h1>

              <p className="text-zinc-400 text-lg leading-relaxed mb-8 max-w-md">
                Plataforma SaaS para la gestión de academias, clubes e instituciones.
                Alumnos, pagos, finanzas, calendario y estadísticas — todo integrado.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setShowLogin(true)}
                  className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-white font-semibold text-sm transition-all duration-200 shadow-xl shadow-cyan-500/25"
                >
                  Iniciar sesión
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                  className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-[#222] text-zinc-400 hover:text-white hover:border-[#333] font-medium text-sm transition-all duration-200"
                >
                  Ver funcionalidades
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Trust indicators */}
              <div className="flex items-center gap-5 mt-8 pt-8 border-t border-[#141414]">
                {[
                  { icon: Shield, label: 'Datos seguros' },
                  { icon: Activity, label: '99.9% uptime' },
                  { icon: Globe, label: 'Multi-sede' },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-2 text-zinc-600">
                    <Icon className="w-3.5 h-3.5 text-zinc-700" />
                    <span className="text-xs font-medium">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: dashboard preview */}
            <div className="flex-1 w-full lg:w-auto">
              <DashboardPreview />
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS STRIP ── */}
      <section className="border-y border-[#111] bg-[#0a0a0a] py-12 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-8">
          {STATS.map((s) => (
            <div key={s.label} className="text-center lg:text-left">
              <p className="text-3xl font-bold text-white mb-1">{s.value}</p>
              <p className="text-sm font-medium text-zinc-300">{s.label}</p>
              <p className="text-xs text-zinc-600 mt-0.5">{s.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-24 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-white/[0.03] border border-white/[0.06] rounded-full px-3 py-1.5 mb-4">
              <span className="text-zinc-500 text-xs font-medium">Módulos del sistema</span>
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-3">
              Todo lo que necesitás,{' '}
              <span className="text-zinc-500">nada que sobre.</span>
            </h2>
            <p className="text-zinc-500 text-base max-w-lg mx-auto">
              Cada módulo fue diseñado para resolver problemas reales de gestión institucional.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className={cn(
                    'group relative bg-[#0d0d0d] border rounded-2xl p-6 transition-all duration-300',
                    'hover:bg-[#0f0f0f] hover:shadow-xl cursor-default',
                    f.border, f.glow
                  )}
                >
                  <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center mb-4', f.bg)}>
                    <Icon className={cn('w-5 h-5', f.color)} />
                  </div>
                  <h3 className="text-white font-semibold text-sm mb-2">{f.title}</h3>
                  <p className="text-zinc-600 text-sm leading-relaxed">{f.description}</p>

                  {/* Hover arrow */}
                  <div className="absolute bottom-5 right-5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ChevronRight className={cn('w-4 h-4', f.color)} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── VISUAL METRICS SECTION ── */}
      <section className="py-24 px-6 lg:px-8 bg-[#090909]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-white/[0.03] border border-white/[0.06] rounded-full px-3 py-1.5 mb-4">
              <span className="text-zinc-500 text-xs font-medium">Inteligencia de negocio</span>
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-3">
              Tomá decisiones con{' '}
              <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                datos reales.
              </span>
            </h2>
            <p className="text-zinc-500 text-base max-w-lg mx-auto">
              Visualizaciones en tiempo real para entender el estado de tu institución de un vistazo.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Big chart card */}
            <div className="lg:col-span-2 bg-[#0d0d0d] border border-[#1a1a1a] rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-white font-semibold text-sm">Ingresos mensuales</h3>
                  <p className="text-zinc-600 text-xs mt-0.5">Últimos 12 meses</p>
                </div>
                <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-1">
                  <TrendingUp className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400 text-xs font-medium">+18% anual</span>
                </div>
              </div>

              {/* Bar chart visual */}
              <div className="flex items-end gap-2 h-40">
                {revenueSparkline.map((v, i) => {
                  const months = ['E','F','M','A','M','J','J','A','S','O','N','D'];
                  const isLast = i === revenueSparkline.length - 1;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className="w-full rounded-t-md transition-all"
                        style={{
                          height: `${(v / MAX_SPARK) * 130}px`,
                          background: isLast
                            ? 'linear-gradient(to top, #06b6d4, #0891b2)'
                            : i >= 9
                              ? 'rgba(6,182,212,0.35)'
                              : 'rgba(255,255,255,0.06)',
                        }}
                      />
                      <span className="text-zinc-700 text-[10px]">{months[i]}</span>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#1a1a1a]">
                <div>
                  <p className="text-zinc-500 text-xs">Total acumulado</p>
                  <p className="text-white font-bold text-xl mt-0.5">$1.248.000</p>
                </div>
                <div className="text-right">
                  <p className="text-zinc-500 text-xs">Promedio mensual</p>
                  <p className="text-white font-bold text-xl mt-0.5">$104.000</p>
                </div>
              </div>
            </div>

            {/* Right column: smaller cards */}
            <div className="space-y-4">
              {/* Morosidad semaforo */}
              <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-2xl p-5">
                <h3 className="text-white font-semibold text-sm mb-4">Semáforo de pagos</h3>
                <div className="space-y-3">
                  {[
                    { label: 'Al día', pct: 74, color: 'bg-emerald-400', text: 'text-emerald-400' },
                    { label: 'Pendiente', pct: 20, color: 'bg-amber-400', text: 'text-amber-400' },
                    { label: 'Vencido', pct: 6, color: 'bg-rose-400', text: 'text-rose-400' },
                  ].map((row) => (
                    <div key={row.label}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-zinc-500 text-xs">{row.label}</span>
                        <span className={cn('text-xs font-semibold', row.text)}>{row.pct}%</span>
                      </div>
                      <div className="h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
                        <div
                          className={cn('h-full rounded-full', row.color)}
                          style={{ width: `${row.pct}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Discipline breakdown */}
              <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-2xl p-5">
                <h3 className="text-white font-semibold text-sm mb-4">Alumnos por disciplina</h3>
                <div className="space-y-2.5">
                  {[
                    { name: 'Gimnasia', n: 98, color: '#06b6d4' },
                    { name: 'Natación', n: 74, color: '#3b82f6' },
                    { name: 'Acrobacia', n: 45, color: '#8b5cf6' },
                    { name: 'Colonia', n: 30, color: '#10b981' },
                  ].map((d) => (
                    <div key={d.name} className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                      <span className="text-zinc-500 text-xs flex-1">{d.name}</span>
                      <div className="flex-1 h-1 bg-[#1a1a1a] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${(d.n / 98) * 100}%`, backgroundColor: d.color, opacity: 0.7 }}
                        />
                      </div>
                      <span className="text-zinc-400 text-xs font-medium w-6 text-right">{d.n}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <div className="relative bg-gradient-to-b from-[#0f0f0f] to-[#0d0d0d] border border-[#1a1a1a] rounded-3xl p-12 overflow-hidden">
            {/* Glow */}
            <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/[0.04] to-transparent rounded-3xl" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-px bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent" />

            <div className="relative">
              <div className="inline-flex items-center gap-2 bg-cyan-500/[0.08] border border-cyan-500/20 rounded-full px-3 py-1.5 mb-6">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-cyan-400 text-xs font-medium">Listo para usar</span>
              </div>

              <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
                Empezá a gestionar<br />tu institución hoy.
              </h2>
              <p className="text-zinc-500 text-base mb-8 max-w-sm mx-auto">
                Accedé al sistema y tenés control total desde el primer día.
              </p>

              <button
                onClick={() => setShowLogin(true)}
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-white font-semibold text-sm transition-all duration-200 shadow-xl shadow-cyan-500/25"
              >
                Iniciar sesión
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-[#111] py-8 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center">
              <span className="text-white font-bold text-[10px]">GC</span>
            </div>
            <span className="text-zinc-600 text-sm font-medium">Gestión y Control</span>
          </div>
          <p className="text-zinc-700 text-xs">Sistema privado de gestión institucional · {new Date().getFullYear()}</p>
        </div>
      </footer>

      {/* ── LOGIN MODAL ── */}
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </div>
  );
}
