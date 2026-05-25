'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Header from '@/components/layout/Header';
import { useAuth } from '@/lib/auth-context';
import {
  Building2, Plus, Pencil, Power, Trash2, X, Check,
  User, ShieldCheck, Palette, CreditCard,
  CircleCheck as CheckCircle2, CircleX,
  Banknote, Smartphone, ArrowUpRight, Wallet,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/* ─── constants ─── */

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin', admin: 'Administración', teacher: 'Profesor', reception: 'Recepción',
};
const ROLE_COLORS: Record<string, string> = {
  super_admin: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  admin:       'text-blue-400 bg-blue-500/10 border-blue-500/20',
  teacher:     'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  reception:   'text-zinc-400 bg-zinc-500/10 border-zinc-500/15',
};

const PRESET_COLORS = [
  '#ef4444','#f97316','#f59e0b','#84cc16','#10b981',
  '#06b6d4','#3b82f6','#8b5cf6','#ec4899','#6b7280',
];

const METHOD_TYPES = [
  { key: 'cash',        label: 'Efectivo' },
  { key: 'transfer',    label: 'Transferencia' },
  { key: 'card',        label: 'Tarjeta' },
  { key: 'mercadopago', label: 'Mercado Pago' },
  { key: 'other',       label: 'Otro' },
];

const METHOD_ICONS: Record<string, React.ElementType> = {
  cash:        Banknote,
  transfer:    ArrowUpRight,
  card:        CreditCard,
  mercadopago: Smartphone,
  other:       Wallet,
};

const METHOD_COLORS: Record<string, string> = {
  cash:        '#10b981',
  transfer:    '#06b6d4',
  card:        '#f59e0b',
  mercadopago: '#3b82f6',
  other:       '#6b7280',
};

const TABS = [
  { key: 'profile',     label: 'Mi perfil',          icon: User },
  { key: 'disciplines', label: 'Disciplinas',         icon: Palette },
  { key: 'methods',     label: 'Métodos de pago',     icon: CreditCard },
  { key: 'users',       label: 'Usuarios',            icon: ShieldCheck },
  { key: 'sede',        label: 'Sede',                icon: Building2 },
];

const inputClass  = "w-full h-10 rounded-lg bg-[#0d0d0d] border border-[#252525] px-3 text-white text-sm focus:outline-none focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/10 transition-all placeholder:text-zinc-700";
const labelClass  = "text-[10px] font-semibold text-zinc-500 mb-1.5 block uppercase tracking-wider";
const sectionCard = "bg-[#111111] border border-[#1f1f1f] rounded-xl overflow-hidden";

/* ─── modal wrapper ─── */

function Modal({ title, onClose, children, maxW = 'max-w-md' }: {
  title: string; onClose: () => void; children: React.ReactNode; maxW?: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />
      <div className={cn('relative bg-[#111111] border border-[#2a2a2a] rounded-2xl w-full shadow-2xl', maxW)}>
        <div className="flex items-center justify-between p-5 border-b border-[#1a1a1a]">
          <h2 className="text-white font-semibold text-sm">{title}</h2>
          <button onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/[0.08] transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ─── status badge ─── */

function StatusBadge({ active, onToggle }: { active: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle}
      className={cn('flex items-center gap-1.5 text-[10px] font-semibold px-2 py-1 rounded-lg border transition-all',
        active
          ? 'text-emerald-400 bg-emerald-500/8 border-emerald-500/15 hover:bg-red-500/8 hover:text-red-400 hover:border-red-500/15'
          : 'text-zinc-500 bg-zinc-800/30 border-zinc-700/30 hover:bg-emerald-500/8 hover:text-emerald-400 hover:border-emerald-500/15'
      )}>
      <Power className="w-3 h-3" />
      {active ? 'Activo' : 'Inactivo'}
    </button>
  );
}

/* ═══════════════════════════════════
   DISCIPLINE MODAL
═══════════════════════════════════ */

function DisciplineModal({ disc, onClose, onSave }: {
  disc: any | null; onClose: () => void; onSave: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name:        disc?.name        || '',
    description: disc?.description || '',
    color:       disc?.color       || '#06b6d4',
    is_active:   disc?.is_active   ?? true,
    sort_order:  disc?.sort_order  ?? 0,
  });

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    if (disc) {
      await supabase.from('disciplines').update(form as any).eq('id', disc.id);
    } else {
      await supabase.from('disciplines').insert(form as any);
    }
    setSaving(false);
    onSave();
  };

  return (
    <Modal title={disc ? 'Editar disciplina' : 'Nueva disciplina'} onClose={onClose}>
      <div className="p-5 space-y-4">
        <div>
          <label className={labelClass}>Nombre *</label>
          <input className={inputClass} placeholder="Ej: Gimnasia Artística"
            value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <label className={labelClass}>Descripción</label>
          <input className={inputClass} placeholder="Descripción breve..."
            value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Color</label>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input type="color" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })}
                  className="w-10 h-10 rounded-lg border border-[#252525] bg-[#0d0d0d] cursor-pointer p-1" />
                <input className={cn(inputClass, 'font-mono text-xs')} value={form.color}
                  onChange={e => setForm({ ...form, color: e.target.value })} />
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {PRESET_COLORS.map(c => (
                  <button key={c} onClick={() => setForm({ ...form, color: c })}
                    className={cn('w-5 h-5 rounded-full border-2 transition-all', form.color === c ? 'border-white scale-110' : 'border-transparent hover:scale-105')}
                    style={{ background: c }} />
                ))}
              </div>
            </div>
          </div>
          <div>
            <label className={labelClass}>Orden</label>
            <input type="number" min="0" className={inputClass} value={form.sort_order}
              onChange={e => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })} />
            <div className="mt-3">
              <label className={labelClass}>Estado</label>
              <button onClick={() => setForm({ ...form, is_active: !form.is_active })}
                className={cn('w-full h-9 flex items-center gap-2 px-3 rounded-lg border text-sm font-medium transition-all',
                  form.is_active ? 'bg-emerald-500/8 border-emerald-500/15 text-emerald-400' : 'bg-zinc-800/30 border-zinc-700/30 text-zinc-500'
                )}>
                <Power className="w-3.5 h-3.5" />
                {form.is_active ? 'Activa' : 'Inactiva'}
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-3 p-5 border-t border-[#1a1a1a]">
        <button onClick={onClose} className="px-4 py-2 rounded-lg border border-[#2a2a2a] text-zinc-400 text-sm hover:text-white transition-colors">Cancelar</button>
        <button onClick={handleSave} disabled={saving || !form.name.trim()}
          className="px-5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-white text-sm font-semibold disabled:opacity-50 flex items-center gap-2 transition-all">
          {saving && <div className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" />}
          {disc ? 'Guardar cambios' : 'Crear disciplina'}
        </button>
      </div>
    </Modal>
  );
}

/* ═══════════════════════════════════
   PAYMENT METHOD MODAL
═══════════════════════════════════ */

function PaymentMethodModal({ method, onClose, onSave }: {
  method: any | null; onClose: () => void; onSave: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name:        method?.name        || '',
    description: method?.description || '',
    type:        method?.type        || 'cash',
    is_active:   method?.is_active   ?? true,
    sort_order:  method?.sort_order  ?? 0,
  });

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    if (method) {
      await supabase.from('payment_methods').update(form as any).eq('id', method.id);
    } else {
      await supabase.from('payment_methods').insert(form as any);
    }
    setSaving(false);
    onSave();
  };

  const TypeIcon = METHOD_ICONS[form.type] || Wallet;

  return (
    <Modal title={method ? 'Editar método de pago' : 'Nuevo método de pago'} onClose={onClose}>
      <div className="p-5 space-y-4">
        {/* Type picker */}
        <div>
          <label className={labelClass}>Tipo de método *</label>
          <div className="grid grid-cols-3 gap-2">
            {METHOD_TYPES.map(({ key, label }) => {
              const Icon = METHOD_ICONS[key] || Wallet;
              const color = METHOD_COLORS[key];
              const active = form.type === key;
              return (
                <button key={key} onClick={() => setForm({ ...form, type: key })}
                  className={cn('flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition-all',
                    active ? 'border-[color] bg-[color]/10 text-white' : 'border-[#252525] text-zinc-600 hover:border-[#333] hover:text-zinc-400'
                  )}
                  style={active ? { borderColor: `${color}40`, background: `${color}12`, color } : {}}>
                  <Icon className="w-4 h-4" />
                  <span className="text-[10px] font-semibold leading-tight">{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className={labelClass}>Nombre visible *</label>
          <div className="relative">
            <TypeIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
            <input className={cn(inputClass, 'pl-9')} placeholder="Ej: Transferencia Bancaria"
              value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>
        </div>

        <div>
          <label className={labelClass}>Detalle / instrucciones</label>
          <textarea rows={2}
            className="w-full rounded-lg bg-[#0d0d0d] border border-[#252525] px-3 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500/40 resize-none placeholder:text-zinc-700 transition-all"
            placeholder="Ej: CBU 0000000000, alias: club.pago, o instrucciones para el alumno..."
            value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Orden de aparición</label>
            <input type="number" min="0" className={inputClass} value={form.sort_order}
              onChange={e => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })} />
          </div>
          <div>
            <label className={labelClass}>Estado</label>
            <button onClick={() => setForm({ ...form, is_active: !form.is_active })}
              className={cn('w-full h-10 flex items-center gap-2 px-3 rounded-lg border text-sm font-medium transition-all',
                form.is_active ? 'bg-emerald-500/8 border-emerald-500/15 text-emerald-400' : 'bg-zinc-800/30 border-zinc-700/30 text-zinc-500'
              )}>
              <Power className="w-3.5 h-3.5" />
              {form.is_active ? 'Activo' : 'Inactivo'}
            </button>
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-3 p-5 border-t border-[#1a1a1a]">
        <button onClick={onClose} className="px-4 py-2 rounded-lg border border-[#2a2a2a] text-zinc-400 text-sm hover:text-white transition-colors">Cancelar</button>
        <button onClick={handleSave} disabled={saving || !form.name.trim()}
          className="px-5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-white text-sm font-semibold disabled:opacity-50 flex items-center gap-2 transition-all">
          {saving && <div className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" />}
          {method ? 'Guardar cambios' : 'Crear método'}
        </button>
      </div>
    </Modal>
  );
}

/* ═══════════════════════════════════
   USER MODAL
═══════════════════════════════════ */

function UserModal({ user, onClose, onSave }: {
  user: any; onClose: () => void; onSave: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    full_name: user?.full_name || '',
    email:     user?.email     || '',
    phone:     user?.phone     || '',
    role:      user?.role      || 'reception',
    is_active: user?.is_active ?? true,
  });

  const handleSave = async () => {
    if (!form.full_name.trim()) return;
    setSaving(true);
    await supabase.from('profiles').update(form as any).eq('id', user.id);
    setSaving(false);
    onSave();
  };

  const PERMS: Record<string, string[]> = {
    super_admin: ['Acceso total al sistema','Gestión de usuarios y roles','Configuración de sede','Eliminación de registros','Exportar reportes'],
    admin:       ['Gestión de alumnos y pagos','Gestión de grupos y empleados','Ver estadísticas y finanzas','Exportar reportes'],
    teacher:     ['Ver alumnos de sus grupos','Registrar asistencia','Ver su calendario'],
    reception:   ['Registrar pagos','Ver alumnos','Ver grupos y horarios'],
  };

  return (
    <Modal title="Editar usuario" onClose={onClose}>
      <div className="p-5 space-y-4">
        <div>
          <label className={labelClass}>Nombre completo *</label>
          <input className={inputClass} placeholder="Nombre y apellido"
            value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Email</label>
            <input type="email" className={inputClass} placeholder="email@ejemplo.com"
              value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <label className={labelClass}>Teléfono</label>
            <input className={inputClass} placeholder="+54 11 ..."
              value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Rol</label>
            <select className={inputClass} value={form.role}
              onChange={e => setForm({ ...form, role: e.target.value })}>
              {Object.entries(ROLE_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Estado</label>
            <button onClick={() => setForm({ ...form, is_active: !form.is_active })}
              className={cn('w-full h-10 flex items-center gap-2 px-3 rounded-lg border text-sm font-medium transition-all',
                form.is_active ? 'bg-emerald-500/8 border-emerald-500/15 text-emerald-400' : 'bg-zinc-800/30 border-zinc-700/30 text-zinc-500'
              )}>
              <Power className="w-3.5 h-3.5" />
              {form.is_active ? 'Activo' : 'Inactivo'}
            </button>
          </div>
        </div>
        <div>
          <label className={labelClass}>Permisos del rol</label>
          <div className="bg-[#0d0d0d] border border-[#252525] rounded-xl p-3 space-y-1.5">
            {(PERMS[form.role] || []).map(p => (
              <div key={p} className="flex items-center gap-2">
                <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                <span className="text-zinc-400 text-xs">{p}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-3 p-5 border-t border-[#1a1a1a]">
        <button onClick={onClose} className="px-4 py-2 rounded-lg border border-[#2a2a2a] text-zinc-400 text-sm hover:text-white transition-colors">Cancelar</button>
        <button onClick={handleSave} disabled={saving || !form.full_name.trim()}
          className="px-5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-white text-sm font-semibold disabled:opacity-50 flex items-center gap-2 transition-all">
          {saving && <div className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" />}
          Guardar cambios
        </button>
      </div>
    </Modal>
  );
}

/* ═══════════════════════════════════
   MAIN PAGE
═══════════════════════════════════ */

export default function SettingsPage() {
  const { profile, refreshProfile } = useAuth();
  const [activeTab, setActiveTab]   = useState('profile');

  const [disciplines,  setDisciplines]  = useState<any[]>([]);
  const [payMethods,   setPayMethods]   = useState<any[]>([]);
  const [users,        setUsers]        = useState<any[]>([]);

  const [discModal,    setDiscModal]    = useState<any>(null);
  const [methodModal,  setMethodModal]  = useState<any>(null);
  const [userModal,    setUserModal]    = useState<any>(null);
  // null = closed, string id = show confirm
  const [deleteMethod,    setDeleteMethod]    = useState<string | null>(null);
  const [deleting,        setDeleting]        = useState(false);
  const [togglingMethod,  setTogglingMethod]  = useState<string | null>(null);
  const [methodError,     setMethodError]     = useState('');

  const [profileForm, setProfileForm] = useState({
    full_name: profile?.full_name || '',
    email:     profile?.email     || '',
    phone:     profile?.phone     || '',
  });
  const [saving,  setSaving]  = useState(false);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (profile) setProfileForm({ full_name: profile.full_name, email: profile.email || '', phone: profile.phone || '' });
    fetchAll();
  }, [profile]);

  const fetchAll = async () => {
    // Fetch payment methods with usage count (join by type string, since payments.method stores the type key)
    const [d, m, u, payCounts] = await Promise.all([
      supabase.from('disciplines').select('*').order('sort_order'),
      supabase.from('payment_methods').select('*').order('sort_order'),
      supabase.from('profiles').select('*').order('full_name'),
      supabase.from('payments').select('method'),
    ]);
    if (d.data) setDisciplines(d.data);
    if (u.data) setUsers(u.data);
    if (m.data) {
      // Annotate each method with how many payments used it (matched by type)
      const counts: Record<string, number> = {};
      (payCounts.data || []).forEach((p: any) => {
        counts[p.method] = (counts[p.method] || 0) + 1;
      });
      setPayMethods(m.data.map((pm: any) => ({ ...pm, paymentCount: counts[pm.type] || 0 })));
    }
  };

  const saveProfile = async () => {
    setSaving(true);
    await supabase.from('profiles').update(profileForm as any).eq('id', profile!.id);
    await refreshProfile();
    setSaving(false);
    setSuccess('Perfil actualizado correctamente');
    setTimeout(() => setSuccess(''), 3000);
  };

  const toggleDisc = async (id: string, v: boolean) => {
    await supabase.from('disciplines').update({ is_active: !v } as any).eq('id', id);
    fetchAll();
  };

  const toggleMethod = async (id: string, currentActive: boolean) => {
    setTogglingMethod(id);
    setMethodError('');
    // Optimistic update
    setPayMethods(prev => prev.map(m => m.id === id ? { ...m, is_active: !currentActive } : m));
    const { error } = await supabase
      .from('payment_methods')
      .update({ is_active: !currentActive } as any)
      .eq('id', id);
    if (error) {
      // Revert on error
      setPayMethods(prev => prev.map(m => m.id === id ? { ...m, is_active: currentActive } : m));
      setMethodError('No se pudo actualizar el estado. Verificá tus permisos.');
      setTimeout(() => setMethodError(''), 4000);
    }
    setTogglingMethod(null);
  };

  const toggleUser = async (id: string, v: boolean) => {
    await supabase.from('profiles').update({ is_active: !v } as any).eq('id', id);
    fetchAll();
  };

  const deleteMethodConfirm = async () => {
    if (!deleteMethod) return;
    const target = payMethods.find(m => m.id === deleteMethod);
    setDeleting(true);
    if (target && target.paymentCount > 0) {
      // Has historical payments — deactivate only, never delete
      const { error } = await supabase
        .from('payment_methods')
        .update({ is_active: false } as any)
        .eq('id', deleteMethod);
      if (!error) {
        setPayMethods(prev => prev.map(m => m.id === deleteMethod ? { ...m, is_active: false } : m));
        setSuccess('El método tiene pagos registrados y fue desactivado en lugar de eliminado.');
        setTimeout(() => setSuccess(''), 4000);
      }
    } else {
      await supabase.from('payment_methods').delete().eq('id', deleteMethod);
      setPayMethods(prev => prev.filter(m => m.id !== deleteMethod));
    }
    setDeleteMethod(null);
    setDeleting(false);
  };

  const activeMethods = payMethods.filter(m => m.is_active).length;
  const activeDiscs   = disciplines.filter(d => d.is_active).length;
  const activeUsers   = users.filter(u => u.is_active).length;

  return (
    <div className="flex-1 flex flex-col">
      <Header title="Configuración" subtitle="Gestión del sistema, disciplinas, métodos de pago y usuarios" />

      <div className="flex-1 p-6 animate-fade-in">
        <div className="max-w-4xl mx-auto space-y-5">

          {/* Tab nav */}
          <div className="flex items-center gap-1 bg-[#111111] border border-[#1f1f1f] rounded-xl p-1 overflow-x-auto">
            {TABS.map(({ key, label, icon: Icon }) => (
              <button key={key} onClick={() => setActiveTab(key)}
                className={cn('flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap',
                  activeTab === key ? 'bg-[#1a1a1a] text-white border border-[#2a2a2a]' : 'text-zinc-500 hover:text-zinc-300'
                )}>
                <Icon className="w-3.5 h-3.5" /> {label}
              </button>
            ))}
          </div>

          {success && (
            <div className="flex items-center gap-2.5 bg-emerald-500/8 border border-emerald-500/20 rounded-xl px-4 py-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-emerald-400 text-sm">{success}</span>
            </div>
          )}

          {/* ══ PROFILE ══ */}
          {activeTab === 'profile' && (
            <div className={sectionCard}>
              <div className="p-5 border-b border-[#1a1a1a]">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
                    <span className="text-cyan-400 text-xl font-bold">{profile?.full_name?.charAt(0)?.toUpperCase()}</span>
                  </div>
                  <div>
                    <p className="text-white font-semibold">{profile?.full_name}</p>
                    <p className="text-zinc-600 text-xs mt-0.5">{profile?.email}</p>
                    <span className={cn('inline-flex text-[10px] font-semibold mt-1.5 px-2 py-0.5 rounded-lg border', ROLE_COLORS[profile?.role || 'reception'])}>
                      {ROLE_LABELS[profile?.role || 'reception']}
                    </span>
                  </div>
                </div>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className={labelClass}>Nombre completo</label>
                  <input className={inputClass} value={profileForm.full_name}
                    onChange={e => setProfileForm({ ...profileForm, full_name: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Email</label>
                    <input type="email" className={inputClass} value={profileForm.email}
                      onChange={e => setProfileForm({ ...profileForm, email: e.target.value })} />
                  </div>
                  <div>
                    <label className={labelClass}>Teléfono</label>
                    <input className={inputClass} value={profileForm.phone}
                      onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })} />
                  </div>
                </div>
                <button onClick={saveProfile} disabled={saving}
                  className="px-5 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-white text-sm font-semibold disabled:opacity-50 flex items-center gap-2 transition-all">
                  {saving ? <div className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  Guardar cambios
                </button>
              </div>
            </div>
          )}

          {/* ══ DISCIPLINES ══ */}
          {activeTab === 'disciplines' && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Total', value: disciplines.length, color: 'text-zinc-300' },
                  { label: 'Activas', value: activeDiscs, color: 'text-emerald-400' },
                  { label: 'Inactivas', value: disciplines.length - activeDiscs, color: 'text-zinc-600' },
                ].map(s => (
                  <div key={s.label} className="bg-[#111111] border border-[#1f1f1f] rounded-xl p-4 text-center">
                    <p className={cn('text-2xl font-bold', s.color)}>{s.value}</p>
                    <p className="text-zinc-600 text-[10px] mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
              <div className={sectionCard}>
                <div className="flex items-center justify-between p-5 border-b border-[#1a1a1a]">
                  <div>
                    <h3 className="text-white font-semibold text-sm">Disciplinas</h3>
                    <p className="text-zinc-600 text-xs">Modalidades ofrecidas por la institución</p>
                  </div>
                  <button onClick={() => setDiscModal(false)}
                    className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-white text-xs font-semibold transition-all">
                    <Plus className="w-3.5 h-3.5" /> Nueva
                  </button>
                </div>
                <div className="divide-y divide-[#1a1a1a]">
                  {disciplines.length === 0 ? (
                    <div className="px-5 py-10 text-center">
                      <Palette className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                      <p className="text-zinc-500 text-sm">No hay disciplinas configuradas</p>
                      <button onClick={() => setDiscModal(false)} className="mt-2 text-cyan-400 text-xs hover:text-cyan-300">Crear la primera →</button>
                    </div>
                  ) : disciplines.map(disc => (
                    <div key={disc.id} className="flex items-center justify-between px-5 py-4 hover:bg-white/[0.02] transition-colors group">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl border flex items-center justify-center shrink-0"
                          style={{ background: `${disc.color}15`, borderColor: `${disc.color}30` }}>
                          <span className="w-3 h-3 rounded-full" style={{ background: disc.color }} />
                        </div>
                        <div>
                          <p className={cn('text-sm font-medium', disc.is_active ? 'text-white' : 'text-zinc-500')}>{disc.name}</p>
                          {disc.description && <p className="text-zinc-600 text-xs">{disc.description}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <StatusBadge active={disc.is_active} onToggle={() => toggleDisc(disc.id, disc.is_active)} />
                        <button onClick={() => setDiscModal(disc)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-500 hover:text-cyan-400 hover:bg-cyan-500/10 transition-all">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ══ PAYMENT METHODS ══ */}
          {activeTab === 'methods' && (
            <div className="space-y-4">
              {/* Error banner */}
              {methodError && (
                <div className="flex items-center gap-2.5 bg-red-500/8 border border-red-500/20 rounded-xl px-4 py-3">
                  <CircleX className="w-4 h-4 text-red-400 shrink-0" />
                  <span className="text-red-400 text-sm">{methodError}</span>
                </div>
              )}

              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Total',     value: payMethods.length,                 color: 'text-zinc-300' },
                  { label: 'Activos',   value: activeMethods,                     color: 'text-emerald-400' },
                  { label: 'Inactivos', value: payMethods.length - activeMethods, color: 'text-zinc-600' },
                ].map(s => (
                  <div key={s.label} className="bg-[#111111] border border-[#1f1f1f] rounded-xl p-4 text-center">
                    <p className={cn('text-2xl font-bold', s.color)}>{s.value}</p>
                    <p className="text-zinc-600 text-[10px] mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>

              <div className={sectionCard}>
                <div className="flex items-center justify-between p-5 border-b border-[#1a1a1a]">
                  <div>
                    <h3 className="text-white font-semibold text-sm">Métodos de pago</h3>
                    <p className="text-zinc-600 text-xs">Formas de cobro disponibles al registrar pagos</p>
                  </div>
                  <button onClick={() => setMethodModal(false)}
                    className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-white text-xs font-semibold transition-all">
                    <Plus className="w-3.5 h-3.5" /> Nuevo método
                  </button>
                </div>

                <div className="divide-y divide-[#1a1a1a]">
                  {payMethods.length === 0 ? (
                    <div className="px-5 py-10 text-center">
                      <CreditCard className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                      <p className="text-zinc-500 text-sm">No hay métodos configurados</p>
                      <button onClick={() => setMethodModal(false)} className="mt-2 text-cyan-400 text-xs hover:text-cyan-300">Crear el primero →</button>
                    </div>
                  ) : payMethods.map(m => {
                    const Icon       = METHOD_ICONS[m.type] || Wallet;
                    const color      = METHOD_COLORS[m.type] || '#6b7280';
                    const isToggling = togglingMethod === m.id;
                    const inUse      = (m.paymentCount || 0) > 0;

                    return (
                      <div key={m.id} className={cn(
                        'flex items-center justify-between px-5 py-4 transition-all group',
                        m.is_active ? 'hover:bg-white/[0.02]' : 'opacity-60'
                      )}>
                        {/* Left: icon + info */}
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 transition-all"
                            style={m.is_active
                              ? { background: `${color}18`, borderColor: `${color}35` }
                              : { background: '#1a1a1a', borderColor: '#252525' }}>
                            <Icon className="w-4.5 h-4.5" style={{ color: m.is_active ? color : '#4b4b4b' }} />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className={cn('text-sm font-semibold leading-tight', m.is_active ? 'text-white' : 'text-zinc-600')}>
                                {m.name}
                              </p>
                              <span className="text-[10px] px-1.5 py-0.5 rounded-md border text-zinc-500 border-zinc-700/25 bg-zinc-800/30 shrink-0">
                                {METHOD_TYPES.find(t => t.key === m.type)?.label || m.type}
                              </span>
                              {inUse && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-md border text-blue-400 border-blue-500/20 bg-blue-500/8 shrink-0">
                                  {m.paymentCount} uso{m.paymentCount !== 1 ? 's' : ''}
                                </span>
                              )}
                            </div>
                            {m.description && (
                              <p className="text-zinc-600 text-[11px] mt-0.5 truncate max-w-xs">{m.description}</p>
                            )}
                          </div>
                        </div>

                        {/* Right: actions — always visible on mobile, hover on desktop */}
                        <div className="flex items-center gap-1.5 ml-3 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          {/* Toggle switch */}
                          <button
                            onClick={() => toggleMethod(m.id, m.is_active)}
                            disabled={isToggling}
                            title={m.is_active ? 'Desactivar' : 'Activar'}
                            className={cn(
                              'relative w-10 h-5.5 rounded-full border transition-all disabled:cursor-not-allowed',
                              m.is_active
                                ? 'bg-emerald-500/20 border-emerald-500/30'
                                : 'bg-zinc-800 border-zinc-700'
                            )}>
                            {isToggling ? (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-3 h-3 border border-zinc-500 border-t-white rounded-full animate-spin" />
                              </div>
                            ) : (
                              <span className={cn(
                                'absolute top-0.5 w-4 h-4 rounded-full border transition-all',
                                m.is_active
                                  ? 'left-5 bg-emerald-400 border-emerald-500 shadow-sm shadow-emerald-500/30'
                                  : 'left-0.5 bg-zinc-500 border-zinc-600'
                              )} />
                            )}
                          </button>

                          {/* Status label */}
                          <span className={cn('text-[10px] font-medium w-14 text-center',
                            m.is_active ? 'text-emerald-400' : 'text-zinc-600'
                          )}>
                            {m.is_active ? 'Activo' : 'Inactivo'}
                          </span>

                          {/* Edit */}
                          <button onClick={() => setMethodModal(m)}
                            title="Editar"
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-500 hover:text-cyan-400 hover:bg-cyan-500/10 transition-all">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete / deactivate */}
                          <button
                            onClick={() => setDeleteMethod(m.id)}
                            title={inUse ? 'Desactivar (tiene pagos registrados)' : 'Eliminar'}
                            className={cn('w-7 h-7 rounded-lg flex items-center justify-center transition-all',
                              inUse
                                ? 'text-zinc-500 hover:text-amber-400 hover:bg-amber-500/10'
                                : 'text-zinc-500 hover:text-red-400 hover:bg-red-500/10'
                            )}>
                            {inUse ? <Power className="w-3.5 h-3.5" /> : <Trash2 className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="p-4 border-t border-[#1a1a1a] bg-[#0d0d0d]/40">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-lg bg-cyan-500/10 border border-cyan-500/15 flex items-center justify-center shrink-0 mt-0.5">
                      <CreditCard className="w-3.5 h-3.5 text-cyan-400" />
                    </div>
                    <p className="text-zinc-600 text-xs leading-relaxed">
                      Los métodos <span className="text-zinc-400">activos</span> aparecen en el formulario de cobro.
                      Los inactivos se ocultan pero conservan el historial.
                      Los métodos con pagos registrados <span className="text-zinc-400">no pueden eliminarse</span>, solo desactivarse.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══ USERS ══ */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-3">
                {([
                  { label: 'Total',      value: users.length,                                              color: 'text-zinc-300' },
                  { label: 'Activos',    value: activeUsers,                                               color: 'text-emerald-400' },
                  { label: 'Admins',     value: users.filter(u => u.role==='admin'||u.role==='super_admin').length, color: 'text-cyan-400' },
                  { label: 'Profesores', value: users.filter(u => u.role==='teacher').length,              color: 'text-blue-400' },
                ] as { label: string; value: number; color: string }[]).map(s => (
                  <div key={s.label} className="bg-[#111111] border border-[#1f1f1f] rounded-xl p-4 text-center">
                    <p className={cn('text-2xl font-bold', s.color)}>{s.value}</p>
                    <p className="text-zinc-600 text-[10px] mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
              <div className={sectionCard}>
                <div className="flex items-center justify-between p-5 border-b border-[#1a1a1a]">
                  <div>
                    <h3 className="text-white font-semibold text-sm">Usuarios del sistema</h3>
                    <p className="text-zinc-600 text-xs">Accesos, roles y permisos</p>
                  </div>
                </div>
                <div className="divide-y divide-[#1a1a1a]">
                  {users.length === 0 ? (
                    <div className="px-5 py-10 text-center">
                      <User className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                      <p className="text-zinc-500 text-sm">No hay usuarios registrados</p>
                    </div>
                  ) : users.map(user => (
                    <div key={user.id} className="flex items-center justify-between px-5 py-4 hover:bg-white/[0.02] transition-colors group">
                      <div className="flex items-center gap-3">
                        <div className={cn('w-9 h-9 rounded-full flex items-center justify-center shrink-0',
                          user.is_active ? 'bg-gradient-to-br from-zinc-700 to-zinc-800' : 'bg-zinc-800/40'
                        )}>
                          <span className={cn('text-xs font-bold', user.is_active ? 'text-zinc-300' : 'text-zinc-600')}>
                            {user.full_name?.charAt(0)?.toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className={cn('text-sm font-medium', user.is_active ? 'text-white' : 'text-zinc-600')}>{user.full_name}</p>
                            {!user.is_active && <CircleX className="w-3.5 h-3.5 text-zinc-700" />}
                          </div>
                          <p className="text-zinc-600 text-xs">{user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-lg border', ROLE_COLORS[user.role] || ROLE_COLORS.reception)}>
                          {ROLE_LABELS[user.role] || user.role}
                        </span>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => toggleUser(user.id, user.is_active)}
                            className={cn('w-7 h-7 rounded-lg flex items-center justify-center transition-all',
                              user.is_active ? 'text-zinc-500 hover:text-amber-400 hover:bg-amber-500/10' : 'text-zinc-500 hover:text-emerald-400 hover:bg-emerald-500/10'
                            )}>
                            <Power className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => setUserModal(user)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-500 hover:text-cyan-400 hover:bg-cyan-500/10 transition-all">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-5 border-t border-[#1a1a1a] bg-[#0d0d0d]/50">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-lg bg-cyan-500/10 border border-cyan-500/15 flex items-center justify-center shrink-0 mt-0.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                    </div>
                    <p className="text-zinc-600 text-xs">Los usuarios deben registrarse con email y contraseña. Una vez registrados, su perfil aparece aquí para asignarles un rol y gestionar sus permisos.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══ SEDE ══ */}
          {activeTab === 'sede' && (
            <div className={sectionCard}>
              <div className="p-5 border-b border-[#1a1a1a]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/15 flex items-center justify-center shrink-0">
                    <Building2 className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-white font-semibold">Gestión y Control</p>
                    <p className="text-zinc-600 text-xs">Plataforma de gestión institucional</p>
                  </div>
                </div>
              </div>
              <div className="p-5 space-y-4">
                <div className="bg-cyan-500/[0.04] border border-cyan-500/15 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                    <span className="text-cyan-400 text-xs font-semibold">Arquitectura multi-sede disponible</span>
                  </div>
                  <p className="text-zinc-500 text-xs">El sistema está preparado para gestionar múltiples sedes con datos independientes.</p>
                </div>
                <div className="divide-y divide-[#1a1a1a]">
                  {[
                    { label: 'Nombre del sistema', value: 'Gestión y Control' },
                    { label: 'Versión', value: 'v1.0 — Gestión integral' },
                    { label: 'Base de datos', value: 'Supabase (PostgreSQL)' },
                    { label: 'Disciplinas activas', value: `${activeDiscs}` },
                    { label: 'Métodos de cobro activos', value: `${activeMethods}` },
                  ].map(item => (
                    <div key={item.label} className="flex items-start justify-between py-3 gap-4">
                      <span className="text-zinc-600 text-sm shrink-0">{item.label}</span>
                      <span className="text-zinc-300 text-sm text-right">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {discModal !== null && (
        <DisciplineModal
          disc={discModal === false ? null : discModal}
          onClose={() => setDiscModal(null)}
          onSave={() => { setDiscModal(null); fetchAll(); }}
        />
      )}

      {methodModal !== null && (
        <PaymentMethodModal
          method={methodModal === false ? null : methodModal}
          onClose={() => setMethodModal(null)}
          onSave={() => { setMethodModal(null); fetchAll(); }}
        />
      )}

      {userModal && (
        <UserModal
          user={userModal}
          onClose={() => setUserModal(null)}
          onSave={() => { setUserModal(null); fetchAll(); }}
        />
      )}

      {deleteMethod && (() => {
        const target = payMethods.find(m => m.id === deleteMethod);
        const inUse  = target && (target.paymentCount || 0) > 0;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setDeleteMethod(null)} />
            <div className="relative bg-[#111111] border border-[#2a2a2a] rounded-2xl w-full max-w-sm shadow-2xl p-6 text-center">
              <div className={cn('w-12 h-12 rounded-full border flex items-center justify-center mx-auto mb-4',
                inUse ? 'bg-amber-500/10 border-amber-500/20' : 'bg-red-500/10 border-red-500/20'
              )}>
                {inUse ? <Power className="w-5 h-5 text-amber-400" /> : <Trash2 className="w-5 h-5 text-red-400" />}
              </div>
              <h3 className="text-white font-semibold mb-1">
                {inUse ? 'Desactivar método de pago' : 'Eliminar método de pago'}
              </h3>
              {target && (
                <p className="text-zinc-400 text-xs mb-2 font-medium">{target.name}</p>
              )}
              <p className="text-zinc-500 text-sm mb-5">
                {inUse
                  ? `Este método tiene ${target?.paymentCount} pago${target?.paymentCount !== 1 ? 's' : ''} registrado${target?.paymentCount !== 1 ? 's' : ''}. No puede eliminarse, pero podés desactivarlo para que no aparezca al cobrar.`
                  : 'Este método no tiene pagos asociados. ¿Querés eliminarlo definitivamente?'}
              </p>
              <div className="flex gap-3 justify-center">
                <button onClick={() => setDeleteMethod(null)}
                  className="px-4 py-2 rounded-lg border border-[#2a2a2a] text-zinc-400 text-sm hover:text-white transition-colors">
                  Cancelar
                </button>
                <button onClick={deleteMethodConfirm} disabled={deleting}
                  className={cn('px-5 py-2 rounded-lg text-sm font-semibold disabled:opacity-50 flex items-center gap-2 transition-all',
                    inUse
                      ? 'bg-amber-500/15 border border-amber-500/25 text-amber-400 hover:bg-amber-500/25'
                      : 'bg-red-500/15 border border-red-500/25 text-red-400 hover:bg-red-500/25'
                  )}>
                  {deleting && <div className={cn('w-3.5 h-3.5 border-2 rounded-full animate-spin',
                    inUse ? 'border-amber-400/30 border-t-amber-400' : 'border-red-400/30 border-t-red-400'
                  )} />}
                  {inUse ? 'Desactivar' : 'Eliminar'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
