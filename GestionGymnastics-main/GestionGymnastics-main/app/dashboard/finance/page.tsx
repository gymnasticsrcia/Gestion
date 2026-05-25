'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import Header from '@/components/layout/Header';
import {
  Plus, TrendingUp, TrendingDown, DollarSign, X, ArrowUpRight, ArrowDownRight,
  Banknote, CreditCard, Smartphone, Building2, Calendar, Filter,
  FileDown, FileSpreadsheet, ChevronDown, Eye, Wallet, Activity,
  BarChart2, PieChart as PieChartIcon, Layers
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';

/* ─────────────────────── constants ─────────────────────── */

const CATEGORIES_INCOME  = ['quota', 'event', 'rental', 'other'];
const CATEGORIES_EXPENSE = ['salary', 'rent', 'utilities', 'equipment', 'maintenance', 'supplies', 'other'];
const CATEGORY_LABELS: Record<string, string> = {
  quota: 'Cuotas', event: 'Eventos', rental: 'Alquileres', salary: 'Sueldos',
  rent: 'Alquiler local', utilities: 'Servicios', equipment: 'Equipamiento',
  maintenance: 'Mantenimiento', supplies: 'Insumos', other: 'Otros',
};
const METHOD_LABELS: Record<string, string> = {
  cash: 'Efectivo', transfer: 'Transferencia', mercadopago: 'Mercado Pago',
  card: 'Tarjeta', other: 'Otro',
};
const METHOD_COLORS: Record<string, string> = {
  cash: '#10b981', transfer: '#06b6d4', mercadopago: '#3b82f6',
  card: '#f59e0b', other: '#6b7280',
};
const MONTHS_SHORT = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

type DateRange = 'day' | 'week' | 'month' | 'custom';
type ChartView = 'bar' | 'area' | 'line';

interface Tx {
  id: string; type: 'income' | 'expense'; category: string;
  amount: number; description: string; date: string;
  payment_method: string; notes?: string; created_at: string;
}

/* ─────────────────────── helpers ─────────────────────── */

const fmt = (cents: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(cents / 100);

const fmtShort = (cents: number) => {
  const v = Math.abs(cents / 100);
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)     return `$${(v / 1_000).toFixed(0)}k`;
  return `$${v.toFixed(0)}`;
};

const getDateRange = (range: DateRange, customStart?: string, customEnd?: string) => {
  const now = new Date();
  if (range === 'day') {
    const s = new Date(now); s.setHours(0,0,0,0);
    return { start: s.toISOString().split('T')[0], end: now.toISOString().split('T')[0] };
  }
  if (range === 'week') {
    const s = new Date(now); s.setDate(now.getDate() - now.getDay());
    return { start: s.toISOString().split('T')[0], end: now.toISOString().split('T')[0] };
  }
  if (range === 'custom') return { start: customStart || '', end: customEnd || '' };
  // month
  return { start: `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-01`, end: now.toISOString().split('T')[0] };
};

/* ─────────────────────── custom tooltip ─────────────────────── */

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-3 shadow-xl text-xs">
      <p className="text-zinc-300 font-semibold mb-2">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-zinc-400">{p.name === 'ingresos' ? 'Ingresos' : p.name === 'egresos' ? 'Egresos' : p.name}:</span>
          <span className="text-white font-medium">{fmt(p.value * 100)}</span>
        </div>
      ))}
    </div>
  );
};

const PieTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  return (
    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-3 shadow-xl text-xs">
      <p className="text-white font-semibold">{p.name}</p>
      <p className="text-zinc-400 mt-0.5">{fmt(p.value * 100)}</p>
    </div>
  );
};

/* ─────────────────────── main page ─────────────────────── */

export default function FinancePage() {
  const [transactions, setTransactions] = useState<Tx[]>([]);
  const [payments, setPayments]         = useState<any[]>([]);
  const [loading, setLoading]           = useState(true);
  const [showModal, setShowModal]       = useState(false);
  const [editTx, setEditTx]             = useState<Tx | null>(null);
  const [showDetail, setShowDetail]     = useState<Tx | null>(null);

  // Filters
  const [dateRange, setDateRange]         = useState<DateRange>('month');
  const [customStart, setCustomStart]     = useState('');
  const [customEnd, setCustomEnd]         = useState('');
  const [typeFilter, setTypeFilter]       = useState<'all'|'income'|'expense'>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [methodFilter, setMethodFilter]   = useState('all');
  const [showFilters, setShowFilters]     = useState(false);
  const [chartView, setChartView]         = useState<ChartView>('bar');
  const [activeTab, setActiveTab]         = useState<'overview'|'transactions'|'methods'>('overview');

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    const [txRes, payRes] = await Promise.all([
      supabase.from('financial_transactions').select('*').order('date', { ascending: false }),
      supabase.from('payments').select('*, student:students(first_name,last_name)').eq('status','paid').order('paid_at', { ascending: false }),
    ]);
    if (txRes.data) setTransactions(txRes.data as Tx[]);
    if (payRes.data) setPayments(payRes.data);
    setLoading(false);
  };

  // Build unified "all income" from financial_transactions + paid payments
  const allIncome: Tx[] = [
    ...transactions.filter(t => t.type === 'income'),
    ...payments.map(p => ({
      id: `pay_${p.id}`,
      type: 'income' as const,
      category: 'quota',
      amount: p.final_amount,
      description: p.student ? `Cuota ${MONTHS_SHORT[(p.month||1)-1]} — ${p.student.first_name} ${p.student.last_name}` : `Cuota`,
      date: p.paid_at ? p.paid_at.split('T')[0] : p.created_at?.split('T')[0] || '',
      payment_method: p.method || 'cash',
      created_at: p.created_at,
    }))
  ];

  const allExpense: Tx[] = transactions.filter(t => t.type === 'expense');

  const { start: rangeStart, end: rangeEnd } = getDateRange(dateRange, customStart, customEnd);

  const inRange = useCallback((date: string) => {
    if (!rangeStart) return true;
    return date >= rangeStart && date <= (rangeEnd || rangeStart);
  }, [rangeStart, rangeEnd]);

  const filteredTx: Tx[] = [
    ...(typeFilter !== 'expense' ? allIncome : []),
    ...(typeFilter !== 'income'  ? allExpense : []),
  ].filter(t => {
    if (!inRange(t.date)) return false;
    if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;
    if (methodFilter   !== 'all' && t.payment_method !== methodFilter) return false;
    return true;
  }).sort((a,b) => b.date.localeCompare(a.date));

  // KPIs for the selected range
  const rangeIncome  = filteredTx.filter(t => t.type === 'income').reduce((s,t) => s+t.amount, 0);
  const rangeExpense = filteredTx.filter(t => t.type === 'expense').reduce((s,t) => s+t.amount, 0);
  const rangeBalance = rangeIncome - rangeExpense;

  // Method breakdown (income only, in range)
  const methodBreakdown = Object.entries(
    filteredTx.filter(t => t.type === 'income').reduce((acc, t) => {
      acc[t.payment_method] = (acc[t.payment_method] || 0) + t.amount;
      return acc;
    }, {} as Record<string,number>)
  ).map(([method, amount]) => ({ name: METHOD_LABELS[method] || method, value: amount / 100, color: METHOD_COLORS[method] || '#6b7280' }))
   .sort((a,b) => b.value - a.value);

  // Category breakdown
  const categoryBreakdown = Object.entries(
    filteredTx.reduce((acc, t) => {
      const key = CATEGORY_LABELS[t.category] || t.category;
      acc[key] = (acc[key] || 0) + (t.type === 'income' ? t.amount : -t.amount);
      return acc;
    }, {} as Record<string,number>)
  ).map(([cat, val]) => ({ cat, val: val/100 })).sort((a,b) => b.val - a.val);

  // 6-month chart data
  const now = new Date();
  const chartData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    const inc = [...allIncome, ...allExpense].filter(t => t.date.startsWith(key));
    return {
      month: MONTHS_SHORT[d.getMonth()],
      ingresos: inc.filter(t => t.type === 'income').reduce((s,t) => s+t.amount/100, 0),
      egresos:  inc.filter(t => t.type === 'expense').reduce((s,t) => s+t.amount/100, 0),
    };
  });

  // --- Export helpers ---
  const exportCSV = () => {
    const rows = [
      ['Fecha','Tipo','Categoría','Método','Descripción','Importe'],
      ...filteredTx.map(t => [
        t.date,
        t.type === 'income' ? 'Ingreso' : 'Egreso',
        CATEGORY_LABELS[t.category] || t.category,
        METHOD_LABELS[t.payment_method] || t.payment_method,
        `"${t.description}"`,
        (t.amount / 100).toFixed(2),
      ])
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `reporte-financiero-${rangeStart || 'todo'}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = () => {
    const lines: string[] = [
      `REPORTE FINANCIERO`,
      `Período: ${rangeStart || 'Todo'} — ${rangeEnd || 'hoy'}`,
      ``,
      `RESUMEN`,
      `Ingresos:  ${fmt(rangeIncome)}`,
      `Egresos:   ${fmt(rangeExpense)}`,
      `Balance:   ${fmt(rangeBalance)}`,
      ``,
      `DETALLE DE MOVIMIENTOS`,
      `Fecha          Tipo      Categoría           Método           Importe        Descripción`,
      `─────────────────────────────────────────────────────────────────────────────────────────`,
      ...filteredTx.map(t =>
        `${t.date}  ${(t.type === 'income' ? 'Ingreso' : 'Egreso').padEnd(9)} ${(CATEGORY_LABELS[t.category]||t.category).padEnd(19)} ${(METHOD_LABELS[t.payment_method]||t.payment_method).padEnd(16)} ${(t.type==='income'?'+':'-') + fmt(t.amount).padEnd(14)} ${t.description}`
      )
    ];
    const content = lines.join('\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `reporte-financiero-${rangeStart || 'todo'}.txt`; a.click();
    URL.revokeObjectURL(url);
  };

  const rangeLabels: Record<DateRange, string> = {
    day: 'Hoy', week: 'Esta semana', month: 'Este mes', custom: 'Rango personalizado'
  };

  const ChartComponent = chartView === 'area' ? AreaChart : chartView === 'line' ? LineChart : BarChart;

  return (
    <div className="flex-1 flex flex-col">
      <Header title="Caja & Finanzas" subtitle="Control financiero integral con reportes auditados" />

      <div className="flex-1 p-6 space-y-5 animate-fade-in">

        {/* ── Top toolbar: date range + exports ── */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            {(['day','week','month','custom'] as DateRange[]).map(r => (
              <button key={r} onClick={() => setDateRange(r)}
                className={cn('h-8 px-3 rounded-lg text-xs font-medium border transition-all',
                  dateRange === r
                    ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400'
                    : 'bg-[#111111] border-[#1f1f1f] text-zinc-500 hover:text-white hover:border-[#2a2a2a]'
                )}>
                {rangeLabels[r]}
              </button>
            ))}
            {dateRange === 'custom' && (
              <div className="flex items-center gap-2">
                <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)}
                  className="h-8 px-2 rounded-lg bg-[#0f0f0f] border border-[#2a2a2a] text-white text-xs focus:outline-none focus:border-cyan-500/40" />
                <span className="text-zinc-600 text-xs">—</span>
                <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)}
                  className="h-8 px-2 rounded-lg bg-[#0f0f0f] border border-[#2a2a2a] text-white text-xs focus:outline-none focus:border-cyan-500/40" />
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => setShowFilters(v => !v)}
              className={cn('flex items-center gap-1.5 h-8 px-3 rounded-lg border text-xs font-medium transition-all',
                showFilters ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400' : 'bg-[#111111] border-[#1f1f1f] text-zinc-400 hover:text-white'
              )}>
              <Filter className="w-3.5 h-3.5" /> Filtros
              {(typeFilter !== 'all' || categoryFilter !== 'all' || methodFilter !== 'all') && (
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              )}
            </button>
            <button onClick={exportCSV}
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-[#111111] border border-[#1f1f1f] text-zinc-400 text-xs font-medium hover:text-white hover:border-[#2a2a2a] transition-all">
              <FileSpreadsheet className="w-3.5 h-3.5" /> Excel
            </button>
            <button onClick={exportPDF}
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-[#111111] border border-[#1f1f1f] text-zinc-400 text-xs font-medium hover:text-white hover:border-[#2a2a2a] transition-all">
              <FileDown className="w-3.5 h-3.5" /> PDF
            </button>
            <button onClick={() => { setEditTx(null); setShowModal(true); }}
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-white text-xs font-semibold transition-all">
              <Plus className="w-3.5 h-3.5" /> Movimiento
            </button>
          </div>
        </div>

        {/* ── Filter panel ── */}
        {showFilters && (
          <div className="bg-[#111111] border border-[#1f1f1f] rounded-xl p-4 flex flex-wrap gap-4">
            <div>
              <p className="text-zinc-500 text-[10px] font-semibold uppercase tracking-wider mb-1.5">Tipo</p>
              <div className="flex gap-1">
                {(['all','income','expense'] as const).map(t => (
                  <button key={t} onClick={() => setTypeFilter(t)}
                    className={cn('h-7 px-2.5 rounded-lg text-xs font-medium border transition-all',
                      typeFilter === t ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400' : 'border-[#2a2a2a] text-zinc-500 hover:text-white'
                    )}>
                    {t === 'all' ? 'Todos' : t === 'income' ? 'Ingresos' : 'Egresos'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-zinc-500 text-[10px] font-semibold uppercase tracking-wider mb-1.5">Categoría</p>
              <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
                className="h-7 px-2 rounded-lg bg-[#0d0d0d] border border-[#2a2a2a] text-white text-xs focus:outline-none focus:border-cyan-500/40">
                <option value="all">Todas</option>
                {[...CATEGORIES_INCOME, ...CATEGORIES_EXPENSE].map(c => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
              </select>
            </div>
            <div>
              <p className="text-zinc-500 text-[10px] font-semibold uppercase tracking-wider mb-1.5">Método</p>
              <select value={methodFilter} onChange={e => setMethodFilter(e.target.value)}
                className="h-7 px-2 rounded-lg bg-[#0d0d0d] border border-[#2a2a2a] text-white text-xs focus:outline-none focus:border-cyan-500/40">
                <option value="all">Todos</option>
                {Object.entries(METHOD_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            {(typeFilter !== 'all' || categoryFilter !== 'all' || methodFilter !== 'all') && (
              <button onClick={() => { setTypeFilter('all'); setCategoryFilter('all'); setMethodFilter('all'); }}
                className="self-end h-7 px-2.5 rounded-lg border border-zinc-700/50 text-zinc-500 text-xs hover:text-white flex items-center gap-1 transition-all">
                <X className="w-3 h-3" /> Limpiar
              </button>
            )}
          </div>
        )}

        {/* ── KPI cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Income */}
          <div className="bg-[#111111] border border-[#1f1f1f] rounded-xl p-5 relative overflow-hidden group hover:border-emerald-500/20 transition-all">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/15 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                  </div>
                  <span className="text-zinc-400 text-xs font-medium">Ingresos</span>
                </div>
                <span className="text-[10px] text-zinc-600">{rangeLabels[dateRange]}</span>
              </div>
              <p className="text-white text-2xl font-bold tracking-tight">{fmt(rangeIncome)}</p>
              <div className="mt-2 flex items-center gap-1.5">
                <div className="flex-1 h-1 rounded-full bg-[#1a1a1a] overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full transition-all"
                    style={{ width: rangeIncome > 0 ? '100%' : '0%' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Expense */}
          <div className="bg-[#111111] border border-[#1f1f1f] rounded-xl p-5 relative overflow-hidden group hover:border-red-500/20 transition-all">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/15 flex items-center justify-center">
                    <TrendingDown className="w-4 h-4 text-red-400" />
                  </div>
                  <span className="text-zinc-400 text-xs font-medium">Egresos</span>
                </div>
                <span className="text-[10px] text-zinc-600">{rangeLabels[dateRange]}</span>
              </div>
              <p className="text-white text-2xl font-bold tracking-tight">{fmt(rangeExpense)}</p>
              <div className="mt-2 flex items-center gap-1.5">
                <div className="flex-1 h-1 rounded-full bg-[#1a1a1a] overflow-hidden">
                  <div className="h-full bg-red-500 rounded-full transition-all"
                    style={{ width: rangeIncome > 0 ? `${Math.min(100, rangeExpense / rangeIncome * 100).toFixed(0)}%` : '0%' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Balance */}
          <div className={cn('border rounded-xl p-5 relative overflow-hidden',
            rangeBalance >= 0 ? 'bg-emerald-500/[0.04] border-emerald-500/20' : 'bg-red-500/[0.04] border-red-500/20'
          )}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center border',
                  rangeBalance >= 0 ? 'bg-emerald-500/10 border-emerald-500/15' : 'bg-red-500/10 border-red-500/15'
                )}>
                  <Wallet className={cn('w-4 h-4', rangeBalance >= 0 ? 'text-emerald-400' : 'text-red-400')} />
                </div>
                <span className="text-zinc-400 text-xs font-medium">Balance neto</span>
              </div>
              <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded border',
                rangeBalance >= 0 ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-red-400 bg-red-500/10 border-red-500/20'
              )}>
                {rangeBalance >= 0 ? 'Superávit' : 'Déficit'}
              </span>
            </div>
            <p className={cn('text-2xl font-bold tracking-tight', rangeBalance >= 0 ? 'text-emerald-400' : 'text-red-400')}>
              {rangeBalance >= 0 ? '' : '-'}{fmt(Math.abs(rangeBalance))}
            </p>
            {rangeIncome > 0 && (
              <p className="text-zinc-600 text-[10px] mt-1">
                Margen: {((1 - rangeExpense / rangeIncome) * 100).toFixed(1)}%
              </p>
            )}
          </div>
        </div>

        {/* ── Method breakdown pills ── */}
        {methodBreakdown.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { key: 'cash',       label: 'Efectivo',      icon: Banknote },
              { key: 'transfer',   label: 'Transferencia', icon: Building2 },
              { key: 'mercadopago',label: 'Mercado Pago',  icon: Smartphone },
              { key: 'card',       label: 'Tarjeta',       icon: CreditCard },
            ].map(({ key, label, icon: Icon }) => {
              const val = filteredTx.filter(t => t.type==='income' && t.payment_method===key).reduce((s,t) => s+t.amount, 0);
              const pct = rangeIncome > 0 ? (val / rangeIncome * 100).toFixed(0) : '0';
              return (
                <button key={key}
                  onClick={() => setMethodFilter(methodFilter === key ? 'all' : key)}
                  className={cn('bg-[#111111] border rounded-xl p-4 text-left transition-all hover:border-[#2a2a2a]',
                    methodFilter === key ? 'border-cyan-500/25 bg-cyan-500/[0.04]' : 'border-[#1f1f1f]'
                  )}>
                  <div className="flex items-center justify-between mb-2">
                    <Icon className="w-4 h-4 text-zinc-500" />
                    <span className="text-[10px] text-zinc-600">{pct}%</span>
                  </div>
                  <p className="text-white text-base font-bold">{fmtShort(val)}</p>
                  <p className="text-zinc-600 text-[10px] mt-0.5">{label}</p>
                  <div className="mt-2 h-0.5 rounded-full bg-[#1a1a1a] overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: METHOD_COLORS[key] }} />
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* ── Tabs ── */}
        <div className="flex items-center gap-1 bg-[#111111] border border-[#1f1f1f] rounded-xl p-1 w-fit">
          {([
            { key: 'overview',     label: 'Tendencias',    icon: BarChart2 },
            { key: 'transactions', label: 'Movimientos',   icon: Layers },
            { key: 'methods',      label: 'Distribución',  icon: PieChartIcon },
          ] as { key: typeof activeTab; label: string; icon: any }[]).map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                activeTab === key ? 'bg-[#1a1a1a] text-white border border-[#2a2a2a]' : 'text-zinc-500 hover:text-zinc-300'
              )}>
              <Icon className="w-3.5 h-3.5" /> {label}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW TAB ── */}
        {activeTab === 'overview' && (
          <div className="bg-[#111111] border border-[#1f1f1f] rounded-xl p-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-white font-semibold text-sm">Flujo financiero</h3>
                <p className="text-zinc-500 text-xs">Últimos 6 meses · incluye pagos de alumnos</p>
              </div>
              <div className="flex items-center gap-1 bg-[#0d0d0d] border border-[#1f1f1f] rounded-lg p-0.5">
                {([['bar', BarChart2], ['area', Activity], ['line', TrendingUp]] as [ChartView, any][]).map(([v, Icon]) => (
                  <button key={v} onClick={() => setChartView(v)}
                    className={cn('w-7 h-7 rounded-md flex items-center justify-center transition-all',
                      chartView === v ? 'bg-[#1f1f1f] text-cyan-400' : 'text-zinc-600 hover:text-zinc-400'
                    )}>
                    <Icon className="w-3.5 h-3.5" />
                  </button>
                ))}
              </div>
            </div>

            <ResponsiveContainer width="100%" height={240}>
              {chartView === 'area' ? (
                <AreaChart data={chartData} margin={{ left: 0, right: 0, top: 4, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gi" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="ge" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ef4444" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" vertical={false} />
                  <XAxis dataKey="month" tick={{ fill: '#52525b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#52525b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={fmtShort} width={48} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="ingresos" stroke="#10b981" strokeWidth={2} fill="url(#gi)" name="ingresos" dot={{ fill: '#10b981', r: 3 }} />
                  <Area type="monotone" dataKey="egresos"  stroke="#ef4444" strokeWidth={2} fill="url(#ge)" name="egresos"  dot={{ fill: '#ef4444', r: 3 }} />
                </AreaChart>
              ) : chartView === 'line' ? (
                <LineChart data={chartData} margin={{ left: 0, right: 0, top: 4, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" vertical={false} />
                  <XAxis dataKey="month" tick={{ fill: '#52525b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#52525b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={fmtShort} width={48} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="ingresos" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', r: 3 }} name="ingresos" />
                  <Line type="monotone" dataKey="egresos"  stroke="#ef4444" strokeWidth={2} dot={{ fill: '#ef4444', r: 3 }} name="egresos" />
                </LineChart>
              ) : (
                <BarChart data={chartData} barGap={4} margin={{ left: 0, right: 0, top: 4, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" vertical={false} />
                  <XAxis dataKey="month" tick={{ fill: '#52525b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#52525b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={fmtShort} width={48} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="ingresos" fill="#10b981" radius={[4,4,0,0]} name="ingresos" />
                  <Bar dataKey="egresos"  fill="#ef4444" radius={[4,4,0,0]} name="egresos" />
                </BarChart>
              )}
            </ResponsiveContainer>

            {/* Legend */}
            <div className="flex items-center gap-5 mt-4 pt-4 border-t border-[#1a1a1a]">
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /><span className="text-xs text-zinc-400">Ingresos</span></div>
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500" /><span className="text-xs text-zinc-400">Egresos</span></div>
              <div className="ml-auto flex items-center gap-4">
                {chartData.length > 0 && (() => {
                  const last = chartData[chartData.length - 1];
                  const prev = chartData[chartData.length - 2];
                  if (!prev || prev.ingresos === 0) return null;
                  const diff = ((last.ingresos - prev.ingresos) / prev.ingresos * 100).toFixed(1);
                  const up = parseFloat(diff) >= 0;
                  return (
                    <span className={cn('text-[10px] font-semibold flex items-center gap-0.5', up ? 'text-emerald-400' : 'text-red-400')}>
                      {up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      {diff}% vs mes anterior
                    </span>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        {/* ── TRANSACTIONS TAB ── */}
        {activeTab === 'transactions' && (
          <div className="bg-[#111111] border border-[#1f1f1f] rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#1a1a1a]">
              <p className="text-white text-sm font-semibold">Movimientos</p>
              <p className="text-zinc-500 text-xs">{filteredTx.length} registros</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#1a1a1a]">
                    <th className="text-left px-5 py-3 text-zinc-500 text-[10px] font-semibold uppercase tracking-wider">Descripción</th>
                    <th className="text-left px-4 py-3 text-zinc-500 text-[10px] font-semibold uppercase tracking-wider hidden md:table-cell">Categoría</th>
                    <th className="text-left px-4 py-3 text-zinc-500 text-[10px] font-semibold uppercase tracking-wider hidden lg:table-cell">Método</th>
                    <th className="text-left px-4 py-3 text-zinc-500 text-[10px] font-semibold uppercase tracking-wider hidden md:table-cell">Fecha</th>
                    <th className="text-right px-5 py-3 text-zinc-500 text-[10px] font-semibold uppercase tracking-wider">Importe</th>
                    <th className="text-right px-5 py-3 text-zinc-500 text-[10px] font-semibold uppercase tracking-wider hidden lg:table-cell">Acc.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1a1a1a]">
                  {loading ? (
                    Array.from({ length: 6 }).map((_,i) => (
                      <tr key={i}>{Array.from({ length: 6 }).map((_,j) => <td key={j} className="px-4 py-4"><div className="h-4 bg-zinc-800/60 rounded animate-pulse w-3/4" /></td>)}</tr>
                    ))
                  ) : filteredTx.length === 0 ? (
                    <tr><td colSpan={6} className="px-5 py-14 text-center">
                      <DollarSign className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                      <p className="text-zinc-500 text-sm">Sin movimientos para este período</p>
                    </td></tr>
                  ) : filteredTx.slice(0, 100).map(tx => (
                    <tr key={tx.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border',
                            tx.type === 'income'
                              ? 'bg-emerald-500/8 border-emerald-500/15'
                              : 'bg-red-500/8 border-red-500/15'
                          )}>
                            {tx.type === 'income'
                              ? <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
                              : <ArrowDownRight className="w-3.5 h-3.5 text-red-400" />
                            }
                          </div>
                          <div>
                            <p className="text-white text-sm leading-tight">{tx.description}</p>
                            {tx.notes && <p className="text-zinc-600 text-[10px] mt-0.5">{tx.notes}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 hidden md:table-cell">
                        <span className="text-zinc-400 text-xs bg-zinc-800/40 px-2 py-0.5 rounded">
                          {CATEGORY_LABELS[tx.category] || tx.category}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 hidden lg:table-cell">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full" style={{ background: METHOD_COLORS[tx.payment_method] || '#6b7280' }} />
                          <span className="text-zinc-400 text-xs">{METHOD_LABELS[tx.payment_method] || tx.payment_method}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 hidden md:table-cell">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-zinc-700" />
                          <span className="text-zinc-400 text-xs">{new Date(tx.date).toLocaleDateString('es-AR')}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <span className={cn('text-sm font-bold tabular-nums', tx.type === 'income' ? 'text-emerald-400' : 'text-red-400')}>
                          {tx.type === 'income' ? '+' : '−'}{fmt(tx.amount)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right hidden lg:table-cell">
                        {!tx.id.startsWith('pay_') && (
                          <button onClick={() => setShowDetail(tx)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-600 hover:text-white hover:bg-white/[0.08] transition-all opacity-0 group-hover:opacity-100 ml-auto">
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredTx.length > 0 && (
              <div className="border-t border-[#1a1a1a] px-5 py-3 flex items-center justify-between">
                <p className="text-zinc-600 text-xs">{filteredTx.length} movimientos · {rangeStart} — {rangeEnd || 'hoy'}</p>
                <div className="flex items-center gap-3">
                  <span className="text-emerald-400 text-xs font-medium">+{fmt(rangeIncome)}</span>
                  <span className="text-zinc-700">·</span>
                  <span className="text-red-400 text-xs font-medium">−{fmt(rangeExpense)}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── METHODS / DISTRIBUTION TAB ── */}
        {activeTab === 'methods' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Pie: income by method */}
            <div className="bg-[#111111] border border-[#1f1f1f] rounded-xl p-5">
              <div className="mb-4">
                <h3 className="text-white font-semibold text-sm">Ingresos por método</h3>
                <p className="text-zinc-500 text-xs">Distribución del período seleccionado</p>
              </div>
              {methodBreakdown.length === 0 ? (
                <div className="h-48 flex items-center justify-center text-zinc-600 text-sm">Sin datos</div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={methodBreakdown} dataKey="value" nameKey="name"
                        cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                        strokeWidth={0} paddingAngle={3}>
                        {methodBreakdown.map((e, i) => <Cell key={i} fill={e.color} />)}
                      </Pie>
                      <Tooltip content={<PieTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2 mt-2">
                    {methodBreakdown.map(({ name, value, color }) => (
                      <div key={name} className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
                        <span className="text-zinc-400 text-xs flex-1">{name}</span>
                        <span className="text-white text-xs font-semibold tabular-nums">{fmt(value * 100)}</span>
                        <span className="text-zinc-600 text-[10px] w-8 text-right">
                          {rangeIncome > 0 ? `${(value / (rangeIncome/100) * 100).toFixed(0)}%` : '—'}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Bar: by category */}
            <div className="bg-[#111111] border border-[#1f1f1f] rounded-xl p-5">
              <div className="mb-4">
                <h3 className="text-white font-semibold text-sm">Movimientos por categoría</h3>
                <p className="text-zinc-500 text-xs">Neto del período · verde = ingreso, rojo = egreso</p>
              </div>
              {categoryBreakdown.length === 0 ? (
                <div className="h-48 flex items-center justify-center text-zinc-600 text-sm">Sin datos</div>
              ) : (
                <div className="space-y-2.5 mt-1">
                  {categoryBreakdown.map(({ cat, val }) => {
                    const maxAbsVal = Math.max(...categoryBreakdown.map(c => Math.abs(c.val)));
                    const pct = maxAbsVal > 0 ? Math.abs(val) / maxAbsVal * 100 : 0;
                    const isPos = val >= 0;
                    return (
                      <div key={cat}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-zinc-400 text-xs">{cat}</span>
                          <span className={cn('text-xs font-semibold tabular-nums', isPos ? 'text-emerald-400' : 'text-red-400')}>
                            {isPos ? '+' : '−'}{fmt(Math.abs(val) * 100)}
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-[#1a1a1a] overflow-hidden">
                          <div className="h-full rounded-full transition-all"
                            style={{ width: `${pct.toFixed(0)}%`, background: isPos ? '#10b981' : '#ef4444' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {showModal && (
        <TransactionModal
          tx={editTx}
          onClose={() => { setShowModal(false); setEditTx(null); }}
          onSave={() => { setShowModal(false); setEditTx(null); fetchAll(); }}
        />
      )}

      {showDetail && (
        <TxDetailModal
          tx={showDetail}
          onClose={() => setShowDetail(null)}
          onEdit={() => { setEditTx(showDetail); setShowDetail(null); setShowModal(true); }}
          onDelete={async () => {
            await supabase.from('financial_transactions').delete().eq('id', showDetail.id);
            setShowDetail(null);
            fetchAll();
          }}
        />
      )}
    </div>
  );
}

/* ─────────────────────── detail modal ─────────────────────── */

function TxDetailModal({ tx, onClose, onEdit, onDelete }: {
  tx: Tx; onClose: () => void; onEdit: () => void; onDelete: () => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const isIncome = tx.type === 'income';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#111111] border border-[#2a2a2a] rounded-2xl w-full max-w-sm shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-[#1a1a1a]">
          <div className="flex items-center gap-2.5">
            <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center border',
              isIncome ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20'
            )}>
              {isIncome ? <ArrowUpRight className="w-4 h-4 text-emerald-400" /> : <ArrowDownRight className="w-4 h-4 text-red-400" />}
            </div>
            <div>
              <p className="text-white font-semibold text-sm leading-tight">{tx.description}</p>
              <p className="text-zinc-600 text-[10px]">{isIncome ? 'Ingreso' : 'Egreso'}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/[0.08]">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 space-y-3">
          <div className={cn('rounded-xl p-4 border text-center',
            isIncome ? 'bg-emerald-500/[0.06] border-emerald-500/15' : 'bg-red-500/[0.06] border-red-500/15'
          )}>
            <p className={cn('text-3xl font-bold', isIncome ? 'text-emerald-400' : 'text-red-400')}>
              {isIncome ? '+' : '−'}{fmt(tx.amount)}
            </p>
          </div>
          {[
            { label: 'Categoría', value: CATEGORY_LABELS[tx.category] || tx.category },
            { label: 'Método', value: METHOD_LABELS[tx.payment_method] || tx.payment_method },
            { label: 'Fecha', value: new Date(tx.date).toLocaleDateString('es-AR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) },
            ...(tx.notes ? [{ label: 'Notas', value: tx.notes }] : []),
          ].map(({ label, value }) => (
            <div key={label} className="flex items-start gap-3 py-2 border-b border-[#1a1a1a] last:border-0">
              <span className="text-zinc-600 text-xs w-20 shrink-0">{label}</span>
              <span className="text-zinc-300 text-xs">{value}</span>
            </div>
          ))}
        </div>
        <div className="flex justify-between gap-2 p-5 border-t border-[#1a1a1a]">
          {confirmDelete ? (
            <>
              <span className="text-red-400 text-xs self-center">¿Confirmar eliminación?</span>
              <div className="flex gap-2">
                <button onClick={() => setConfirmDelete(false)} className="px-3 py-2 rounded-lg border border-[#2a2a2a] text-zinc-400 text-xs hover:text-white">Cancelar</button>
                <button onClick={onDelete} className="px-3 py-2 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-semibold hover:bg-red-500/30">Eliminar</button>
              </div>
            </>
          ) : (
            <>
              <button onClick={() => setConfirmDelete(true)} className="px-3 py-2 rounded-lg border border-red-500/20 text-red-400 text-xs hover:bg-red-500/10 transition-all">Eliminar</button>
              <div className="flex gap-2">
                <button onClick={onClose} className="px-3 py-2 rounded-lg border border-[#2a2a2a] text-zinc-400 text-xs hover:text-white">Cerrar</button>
                <button onClick={onEdit} className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-white text-xs font-semibold">Editar</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────── transaction modal ─────────────────────── */

function TransactionModal({ tx, onClose, onSave }: { tx: Tx | null; onClose: () => void; onSave: () => void }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    type: tx?.type || 'income',
    category: tx?.category || 'quota',
    amount: tx ? tx.amount / 100 : 0,
    description: tx?.description || '',
    date: tx?.date || new Date().toISOString().split('T')[0],
    payment_method: tx?.payment_method || 'cash',
    notes: tx?.notes || '',
  });

  const handleSave = async () => {
    if (!form.description.trim() || form.amount <= 0) return;
    setSaving(true);
    const payload = { ...form, amount: Math.round(form.amount * 100) };
    if (tx) {
      await supabase.from('financial_transactions').update(payload as any).eq('id', tx.id);
    } else {
      await supabase.from('financial_transactions').insert(payload as any);
    }
    setSaving(false);
    onSave();
  };

  const inputClass = "w-full h-10 rounded-lg bg-[#0d0d0d] border border-[#2a2a2a] px-3 text-white text-sm focus:outline-none focus:border-cyan-500/40 transition-colors";
  const labelClass = "text-xs font-medium text-zinc-400 mb-1.5 block";
  const categories = form.type === 'income' ? CATEGORIES_INCOME : CATEGORIES_EXPENSE;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#111111] border border-[#2a2a2a] rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-[#1a1a1a]">
          <h2 className="text-white font-semibold">{tx ? 'Editar movimiento' : 'Nuevo movimiento'}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/[0.08]"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-5 space-y-4">
          {/* Type toggle */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-[#0d0d0d] rounded-xl">
            {(['income', 'expense'] as const).map(t => (
              <button key={t}
                onClick={() => setForm({ ...form, type: t, category: t === 'income' ? 'quota' : 'salary' })}
                className={cn('py-2.5 rounded-lg text-sm font-semibold transition-all',
                  form.type === t
                    ? t === 'income' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25' : 'bg-red-500/15 text-red-400 border border-red-500/25'
                    : 'text-zinc-500 hover:text-white'
                )}>
                {t === 'income' ? 'Ingreso' : 'Egreso'}
              </button>
            ))}
          </div>

          <div>
            <label className={labelClass}>Descripción *</label>
            <input className={inputClass} placeholder="Descripción del movimiento"
              value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Categoría</label>
              <select className={inputClass} value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                {categories.map(c => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Importe (ARS) *</label>
              <input type="number" min="0" className={inputClass} placeholder="0"
                value={form.amount || ''} onChange={e => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Fecha</label>
              <input type="date" className={inputClass} value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>Método de pago</label>
              <select className={inputClass} value={form.payment_method} onChange={e => setForm({ ...form, payment_method: e.target.value })}>
                {Object.entries(METHOD_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass}>Notas</label>
            <textarea rows={2} className={cn(inputClass, 'h-auto py-2.5 resize-none')} placeholder="Observaciones opcionales..."
              value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
          </div>
        </div>

        <div className="flex justify-end gap-3 p-5 border-t border-[#1a1a1a]">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border border-[#2a2a2a] text-zinc-400 text-sm hover:text-white transition-colors">Cancelar</button>
          <button onClick={handleSave} disabled={saving || !form.description.trim() || form.amount <= 0}
            className="px-5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-white text-sm font-semibold disabled:opacity-50 transition-all flex items-center gap-2">
            {saving && <div className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" />}
            {tx ? 'Guardar cambios' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}
