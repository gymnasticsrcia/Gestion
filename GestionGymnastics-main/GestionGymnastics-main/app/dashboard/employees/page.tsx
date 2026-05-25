'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Header from '@/components/layout/Header';
import type { Employee, Discipline } from '@/lib/types';
import { Plus, Search, X, Edit2, CreditCard, Phone, Calendar, DollarSign, UserCog, Trash2, MapPin, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';

const ROLE_LABELS: Record<string, string> = {
  director: 'Director/a', admin: 'Administración', instructor: 'Profesor/a',
  reception: 'Recepción', maintenance: 'Mantenimiento', other: 'Otro',
};

const ROLE_COLORS: Record<string, string> = {
  director: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  admin: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  instructor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  reception: 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20',
  maintenance: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
  other: 'text-zinc-500 bg-zinc-500/10 border-zinc-500/20',
};

const formatCurrency = (cents: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(cents / 100);

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editEmployee, setEditEmployee] = useState<Employee | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [salaryMass, setSalaryMass] = useState(0);

  useEffect(() => { fetchEmployees(); }, []);

  const fetchEmployees = async () => {
    setLoading(true);
    const { data } = await supabase.from('employees').select('*').order('first_name');
    if (data) {
      setEmployees(data as Employee[]);
      const active = (data as Employee[]).filter(e => e.status === 'active');
      setSalaryMass(active.reduce((sum, e) => sum + (e.salary_amount || 0), 0));
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    await supabase.from('employees').update({ status: 'inactive' }).eq('id', id);
    setDeleteConfirm(null);
    fetchEmployees();
  };

  const filtered = employees.filter(e => {
    const matchesSearch = search === '' || `${e.first_name} ${e.last_name}`.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'all' || e.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const roleStats = ['instructor', 'admin', 'reception', 'director'].map(role => ({
    role,
    count: employees.filter(e => e.role === role && e.status === 'active').length,
  }));

  return (
    <div className="flex-1 flex flex-col">
      <Header title="Empleados" subtitle="Personal y profesores del equipo" />

      <div className="flex-1 p-6 space-y-5 animate-fade-in">
        {/* Salary mass banner */}
        <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <p className="text-zinc-400 text-xs font-medium">Masa salarial total</p>
              <p className="text-zinc-600 text-[10px]">Empleados activos</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-amber-400 text-xl font-bold">{formatCurrency(salaryMass)}</p>
            <p className="text-zinc-600 text-[10px]">por mes</p>
          </div>
        </div>

        {/* Role stats — clickable filters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {roleStats.map(({ role, count }) => (
            <div
              key={role}
              onClick={() => setRoleFilter(roleFilter === role ? 'all' : role)}
              className={cn(
                'border rounded-xl p-4 text-center cursor-pointer transition-all hover:border-[#2a2a2a]',
                roleFilter === role
                  ? 'bg-cyan-500/5 border-cyan-500/30'
                  : 'bg-[#111111] border-[#1f1f1f]',
              )}
            >
              <p className="text-white text-2xl font-bold">{count}</p>
              <p className="text-zinc-600 text-xs mt-0.5">{ROLE_LABELS[role]}</p>
            </div>
          ))}
        </div>

        {/* Search + add */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
            <input
              type="text"
              placeholder="Buscar empleado..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full h-10 pl-9 pr-4 rounded-lg bg-[#111111] border border-[#2a2a2a] text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-cyan-500/40"
            />
          </div>
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="h-10 px-3 rounded-lg bg-[#111111] border border-[#2a2a2a] text-zinc-300 text-sm focus:outline-none focus:border-cyan-500/40"
          >
            <option value="all">Todos los roles</option>
            {Object.entries(ROLE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <button
            onClick={() => { setEditEmployee(null); setShowModal(true); }}
            className="flex items-center gap-2 h-10 px-4 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-white text-sm font-semibold transition-all"
          >
            <Plus className="w-4 h-4" />
            Nuevo empleado
          </button>
        </div>

        {/* Employee grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-[#111111] border border-[#1f1f1f] rounded-xl p-5 h-44 animate-pulse" />
            ))
          ) : filtered.length === 0 ? (
            <div className="col-span-full bg-[#111111] border border-[#1f1f1f] rounded-xl p-12 text-center">
              <UserCog className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
              <p className="text-zinc-500 text-sm">No hay empleados registrados</p>
              <button onClick={() => setShowModal(true)} className="mt-3 text-cyan-400 text-sm font-medium hover:text-cyan-300">Agregar el primero →</button>
            </div>
          ) : filtered.map(employee => (
            <div key={employee.id} className="bg-[#111111] border border-[#1f1f1f] rounded-xl p-5 hover:border-[#2a2a2a] transition-all group relative">
              {/* Hover actions */}
              <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                <button
                  onClick={() => { setEditEmployee(employee); setShowModal(true); }}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-500 hover:text-cyan-400 hover:bg-cyan-500/10 transition-all"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setDeleteConfirm(employee.id)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex items-start gap-3 mb-4">
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center shrink-0">
                  <span className="text-zinc-300 text-sm font-bold">
                    {employee.first_name.charAt(0)}{employee.last_name.charAt(0)}
                  </span>
                </div>
                <div className="min-w-0 pr-16">
                  <p className="text-white font-semibold text-sm truncate">{employee.first_name} {employee.last_name}</p>
                  <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded border', ROLE_COLORS[employee.role])}>
                    {ROLE_LABELS[employee.role]}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                {(employee as any).dni && (
                  <div className="flex items-center gap-1.5">
                    <CreditCard className="w-3 h-3 text-zinc-600 shrink-0" />
                    <span className="text-zinc-400 text-xs">DNI {(employee as any).dni}</span>
                  </div>
                )}
                {employee.phone && (
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3 h-3 text-zinc-600 shrink-0" />
                    <span className="text-zinc-400 text-xs">{employee.phone}</span>
                  </div>
                )}
                {(employee as any).address && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3 h-3 text-zinc-600 shrink-0" />
                    <span className="text-zinc-400 text-xs truncate">{(employee as any).address}</span>
                  </div>
                )}
                {employee.hire_date && (
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3 h-3 text-zinc-600 shrink-0" />
                    <span className="text-zinc-400 text-xs">Desde {new Date(employee.hire_date).toLocaleDateString('es-AR')}</span>
                  </div>
                )}
                {employee.salary_amount > 0 && (
                  <div className="flex items-center gap-1.5">
                    <DollarSign className="w-3 h-3 text-zinc-600 shrink-0" />
                    <span className="text-amber-400/80 text-xs font-medium">{formatCurrency(employee.salary_amount)}/mes</span>
                  </div>
                )}
              </div>

              {employee.specializations && employee.specializations.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3 pt-3 border-t border-[#1a1a1a] items-center">
                  <Tag className="w-3 h-3 text-zinc-700 shrink-0" />
                  {employee.specializations.map(s => (
                    <span key={s} className="text-[10px] bg-white/[0.04] text-zinc-500 px-1.5 py-0.5 rounded-md">{s}</span>
                  ))}
                </div>
              )}

              <div className="mt-3 pt-3 border-t border-[#1a1a1a]">
                <span className={cn(
                  'text-[10px] font-medium px-2 py-0.5 rounded-full',
                  employee.status === 'active' ? 'text-emerald-400 bg-emerald-500/10' :
                  employee.status === 'on_leave' ? 'text-amber-400 bg-amber-500/10' :
                  'text-zinc-500 bg-zinc-500/10',
                )}>
                  {employee.status === 'active' ? 'Activo' : employee.status === 'on_leave' ? 'Con licencia' : 'Inactivo'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <EmployeeModal
          employee={editEmployee}
          onClose={() => { setShowModal(false); setEditEmployee(null); }}
          onSave={() => { setShowModal(false); setEditEmployee(null); fetchEmployees(); }}
        />
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
          <div className="relative bg-[#111111] border border-[#2a2a2a] rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-slide-up text-center">
            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-5 h-5 text-red-400" />
            </div>
            <h3 className="text-white font-semibold mb-1">Inactivar empleado</h3>
            <p className="text-zinc-500 text-sm mb-6">El empleado pasará a estado inactivo y dejará de aparecer en los listados activos.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2.5 rounded-lg border border-[#2a2a2a] text-zinc-400 text-sm hover:text-white">Cancelar</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 px-4 py-2.5 rounded-lg bg-red-500 hover:bg-red-400 text-white text-sm font-semibold">Inactivar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EmployeeModal({ employee, onClose, onSave }: { employee: Employee | null; onClose: () => void; onSave: () => void }) {
  const [saving, setSaving] = useState(false);
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [selectedSpec, setSelectedSpec] = useState('');
  const [form, setForm] = useState({
    first_name: employee?.first_name || '',
    last_name: employee?.last_name || '',
    dni: (employee as any)?.dni || '',
    phone: employee?.phone || '',
    whatsapp: employee?.whatsapp || '',
    email: employee?.email || '',
    address: (employee as any)?.address || '',
    birth_date: employee?.birth_date || '',
    hire_date: employee?.hire_date || new Date().toISOString().split('T')[0],
    role: employee?.role || 'instructor',
    salary_amount: employee ? employee.salary_amount / 100 : 0,
    salary_type: employee?.salary_type || 'monthly',
    status: employee?.status || 'active',
    specializations: (employee?.specializations || []) as string[],
    notes: employee?.notes || '',
  });

  useEffect(() => {
    supabase.from('disciplines').select('id, name, color, is_active').eq('is_active', true).order('name').then(({ data }) => {
      if (data) setDisciplines(data as Discipline[]);
    });
  }, []);

  const addSpec = (spec: string) => {
    if (spec && !form.specializations.includes(spec)) {
      setForm(f => ({ ...f, specializations: [...f.specializations, spec] }));
    }
    setSelectedSpec('');
  };

  const removeSpec = (spec: string) => {
    setForm(f => ({ ...f, specializations: f.specializations.filter(s => s !== spec) }));
  };

  const handleSave = async () => {
    if (!form.first_name.trim() || !form.last_name.trim()) return;
    setSaving(true);
    const payload = { ...form, salary_amount: Math.round(form.salary_amount * 100) };
    if (employee) {
      await supabase.from('employees').update(payload as any).eq('id', employee.id);
    } else {
      await supabase.from('employees').insert(payload as any);
    }
    setSaving(false);
    onSave();
  };

  const inputClass = "w-full h-10 rounded-lg bg-[#0d0d0d] border border-[#2a2a2a] px-3 text-white text-sm focus:outline-none focus:border-cyan-500/40";
  const labelClass = "text-xs font-medium text-zinc-400 mb-1 block";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#111111] border border-[#2a2a2a] rounded-2xl w-full max-w-lg max-h-[92vh] flex flex-col shadow-2xl animate-slide-up">
        <div className="flex items-center justify-between p-5 border-b border-[#1a1a1a]">
          <h2 className="text-white font-semibold">{employee ? 'Editar empleado' : 'Nuevo empleado'}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/[0.08]">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className={labelClass}>Nombre *</label><input className={inputClass} value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} /></div>
            <div><label className={labelClass}>Apellido *</label><input className={inputClass} value={form.last_name} onChange={e => setForm({ ...form, last_name: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className={labelClass}>DNI</label><input className={inputClass} placeholder="12345678" value={form.dni} onChange={e => setForm({ ...form, dni: e.target.value })} /></div>
            <div><label className={labelClass}>Fecha de nacimiento</label><input type="date" className={inputClass} value={form.birth_date} onChange={e => setForm({ ...form, birth_date: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Rol</label>
              <select className={inputClass} value={form.role} onChange={e => setForm({ ...form, role: e.target.value as any })}>
                {Object.entries(ROLE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Estado</label>
              <select className={inputClass} value={form.status} onChange={e => setForm({ ...form, status: e.target.value as any })}>
                <option value="active">Activo</option>
                <option value="inactive">Inactivo</option>
                <option value="on_leave">Con licencia</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className={labelClass}>Teléfono</label><input className={inputClass} value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
            <div><label className={labelClass}>WhatsApp</label><input className={inputClass} value={form.whatsapp} onChange={e => setForm({ ...form, whatsapp: e.target.value })} /></div>
          </div>
          <div><label className={labelClass}>Email</label><input type="email" className={inputClass} value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
          <div><label className={labelClass}>Domicilio</label><input className={inputClass} placeholder="Calle 123, Ciudad" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Sueldo mensual (ARS)</label>
              <input type="number" className={inputClass} value={form.salary_amount} onChange={e => setForm({ ...form, salary_amount: parseFloat(e.target.value) || 0 })} />
            </div>
            <div><label className={labelClass}>Fecha de ingreso</label><input type="date" className={inputClass} value={form.hire_date} onChange={e => setForm({ ...form, hire_date: e.target.value })} /></div>
          </div>

          {/* Specializations */}
          <div>
            <label className={labelClass}>Especialidades</label>
            <div className="flex gap-2">
              <select
                className="flex-1 h-10 rounded-lg bg-[#0d0d0d] border border-[#2a2a2a] px-3 text-zinc-300 text-sm focus:outline-none focus:border-cyan-500/40"
                value={selectedSpec}
                onChange={e => setSelectedSpec(e.target.value)}
              >
                <option value="">Seleccionar disciplina...</option>
                {disciplines.filter(d => !form.specializations.includes(d.name)).map(d => (
                  <option key={d.id} value={d.name}>{d.name}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => addSpec(selectedSpec)}
                disabled={!selectedSpec}
                className="h-10 px-3 rounded-lg bg-white/[0.06] hover:bg-white/[0.10] text-zinc-300 disabled:opacity-40 transition-all"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {form.specializations.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {form.specializations.map(s => (
                  <span key={s} className="flex items-center gap-1 text-xs bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2 py-1 rounded-lg">
                    {s}
                    <button type="button" onClick={() => removeSpec(s)} className="text-cyan-600 hover:text-cyan-300">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className={labelClass}>Notas</label>
            <textarea className="w-full rounded-lg bg-[#0d0d0d] border border-[#2a2a2a] px-3 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500/40 resize-none" rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
          </div>
        </div>
        <div className="flex justify-end gap-3 p-5 border-t border-[#1a1a1a]">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border border-[#2a2a2a] text-zinc-400 text-sm hover:text-white">Cancelar</button>
          <button onClick={handleSave} disabled={saving} className="px-5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-white text-sm font-semibold disabled:opacity-50 flex items-center gap-2">
            {saving && <div className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" />}
            {employee ? 'Guardar cambios' : 'Crear empleado'}
          </button>
        </div>
      </div>
    </div>
  );
}
