'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Header from '@/components/layout/Header';
import type { Student, Discipline } from '@/lib/types';
import { Search, Plus, X, Eye, CreditCard as Edit2, Phone, Calendar, Users, UserCheck, UserX, Clock, CircleAlert as AlertCircle, CircleCheck as CheckCircle, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import StudentModal from '@/components/students/StudentModal';
import StudentDetailModal from '@/components/students/StudentDetailModal';

type StatusFilter = 'all' | 'active' | 'inactive' | 'suspended' | 'waiting';

export default function StudentsPage() {
  const [students, setStudents]             = useState<Student[]>([]);
  const [overdueMap, setOverdueMap]         = useState<Record<string, number>>({});
  const [loading, setLoading]               = useState(true);
  const [search, setSearch]                 = useState('');
  const [statusFilter, setStatusFilter]     = useState<StatusFilter>('all');
  const [showModal, setShowModal]           = useState(false);
  const [showDetail, setShowDetail]         = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [editStudent, setEditStudent]       = useState<Student | null>(null);

  useEffect(() => { fetchStudents(); }, []);

  const fetchStudents = async () => {
    setLoading(true);
    const { data: studs } = await supabase
      .from('students')
      .select('*, guardians:student_guardians(*)')
      .order('first_name', { ascending: true });

    if (studs) {
      setStudents(studs as Student[]);
      // Count overdue payments per student
      const ids = studs.map(s => s.id);
      if (ids.length > 0) {
        const { data: pays } = await supabase
          .from('payments')
          .select('student_id, status')
          .in('student_id', ids)
          .in('status', ['overdue', 'pending']);
        if (pays) {
          const now = new Date();
          const map: Record<string, number> = {};
          pays.forEach((p: any) => {
            if (p.status === 'overdue') {
              map[p.student_id] = (map[p.student_id] || 0) + 1;
            }
          });
          setOverdueMap(map);
        }
      }
    }
    setLoading(false);
  };

  const filteredStudents = students.filter(s => {
    const matchSearch = search === '' ||
      `${s.first_name} ${s.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
      s.dni?.includes(search) ||
      s.phone?.includes(search) ||
      s.whatsapp?.includes(search);
    const matchStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const getAge = (birthDate?: string) => {
    if (!birthDate) return '—';
    return `${Math.floor((Date.now() - new Date(birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000))}a`;
  };

  const getStatusBadge = (status: string, overdueCount: number) => {
    if (overdueCount >= 3 && status === 'active') {
      return (
        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-red-500/12 border border-red-500/20 text-red-400">
            <TrendingDown className="w-2.5 h-2.5" /> Inactivo
          </span>
        </div>
      );
    }
    const map: Record<string, { label: string; class: string }> = {
      active:    { label: 'Activo',       class: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' },
      inactive:  { label: 'Inactivo',     class: 'bg-zinc-500/10 border-zinc-500/20 text-zinc-400' },
      suspended: { label: 'Suspendido',   class: 'bg-amber-500/10 border-amber-500/20 text-amber-400' },
      waiting:   { label: 'Lista espera', class: 'bg-blue-500/10 border-blue-500/20 text-blue-400' },
    };
    const m = map[status] ?? map.inactive;
    return <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded border', m.class)}>{m.label}</span>;
  };

  const counts = {
    total:     students.length,
    active:    students.filter(s => s.status === 'active').length,
    inactive:  students.filter(s => s.status === 'inactive').length,
    suspended: students.filter(s => s.status === 'suspended').length,
    waiting:   students.filter(s => s.status === 'waiting').length,
  };

  const statsBar = [
    { key: 'all',       label: 'Total',       value: counts.total,     icon: Users,      color: 'text-zinc-300',   bg: 'bg-zinc-500/8',   border: 'border-zinc-500/15' },
    { key: 'active',    label: 'Activos',      value: counts.active,    icon: UserCheck,  color: 'text-emerald-400', bg: 'bg-emerald-500/8', border: 'border-emerald-500/15' },
    { key: 'suspended', label: 'Suspendidos', value: counts.suspended, icon: AlertCircle, color: 'text-amber-400',  bg: 'bg-amber-500/8',  border: 'border-amber-500/15' },
    { key: 'inactive',  label: 'Inactivos',    value: counts.inactive,  icon: UserX,      color: 'text-zinc-500',   bg: 'bg-zinc-800/40',  border: 'border-zinc-700/30' },
  ] as const;

  return (
    <div className="flex-1 flex flex-col">
      <Header title="Alumnos" subtitle="Padrón completo de socios y alumnos" />

      <div className="flex-1 p-6 space-y-5 animate-fade-in">

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {statsBar.map(s => {
            const Icon = s.icon;
            return (
              <button
                key={s.key}
                onClick={() => setStatusFilter(s.key as StatusFilter)}
                className={cn(
                  'flex items-center gap-3 p-4 rounded-xl border transition-all text-left',
                  statusFilter === s.key
                    ? `${s.bg} ${s.border} ring-1 ring-inset ${s.border.replace('border-', 'ring-')}`
                    : 'bg-[#111111] border-[#1f1f1f] hover:border-[#2a2a2a]'
                )}
              >
                <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center shrink-0', s.bg, s.border, 'border')}>
                  <Icon className={cn('w-4 h-4', s.color)} />
                </div>
                <div>
                  <p className={cn('text-xl font-bold', s.color)}>{s.value}</p>
                  <p className="text-zinc-600 text-[10px]">{s.label}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
            <input
              type="text"
              placeholder="Buscar por nombre, DNI o teléfono..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full h-10 pl-9 pr-4 rounded-lg bg-[#0f0f0f] border border-[#1e1e1e] text-white text-sm placeholder:text-zinc-700 focus:outline-none focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/10 transition-all"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button
            onClick={() => { setEditStudent(null); setShowModal(true); }}
            className="flex items-center gap-2 h-10 px-4 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-white text-sm font-semibold transition-all shrink-0"
          >
            <Plus className="w-4 h-4" /> Nuevo alumno
          </button>
        </div>

        {/* Table */}
        <div className="bg-[#111111] border border-[#1f1f1f] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1a1a1a]">
                  <th className="text-left px-5 py-3.5 text-zinc-500 text-xs font-semibold uppercase tracking-wider">Alumno</th>
                  <th className="text-left px-4 py-3.5 text-zinc-500 text-xs font-semibold uppercase tracking-wider hidden md:table-cell">Edad</th>
                  <th className="text-left px-4 py-3.5 text-zinc-500 text-xs font-semibold uppercase tracking-wider hidden lg:table-cell">Contacto</th>
                  <th className="text-left px-4 py-3.5 text-zinc-500 text-xs font-semibold uppercase tracking-wider hidden xl:table-cell">Inscripción</th>
                  <th className="text-left px-4 py-3.5 text-zinc-500 text-xs font-semibold uppercase tracking-wider">Estado</th>
                  <th className="text-right px-5 py-3.5 text-zinc-500 text-xs font-semibold uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1a1a1a]">
                {loading ? (
                  Array.from({ length: 7 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 6 }).map((_, j) => (
                        <td key={j} className="px-4 py-4"><div className="h-4 bg-zinc-800/60 rounded animate-pulse w-3/4" /></td>
                      ))}
                    </tr>
                  ))
                ) : filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-14 text-center">
                      <Users className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                      <p className="text-zinc-500 text-sm">{search ? 'Sin resultados para esa búsqueda' : 'No hay alumnos registrados'}</p>
                      {!search && (
                        <button onClick={() => setShowModal(true)} className="mt-3 text-cyan-400 text-sm font-medium hover:text-cyan-300 transition-colors">
                          Agregar el primer alumno →
                        </button>
                      )}
                    </td>
                  </tr>
                ) : filteredStudents.map(student => {
                  const overdue = overdueMap[student.id] || 0;
                  const autoInactive = overdue >= 3 && student.status === 'active';
                  return (
                    <tr key={student.id} className={cn('transition-colors group', autoInactive ? 'bg-red-500/[0.03] hover:bg-red-500/[0.05]' : 'hover:bg-white/[0.02]')}>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className={cn('w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold',
                            autoInactive ? 'bg-red-500/15 text-red-400' : 'bg-gradient-to-br from-zinc-700 to-zinc-800 text-zinc-300'
                          )}>
                            {student.first_name.charAt(0)}{student.last_name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-white text-sm font-medium">{student.first_name} {student.last_name}</p>
                            <div className="flex items-center gap-1.5">
                              {student.dni && <p className="text-zinc-600 text-xs">DNI {student.dni}</p>}
                              {overdue > 0 && (
                                <span className="text-[9px] font-semibold text-red-400 bg-red-500/10 px-1 py-0.5 rounded">
                                  {overdue} venc.
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 hidden md:table-cell">
                        <span className="text-zinc-300 text-sm">{getAge(student.birth_date)}</span>
                      </td>
                      <td className="px-4 py-3.5 hidden lg:table-cell">
                        {student.whatsapp || student.phone ? (
                          <div className="flex items-center gap-1.5">
                            <Phone className="w-3 h-3 text-zinc-600" />
                            <span className="text-zinc-400 text-xs">{student.whatsapp || student.phone}</span>
                          </div>
                        ) : <span className="text-zinc-700 text-xs">—</span>}
                      </td>
                      <td className="px-4 py-3.5 hidden xl:table-cell">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3 h-3 text-zinc-600" />
                          <span className="text-zinc-400 text-xs">
                            {student.enrollment_date ? new Date(student.enrollment_date).toLocaleDateString('es-AR') : '—'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        {getStatusBadge(student.status, overdue)}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => { setSelectedStudent(student); setShowDetail(true); }}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/[0.08] transition-all"
                            title="Ver detalle"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => { setEditStudent(student); setShowModal(true); }}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-500 hover:text-cyan-400 hover:bg-cyan-500/10 transition-all"
                            title="Editar"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredStudents.length > 0 && (
            <div className="border-t border-[#1a1a1a] px-5 py-3 flex items-center justify-between">
              <p className="text-zinc-600 text-xs">
                {filteredStudents.length} de {students.length} alumnos
                {statusFilter !== 'all' && ` · filtro: ${statusFilter}`}
              </p>
              {statusFilter !== 'all' && (
                <button onClick={() => setStatusFilter('all')} className="text-zinc-500 text-xs hover:text-white flex items-center gap-1 transition-colors">
                  <X className="w-3 h-3" /> Limpiar filtro
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <StudentModal
          student={editStudent}
          onClose={() => { setShowModal(false); setEditStudent(null); }}
          onSave={() => { setShowModal(false); setEditStudent(null); fetchStudents(); }}
        />
      )}

      {showDetail && selectedStudent && (
        <StudentDetailModal
          student={selectedStudent}
          onClose={() => { setShowDetail(false); setSelectedStudent(null); }}
          onEdit={() => { setShowDetail(false); setEditStudent(selectedStudent); setShowModal(true); }}
          onRefresh={fetchStudents}
        />
      )}
    </div>
  );
}
