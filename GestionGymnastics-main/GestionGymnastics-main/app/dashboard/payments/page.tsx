'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Header from '@/components/layout/Header';
import type { Payment, Student } from '@/lib/types';
import {
  Search, Plus, X, CircleCheck as CheckCircle, CircleAlert as AlertCircle,
  Clock, DollarSign, TrendingDown, Send, Link2, Eye, FileText,
  Paperclip, ChevronLeft, ChevronRight, Banknote, CreditCard,
  Smartphone, Wallet, ArrowUpRight, Receipt,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const MONTHS_SHORT = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

const METHOD_META: Record<string, { label: string; icon: typeof Banknote; color: string }> = {
  cash:        { label: 'Efectivo',      icon: Banknote,    color: 'text-emerald-400' },
  transfer:    { label: 'Transferencia', icon: ArrowUpRight, color: 'text-blue-400' },
  mercadopago: { label: 'Mercado Pago',  icon: Smartphone,  color: 'text-sky-400' },
  card:        { label: 'Tarjeta',       icon: CreditCard,  color: 'text-cyan-400' },
  other:       { label: 'Otro',          icon: Wallet,      color: 'text-zinc-400' },
};

// Icon lookup for dynamic payment methods
const METHOD_TYPE_ICONS: Record<string, typeof Banknote> = {
  cash:        Banknote,
  transfer:    ArrowUpRight,
  mercadopago: Smartphone,
  card:        CreditCard,
  other:       Wallet,
};

type PaymentFilter = 'all' | 'paid' | 'pending' | 'overdue';

// ── Payment Detail Modal ──────────────────────────────────────────────────────
function PaymentDetailModal({ payment, onClose }: { payment: any; onClose: () => void }) {
  const formatCurrency = (cents: number) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(cents / 100);

  const method = METHOD_META[payment.method] ?? METHOD_META.other;
  const MethodIcon = method.icon;

  const statusMeta = {
    paid:    { label: 'Pagado',    class: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
    pending: { label: 'Pendiente', class: 'text-amber-400 bg-amber-500/10 border-amber-500/15' },
    overdue: { label: 'Vencido',   class: 'text-red-400 bg-red-500/10 border-red-500/20' },
    partial: { label: 'Parcial',   class: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
    cancelled: { label: 'Cancelado', class: 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20' },
    forgiven:  { label: 'Perdonado', class: 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20' },
  } as Record<string, { label: string; class: string }>;
  const sm = statusMeta[payment.status] ?? statusMeta.pending;

  const discountPct  = payment.discount_percentage  || 0;
  const surchargePct = payment.surcharge_percentage || 0;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#111111] border border-[#252525] rounded-2xl w-full max-w-md shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1a1a1a]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
              <Receipt className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-white font-semibold text-sm">Detalle de pago</h3>
              <p className="text-zinc-500 text-xs">{MONTHS[payment.month - 1]} {payment.year}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/[0.07] transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Student */}
          <div className="flex items-center gap-3 p-3 bg-[#0d0d0d] border border-[#1e1e1e] rounded-xl">
            <div className="w-9 h-9 rounded-full bg-cyan-500/10 border border-cyan-500/15 flex items-center justify-center shrink-0">
              <span className="text-cyan-400 text-xs font-bold">
                {payment.student?.first_name?.charAt(0)}{payment.student?.last_name?.charAt(0)}
              </span>
            </div>
            <div>
              <p className="text-white text-sm font-medium">{payment.student?.first_name} {payment.student?.last_name}</p>
              {payment.group && (
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: payment.group?.discipline?.color || '#06b6d4' }} />
                  <p className="text-zinc-500 text-xs">{payment.group.name}</p>
                </div>
              )}
            </div>
            <span className={cn('ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded border', sm.class)}>{sm.label}</span>
          </div>

          {/* Amount breakdown */}
          <div className="bg-[#0d0d0d] border border-[#1e1e1e] rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-[#1e1e1e] flex items-center justify-between">
              <span className="text-zinc-500 text-xs">Cuota base</span>
              <span className="text-white text-sm font-medium">{formatCurrency(payment.base_amount)}</span>
            </div>
            {payment.discount_amount > 0 && (
              <div className="px-4 py-3 border-b border-[#1e1e1e] flex items-center justify-between">
                <span className="text-emerald-400 text-xs">
                  Descuento{discountPct > 0 ? ` (${discountPct}%)` : ''}
                </span>
                <span className="text-emerald-400 text-sm font-medium">−{formatCurrency(payment.discount_amount)}</span>
              </div>
            )}
            {payment.surcharge_amount > 0 && (
              <div className="px-4 py-3 border-b border-[#1e1e1e] flex items-center justify-between">
                <span className="text-red-400 text-xs">
                  Recargo{surchargePct > 0 ? ` (${surchargePct}%)` : ''}
                </span>
                <span className="text-red-400 text-sm font-medium">+{formatCurrency(payment.surcharge_amount)}</span>
              </div>
            )}
            <div className="px-4 py-3 flex items-center justify-between bg-white/[0.02]">
              <span className="text-white text-sm font-semibold">Total</span>
              <span className="text-white text-lg font-bold">{formatCurrency(payment.final_amount)}</span>
            </div>
          </div>

          {/* Meta */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-[#0d0d0d] border border-[#1e1e1e] rounded-xl">
              <p className="text-zinc-600 text-[10px] mb-1">Método de pago</p>
              <div className="flex items-center gap-1.5">
                <MethodIcon className={cn('w-3.5 h-3.5', method.color)} />
                <span className={cn('text-xs font-medium', method.color)}>{method.label}</span>
              </div>
            </div>
            <div className="p-3 bg-[#0d0d0d] border border-[#1e1e1e] rounded-xl">
              <p className="text-zinc-600 text-[10px] mb-1">Fecha de pago</p>
              <span className="text-white text-xs font-medium">
                {payment.paid_at ? new Date(payment.paid_at).toLocaleDateString('es-AR') : '—'}
              </span>
            </div>
          </div>

          {/* Receipt */}
          {payment.receipt_url ? (
            <div className="flex items-center gap-3 p-3 bg-[#0d0d0d] border border-[#1e1e1e] rounded-xl">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                <FileText className="w-3.5 h-3.5 text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs font-medium truncate">{payment.receipt_name || 'Comprobante'}</p>
                <p className="text-zinc-600 text-[10px]">Comprobante adjunto</p>
              </div>
              <a href={payment.receipt_url} target="_blank" rel="noreferrer"
                className="flex items-center gap-1 text-cyan-400 text-xs hover:text-cyan-300 transition-colors shrink-0">
                Ver <ArrowUpRight className="w-3 h-3" />
              </a>
            </div>
          ) : (
            <div className="flex items-center gap-2 p-3 bg-[#0d0d0d] border border-[#1e1e1e] rounded-xl">
              <Paperclip className="w-3.5 h-3.5 text-zinc-700" />
              <span className="text-zinc-600 text-xs">Sin comprobante adjunto</span>
            </div>
          )}

          {payment.notes && (
            <div className="p-3 bg-[#0d0d0d] border border-[#1e1e1e] rounded-xl">
              <p className="text-zinc-500 text-[10px] mb-1">Notas</p>
              <p className="text-zinc-300 text-xs">{payment.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Payment Modal ─────────────────────────────────────────────────────────────
function PaymentModal({ students, month, year, editPayment, onClose, onSave }: {
  students: Student[];
  month: number;
  year: number;
  editPayment?: any;
  onClose: () => void;
  onSave: () => void;
}) {
  const [saving, setSaving]         = useState(false);
  const [groups, setGroups]         = useState<any[]>([]);
  const [payMethods, setPayMethods] = useState<any[]>([]);
  const [discountMode, setDiscountMode]   = useState<'amount' | 'pct'>('amount');
  const [surchargeMode, setSurchargeMode] = useState<'amount' | 'pct'>('amount');

  const [form, setForm] = useState<{
    student_id: string; group_id: string; month: number; year: number;
    base_amount: number; discount_amount: number; discount_percentage: number;
    surcharge_amount: number; surcharge_percentage: number;
    method: string; _methodId: string; status: string;
    receipt_url: string; receipt_name: string; notes: string;
  }>({
    student_id:           editPayment?.student_id   || '',
    group_id:             editPayment?.group_id     || '',
    month:                editPayment?.month        ?? month,
    year:                 editPayment?.year         ?? year,
    base_amount:          editPayment ? editPayment.base_amount / 100         : 0,
    discount_amount:      editPayment ? editPayment.discount_amount / 100     : 0,
    discount_percentage:  editPayment?.discount_percentage  || 0,
    surcharge_amount:     editPayment ? editPayment.surcharge_amount / 100    : 0,
    surcharge_percentage: editPayment?.surcharge_percentage || 0,
    method:               editPayment?.method  || 'cash',
    _methodId:            '',
    status:               editPayment?.status  || 'paid',
    receipt_url:          editPayment?.receipt_url  || '',
    receipt_name:         editPayment?.receipt_name || '',
    notes:                editPayment?.notes        || '',
  });

  useEffect(() => {
    supabase.from('payment_methods')
      .select('*').eq('is_active', true).order('sort_order')
      .then(({ data }) => { if (data) setPayMethods(data); });
  }, []);

  useEffect(() => {
    if (form.student_id) {
      supabase.from('student_groups')
        .select('*, group:groups(id, name, monthly_fee, discipline:disciplines(name, color))')
        .eq('student_id', form.student_id).eq('status', 'active')
        .then(({ data }) => { if (data) setGroups(data.map((sg: any) => sg.group).filter(Boolean)); });
    }
  }, [form.student_id]);

  useEffect(() => {
    if (form.group_id) {
      const g = groups.find(g => g?.id === form.group_id);
      if (g) setForm(f => ({ ...f, base_amount: g.monthly_fee / 100 }));
    }
  }, [form.group_id, groups]);

  // Recalculate amounts when percentage changes
  const handleDiscountPct = (pct: number) => {
    const amt = form.base_amount > 0 ? parseFloat(((form.base_amount * pct) / 100).toFixed(2)) : 0;
    setForm(f => ({ ...f, discount_percentage: pct, discount_amount: amt }));
  };
  const handleSurchargePct = (pct: number) => {
    const amt = form.base_amount > 0 ? parseFloat(((form.base_amount * pct) / 100).toFixed(2)) : 0;
    setForm(f => ({ ...f, surcharge_percentage: pct, surcharge_amount: amt }));
  };

  const finalAmount = Math.max(0, form.base_amount - form.discount_amount + form.surcharge_amount);

  const handleSave = async () => {
    if (!form.student_id) return;
    setSaving(true);
    const payload = {
      student_id:           form.student_id,
      group_id:             form.group_id || null,
      month:                form.month,
      year:                 form.year,
      base_amount:          Math.round(form.base_amount * 100),
      discount_amount:      Math.round(form.discount_amount * 100),
      discount_percentage:  form.discount_percentage,
      surcharge_amount:     Math.round(form.surcharge_amount * 100),
      surcharge_percentage: form.surcharge_percentage,
      final_amount:         Math.round(finalAmount * 100),
      method:               form.method,
      payment_method_id:    form._methodId || null,
      status:               form.status,
      receipt_url:          form.receipt_url,
      receipt_name:         form.receipt_name,
      notes:                form.notes,
      paid_at:              form.status === 'paid' ? new Date().toISOString() : null,
      due_date:             `${form.year}-${String(form.month).padStart(2, '0')}-15`,
    };
    if (editPayment) {
      await supabase.from('payments').update(payload as any).eq('id', editPayment.id);
    } else {
      await supabase.from('payments').insert(payload as any);
    }
    setSaving(false);
    onSave();
  };

  const inputClass  = "w-full h-10 rounded-lg bg-[#0d0d0d] border border-[#2a2a2a] px-3 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/10 transition-all";
  const labelClass  = "text-xs font-medium text-zinc-400 mb-1.5 block";
  const toggleClass = (active: boolean) => cn(
    'px-2.5 py-1 rounded text-xs font-medium transition-all',
    active ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/20' : 'text-zinc-500 hover:text-zinc-300'
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#111111] border border-[#252525] rounded-2xl w-full max-w-md max-h-[92vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1a1a1a]">
          <h2 className="text-white font-semibold text-sm">{editPayment ? 'Editar pago' : 'Registrar pago'}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/[0.08] transition-all"><X className="w-4 h-4" /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {/* Student */}
          <div>
            <label className={labelClass}>Alumno *</label>
            <select className={inputClass} value={form.student_id} onChange={e => setForm({ ...form, student_id: e.target.value, group_id: '' })}>
              <option value="">Seleccionar alumno</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}
            </select>
          </div>

          {groups.length > 0 && (
            <div>
              <label className={labelClass}>Grupo</label>
              <select className={inputClass} value={form.group_id} onChange={e => setForm({ ...form, group_id: e.target.value })}>
                <option value="">Sin grupo específico</option>
                {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
          )}

          {/* Period */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Mes</label>
              <select className={inputClass} value={form.month} onChange={e => setForm({ ...form, month: parseInt(e.target.value) })}>
                {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Año</label>
              <select className={inputClass} value={form.year} onChange={e => setForm({ ...form, year: parseInt(e.target.value) })}>
                {[2023, 2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>

          {/* Base amount */}
          <div>
            <label className={labelClass}>Cuota base (ARS)</label>
            <input type="number" className={inputClass} placeholder="0" value={form.base_amount || ''} onChange={e => setForm({ ...form, base_amount: parseFloat(e.target.value) || 0 })} />
          </div>

          {/* Discount */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-zinc-400">Descuento</label>
              <div className="flex items-center gap-1 bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg p-0.5">
                <button onClick={() => setDiscountMode('amount')} className={toggleClass(discountMode === 'amount')}>$</button>
                <button onClick={() => setDiscountMode('pct')} className={toggleClass(discountMode === 'pct')}>%</button>
              </div>
            </div>
            {discountMode === 'pct' ? (
              <div className="flex items-center gap-3">
                <input type="range" min={0} max={100} step={1} value={form.discount_percentage}
                  onChange={e => handleDiscountPct(parseInt(e.target.value))} className="flex-1 accent-emerald-500" />
                <span className="text-emerald-400 text-sm font-bold w-12 text-right">{form.discount_percentage}%</span>
              </div>
            ) : (
              <input type="number" className={inputClass} placeholder="0" value={form.discount_amount || ''}
                onChange={e => setForm({ ...form, discount_amount: parseFloat(e.target.value) || 0, discount_percentage: 0 })} />
            )}
            {form.discount_amount > 0 && (
              <p className="text-emerald-400 text-xs mt-1">
                −{new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(form.discount_amount)}
              </p>
            )}
          </div>

          {/* Surcharge */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-zinc-400">Recargo</label>
              <div className="flex items-center gap-1 bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg p-0.5">
                <button onClick={() => setSurchargeMode('amount')} className={toggleClass(surchargeMode === 'amount')}>$</button>
                <button onClick={() => setSurchargeMode('pct')} className={toggleClass(surchargeMode === 'pct')}>%</button>
              </div>
            </div>
            {surchargeMode === 'pct' ? (
              <div className="flex items-center gap-3">
                <input type="range" min={0} max={50} step={1} value={form.surcharge_percentage}
                  onChange={e => handleSurchargePct(parseInt(e.target.value))} className="flex-1 accent-red-500" />
                <span className="text-red-400 text-sm font-bold w-12 text-right">{form.surcharge_percentage}%</span>
              </div>
            ) : (
              <input type="number" className={inputClass} placeholder="0" value={form.surcharge_amount || ''}
                onChange={e => setForm({ ...form, surcharge_amount: parseFloat(e.target.value) || 0, surcharge_percentage: 0 })} />
            )}
            {form.surcharge_amount > 0 && (
              <p className="text-red-400 text-xs mt-1">
                +{new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(form.surcharge_amount)}
              </p>
            )}
          </div>

          {/* Total */}
          <div className="bg-cyan-500/5 border border-cyan-500/15 rounded-xl p-4 flex items-center justify-between">
            <span className="text-zinc-400 text-sm">Total a cobrar</span>
            <span className="text-cyan-400 text-2xl font-bold">
              {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(finalAmount)}
            </span>
          </div>

          {/* Method & status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Método de pago</label>
              {payMethods.length > 0 ? (
                <div className="space-y-1.5">
                  {payMethods.map(pm => {
                    const Icon = METHOD_TYPE_ICONS[pm.type] || Wallet;
                    const isSelected = form.method === pm.type && (!form._methodId || form._methodId === pm.id);
                    return (
                      <button key={pm.id} type="button"
                        onClick={() => setForm({ ...form, method: pm.type, _methodId: pm.id } as any)}
                        className={cn('w-full flex items-center gap-2.5 px-3 py-2 rounded-lg border text-left transition-all text-sm',
                          isSelected
                            ? 'bg-cyan-500/10 border-cyan-500/20 text-white'
                            : 'bg-[#0d0d0d] border-[#2a2a2a] text-zinc-400 hover:border-[#3a3a3a] hover:text-zinc-200'
                        )}>
                        <Icon className={cn('w-3.5 h-3.5 shrink-0', isSelected ? 'text-cyan-400' : 'text-zinc-600')} />
                        <div className="min-w-0">
                          <p className="text-xs font-medium leading-tight truncate">{pm.name}</p>
                          {pm.description && <p className="text-[10px] text-zinc-600 truncate">{pm.description}</p>}
                        </div>
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 ml-auto shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <select className={inputClass} value={form.method} onChange={e => setForm({ ...form, method: e.target.value })}>
                  <option value="cash">Efectivo</option>
                  <option value="transfer">Transferencia</option>
                  <option value="mercadopago">Mercado Pago</option>
                  <option value="card">Tarjeta</option>
                  <option value="other">Otro</option>
                </select>
              )}
            </div>
            <div>
              <label className={labelClass}>Estado</label>
              <select className={inputClass} value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                <option value="paid">Pagado</option>
                <option value="pending">Pendiente</option>
                <option value="overdue">Vencido</option>
                <option value="partial">Parcial</option>
              </select>
            </div>
          </div>

          {/* Receipt URL */}
          <div className="border-t border-[#1a1a1a] pt-4">
            <label className={labelClass}>Comprobante (URL de PDF o imagen)</label>
            <input className={inputClass} placeholder="https://drive.google.com/..." value={form.receipt_url} onChange={e => setForm({ ...form, receipt_url: e.target.value })} />
            {form.receipt_url && (
              <input className={cn(inputClass, 'mt-2')} placeholder="Nombre del comprobante (ej: Transferencia Banco XYZ)" value={form.receipt_name} onChange={e => setForm({ ...form, receipt_name: e.target.value })} />
            )}
          </div>

          {/* Notes */}
          <div>
            <label className={labelClass}>Notas</label>
            <textarea
              className="w-full rounded-lg bg-[#0d0d0d] border border-[#2a2a2a] px-3 py-2.5 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-cyan-500/40 resize-none"
              rows={2} placeholder="Observaciones..." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-[#1a1a1a]">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border border-[#2a2a2a] text-zinc-400 text-sm hover:text-white hover:border-[#3a3a3a] transition-all">Cancelar</button>
          <button onClick={handleSave} disabled={saving || !form.student_id} className="px-5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-white text-sm font-semibold transition-all disabled:opacity-50 flex items-center gap-2">
            {saving && <div className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" />}
            {editPayment ? 'Guardar cambios' : 'Registrar pago'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── WhatsApp message builders ─────────────────────────────────────────────────
function buildWhatsAppMsg(payment: any, type: 'reminder' | 'overdue') {
  const name = `${payment.student?.first_name} ${payment.student?.last_name}`;
  const period = `${MONTHS[payment.month - 1]} ${payment.year}`;
  const amt = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format((payment.final_amount || 0) / 100);
  if (type === 'reminder') {
    return `Hola ${payment.student?.first_name}! Te recordamos que la cuota de *${period}* por *${amt}* está próxima a vencer. Podés acercarte a abonarla cuando quieras. ¡Gracias!`;
  }
  return `Hola ${payment.student?.first_name}! Queremos informarte que tenés la cuota de *${period}* por *${amt}* vencida. Por favor regularizá tu situación a la brevedad. ¡Gracias!`;
}

function openWhatsApp(phone: string, message: string) {
  const clean = phone.replace(/\D/g, '');
  const num = clean.startsWith('54') ? clean : `54${clean}`;
  window.open(`https://wa.me/${num}?text=${encodeURIComponent(message)}`, '_blank');
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function PaymentsPage() {
  const [payments, setPayments]         = useState<any[]>([]);
  const [students, setStudents]         = useState<Student[]>([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState('');
  const [statusFilter, setStatusFilter] = useState<PaymentFilter>('all');
  const [showModal, setShowModal]       = useState(false);
  const [editPayment, setEditPayment]   = useState<any | null>(null);
  const [detailPayment, setDetailPayment] = useState<any | null>(null);
  const [monthFilter, setMonthFilter]   = useState(new Date().getMonth() + 1);
  const [yearFilter, setYearFilter]     = useState(new Date().getFullYear());

  useEffect(() => { fetchPayments(); fetchStudents(); }, [monthFilter, yearFilter]);

  const fetchPayments = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('payments')
      .select('*, student:students(id, first_name, last_name, whatsapp, phone), group:groups(name, discipline:disciplines(name, color))')
      .eq('month', monthFilter)
      .eq('year', yearFilter)
      .order('status')
      .order('created_at', { ascending: false });
    if (data) setPayments(data);
    setLoading(false);
  };

  const fetchStudents = async () => {
    const { data } = await supabase.from('students').select('id, first_name, last_name').eq('status', 'active').order('first_name');
    if (data) setStudents(data as Student[]);
  };

  const filtered = payments.filter(p => {
    const name = `${p.student?.first_name} ${p.student?.last_name}`.toLowerCase();
    return (search === '' || name.includes(search.toLowerCase())) &&
           (statusFilter === 'all' || p.status === statusFilter);
  });

  const formatCurrency = (cents: number) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(cents / 100);

  const markAsPaid = async (paymentId: string) => {
    await supabase.from('payments').update({ status: 'paid', paid_at: new Date().toISOString() }).eq('id', paymentId);
    fetchPayments();
  };

  const counts = {
    paid:    payments.filter(p => p.status === 'paid').length,
    pending: payments.filter(p => p.status === 'pending').length,
    overdue: payments.filter(p => p.status === 'overdue').length,
  };
  const summary = {
    paid:    payments.filter(p => p.status === 'paid').reduce((s, p) => s + (p.final_amount || 0), 0),
    pending: payments.filter(p => p.status === 'pending').reduce((s, p) => s + (p.final_amount || 0), 0),
    overdue: payments.filter(p => p.status === 'overdue').reduce((s, p) => s + (p.final_amount || 0), 0),
  };
  const collectionRate = payments.length > 0 ? Math.round((counts.paid / payments.length) * 100) : 0;

  const prevMonth = () => { if (monthFilter === 1) { setMonthFilter(12); setYearFilter(y => y - 1); } else setMonthFilter(m => m - 1); };
  const nextMonth = () => { if (monthFilter === 12) { setMonthFilter(1); setYearFilter(y => y + 1); } else setMonthFilter(m => m + 1); };

  const statusConfig = {
    paid:      { label: 'Pagado',    dotColor: 'bg-emerald-400', badgeClass: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
    pending:   { label: 'Pendiente', dotColor: 'bg-amber-400',   badgeClass: 'text-amber-400 bg-amber-500/10 border-amber-500/15' },
    overdue:   { label: 'Vencido',   dotColor: 'bg-red-400',     badgeClass: 'text-red-400 bg-red-500/10 border-red-500/20' },
    partial:   { label: 'Parcial',   dotColor: 'bg-blue-400',    badgeClass: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
    cancelled: { label: 'Cancelado', dotColor: 'bg-zinc-600',    badgeClass: 'text-zinc-500 bg-zinc-800 border-zinc-700' },
    forgiven:  { label: 'Perdonado', dotColor: 'bg-zinc-600',    badgeClass: 'text-zinc-500 bg-zinc-800 border-zinc-700' },
  } as Record<string, { label: string; dotColor: string; badgeClass: string }>;

  const needsAction = (p: any) => p.status === 'pending' || p.status === 'overdue';

  return (
    <div className="flex-1 flex flex-col">
      <Header title="Pagos & Morosidad" subtitle="Control de cuotas, cobros y estado de deuda" />

      <div className="flex-1 p-6 space-y-5 animate-fade-in">

        {/* Month navigator */}
        <div className="flex items-center gap-3">
          <button onClick={prevMonth} className="w-9 h-9 rounded-lg flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/[0.07] border border-[#1e1e1e] transition-all">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-3 flex-1">
            <select value={monthFilter} onChange={e => setMonthFilter(parseInt(e.target.value))}
              className="h-10 rounded-lg bg-[#111111] border border-[#1e1e1e] px-3 text-white text-sm focus:outline-none focus:border-cyan-500/40">
              {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
            <select value={yearFilter} onChange={e => setYearFilter(parseInt(e.target.value))}
              className="h-10 rounded-lg bg-[#111111] border border-[#1e1e1e] px-3 text-white text-sm focus:outline-none focus:border-cyan-500/40">
              {[2023, 2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <button onClick={nextMonth} className="w-9 h-9 rounded-lg flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/[0.07] border border-[#1e1e1e] transition-all">
            <ChevronRight className="w-4 h-4" />
          </button>
          <button onClick={() => { setEditPayment(null); setShowModal(true); }}
            className="flex items-center gap-2 h-10 px-4 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-white text-sm font-semibold transition-all ml-auto shrink-0">
            <Plus className="w-4 h-4" /> Registrar pago
          </button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { key: 'paid',    label: 'Cobrado',    icon: CheckCircle, accent: 'border-l-emerald-500', color: 'text-emerald-400', amount: summary.paid,    count: counts.paid },
            { key: 'pending', label: 'Pendiente',  icon: Clock,       accent: 'border-l-amber-500',   color: 'text-amber-400',   amount: summary.pending, count: counts.pending },
            { key: 'overdue', label: 'Vencido',    icon: AlertCircle, accent: 'border-l-red-500',     color: 'text-red-400',     amount: summary.overdue, count: counts.overdue },
          ].map(card => {
            const Icon = card.icon;
            return (
              <button key={card.key} onClick={() => setStatusFilter(statusFilter === card.key as PaymentFilter ? 'all' : card.key as PaymentFilter)}
                className={cn(
                  'bg-[#111111] border border-[#1f1f1f] rounded-xl p-5 text-left border-l-4 transition-all hover:border-[#2a2a2a]',
                  card.accent,
                  statusFilter === card.key && 'ring-1 ring-inset ring-white/[0.06]'
                )}>
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={cn('w-4 h-4', card.color)} />
                  <span className={cn('text-xs font-semibold uppercase tracking-wide', card.color)}>{card.label}</span>
                </div>
                <p className="text-white text-2xl font-bold">{card.count}</p>
                <p className={cn('text-sm font-medium', card.color)}>{formatCurrency(card.amount)}</p>
              </button>
            );
          })}
        </div>

        {/* Collection rate bar */}
        {payments.length > 0 && (
          <div className="bg-[#111111] border border-[#1f1f1f] rounded-xl px-5 py-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-zinc-400 text-xs font-medium">Índice de cobranza — {MONTHS[monthFilter - 1]} {yearFilter}</span>
                <p className="text-zinc-600 text-[10px] mt-0.5">{payments.length} cuotas totales</p>
              </div>
              <div className="text-right">
                <span className={cn('text-xl font-bold', collectionRate >= 80 ? 'text-emerald-400' : collectionRate >= 60 ? 'text-amber-400' : 'text-red-400')}>
                  {collectionRate}%
                </span>
                <p className="text-zinc-600 text-[10px]">cobrado</p>
              </div>
            </div>
            <div className="flex h-2.5 rounded-full overflow-hidden gap-px bg-zinc-900">
              {counts.paid > 0 && <div className="bg-emerald-500 transition-all rounded-l-full" style={{ width: `${(counts.paid / payments.length) * 100}%` }} />}
              {counts.pending > 0 && <div className="bg-amber-500 transition-all" style={{ width: `${(counts.pending / payments.length) * 100}%` }} />}
              {counts.overdue > 0 && <div className="bg-red-500 transition-all rounded-r-full" style={{ width: `${(counts.overdue / payments.length) * 100}%` }} />}
            </div>
            <div className="flex gap-5 mt-2.5">
              {[
                { label: `Pagado (${counts.paid})`,    color: 'bg-emerald-500' },
                { label: `Pendiente (${counts.pending})`, color: 'bg-amber-500' },
                { label: `Vencido (${counts.overdue})`,   color: 'bg-red-500' },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-1.5">
                  <span className={cn('w-2 h-2 rounded-full', item.color)} />
                  <span className="text-zinc-600 text-[10px]">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Delinquency alert */}
        {counts.overdue > 0 && (
          <div className="flex items-center gap-3 p-4 bg-red-500/5 border border-red-500/15 rounded-xl">
            <TrendingDown className="w-5 h-5 text-red-400 shrink-0" />
            <div className="flex-1">
              <p className="text-red-300 text-sm font-medium">{counts.overdue} cuota{counts.overdue !== 1 ? 's' : ''} vencida{counts.overdue !== 1 ? 's' : ''} — {formatCurrency(summary.overdue)} sin cobrar</p>
              <p className="text-red-400/60 text-xs mt-0.5">Podés enviar recordatorios directamente desde la tabla</p>
            </div>
            <button onClick={() => setStatusFilter('overdue')} className="text-red-400 text-xs font-medium hover:text-red-300 transition-colors shrink-0">
              Ver vencidos →
            </button>
          </div>
        )}

        {/* Search & filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
            <input type="text" placeholder="Buscar alumno..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full h-10 pl-9 pr-4 rounded-lg bg-[#0f0f0f] border border-[#1e1e1e] text-white text-sm placeholder:text-zinc-700 focus:outline-none focus:border-cyan-500/40 transition-all" />
            {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"><X className="w-3.5 h-3.5" /></button>}
          </div>
          <div className="flex items-center gap-1.5 bg-[#111111] border border-[#1e1e1e] rounded-lg px-1.5 py-1.5 shrink-0">
            {(['all', 'paid', 'pending', 'overdue'] as PaymentFilter[]).map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={cn('px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                  statusFilter === s ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/15' : 'text-zinc-500 hover:text-white'
                )}>
                {s === 'all' ? 'Todos' : s === 'paid' ? 'Pagados' : s === 'pending' ? 'Pendientes' : 'Vencidos'}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-[#111111] border border-[#1f1f1f] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1a1a1a]">
                  <th className="text-left px-5 py-3.5 text-zinc-500 text-xs font-semibold uppercase tracking-wider">Alumno</th>
                  <th className="text-left px-4 py-3.5 text-zinc-500 text-xs font-semibold uppercase tracking-wider hidden md:table-cell">Grupo</th>
                  <th className="text-left px-4 py-3.5 text-zinc-500 text-xs font-semibold uppercase tracking-wider">Importe</th>
                  <th className="text-left px-4 py-3.5 text-zinc-500 text-xs font-semibold uppercase tracking-wider">Estado</th>
                  <th className="text-left px-4 py-3.5 text-zinc-500 text-xs font-semibold uppercase tracking-wider hidden lg:table-cell">Método / Fecha</th>
                  <th className="text-right px-5 py-3.5 text-zinc-500 text-xs font-semibold uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#161616]">
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i}>{Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-4 py-4"><div className="h-4 bg-zinc-800/60 rounded animate-pulse w-3/4" /></td>
                    ))}</tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-14 text-center">
                      <DollarSign className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                      <p className="text-zinc-500 text-sm">No hay pagos para este período</p>
                      <button onClick={() => setShowModal(true)} className="mt-2 text-cyan-400 text-xs font-medium hover:text-cyan-300 transition-colors">
                        Registrar pago →
                      </button>
                    </td>
                  </tr>
                ) : filtered.map(payment => {
                  const sc = statusConfig[payment.status] ?? statusConfig.pending;
                  const method = METHOD_META[payment.method] ?? METHOD_META.other;
                  const MethodIcon = method.icon;
                  const phone = payment.student?.whatsapp || payment.student?.phone;
                  const isActionable = needsAction(payment);

                  return (
                    <tr key={payment.id} className={cn(
                      'transition-colors group',
                      payment.status === 'overdue' ? 'hover:bg-red-500/[0.03]' : 'hover:bg-white/[0.02]'
                    )}>
                      {/* Student */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className={cn('w-1.5 h-8 rounded-full shrink-0', sc.dotColor)} />
                          <div>
                            <p className="text-white text-sm font-medium">{payment.student?.first_name} {payment.student?.last_name}</p>
                            {phone && <p className="text-zinc-600 text-xs">{phone}</p>}
                          </div>
                        </div>
                      </td>

                      {/* Group */}
                      <td className="px-4 py-3.5 hidden md:table-cell">
                        {payment.group ? (
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: (payment.group as any)?.discipline?.color || '#06b6d4' }} />
                            <span className="text-zinc-400 text-xs">{payment.group.name}</span>
                          </div>
                        ) : <span className="text-zinc-700 text-xs">—</span>}
                      </td>

                      {/* Amount */}
                      <td className="px-4 py-3.5">
                        <p className="text-white text-sm font-semibold">{formatCurrency(payment.final_amount || 0)}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {payment.discount_amount > 0 && (
                            <span className="text-emerald-400 text-[10px]">
                              −{payment.discount_percentage > 0 ? `${payment.discount_percentage}%` : formatCurrency(payment.discount_amount)}
                            </span>
                          )}
                          {payment.surcharge_amount > 0 && (
                            <span className="text-red-400 text-[10px]">
                              +{payment.surcharge_percentage > 0 ? `${payment.surcharge_percentage}%` : formatCurrency(payment.surcharge_amount)}
                            </span>
                          )}
                          {payment.receipt_url && <span title="Tiene comprobante"><Paperclip className="w-3 h-3 text-zinc-600" /></span>}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        <span className={cn('text-[10px] font-semibold px-2 py-1 rounded-full border', sc.badgeClass)}>
                          {sc.label}
                        </span>
                      </td>

                      {/* Method / Date */}
                      <td className="px-4 py-3.5 hidden lg:table-cell">
                        <div className="flex items-center gap-1.5">
                          <MethodIcon className={cn('w-3 h-3', method.color)} />
                          <span className="text-zinc-400 text-xs">{method.label}</span>
                        </div>
                        <p className="text-zinc-600 text-[10px] mt-0.5">
                          {payment.paid_at ? new Date(payment.paid_at).toLocaleDateString('es-AR') : payment.due_date ? `Vence ${new Date(payment.due_date).toLocaleDateString('es-AR')}` : '—'}
                        </p>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          {/* View detail — always */}
                          <button onClick={() => setDetailPayment(payment)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-600 hover:text-white hover:bg-white/[0.08] transition-all opacity-0 group-hover:opacity-100"
                            title="Ver detalle">
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* WhatsApp — only actionable */}
                          {isActionable && phone && (
                            <button
                              onClick={() => openWhatsApp(phone, buildWhatsAppMsg(payment, payment.status === 'overdue' ? 'overdue' : 'reminder'))}
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-600 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all opacity-0 group-hover:opacity-100"
                              title="Enviar recordatorio WhatsApp">
                              <Send className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Copy payment link — only actionable */}
                          {isActionable && (
                            <button
                              onClick={() => {
                                const link = `${window.location.origin}/pago/${payment.id}`;
                                navigator.clipboard.writeText(link).then(() => alert('Link copiado al portapapeles'));
                              }}
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-600 hover:text-cyan-400 hover:bg-cyan-500/10 transition-all opacity-0 group-hover:opacity-100"
                              title="Copiar link de pago">
                              <Link2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Mark as paid */}
                          {payment.status !== 'paid' && (
                            <button onClick={() => markAsPaid(payment.id)}
                              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium hover:bg-emerald-500/20 transition-all opacity-0 group-hover:opacity-100"
                              title="Marcar como pagado">
                              <CheckCircle className="w-3 h-3" /> Cobrar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filtered.length > 0 && (
            <div className="border-t border-[#1a1a1a] px-5 py-3 flex items-center justify-between">
              <p className="text-zinc-600 text-xs">{filtered.length} de {payments.length} registros</p>
              <p className="text-zinc-600 text-xs">{MONTHS[monthFilter - 1]} {yearFilter}</p>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <PaymentModal
          students={students} month={monthFilter} year={yearFilter}
          editPayment={editPayment}
          onClose={() => { setShowModal(false); setEditPayment(null); }}
          onSave={() => { setShowModal(false); setEditPayment(null); fetchPayments(); }}
        />
      )}

      {detailPayment && (
        <PaymentDetailModal
          payment={detailPayment}
          onClose={() => setDetailPayment(null)}
        />
      )}
    </div>
  );
}
