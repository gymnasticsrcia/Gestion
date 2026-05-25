'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import Header from '@/components/layout/Header';
import type { Group, Discipline, Employee } from '@/lib/types';
import { Plus, Users, Search, X, CreditCard as Edit2, Clock, User, ChevronDown, Trash2, ClipboardList, Printer, CircleCheck as CheckCircle, Circle as XCircle, CircleAlert as AlertCircle, CircleMinus as MinusCircle, ChevronLeft, ChevronRight, Filter, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

const DAYS_ES: Record<string, string> = {
  monday: 'Lun', tuesday: 'Mar', wednesday: 'Mié',
  thursday: 'Jue', friday: 'Vie', saturday: 'Sáb', sunday: 'Dom',
};
const DAYS_FULL: Record<string, string> = {
  monday: 'Lunes', tuesday: 'Martes', wednesday: 'Miércoles',
  thursday: 'Jueves', friday: 'Viernes', saturday: 'Sábado', sunday: 'Domingo',
};
const MONTHS_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

const LEVELS: Record<string, string> = {
  beginner: 'Principiante', intermediate: 'Intermedio',
  advanced: 'Avanzado', competition: 'Competencia', recreational: 'Recreativo',
};
const LEVEL_COLORS: Record<string, string> = {
  beginner:     'text-blue-400 bg-blue-500/10 border-blue-500/20',
  intermediate: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/15',
  advanced:     'text-orange-400 bg-orange-500/10 border-orange-500/20',
  competition:  'text-red-400 bg-red-500/10 border-red-500/20',
  recreational: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
};

const ATT_STATUS = {
  present: { label: 'P',       icon: CheckCircle,  color: 'text-emerald-400', bg: 'bg-emerald-500/15 border-emerald-500/25', title: 'Presente' },
  absent:  { label: 'A',       icon: XCircle,      color: 'text-red-400',     bg: 'bg-red-500/15 border-red-500/25',         title: 'Ausente' },
  late:    { label: 'T',       icon: AlertCircle,  color: 'text-amber-400',   bg: 'bg-amber-500/15 border-amber-500/25',     title: 'Tarde' },
  excused: { label: 'J',       icon: MinusCircle,  color: 'text-zinc-400',    bg: 'bg-zinc-500/15 border-zinc-500/25',       title: 'Justificado' },
  none:    { label: '—',       icon: MinusCircle,  color: 'text-zinc-700',    bg: 'bg-zinc-800/40 border-zinc-700/30',       title: 'Sin clase' },
};

type AttStatus = 'present' | 'absent' | 'late' | 'excused';

// ─── Attendance Modal ────────────────────────────────────────────────────────
function AttendanceModal({ group, onClose }: { group: Group; onClose: () => void }) {
  const now = new Date();
  const [year, setYear]   = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth()); // 0-indexed

  const [students, setStudents]   = useState<any[]>([]);
  const [sessions, setSessions]   = useState<any[]>([]); // {id, date}
  const [records, setRecords]     = useState<Record<string, Record<string, AttStatus>>>({}); // {date: {studentId: status}}
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState<string | null>(null);

  // Days in month that match the group's schedule
  const scheduleDays = (group.schedule || []).map((s: any) => s.day);
  const classDates = (() => {
    const dates: string[] = [];
    const dMap: Record<string, number> = { sunday:0, monday:1, tuesday:2, wednesday:3, thursday:4, friday:5, saturday:6 };
    const d = new Date(year, month, 1);
    while (d.getMonth() === month) {
      const dayName = Object.keys(dMap).find(k => dMap[k] === d.getDay());
      if (dayName && scheduleDays.includes(dayName)) {
        dates.push(d.toISOString().split('T')[0]);
      }
      d.setDate(d.getDate() + 1);
    }
    return dates;
  })();

  useEffect(() => { fetchData(); }, [group.id, year, month]);

  const fetchData = async () => {
    setLoading(true);
    const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const endDate   = `${year}-${String(month + 1).padStart(2, '0')}-31`;

    const [studsRes, sessRes] = await Promise.all([
      supabase.from('student_groups')
        .select('student_id, status, student:students(id, first_name, last_name, status)')
        .eq('group_id', group.id),
      supabase.from('attendance_sessions')
        .select('id, date')
        .eq('group_id', group.id)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date'),
    ]);

    const studs = (studsRes.data || []).map((sg: any) => sg.student).filter(Boolean);
    setSessions(sessRes.data || []);

    // Load records for these sessions
    const sessionIds = (sessRes.data || []).map((s: any) => s.id);
    let recMap: Record<string, Record<string, AttStatus>> = {};
    if (sessionIds.length > 0) {
      const { data: recs } = await supabase
        .from('attendance_records')
        .select('session_id, student_id, status')
        .in('session_id', sessionIds);
      (recs || []).forEach((r: any) => {
        const sess = (sessRes.data || []).find((s: any) => s.id === r.session_id);
        if (sess) {
          if (!recMap[sess.date]) recMap[sess.date] = {};
          recMap[sess.date][r.student_id] = r.status;
        }
      });
    }

    setStudents(studs);
    setRecords(recMap);
    setLoading(false);
  };

  const cycleStatus = async (studentId: string, date: string) => {
    const current = records[date]?.[studentId];
    const cycle: (AttStatus | undefined)[] = [undefined, 'present', 'absent', 'late', 'excused'];
    const idx = cycle.indexOf(current);
    const next = cycle[(idx + 1) % cycle.length];

    setSaving(`${date}-${studentId}`);

    // Ensure session exists
    let sessionId: string;
    let existingSession = sessions.find(s => s.date === date);
    if (!existingSession) {
      const { data: newSess } = await supabase
        .from('attendance_sessions')
        .upsert({ group_id: group.id, date }, { onConflict: 'group_id,date' })
        .select('id, date')
        .single();
      if (newSess) {
        existingSession = newSess;
        setSessions(prev => [...prev, newSess]);
      }
    }
    sessionId = existingSession?.id;

    if (!next) {
      // Remove record
      if (sessionId) {
        await supabase.from('attendance_records').delete()
          .eq('session_id', sessionId).eq('student_id', studentId);
      }
    } else {
      await supabase.from('attendance_records').upsert(
        { session_id: sessionId, student_id: studentId, status: next },
        { onConflict: 'session_id,student_id' }
      );
    }

    setRecords(prev => {
      const updated = { ...prev };
      if (!updated[date]) updated[date] = {};
      if (!next) { delete updated[date][studentId]; }
      else { updated[date][studentId] = next; }
      return updated;
    });
    setSaving(null);
  };

  const handlePrint = () => window.print();

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  const getAttSummary = (studentId: string) => {
    let present = 0, absent = 0, late = 0, excused = 0, total = classDates.length;
    classDates.forEach(d => {
      const s = records[d]?.[studentId];
      if (s === 'present') present++;
      else if (s === 'absent') absent++;
      else if (s === 'late') late++;
      else if (s === 'excused') excused++;
    });
    return { present, absent, late, excused, total };
  };

  const disc = group.discipline as any;
  const instructor = group.instructor as any;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#0d0d0d] border border-[#252525] rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1a1a1a] print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center border" style={{ backgroundColor: `${disc?.color}15`, borderColor: `${disc?.color}25` }}>
              <ClipboardList className="w-4 h-4" style={{ color: disc?.color }} />
            </div>
            <div>
              <h2 className="text-white font-semibold text-sm">{group.name}</h2>
              <p className="text-zinc-500 text-xs">Planilla mensual de asistencias</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handlePrint} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#2a2a2a] text-zinc-400 text-xs hover:text-white hover:border-[#3a3a3a] transition-all">
              <Printer className="w-3.5 h-3.5" /> Imprimir / PDF
            </button>
            <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/[0.07] transition-all">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Month navigator */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-[#1a1a1a]">
          <div className="flex items-center gap-3">
            <button onClick={prevMonth} className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/[0.07] transition-all print:hidden">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <p className="text-white font-semibold text-sm w-40 text-center">{MONTHS_ES[month]} {year}</p>
            <button onClick={nextMonth} className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/[0.07] transition-all print:hidden">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center gap-4">
            {instructor && (
              <div className="flex items-center gap-1.5">
                <User className="w-3 h-3 text-zinc-600" />
                <span className="text-zinc-400 text-xs">{instructor.first_name} {instructor.last_name}</span>
              </div>
            )}
            <div className="flex items-center gap-3 text-[10px]">
              {Object.entries(ATT_STATUS).filter(([k]) => k !== 'none').map(([key, meta]) => (
                <span key={key} className={cn('px-1.5 py-0.5 rounded border font-semibold', meta.bg, meta.color)}>
                  {meta.label} {meta.title}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="p-8 text-center"><div className="w-6 h-6 border-2 border-zinc-700 border-t-cyan-500 rounded-full animate-spin mx-auto" /></div>
          ) : students.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
              <p className="text-zinc-500 text-sm">Sin alumnos inscriptos en este grupo</p>
            </div>
          ) : (
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#1a1a1a]">
                  <th className="text-left px-4 py-3 text-zinc-500 font-semibold uppercase tracking-wider sticky left-0 bg-[#0d0d0d] z-10 w-48">Alumno</th>
                  {classDates.map(d => {
                    const dateObj = new Date(d + 'T00:00:00');
                    const dayName = Object.keys(DAYS_ES)[dateObj.getDay() === 0 ? 6 : dateObj.getDay() - 1];
                    return (
                      <th key={d} className="px-1 py-3 text-center text-zinc-600 font-medium min-w-[44px]">
                        <div className="flex flex-col items-center gap-0.5">
                          <span className="text-[9px] uppercase text-zinc-600">{DAYS_ES[dayName] || ''}</span>
                          <span className="text-zinc-400 font-semibold">{dateObj.getDate()}</span>
                        </div>
                      </th>
                    );
                  })}
                  <th className="px-3 py-3 text-center text-zinc-500 font-semibold uppercase tracking-wider min-w-[80px]">Resumen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#161616]">
                {students.map((student: any) => {
                  const summary = getAttSummary(student.id);
                  const pct = summary.total > 0 ? Math.round(((summary.present + summary.late) / summary.total) * 100) : 0;
                  const isInactive = student.status !== 'active';
                  return (
                    <tr key={student.id} className={cn('group/row transition-colors', isInactive ? 'opacity-50' : 'hover:bg-white/[0.02]')}>
                      <td className="px-4 py-2.5 sticky left-0 bg-[#0d0d0d] group-hover/row:bg-[#121212] z-10 transition-colors">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center shrink-0 text-[9px] font-bold text-zinc-400">
                            {student.first_name.charAt(0)}{student.last_name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-white font-medium text-xs">{student.first_name} {student.last_name}</p>
                            {isInactive && <p className="text-zinc-600 text-[9px]">Inactivo</p>}
                          </div>
                        </div>
                      </td>
                      {classDates.map(d => {
                        const status = records[d]?.[student.id];
                        const meta = status ? ATT_STATUS[status] : ATT_STATUS.none;
                        const isSaving = saving === `${d}-${student.id}`;
                        return (
                          <td key={d} className="px-1 py-2.5 text-center">
                            <button
                              onClick={() => !isInactive && cycleStatus(student.id, d)}
                              disabled={isInactive || !!saving}
                              title={meta.title}
                              className={cn(
                                'w-8 h-8 rounded-lg flex items-center justify-center mx-auto font-bold transition-all border',
                                meta.bg, meta.color,
                                !isInactive && 'hover:scale-110 hover:shadow-lg',
                                isSaving && 'opacity-50'
                              )}
                            >
                              {isSaving ? (
                                <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <span className="text-[10px]">{meta.label}</span>
                              )}
                            </button>
                          </td>
                        );
                      })}
                      <td className="px-3 py-2.5 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className={cn('text-xs font-bold',
                            pct >= 80 ? 'text-emerald-400' : pct >= 60 ? 'text-amber-400' : 'text-red-400'
                          )}>{pct}%</span>
                          <div className="flex items-center gap-1 text-[9px] text-zinc-600">
                            <span className="text-emerald-400">{summary.present}P</span>
                            <span className="text-red-400">{summary.absent}A</span>
                            {summary.late > 0 && <span className="text-amber-400">{summary.late}T</span>}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {/* Totals row */}
              <tfoot>
                <tr className="border-t border-[#2a2a2a]">
                  <td className="px-4 py-2.5 sticky left-0 bg-[#0d0d0d] z-10">
                    <span className="text-zinc-500 text-[10px] font-semibold uppercase tracking-wider">Totales presentes</span>
                  </td>
                  {classDates.map(d => {
                    const presentCount = students.filter(s => records[d]?.[s.id] === 'present' || records[d]?.[s.id] === 'late').length;
                    return (
                      <td key={d} className="px-1 py-2.5 text-center">
                        <span className={cn('text-xs font-semibold', presentCount > 0 ? 'text-zinc-300' : 'text-zinc-700')}>
                          {presentCount || '—'}
                        </span>
                      </td>
                    );
                  })}
                  <td className="px-3 py-2.5 text-center">
                    <span className="text-zinc-600 text-[10px]">{classDates.length} clases</span>
                  </td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Group Modal ─────────────────────────────────────────────────────────────
function GroupModal({ group, disciplines, employees, onClose, onSave, onDelete }: {
  group: Group | null;
  disciplines: Discipline[];
  employees: Employee[];
  onClose: () => void;
  onSave: () => void;
  onDelete?: () => void;
}) {
  const [saving, setSaving]       = useState(false);
  const [deleting, setDeleting]   = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const [error, setError]         = useState('');
  const [schedule, setSchedule]   = useState<any[]>(
    group?.schedule && Array.isArray(group.schedule) ? group.schedule : []
  );
  const [form, setForm] = useState({
    name:          group?.name || '',
    discipline_id: group?.discipline_id || '',
    instructor_id: group?.instructor_id || '',
    level:         group?.level || 'beginner',
    min_age:       group?.min_age || '',
    max_age:       group?.max_age || '',
    capacity:      group?.capacity || 15,
    monthly_fee:   group ? group.monthly_fee / 100 : 0,
    days_per_week: group?.days_per_week || 2,
    is_active:     group?.is_active ?? true,
    notes:         group?.notes || '',
  });

  const addSlot = () => setSchedule([...schedule, { day: 'monday', start_time: '09:00', end_time: '10:00' }]);
  const removeSlot = (i: number) => setSchedule(schedule.filter((_, idx) => idx !== i));
  const updateSlot = (i: number, field: string, value: string) =>
    setSchedule(schedule.map((s, idx) => idx === i ? { ...s, [field]: value } : s));

  const handleSave = async () => {
    if (!form.name.trim() || !form.discipline_id) { setError('Nombre y disciplina son obligatorios'); return; }
    setSaving(true); setError('');
    try {
      const payload = {
        ...form,
        monthly_fee:  Math.round(form.monthly_fee * 100),
        min_age:      form.min_age ? parseInt(String(form.min_age)) : null,
        max_age:      form.max_age ? parseInt(String(form.max_age)) : null,
        instructor_id: form.instructor_id || null,
        schedule, days_per_week: schedule.length || form.days_per_week,
      };
      if (group) {
        const { error: e } = await supabase.from('groups').update(payload as any).eq('id', group.id);
        if (e) throw e;
      } else {
        const { error: e } = await supabase.from('groups').insert(payload as any);
        if (e) throw e;
      }
      onSave();
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!group) return;
    setDeleting(true);
    await supabase.from('groups').update({ is_active: false }).eq('id', group.id);
    setDeleting(false);
    onDelete?.();
    onSave();
  };

  const inputClass = "w-full h-10 rounded-lg bg-[#0d0d0d] border border-[#2a2a2a] px-3 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/10 transition-all";
  const labelClass = "text-xs font-medium text-zinc-400 mb-1.5 block";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#111111] border border-[#252525] rounded-2xl w-full max-w-lg max-h-[92vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1a1a1a]">
          <h2 className="text-white font-semibold text-sm">{group ? 'Editar grupo' : 'Nuevo grupo'}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/[0.08] transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {error && <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-red-400 text-xs">{error}</div>}

          <div><label className={labelClass}>Nombre *</label><input className={inputClass} placeholder="Ej: Gimnasia Inicial L/M" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Disciplina *</label>
              <select className={inputClass} value={form.discipline_id} onChange={e => setForm({ ...form, discipline_id: e.target.value })}>
                <option value="">Seleccionar</option>
                {disciplines.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Nivel</label>
              <select className={inputClass} value={form.level} onChange={e => setForm({ ...form, level: e.target.value as any })}>
                {Object.entries(LEVELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass}>Profesor</label>
            <select className={inputClass} value={form.instructor_id} onChange={e => setForm({ ...form, instructor_id: e.target.value })}>
              <option value="">Sin asignar</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div><label className={labelClass}>Edad mín.</label><input type="number" className={inputClass} placeholder="3" value={form.min_age} onChange={e => setForm({ ...form, min_age: e.target.value as any })} /></div>
            <div><label className={labelClass}>Edad máx.</label><input type="number" className={inputClass} placeholder="12" value={form.max_age} onChange={e => setForm({ ...form, max_age: e.target.value as any })} /></div>
            <div><label className={labelClass}>Capacidad</label><input type="number" className={inputClass} placeholder="15" value={form.capacity} onChange={e => setForm({ ...form, capacity: parseInt(e.target.value) || 15 })} /></div>
          </div>

          <div><label className={labelClass}>Cuota mensual (ARS)</label><input type="number" className={inputClass} placeholder="15000" value={form.monthly_fee} onChange={e => setForm({ ...form, monthly_fee: parseFloat(e.target.value) || 0 })} /></div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className={labelClass + ' mb-0'}>Horarios</label>
              <button onClick={addSlot} className="text-cyan-400 text-xs font-medium hover:text-cyan-300 flex items-center gap-1 transition-colors"><Plus className="w-3 h-3" />Agregar</button>
            </div>
            <div className="space-y-2">
              {schedule.map((slot, i) => (
                <div key={i} className="grid grid-cols-[1fr_auto_auto_auto] gap-2 items-center">
                  <select className={inputClass} value={slot.day} onChange={e => updateSlot(i, 'day', e.target.value)}>
                    {Object.entries(DAYS_ES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                  <input type="time" className="h-10 rounded-lg bg-[#0d0d0d] border border-[#2a2a2a] px-3 text-white text-sm focus:outline-none focus:border-cyan-500/40 w-28" value={slot.start_time} onChange={e => updateSlot(i, 'start_time', e.target.value)} />
                  <input type="time" className="h-10 rounded-lg bg-[#0d0d0d] border border-[#2a2a2a] px-3 text-white text-sm focus:outline-none focus:border-cyan-500/40 w-28" value={slot.end_time} onChange={e => updateSlot(i, 'end_time', e.target.value)} />
                  <button onClick={() => removeSlot(i)} className="text-zinc-600 hover:text-red-400 transition-colors"><X className="w-4 h-4" /></button>
                </div>
              ))}
              {schedule.length === 0 && <p className="text-zinc-700 text-xs italic">Sin horarios asignados</p>}
            </div>
          </div>

          {group && (
            <div className="border-t border-[#1a1a1a] pt-4">
              {!confirmDel ? (
                <button onClick={() => setConfirmDel(true)} className="flex items-center gap-2 text-red-400 text-xs font-medium hover:text-red-300 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" /> Eliminar grupo
                </button>
              ) : (
                <div className="p-3 bg-red-500/8 border border-red-500/20 rounded-xl">
                  <p className="text-red-300 text-xs font-medium mb-2">¿Desactivar este grupo permanentemente?</p>
                  <div className="flex gap-2">
                    <button onClick={() => setConfirmDel(false)} className="px-3 py-1.5 rounded-lg border border-[#2a2a2a] text-zinc-400 text-xs hover:text-white transition-all">Cancelar</button>
                    <button onClick={handleDelete} disabled={deleting} className="px-3 py-1.5 rounded-lg bg-red-500 hover:bg-red-400 text-white text-xs font-semibold transition-all disabled:opacity-50">
                      {deleting ? 'Eliminando...' : 'Confirmar'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-[#1a1a1a]">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border border-[#2a2a2a] text-zinc-400 text-sm hover:text-white hover:border-[#3a3a3a] transition-all">Cancelar</button>
          <button onClick={handleSave} disabled={saving} className="px-5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-white text-sm font-semibold transition-all disabled:opacity-50 flex items-center gap-2">
            {saving && <div className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" />}
            {group ? 'Guardar cambios' : 'Crear grupo'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function GroupsPage() {
  const [groups, setGroups]               = useState<Group[]>([]);
  const [disciplines, setDisciplines]     = useState<Discipline[]>([]);
  const [employees, setEmployees]         = useState<Employee[]>([]);
  const [loading, setLoading]             = useState(true);
  const [search, setSearch]               = useState('');
  const [filterDiscipline, setFilterDiscipline] = useState('');
  const [filterInstructor, setFilterInstructor] = useState('');
  const [showModal, setShowModal]         = useState(false);
  const [editGroup, setEditGroup]         = useState<Group | null>(null);
  const [attendanceGroup, setAttendanceGroup] = useState<Group | null>(null);
  const [enrollmentCounts, setEnrollmentCounts] = useState<Record<string, number>>({});

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    const [groupsRes, disciplinesRes, employeesRes, countsRes] = await Promise.all([
      supabase.from('groups').select('*, discipline:disciplines(*), instructor:employees(*)').eq('is_active', true).order('name'),
      supabase.from('disciplines').select('*').eq('is_active', true).order('sort_order'),
      supabase.from('employees').select('*').eq('status', 'active').order('first_name'),
      supabase.from('student_groups').select('group_id').eq('status', 'active'),
    ]);
    if (groupsRes.data) setGroups(groupsRes.data as Group[]);
    if (disciplinesRes.data) setDisciplines(disciplinesRes.data);
    if (employeesRes.data) setEmployees(employeesRes.data);
    if (countsRes.data) {
      const counts: Record<string, number> = {};
      countsRes.data.forEach((sg: any) => { counts[sg.group_id] = (counts[sg.group_id] || 0) + 1; });
      setEnrollmentCounts(counts);
    }
    setLoading(false);
  };

  const filteredGroups = groups.filter(g => {
    const disc = g.discipline as any;
    const instr = g.instructor as any;
    const matchSearch = search === '' ||
      g.name.toLowerCase().includes(search.toLowerCase()) ||
      disc?.name?.toLowerCase().includes(search.toLowerCase());
    const matchDisc = filterDiscipline === '' || g.discipline_id === filterDiscipline;
    const matchInstr = filterInstructor === '' || g.instructor_id === filterInstructor;
    return matchSearch && matchDisc && matchInstr;
  });

  const groupedByDiscipline: Record<string, Group[]> = {};
  filteredGroups.forEach(g => {
    const discName = (g.discipline as any)?.name || 'Sin disciplina';
    if (!groupedByDiscipline[discName]) groupedByDiscipline[discName] = [];
    groupedByDiscipline[discName].push(g);
  });

  const hasFilters = search || filterDiscipline || filterInstructor;
  const clearFilters = () => { setSearch(''); setFilterDiscipline(''); setFilterInstructor(''); };

  const totalStudents = groups.reduce((s, g) => s + (enrollmentCounts[g.id] || 0), 0);

  return (
    <div className="flex-1 flex flex-col">
      <Header title="Grupos" subtitle="Gestión de grupos, horarios y asistencias" />

      <div className="flex-1 p-6 space-y-5 animate-fade-in">

        {/* Summary stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {disciplines.slice(0, 4).map(disc => {
            const discGroups = groups.filter(g => g.discipline_id === disc.id);
            const discStudents = discGroups.reduce((s, g) => s + (enrollmentCounts[g.id] || 0), 0);
            return (
              <button
                key={disc.id}
                onClick={() => setFilterDiscipline(filterDiscipline === disc.id ? '' : disc.id)}
                className={cn(
                  'flex items-center gap-3 p-4 rounded-xl border transition-all text-left group',
                  filterDiscipline === disc.id
                    ? 'border-[#2a2a2a] bg-white/[0.04]'
                    : 'bg-[#111111] border-[#1f1f1f] hover:border-[#2a2a2a]'
                )}
              >
                <div className="w-2.5 h-2.5 rounded-full shrink-0 mt-0.5" style={{ backgroundColor: disc.color }} />
                <div className="min-w-0">
                  <p className="text-white text-lg font-bold">{discGroups.length}</p>
                  <p className="text-zinc-500 text-[10px] truncate">{disc.name}</p>
                  <p className="text-zinc-700 text-[10px]">{discStudents} alumnos</p>
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
              placeholder="Buscar grupos o disciplinas..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full h-10 pl-9 pr-4 rounded-lg bg-[#0f0f0f] border border-[#1e1e1e] text-white text-sm placeholder:text-zinc-700 focus:outline-none focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/10 transition-all"
            />
            {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"><X className="w-3.5 h-3.5" /></button>}
          </div>

          {/* Discipline filter */}
          <select
            value={filterDiscipline}
            onChange={e => setFilterDiscipline(e.target.value)}
            className="h-10 px-3 rounded-lg bg-[#0f0f0f] border border-[#1e1e1e] text-sm text-zinc-300 focus:outline-none focus:border-cyan-500/40 transition-all shrink-0"
          >
            <option value="">Todas las disciplinas</option>
            {disciplines.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>

          {/* Instructor filter */}
          <select
            value={filterInstructor}
            onChange={e => setFilterInstructor(e.target.value)}
            className="h-10 px-3 rounded-lg bg-[#0f0f0f] border border-[#1e1e1e] text-sm text-zinc-300 focus:outline-none focus:border-cyan-500/40 transition-all shrink-0"
          >
            <option value="">Todos los profesores</option>
            {employees.map(e => <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>)}
          </select>

          {hasFilters && (
            <button onClick={clearFilters} className="flex items-center gap-1.5 h-10 px-3 rounded-lg border border-[#2a2a2a] text-zinc-500 text-sm hover:text-white hover:border-[#3a3a3a] transition-all shrink-0">
              <X className="w-3.5 h-3.5" /> Limpiar
            </button>
          )}

          <button
            onClick={() => { setEditGroup(null); setShowModal(true); }}
            className="flex items-center gap-2 h-10 px-4 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-white text-sm font-semibold transition-all shrink-0"
          >
            <Plus className="w-4 h-4" /> Nuevo grupo
          </button>
        </div>

        {/* Groups */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-[#111111] border border-[#1f1f1f] rounded-xl p-5 h-48 animate-pulse" />
            ))}
          </div>
        ) : filteredGroups.length === 0 ? (
          <div className="bg-[#111111] border border-[#1f1f1f] rounded-xl p-14 text-center">
            <BookOpen className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
            <p className="text-zinc-500 text-sm">{hasFilters ? 'No hay grupos con ese filtro' : 'No hay grupos creados'}</p>
            {!hasFilters && (
              <button onClick={() => setShowModal(true)} className="mt-3 text-cyan-400 text-sm font-medium hover:text-cyan-300 transition-colors">
                Crear el primer grupo →
              </button>
            )}
            {hasFilters && (
              <button onClick={clearFilters} className="mt-3 text-zinc-400 text-sm hover:text-white transition-colors">
                Limpiar filtros
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedByDiscipline).map(([discName, discGroups]) => {
              const disc = disciplines.find(d => d.name === discName);
              return (
                <div key={discName}>
                  {/* Section header */}
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: disc?.color || '#f59e0b' }} />
                    <h3 className="text-white font-semibold text-sm">{discName}</h3>
                    <span className="text-zinc-600 text-xs">{discGroups.length} {discGroups.length === 1 ? 'grupo' : 'grupos'}</span>
                    <div className="flex-1 h-px bg-[#1a1a1a]" />
                    <span className="text-zinc-600 text-xs">
                      {discGroups.reduce((s, g) => s + (enrollmentCounts[g.id] || 0), 0)} alumnos en total
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                    {discGroups.map(group => {
                      const enrolled = enrollmentCounts[group.id] || 0;
                      const occupancy = group.capacity > 0 ? (enrolled / group.capacity) * 100 : 0;
                      const schedule = Array.isArray(group.schedule) ? group.schedule : [];
                      const instr = group.instructor as any;
                      const disciplineData = group.discipline as any;
                      const isFull = occupancy >= 100;
                      const isNearFull = occupancy >= 75 && !isFull;

                      return (
                        <div key={group.id} className="bg-[#111111] border border-[#1f1f1f] rounded-xl overflow-hidden hover:border-[#2a2a2a] transition-all group/card">
                          {/* Top accent line */}
                          <div className="h-0.5" style={{ backgroundColor: disciplineData?.color || '#06b6d4' }} />

                          <div className="p-5">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1 min-w-0">
                                <h4 className="text-white font-semibold text-sm truncate">{group.name}</h4>
                                <span className={cn('inline-block mt-1 text-[10px] font-medium px-1.5 py-0.5 rounded border', LEVEL_COLORS[group.level])}>
                                  {LEVELS[group.level]}
                                </span>
                              </div>
                              {/* Action buttons */}
                              <div className="flex items-center gap-1 ml-2 opacity-0 group-hover/card:opacity-100 transition-opacity">
                                <button
                                  onClick={() => setAttendanceGroup(group)}
                                  className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-500 hover:text-cyan-400 hover:bg-cyan-500/10 transition-all"
                                  title="Planilla de asistencias"
                                >
                                  <ClipboardList className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => { setEditGroup(group); setShowModal(true); }}
                                  className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/[0.08] transition-all"
                                  title="Editar"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Schedule badges */}
                            {schedule.length > 0 ? (
                              <div className="flex flex-wrap gap-1 mb-3">
                                {schedule.map((slot: any, i: number) => (
                                  <span key={i} className="inline-flex items-center gap-1 text-[10px] bg-white/[0.04] border border-white/[0.06] text-zinc-400 px-2 py-1 rounded-lg">
                                    <Clock className="w-2.5 h-2.5 text-zinc-600" />
                                    {DAYS_ES[slot.day] || slot.day} {slot.start_time}–{slot.end_time}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <p className="text-zinc-700 text-[10px] italic mb-3">Sin horarios asignados</p>
                            )}

                            {/* Instructor */}
                            <div className="flex items-center justify-between mb-3">
                              {instr ? (
                                <div className="flex items-center gap-1.5">
                                  <div className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center">
                                    <User className="w-2.5 h-2.5 text-zinc-500" />
                                  </div>
                                  <span className="text-zinc-400 text-xs">{instr.first_name} {instr.last_name}</span>
                                </div>
                              ) : (
                                <span className="text-zinc-700 text-xs italic">Sin profesor</span>
                              )}
                              {(group.min_age || group.max_age) && (
                                <span className="text-zinc-600 text-[10px]">
                                  {group.min_age && group.max_age ? `${group.min_age}–${group.max_age} años` : group.min_age ? `+${group.min_age} años` : `hasta ${group.max_age} años`}
                                </span>
                              )}
                            </div>

                            {/* Occupancy bar */}
                            <div>
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-zinc-600 text-[10px]">Ocupación</span>
                                <div className="flex items-center gap-1.5">
                                  <span className={cn('text-[10px] font-semibold',
                                    isFull ? 'text-red-400' : isNearFull ? 'text-amber-400' : 'text-zinc-400'
                                  )}>{enrolled}/{group.capacity}</span>
                                  {isFull && <span className="text-[9px] font-bold text-red-400 bg-red-500/10 px-1 py-0.5 rounded">Lleno</span>}
                                  {isNearFull && <span className="text-[9px] font-bold text-amber-400 bg-amber-500/10 px-1 py-0.5 rounded">Casi lleno</span>}
                                </div>
                              </div>
                              <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                                <div
                                  className={cn('h-full rounded-full transition-all duration-500',
                                    isFull ? 'bg-red-500' : isNearFull ? 'bg-amber-500' : 'bg-emerald-500'
                                  )}
                                  style={{ width: `${Math.min(occupancy, 100)}%` }}
                                />
                              </div>
                            </div>

                            {/* Fee */}
                            {group.monthly_fee > 0 && (
                              <div className="mt-3 pt-3 border-t border-[#1a1a1a] flex items-center justify-between">
                                <span className="text-zinc-600 text-[10px]">Cuota mensual</span>
                                <span className="text-zinc-300 text-xs font-semibold">
                                  ${(group.monthly_fee / 100).toLocaleString('es-AR')}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer info */}
        {filteredGroups.length > 0 && (
          <p className="text-zinc-700 text-xs text-center pb-2">
            {filteredGroups.length} grupos · {totalStudents} alumnos en total
          </p>
        )}
      </div>

      {showModal && (
        <GroupModal
          group={editGroup}
          disciplines={disciplines}
          employees={employees}
          onClose={() => { setShowModal(false); setEditGroup(null); }}
          onSave={() => { setShowModal(false); setEditGroup(null); fetchAll(); }}
        />
      )}

      {attendanceGroup && (
        <AttendanceModal
          group={attendanceGroup}
          onClose={() => setAttendanceGroup(null)}
        />
      )}
    </div>
  );
}
