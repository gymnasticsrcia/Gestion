'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Header from '@/components/layout/Header';
import { Users, DollarSign, TriangleAlert as AlertTriangle, Activity, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, FileDown, RefreshCw, Target, Layers, ChartBar as BarChart2, UserCheck, CreditCard, Banknote, Smartphone, Building2 } from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, ComposedChart, ReferenceLine,
} from 'recharts';
import { cn } from '@/lib/utils';

/* ─── constants ─── */

const MONTHS_SHORT = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

const CATEGORY_LABELS: Record<string, string> = {
  quota: 'Cuotas', event: 'Eventos', rental: 'Alquileres',
  salary: 'Sueldos', rent: 'Alquiler local', utilities: 'Servicios',
  equipment: 'Equipamiento', maintenance: 'Mantenimiento',
  supplies: 'Insumos', other: 'Otros',
};

const EXPENSE_COLORS: Record<string, string> = {
  salary: '#f59e0b', rent: '#06b6d4', utilities: '#3b82f6',
  equipment: '#8b5cf6', maintenance: '#10b981', supplies: '#ec4899', other: '#6b7280',
};

const METHOD_COLORS: Record<string, string> = {
  cash: '#10b981', transfer: '#06b6d4', mercadopago: '#3b82f6', card: '#f59e0b', other: '#6b7280',
};
const METHOD_LABELS: Record<string, string> = {
  cash: 'Efectivo', transfer: 'Transferencia', mercadopago: 'Mercado Pago', card: 'Tarjeta', other: 'Otro',
};

/* ─── helpers ─── */

const fmt = (v: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(v);

const fmtCompact = (v: number) => {
  const abs = Math.abs(v);
  if (abs >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000)     return `$${(v / 1_000).toFixed(0)}k`;
  return `$${v.toFixed(0)}`;
};

/* ─── custom tooltips ─── */

const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-3 shadow-xl text-xs min-w-[140px]">
      <p className="text-zinc-300 font-semibold mb-2">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2 mb-1 last:mb-0">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color }} />
          <span className="text-zinc-400 flex-1">{p.name}:</span>
          <span className="text-white font-medium">
            {typeof p.value === 'number' && p.name?.includes('$')
              ? fmt(p.value * 100)
              : p.value}
          </span>
        </div>
      ))}
    </div>
  );
};

const MoneyTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-3 shadow-xl text-xs">
      <p className="text-zinc-300 font-semibold mb-2">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2 mb-1 last:mb-0">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color || p.fill }} />
          <span className="text-zinc-400 flex-1">{p.name}:</span>
          <span className="text-white font-medium">{fmtCompact(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

/* ─── stat card ─── */

interface KpiCardProps {
  title: string; value: string | number; sub?: string;
  icon: React.ElementType; accent: string; bg: string;
  border?: string; trend?: number; loading?: boolean;
}

function KpiCard({ title, value, sub, icon: Icon, accent, bg, border, trend, loading }: KpiCardProps) {
  if (loading) return <div className="bg-[#111111] border border-[#1f1f1f] rounded-xl h-28 animate-pulse" />;
  return (
    <div className={cn('bg-[#111111] border rounded-xl p-5 flex flex-col gap-3 hover:border-opacity-50 transition-all group', border || 'border-[#1f1f1f]')}>
      <div className="flex items-center justify-between">
        <span className="text-zinc-500 text-xs font-medium">{title}</span>
        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center border', bg, border || 'border-transparent')}>
          <Icon className={cn('w-4 h-4', accent)} />
        </div>
      </div>
      <div>
        <p className={cn('text-2xl font-bold tracking-tight', accent)}>{value}</p>
        {sub && (
          <div className="flex items-center gap-1 mt-0.5">
            {trend !== undefined && (
              trend >= 0
                ? <ArrowUpRight className="w-3 h-3 text-emerald-400" />
                : <ArrowDownRight className="w-3 h-3 text-red-400" />
            )}
            <p className={cn('text-[11px]', trend !== undefined ? (trend >= 0 ? 'text-emerald-500' : 'text-red-500') : 'text-zinc-500')}>{sub}</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── section wrapper ─── */

function Panel({ title, sub, right, children, className }: {
  title: string; sub?: string; right?: React.ReactNode; children: React.ReactNode; className?: string;
}) {
  return (
    <div className={cn('bg-[#111111] border border-[#1f1f1f] rounded-xl p-5', className)}>
      <div className="flex items-start justify-between mb-5">
        <div>
          <h3 className="text-white font-semibold text-sm">{title}</h3>
          {sub && <p className="text-zinc-500 text-xs mt-0.5">{sub}</p>}
        </div>
        {right}
      </div>
      {children}
    </div>
  );
}

/* ─── main ─── */

export default function StatsPage() {
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [expCategory, setExpCategory] = useState('all');

  // Data
  const [kpis, setKpis]             = useState({ students: 0, newMonth: 0, groups: 0, avgAge: 0, delinquency: 0, delinqCount: 0 });
  const [revenue, setRevenue]       = useState({ current: 0, prev: 0 });
  const [expenses, setExpenses]     = useState({ current: 0, prev: 0 });
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [expenseData, setExpenseData] = useState<any[]>([]);
  const [categoryExpenses, setCategoryExpenses] = useState<any[]>([]);
  const [methodData, setMethodData] = useState<any[]>([]);
  const [disciplineData, setDisciplineData] = useState<any[]>([]);
  const [genderData, setGenderData] = useState<any[]>([]);
  const [ageData, setAgeData]       = useState<any[]>([]);

  const now = new Date();
  const CM = now.getMonth() + 1;
  const CY = now.getFullYear();

  useEffect(() => { fetchStats(); }, []);

  const fetchStats = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);

    const [studRes, payRes, txRes, sgRes, grpRes] = await Promise.all([
      supabase.from('students').select('id,status,birth_date,gender,created_at,enrollment_date'),
      supabase.from('payments').select('month,year,final_amount,status,method'),
      supabase.from('financial_transactions').select('type,category,amount,date,payment_method'),
      supabase.from('student_groups').select('group_id,status,group:groups(discipline_id,discipline:disciplines(name,color))'),
      supabase.from('groups').select('id', { count: 'exact' }).eq('is_active', true),
    ]);

    const students    = studRes.data ?? [];
    const payments    = payRes.data  ?? [];
    const txs         = txRes.data   ?? [];
    const studentGrps = sgRes.data   ?? [];

    const active = students.filter(s => s.status === 'active');
    const ages   = active.filter(s => s.birth_date).map(s =>
      Math.floor((Date.now() - new Date(s.birth_date!).getTime()) / (365.25*24*3600*1000))
    );

    const newM = students.filter(s => {
      const d = new Date(s.created_at);
      return d.getMonth()+1 === CM && d.getFullYear() === CY;
    }).length;

    const curPays  = payments.filter(p => p.month === CM && p.year === CY);
    const overdue  = curPays.filter(p => p.status === 'overdue').length;
    const curRev   = curPays.filter(p => p.status === 'paid').reduce((s,p) => s+p.final_amount, 0);
    const prevM    = CM===1?12:CM-1; const prevY = CM===1?CY-1:CY;
    const prevRev  = payments.filter(p => p.month===prevM && p.year===prevY && p.status==='paid').reduce((s,p) => s+p.final_amount, 0);

    // Expenses from financial_transactions
    const curExp = txs.filter(t => {
      const d = new Date(t.date);
      return t.type==='expense' && d.getMonth()+1===CM && d.getFullYear()===CY;
    }).reduce((s,t) => s+t.amount, 0);

    const prevExp = txs.filter(t => {
      const d = new Date(t.date);
      return t.type==='expense' && d.getMonth()+1===prevM && d.getFullYear()===prevY;
    }).reduce((s,t) => s+t.amount, 0);

    setKpis({ students: active.length, newMonth: newM, groups: grpRes.count??0, avgAge: ages.length ? Math.round(ages.reduce((a,b)=>a+b,0)/ages.length) : 0, delinquency: curPays.length>0?Math.round(overdue/curPays.length*100):0, delinqCount: overdue });
    setRevenue({ current: curRev, prev: prevRev });
    setExpenses({ current: curExp, prev: prevExp });

    // 12-month combined data
    const chart = Array.from({ length: 12 }, (_,i) => {
      const d    = new Date(CY, CM-1-(11-i), 1);
      const m    = d.getMonth()+1; const y = d.getFullYear();
      const mPay = payments.filter(p => p.month===m && p.year===y);
      const inc  = mPay.filter(p => p.status==='paid').reduce((s,p) => s+p.final_amount/100, 0);
      const newS = students.filter(s => { const sd=new Date(s.created_at); return sd.getMonth()+1===m && sd.getFullYear()===y; }).length;
      const exp  = txs.filter(t => { const td=new Date(t.date); return t.type==='expense' && td.getMonth()+1===m && td.getFullYear()===y; }).reduce((s,t) => s+t.amount/100, 0);
      const od   = mPay.filter(p => p.status==='overdue').length;
      return { month: MONTHS_SHORT[d.getMonth()], ingresos: inc, egresos: exp, balance: inc-exp, alumnos: newS, morosos: od };
    });
    setMonthlyData(chart);

    // Expense by category (all time)
    const catMap: Record<string, number> = {};
    txs.filter(t => t.type==='expense').forEach(t => {
      catMap[t.category] = (catMap[t.category]||0) + t.amount;
    });
    const catArr = Object.entries(catMap).map(([cat,amount]) => ({
      cat: CATEGORY_LABELS[cat]||cat, key: cat, amount: amount/100, color: EXPENSE_COLORS[cat]||'#6b7280'
    })).sort((a,b) => b.amount-a.amount);
    setCategoryExpenses(catArr);

    // Monthly expense breakdown (last 6mo)
    const expMonths = Array.from({ length: 6 }, (_,i) => {
      const d = new Date(CY, CM-1-(5-i), 1);
      const m = d.getMonth()+1; const y = d.getFullYear();
      const row: any = { month: MONTHS_SHORT[d.getMonth()] };
      Object.keys(EXPENSE_COLORS).forEach(cat => {
        row[cat] = txs.filter(t => { const td=new Date(t.date); return t.type==='expense' && t.category===cat && td.getMonth()+1===m && td.getFullYear()===y; }).reduce((s,t) => s+t.amount/100, 0);
      });
      return row;
    });
    setExpenseData(expMonths);

    // Method breakdown (income payments)
    const mMap: Record<string,number> = {};
    payments.filter(p => p.status==='paid').forEach(p => {
      const mKey = p.method||'other';
      mMap[mKey] = (mMap[mKey]||0) + p.final_amount;
    });
    setMethodData(Object.entries(mMap).map(([method,amount]) => ({ name: METHOD_LABELS[method]||method, value: amount/100, color: METHOD_COLORS[method]||'#6b7280' })).sort((a,b) => b.value-a.value));

    // Discipline
    const dMap: Record<string,{name:string;color:string;count:number}> = {};
    studentGrps.forEach(sg => {
      if (sg.status==='active') {
        const disc = (sg.group as any)?.discipline;
        if (disc) { if (!dMap[disc.name]) dMap[disc.name]={name:disc.name,color:disc.color||'#06b6d4',count:0}; dMap[disc.name].count++; }
      }
    });
    setDisciplineData(Object.values(dMap).sort((a,b) => b.count-a.count));

    // Gender + age
    setGenderData([
      { name: 'Femenino', value: active.filter(s=>s.gender==='female').length, color: '#ec4899' },
      { name: 'Masculino', value: active.filter(s=>s.gender==='male').length, color: '#3b82f6' },
      { name: 'No especificado', value: active.filter(s=>!s.gender||s.gender==='other').length, color: '#6b7280' },
    ].filter(d=>d.value>0));
    setAgeData([
      {range:'3-5',min:3,max:5},{range:'6-8',min:6,max:8},{range:'9-11',min:9,max:11},
      {range:'12-14',min:12,max:14},{range:'15-17',min:15,max:17},{range:'18-25',min:18,max:25},{range:'26+',min:26,max:200},
    ].map(b => ({ range: b.range, count: ages.filter(a => a>=b.min && a<=b.max).length })));

    setLoading(false); setRefreshing(false);
  };

  /* ─── PDF export ─── */
  const exportPDF = () => {
    const rev = revenue.current/100; const exp = expenses.current/100;
    const lines = [
      `REPORTE ESTADÍSTICO — GYMASTICS CLUB`,
      `Generado: ${new Date().toLocaleDateString('es-AR', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}`,
      ``,
      `══════════════════════════════════════════`,
      `RESUMEN EJECUTIVO — MES ACTUAL`,
      `══════════════════════════════════════════`,
      `Alumnos activos:    ${kpis.students}  (+${kpis.newMonth} este mes)`,
      `Grupos activos:     ${kpis.groups}`,
      `Edad promedio:      ${kpis.avgAge} años`,
      ``,
      `Ingresos del mes:   ${fmt(revenue.current/100)}`,
      `Egresos del mes:    ${fmt(expenses.current/100)}`,
      `Balance neto:       ${fmt(rev-exp)}`,
      `Tasa de morosidad:  ${kpis.delinquency}% (${kpis.delinqCount} alumnos)`,
      ``,
      `══════════════════════════════════════════`,
      `EVOLUCIÓN MENSUAL (ÚLTIMOS 12 MESES)`,
      `══════════════════════════════════════════`,
      `Mes       Ingresos          Egresos          Balance`,
      `────────────────────────────────────────────────────`,
      ...monthlyData.map(m =>
        `${m.month.padEnd(10)}${fmt(m.ingresos).padEnd(18)}${fmt(m.egresos).padEnd(18)}${m.balance>=0?'+':''}${fmt(m.balance)}`
      ),
      ``,
      `══════════════════════════════════════════`,
      `GASTOS POR CATEGORÍA (HISTÓRICO)`,
      `══════════════════════════════════════════`,
      ...categoryExpenses.map(c => `${c.cat.padEnd(22)}${fmt(c.amount)}`),
      ``,
      `══════════════════════════════════════════`,
      `DISTRIBUCIÓN DISCIPLINAS`,
      `══════════════════════════════════════════`,
      ...disciplineData.map(d => `${d.name.padEnd(22)}${d.count} alumnos`),
      ``,
      `══════════════════════════════════════════`,
      `DISTRIBUCIÓN GÉNERO`,
      `══════════════════════════════════════════`,
      ...genderData.map(g => `${g.name.padEnd(22)}${g.value} (${kpis.students>0?Math.round(g.value/kpis.students*100):0}%)`),
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a'); a.href=url;
    a.download = `estadisticas-${CY}-${String(CM).padStart(2,'0')}.txt`; a.click();
    URL.revokeObjectURL(url);
  };

  const exportCSV = () => {
    const rows = [
      ['Mes','Ingresos','Egresos','Balance','Nuevos alumnos','Morosos'],
      ...monthlyData.map(m => [m.month, m.ingresos.toFixed(2), m.egresos.toFixed(2), m.balance.toFixed(2), m.alumnos, m.morosos])
    ];
    const blob = new Blob(['\ufeff'+rows.map(r=>r.join(',')).join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a'); a.href=url;
    a.download = `estadisticas-${CY}-${String(CM).padStart(2,'0')}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const revChange  = revenue.prev  > 0 ? ((revenue.current  - revenue.prev)  / revenue.prev  * 100) : 0;
  const expChange  = expenses.prev > 0 ? ((expenses.current - expenses.prev) / expenses.prev * 100) : 0;
  const curBalance = (revenue.current - expenses.current) / 100;

  const filteredExpCat = expCategory === 'all'
    ? categoryExpenses
    : categoryExpenses.filter(c => c.key === expCategory);

  const totalExpCat = categoryExpenses.reduce((s,c) => s+c.amount, 0);

  return (
    <div className="flex-1 flex flex-col">
      <Header title="Estadísticas" subtitle="Business intelligence · métricas avanzadas y reportes financieros" />

      <div className="flex-1 p-6 space-y-5 animate-fade-in">

        {/* ── Toolbar ── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-zinc-600 text-xs">
              Datos al {new Date().toLocaleDateString('es-AR', { day:'numeric', month:'long', year:'numeric' })}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => fetchStats(true)} disabled={refreshing}
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-[#111111] border border-[#1f1f1f] text-zinc-400 text-xs hover:text-white hover:border-[#2a2a2a] transition-all disabled:opacity-50">
              <RefreshCw className={cn('w-3.5 h-3.5', refreshing && 'animate-spin')} /> Actualizar
            </button>
            <button onClick={exportCSV}
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-[#111111] border border-[#1f1f1f] text-zinc-400 text-xs hover:text-white hover:border-[#2a2a2a] transition-all">
              <BarChart2 className="w-3.5 h-3.5" /> Excel
            </button>
            <button onClick={exportPDF}
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-white text-xs font-semibold transition-all">
              <FileDown className="w-3.5 h-3.5" /> Exportar PDF
            </button>
          </div>
        </div>

        {/* ── KPI row 1: Students ── */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <KpiCard loading={loading} title="Alumnos activos" value={kpis.students}
            sub={`+${kpis.newMonth} nuevos este mes`} icon={Users}
            accent="text-blue-400" bg="bg-blue-500/10" border="border-[#1f1f1f]" />
          <KpiCard loading={loading} title="Grupos activos" value={kpis.groups}
            sub={`Edad prom. ${kpis.avgAge} años`} icon={Layers}
            accent="text-cyan-400" bg="bg-cyan-500/10" border="border-[#1f1f1f]" />
          <KpiCard loading={loading} title="Tasa de morosidad" value={`${kpis.delinquency}%`}
            sub={`${kpis.delinqCount} cuotas sin cobrar`} icon={AlertTriangle}
            accent={kpis.delinquency > 25 ? 'text-red-400' : 'text-amber-400'}
            bg={kpis.delinquency > 25 ? 'bg-red-500/10' : 'bg-amber-500/10'} border="border-[#1f1f1f]"
            trend={-kpis.delinquency} />
          <KpiCard loading={loading} title="Retención" value={kpis.students > 0 ? `${100 - kpis.delinquency}%` : '—'}
            sub="Alumnos al corriente" icon={UserCheck}
            accent="text-emerald-400" bg="bg-emerald-500/10" border="border-[#1f1f1f]" />
        </div>

        {/* ── KPI row 2: Financial ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Ingresos */}
          <div className={cn('bg-[#111111] border rounded-xl p-5 relative overflow-hidden', loading ? 'animate-pulse h-28' : 'border-[#1f1f1f]')}>
            {!loading && (
              <>
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500/60 to-transparent rounded-t-xl" />
                <div className="flex items-center justify-between mb-3">
                  <span className="text-zinc-500 text-xs font-medium">Ingresos del mes</span>
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/15 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-emerald-400 tracking-tight">{fmt(revenue.current/100)}</p>
                <div className="flex items-center gap-1 mt-1">
                  {revChange >= 0 ? <ArrowUpRight className="w-3 h-3 text-emerald-400" /> : <ArrowDownRight className="w-3 h-3 text-red-400" />}
                  <span className={cn('text-[11px]', revChange >= 0 ? 'text-emerald-500' : 'text-red-500')}>
                    {revChange >= 0 ? '+' : ''}{revChange.toFixed(1)}% vs mes anterior
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Egresos */}
          <div className={cn('bg-[#111111] border rounded-xl p-5 relative overflow-hidden', loading ? 'animate-pulse h-28' : 'border-[#1f1f1f]')}>
            {!loading && (
              <>
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-red-500/60 to-transparent rounded-t-xl" />
                <div className="flex items-center justify-between mb-3">
                  <span className="text-zinc-500 text-xs font-medium">Egresos del mes</span>
                  <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/15 flex items-center justify-center">
                    <TrendingDown className="w-4 h-4 text-red-400" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-red-400 tracking-tight">{fmt(expenses.current/100)}</p>
                <div className="flex items-center gap-1 mt-1">
                  {expChange <= 0 ? <ArrowDownRight className="w-3 h-3 text-emerald-400" /> : <ArrowUpRight className="w-3 h-3 text-red-400" />}
                  <span className={cn('text-[11px]', expChange <= 0 ? 'text-emerald-500' : 'text-red-500')}>
                    {expChange >= 0 ? '+' : ''}{expChange.toFixed(1)}% vs mes anterior
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Balance */}
          <div className={cn('border rounded-xl p-5 relative overflow-hidden', loading ? 'bg-[#111111] border-[#1f1f1f] animate-pulse h-28' : curBalance >= 0 ? 'bg-emerald-500/[0.04] border-emerald-500/20' : 'bg-red-500/[0.04] border-red-500/20')}>
            {!loading && (
              <>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-zinc-500 text-xs font-medium">Balance neto del mes</span>
                  <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded border',
                    curBalance >= 0 ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-red-400 bg-red-500/10 border-red-500/20'
                  )}>{curBalance >= 0 ? 'Superávit' : 'Déficit'}</span>
                </div>
                <p className={cn('text-2xl font-bold tracking-tight', curBalance >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                  {curBalance < 0 ? '−' : ''}{fmt(Math.abs(curBalance))}
                </p>
                {revenue.current > 0 && (
                  <p className="text-zinc-600 text-[11px] mt-1">
                    Margen: {((1 - expenses.current / revenue.current) * 100).toFixed(1)}%
                  </p>
                )}
              </>
            )}
          </div>
        </div>

        {/* ── Income evolution (12mo) ── */}
        <Panel title="Evolución de ingresos y egresos" sub="Últimos 12 meses · cuotas cobradas + movimientos financieros"
          right={
            <div className="flex items-center gap-3 text-xs text-zinc-500">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />Ingresos</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500" />Egresos</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />Balance</span>
            </div>
          }>
          {loading ? <div className="h-56 bg-zinc-800/30 rounded-lg animate-pulse" /> : (
            <ResponsiveContainer width="100%" height={230}>
              <ComposedChart data={monthlyData} margin={{ left: 0, right: 0, top: 4, bottom: 0 }}>
                <defs>
                  <linearGradient id="gInc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: '#52525b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#52525b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={fmtCompact} width={52} />
                <Tooltip content={<MoneyTooltip />} />
                <ReferenceLine y={0} stroke="#2a2a2a" strokeWidth={1} />
                <Area type="monotone" dataKey="ingresos" fill="url(#gInc)" stroke="#10b981" strokeWidth={2} name="Ingresos" dot={false} />
                <Bar dataKey="egresos" fill="#ef444430" stroke="#ef4444" strokeWidth={1} radius={[3,3,0,0]} name="Egresos" />
                <Line type="monotone" dataKey="balance" stroke="#06b6d4" strokeWidth={2} dot={{ fill: '#06b6d4', r: 3 }} name="Balance" />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </Panel>

        {/* ── 2-col: Expense categories + Method breakdown ── */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {/* Expense by category */}
          <div className="bg-[#111111] border border-[#1f1f1f] rounded-xl p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-white font-semibold text-sm">Gastos por categoría</h3>
                <p className="text-zinc-500 text-xs mt-0.5">Histórico acumulado</p>
              </div>
              <select value={expCategory} onChange={e => setExpCategory(e.target.value)}
                className="h-7 px-2 rounded-lg bg-[#0d0d0d] border border-[#2a2a2a] text-zinc-300 text-xs focus:outline-none focus:border-cyan-500/40">
                <option value="all">Todas</option>
                {categoryExpenses.map(c => <option key={c.key} value={c.key}>{c.cat}</option>)}
              </select>
            </div>
            {loading ? <div className="space-y-3">{Array.from({length:5}).map((_,i) => <div key={i} className="h-8 bg-zinc-800/40 rounded-lg animate-pulse" />)}</div> : (
              filteredExpCat.length === 0 ? (
                <div className="flex items-center justify-center h-32 text-zinc-600 text-sm">Sin datos de gastos</div>
              ) : (
                <div className="space-y-3">
                  {filteredExpCat.map(({ cat, amount, color }) => {
                    const pct = totalExpCat > 0 ? (amount / totalExpCat * 100) : 0;
                    return (
                      <div key={cat}>
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
                            <span className="text-zinc-300 text-xs font-medium">{cat}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-zinc-500 text-[10px]">{pct.toFixed(1)}%</span>
                            <span className="text-white text-xs font-bold tabular-nums">{fmtCompact(amount)}</span>
                          </div>
                        </div>
                        <div className="h-1.5 rounded-full bg-[#1a1a1a] overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
                        </div>
                      </div>
                    );
                  })}
                  <div className="pt-2 border-t border-[#1a1a1a] flex items-center justify-between">
                    <span className="text-zinc-600 text-xs">Total histórico</span>
                    <span className="text-red-400 text-sm font-bold">{fmt(totalExpCat)}</span>
                  </div>
                </div>
              )
            )}
          </div>

          {/* Income by payment method */}
          <div className="bg-[#111111] border border-[#1f1f1f] rounded-xl p-5">
            <div className="mb-4">
              <h3 className="text-white font-semibold text-sm">Ingresos por método de cobro</h3>
              <p className="text-zinc-500 text-xs mt-0.5">Total histórico de cuotas cobradas</p>
            </div>
            {loading ? <div className="h-44 bg-zinc-800/30 rounded-lg animate-pulse" /> : (
              methodData.length === 0 ? (
                <div className="flex items-center justify-center h-44 text-zinc-600 text-sm">Sin datos</div>
              ) : (
                <div className="flex items-center gap-4">
                  <div className="shrink-0">
                    <ResponsiveContainer width={150} height={150}>
                      <PieChart>
                        <Pie data={methodData} dataKey="value" cx="50%" cy="50%"
                          innerRadius={42} outerRadius={65} strokeWidth={0} paddingAngle={3}>
                          {methodData.map((e, i) => <Cell key={i} fill={e.color} />)}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, fontSize: 11 }}
                          formatter={(v: any) => fmtCompact(v)} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex-1 space-y-2.5">
                    {methodData.map(({ name, value, color }) => {
                      const total = methodData.reduce((s,m) => s+m.value, 0);
                      const pct = total > 0 ? (value/total*100).toFixed(0) : '0';
                      const Icon = name === 'Efectivo' ? Banknote : name === 'Transferencia' ? Building2 : name === 'Mercado Pago' ? Smartphone : name === 'Tarjeta' ? CreditCard : DollarSign;
                      return (
                        <div key={name}>
                          <div className="flex items-center gap-1.5 mb-1">
                            <Icon className="w-3 h-3" style={{ color }} />
                            <span className="text-zinc-300 text-xs flex-1">{name}</span>
                            <span className="text-zinc-500 text-[10px]">{pct}%</span>
                            <span className="text-white text-xs font-bold">{fmtCompact(value)}</span>
                          </div>
                          <div className="h-1 rounded-full bg-[#1a1a1a] overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )
            )}
          </div>
        </div>

        {/* ── Stacked expense chart ── */}
        <Panel title="Composición de gastos mensuales" sub="Últimos 6 meses por categoría"
          right={
            <div className="flex flex-wrap gap-2">
              {Object.entries(EXPENSE_COLORS).slice(0,5).map(([key, color]) => (
                <span key={key} className="flex items-center gap-1 text-[10px] text-zinc-500">
                  <span className="w-2 h-2 rounded-full" style={{ background: color }} />{CATEGORY_LABELS[key]||key}
                </span>
              ))}
            </div>
          }>
          {loading ? <div className="h-52 bg-zinc-800/30 rounded-lg animate-pulse" /> : (
            <ResponsiveContainer width="100%" height={210}>
              <BarChart data={expenseData} margin={{ left: 0, right: 0, top: 4, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: '#52525b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#52525b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={fmtCompact} width={52} />
                <Tooltip content={<MoneyTooltip />} />
                {Object.entries(EXPENSE_COLORS).map(([key, color]) => (
                  <Bar key={key} dataKey={key} stackId="a" fill={color} name={CATEGORY_LABELS[key]||key} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          )}
        </Panel>

        {/* ── 3-col bottom: discipline + gender + age ── */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          {/* Discipline */}
          <div className="bg-[#111111] border border-[#1f1f1f] rounded-xl p-5">
            <div className="mb-4">
              <h3 className="text-white font-semibold text-sm">Por disciplina</h3>
              <p className="text-zinc-500 text-xs mt-0.5">Alumnos inscriptos activos</p>
            </div>
            {loading ? <div className="space-y-3">{Array.from({length:4}).map((_,i) => <div key={i} className="h-7 bg-zinc-800/40 rounded animate-pulse" />)}</div> : (
              disciplineData.length === 0 ? (
                <div className="flex items-center justify-center h-32 text-zinc-600 text-sm">Sin datos</div>
              ) : (
                <div className="space-y-3">
                  {disciplineData.slice(0,7).map(item => {
                    const max = Math.max(...disciplineData.map(d=>d.count), 1);
                    return (
                      <div key={item.name}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: item.color }} />
                            <span className="text-zinc-400 text-xs truncate max-w-[120px]">{item.name}</span>
                          </div>
                          <span className="text-white text-xs font-bold shrink-0 ml-2">{item.count}</span>
                        </div>
                        <div className="h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${item.count/max*100}%`, background: item.color }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            )}
          </div>

          {/* Gender */}
          <div className="bg-[#111111] border border-[#1f1f1f] rounded-xl p-5">
            <div className="mb-4">
              <h3 className="text-white font-semibold text-sm">Por género</h3>
              <p className="text-zinc-500 text-xs mt-0.5">Distribución de alumnos activos</p>
            </div>
            {loading ? <div className="h-40 bg-zinc-800/30 rounded-lg animate-pulse" /> : (
              genderData.length === 0 ? (
                <div className="flex items-center justify-center h-32 text-zinc-600 text-sm">Sin datos</div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={120}>
                    <PieChart>
                      <Pie data={genderData} dataKey="value" cx="50%" cy="50%"
                        innerRadius={35} outerRadius={52} strokeWidth={0} paddingAngle={3}>
                        {genderData.map((e,i) => <Cell key={i} fill={e.color} />)}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2 mt-2">
                    {genderData.map(g => (
                      <div key={g.name} className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: g.color }} />
                        <span className="text-zinc-400 text-xs flex-1">{g.name}</span>
                        <span className="text-white text-xs font-bold">{g.value}</span>
                        <span className="text-zinc-600 text-[10px] w-8 text-right">
                          {kpis.students > 0 ? `${Math.round(g.value/kpis.students*100)}%` : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )
            )}
          </div>

          {/* Age */}
          <div className="bg-[#111111] border border-[#1f1f1f] rounded-xl p-5">
            <div className="mb-4">
              <h3 className="text-white font-semibold text-sm">Por rango de edad</h3>
              <p className="text-zinc-500 text-xs mt-0.5">Alumnos activos</p>
            </div>
            {loading ? <div className="h-40 bg-zinc-800/30 rounded-lg animate-pulse" /> : (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={ageData} layout="vertical" barSize={12} margin={{ left: 0, right: 8, top: 0, bottom: 0 }}>
                  <XAxis type="number" tick={{ fill: '#52525b', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <YAxis type="category" dataKey="range" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} width={34} />
                  <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, fontSize: 11 }}
                    formatter={(v: any) => [v, 'Alumnos']} />
                  <Bar dataKey="count" radius={[0,3,3,0]}>
                    {ageData.map((_,i) => (
                      <Cell key={i} fill={`hsl(${185 + i*12}, 70%, ${45 + i*3}%)`} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* ── Delinquency + new students ── */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {/* New students */}
          <Panel title="Nuevos alumnos por mes" sub="Inscripciones completadas — últimos 12 meses">
            {loading ? <div className="h-44 bg-zinc-800/30 rounded-lg animate-pulse" /> : (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={monthlyData} barSize={16}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" vertical={false} />
                  <XAxis dataKey="month" tick={{ fill: '#52525b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#52525b', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, fontSize: 11 }}
                    formatter={(v: any) => [v, 'Nuevos alumnos']} />
                  <Bar dataKey="alumnos" radius={[4,4,0,0]}>
                    {monthlyData.map((_,i) => (
                      <Cell key={i} fill={i === monthlyData.length-1 ? '#06b6d4' : '#1e3a5f'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </Panel>

          {/* Delinquency */}
          <Panel title="Tendencia de morosidad" sub="Cuotas vencidas sin cobrar por mes"
            right={
              <div className={cn('text-xs font-semibold px-2 py-1 rounded-lg border',
                kpis.delinquency > 25 ? 'text-red-400 bg-red-500/10 border-red-500/20' : 'text-amber-400 bg-amber-500/10 border-amber-500/20'
              )}>
                {kpis.delinquency}% actual
              </div>
            }>
            {loading ? <div className="h-44 bg-zinc-800/30 rounded-lg animate-pulse" /> : (
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={monthlyData}>
                  <defs>
                    <linearGradient id="gMor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" vertical={false} />
                  <XAxis dataKey="month" tick={{ fill: '#52525b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#52525b', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, fontSize: 11 }}
                    formatter={(v: any) => [v, 'Morosos']} />
                  <Area type="monotone" dataKey="morosos" stroke="#ef4444" strokeWidth={2} fill="url(#gMor)" dot={{ fill: '#ef4444', r: 3 }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </Panel>
        </div>

        {/* ── Target indicators ── */}
        <div className="bg-[#111111] border border-[#1f1f1f] rounded-xl p-5">
          <div className="flex items-center gap-2 mb-5">
            <Target className="w-4 h-4 text-cyan-400" />
            <h3 className="text-white font-semibold text-sm">Indicadores de salud financiera</h3>
          </div>
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-5">
            {[
              {
                label: 'Cobro del mes',
                value: revenue.current > 0 ? Math.min(100, Math.round((revenue.current - expenses.current) / revenue.current * 100 + 50)) : 0,
                color: '#10b981', target: 70, desc: 'Objetivo: margen > 30%'
              },
              {
                label: 'Cumplimiento cuotas',
                value: 100 - kpis.delinquency,
                color: kpis.delinquency > 25 ? '#ef4444' : '#06b6d4', target: 80, desc: 'Objetivo: morosidad < 20%'
              },
              {
                label: 'Crecimiento alumnos',
                value: kpis.students > 0 ? Math.min(100, Math.round(kpis.newMonth / kpis.students * 100 * 5)) : 0,
                color: '#3b82f6', target: 60, desc: `${kpis.newMonth} nuevos / ${kpis.students} activos`
              },
              {
                label: 'Diversificación cobro',
                value: methodData.length > 0 ? Math.min(100, methodData.length * 25) : 0,
                color: '#f59e0b', target: 75, desc: `${methodData.length} métodos activos`
              },
            ].map(({ label, value, color, target, desc }) => (
              <div key={label}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-zinc-400 text-xs">{label}</span>
                  <span className="text-white text-sm font-bold">{value}%</span>
                </div>
                <div className="relative h-2 bg-[#1a1a1a] rounded-full overflow-hidden mb-1">
                  <div className="h-full rounded-full transition-all" style={{ width: `${value}%`, background: color }} />
                  <div className="absolute top-0 bottom-0 w-0.5 bg-zinc-600" style={{ left: `${target}%` }} />
                </div>
                <p className="text-zinc-600 text-[10px]">{desc}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
