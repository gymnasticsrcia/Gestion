'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { Student } from '@/lib/types';
import { X, Plus, Trash2, Phone, Heart, FileText, Percent, Users, Paperclip, ClipboardList, ChevronDown, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StudentModalProps {
  student: Student | null;
  onClose: () => void;
  onSave: () => void;
}

const TABS = [
  { label: 'Personal',     icon: Users },
  { label: 'Contacto',     icon: Phone },
  { label: 'Médico',       icon: Heart },
  { label: 'Financiero',   icon: Percent },
  { label: 'Inscripción',  icon: ClipboardList },
  { label: 'Documentos',   icon: Paperclip },
];

const DOC_TYPES = [
  { value: 'enrollment_contract', label: 'Contrato de inscripción' },
  { value: 'insurance',           label: 'Seguro médico' },
  { value: 'medical_certificate', label: 'Certificado médico' },
  { value: 'authorization',       label: 'Autorización' },
  { value: 'id_copy',             label: 'Copia DNI' },
  { value: 'other',               label: 'Otro' },
];

const SHIRT_SIZES = ['2', '4', '6', '8', '10', '12', '14', 'XS', 'S', 'M', 'L', 'XL', 'XXL'];

export default function StudentModal({ student, onClose, onSave }: StudentModalProps) {
  const [activeTab, setActiveTab] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [disciplines, setDisciplines] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [selectedDiscipline, setSelectedDiscipline] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [existingGroups, setExistingGroups] = useState<any[]>([]);

  const [form, setForm] = useState({
    first_name: '', last_name: '', dni: '', birth_date: '', gender: '',
    school: '', address: '', phone: '', whatsapp: '', email: '',
    medical_notes: '', blood_type: '', has_medical_insurance: false,
    insurance_details: '', has_scholarship: false, scholarship_percentage: 0,
    sibling_discount: false, sibling_discount_percentage: 10,
    status: 'active', enrollment_date: new Date().toISOString().split('T')[0], notes: '',
  });

  const [guardians, setGuardians] = useState([{
    full_name: '', relationship: 'mother', phone: '', whatsapp: '', email: '', is_primary: true,
  }]);

  const [enrollment, setEnrollment] = useState({
    year: new Date().getFullYear(), status: 'enrolled',
    enrollment_date: new Date().toISOString().split('T')[0],
    shirt_size: '', contract_signed: false, observations: '',
  });

  const [documents, setDocuments] = useState<{ name: string; type: string; file_url: string; file_name: string; notes: string }[]>([]);

  useEffect(() => {
    fetchDisciplines();
    if (student) {
      setForm({
        first_name: student.first_name || '', last_name: student.last_name || '',
        dni: student.dni || '', birth_date: student.birth_date || '', gender: student.gender || '',
        school: student.school || '', address: student.address || '', phone: student.phone || '',
        whatsapp: student.whatsapp || '', email: student.email || '',
        medical_notes: student.medical_notes || '', blood_type: student.blood_type || '',
        has_medical_insurance: student.has_medical_insurance || false,
        insurance_details: student.insurance_details || '',
        has_scholarship: student.has_scholarship || false,
        scholarship_percentage: student.scholarship_percentage || 0,
        sibling_discount: student.sibling_discount || false,
        sibling_discount_percentage: student.sibling_discount_percentage || 10,
        status: student.status || 'active',
        enrollment_date: student.enrollment_date || new Date().toISOString().split('T')[0],
        notes: student.notes || '',
      });
      if (student.guardians?.length) {
        setGuardians(student.guardians.map(g => ({
          full_name: g.full_name, relationship: g.relationship,
          phone: g.phone || '', whatsapp: g.whatsapp || '', email: g.email || '', is_primary: g.is_primary,
        })));
      }
      fetchStudentData(student.id);
    }
  }, [student]);

  const fetchDisciplines = async () => {
    const { data } = await supabase.from('disciplines').select('*').eq('is_active', true).order('sort_order');
    if (data) setDisciplines(data);
  };

  const fetchStudentData = async (studentId: string) => {
    const [enrollmentRes, docsRes, groupsRes] = await Promise.all([
      supabase.from('student_annual_enrollments').select('*').eq('student_id', studentId).eq('year', new Date().getFullYear()).maybeSingle(),
      supabase.from('student_documents').select('*').eq('student_id', studentId).order('created_at'),
      supabase.from('student_groups').select('*, group:groups(*, discipline:disciplines(*))').eq('student_id', studentId).eq('status', 'active'),
    ]);
    if (enrollmentRes.data) {
      setEnrollment({ year: enrollmentRes.data.year, status: enrollmentRes.data.status, enrollment_date: enrollmentRes.data.enrollment_date || '', shirt_size: enrollmentRes.data.shirt_size || '', contract_signed: enrollmentRes.data.contract_signed || false, observations: enrollmentRes.data.observations || '' });
    }
    if (docsRes.data) {
      setDocuments(docsRes.data.map((d: any) => ({ name: d.name, type: d.type, file_url: d.file_url || '', file_name: d.file_name || '', notes: d.notes || '' })));
    }
    if (groupsRes.data) setExistingGroups(groupsRes.data);
  };

  useEffect(() => {
    if (selectedDiscipline) {
      supabase.from('groups').select('*, instructor:employees(first_name, last_name)').eq('discipline_id', selectedDiscipline).eq('is_active', true).then(({ data }) => {
        setGroups(data || []);
        setSelectedGroup('');
      });
    } else {
      setGroups([]);
    }
  }, [selectedDiscipline]);

  const handleAddGroup = async () => {
    if (!selectedGroup || !student?.id) return;
    await supabase.from('student_groups').upsert({ student_id: student.id, group_id: selectedGroup, status: 'active', enrolled_at: new Date().toISOString() });
    fetchStudentData(student.id);
    setSelectedGroup('');
    setSelectedDiscipline('');
  };

  const handleRemoveGroup = async (sgId: string) => {
    await supabase.from('student_groups').delete().eq('id', sgId);
    if (student?.id) fetchStudentData(student.id);
  };

  const handleSave = async () => {
    if (!form.first_name.trim() || !form.last_name.trim()) {
      setError('El nombre y apellido son obligatorios'); setActiveTab(0); return;
    }
    setSaving(true); setError('');
    try {
      let studentId = student?.id;
      if (student) {
        const { error: e } = await supabase.from('students').update(form as any).eq('id', student.id);
        if (e) throw e;
      } else {
        const { data, error: e } = await supabase.from('students').insert(form as any).select().single();
        if (e) throw e;
        studentId = data.id;
      }
      if (studentId) {
        if (student) await supabase.from('student_guardians').delete().eq('student_id', studentId);
        const toInsert = guardians.filter(g => g.full_name.trim()).map(g => ({ ...g, student_id: studentId! }));
        if (toInsert.length > 0) await supabase.from('student_guardians').insert(toInsert as any);

        await supabase.from('student_annual_enrollments').upsert({ ...enrollment, student_id: studentId }, { onConflict: 'student_id,year' });

        if (documents.length > 0) {
          const existingDocs = await supabase.from('student_documents').select('id').eq('student_id', studentId);
          const existingIds = (existingDocs.data || []).map((d: any) => d.id);
          if (existingIds.length) await supabase.from('student_documents').delete().eq('student_id', studentId);
          const docsToInsert = documents.filter(d => d.name.trim()).map(d => ({ ...d, student_id: studentId! }));
          if (docsToInsert.length > 0) await supabase.from('student_documents').insert(docsToInsert as any);
        }
      }
      onSave();
    } catch (e: any) {
      setError(e.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const addGuardian = () => setGuardians([...guardians, { full_name: '', relationship: 'father', phone: '', whatsapp: '', email: '', is_primary: false }]);
  const removeGuardian = (i: number) => setGuardians(guardians.filter((_, idx) => idx !== i));
  const updateGuardian = (i: number, field: string, value: any) => setGuardians(guardians.map((g, idx) => idx === i ? { ...g, [field]: value } : g));

  const addDocument = () => setDocuments([...documents, { name: '', type: 'other', file_url: '', file_name: '', notes: '' }]);
  const removeDocument = (i: number) => setDocuments(documents.filter((_, idx) => idx !== i));
  const updateDocument = (i: number, field: string, value: string) => setDocuments(documents.map((d, idx) => idx === i ? { ...d, [field]: value } : d));

  const inputClass = "w-full h-10 rounded-lg bg-[#0d0d0d] border border-[#2a2a2a] px-3 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/10 transition-all";
  const labelClass = "text-xs font-medium text-zinc-400 mb-1.5 block";

  const selectedGroupData = groups.find(g => g.id === selectedGroup);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#111111] border border-[#252525] rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl" style={{ animation: 'slideUp 0.2s ease-out' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1a1a1a]">
          <div>
            <h2 className="text-white font-semibold text-sm">{student ? 'Editar alumno' : 'Nuevo alumno'}</h2>
            <p className="text-zinc-500 text-xs mt-0.5">{student ? `${student.first_name} ${student.last_name}` : 'Completá los datos del alumno'}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/[0.08] transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#1a1a1a] px-2 overflow-x-auto">
          {TABS.map((tab, i) => {
            const Icon = tab.icon;
            return (
              <button key={tab.label} onClick={() => setActiveTab(i)} className={cn(
                'flex items-center gap-1.5 px-3 py-3 text-xs font-medium border-b-2 whitespace-nowrap transition-all',
                activeTab === i ? 'text-cyan-400 border-cyan-500' : 'text-zinc-500 border-transparent hover:text-zinc-300'
              )}>
                <Icon className="w-3 h-3" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {error && <div className="mb-4 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-red-400 text-xs">{error}</div>}

          {/* ── Personal ── */}
          {activeTab === 0 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelClass}>Nombre *</label><input className={inputClass} placeholder="Juan" value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} /></div>
                <div><label className={labelClass}>Apellido *</label><input className={inputClass} placeholder="García" value={form.last_name} onChange={e => setForm({ ...form, last_name: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelClass}>DNI</label><input className={inputClass} placeholder="12345678" value={form.dni} onChange={e => setForm({ ...form, dni: e.target.value })} /></div>
                <div><label className={labelClass}>Fecha de nacimiento</label><input type="date" className={inputClass} value={form.birth_date} onChange={e => setForm({ ...form, birth_date: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Género</label>
                  <select className={inputClass} value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })}>
                    <option value="">Seleccionar</option>
                    <option value="female">Femenino</option>
                    <option value="male">Masculino</option>
                    <option value="other">Otro</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Estado</label>
                  <select className={inputClass} value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                    <option value="active">Activo</option>
                    <option value="inactive">Inactivo</option>
                    <option value="suspended">Suspendido</option>
                    <option value="waiting">Lista de espera</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelClass}>Escuela / Colegio</label><input className={inputClass} placeholder="Colegio..." value={form.school} onChange={e => setForm({ ...form, school: e.target.value })} /></div>
                <div><label className={labelClass}>Fecha de inscripción</label><input type="date" className={inputClass} value={form.enrollment_date} onChange={e => setForm({ ...form, enrollment_date: e.target.value })} /></div>
              </div>
              <div>
                <label className={labelClass}>Observaciones</label>
                <textarea className="w-full rounded-lg bg-[#0d0d0d] border border-[#2a2a2a] px-3 py-2.5 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-cyan-500/40 resize-none" rows={3} placeholder="Notas adicionales..." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
              </div>

              {/* Group assignment */}
              <div className="border-t border-[#1a1a1a] pt-4">
                <p className="text-white text-xs font-semibold mb-3">Grupos asignados</p>
                {existingGroups.length > 0 && (
                  <div className="space-y-1.5 mb-3">
                    {existingGroups.map(sg => (
                      <div key={sg.id} className="flex items-center justify-between p-2.5 bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: sg.group?.discipline?.color || '#06b6d4' }} />
                          <div>
                            <p className="text-white text-xs font-medium">{sg.group?.name}</p>
                            <p className="text-zinc-600 text-[10px]">{sg.group?.discipline?.name}</p>
                          </div>
                        </div>
                        <button onClick={() => handleRemoveGroup(sg.id)} className="text-zinc-700 hover:text-red-400 transition-colors">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3 mb-2">
                  <div>
                    <label className={labelClass}>Disciplina</label>
                    <select className={inputClass} value={selectedDiscipline} onChange={e => setSelectedDiscipline(e.target.value)}>
                      <option value="">Seleccionar disciplina</option>
                      {disciplines.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Grupo</label>
                    <select className={inputClass} value={selectedGroup} onChange={e => setSelectedGroup(e.target.value)} disabled={!selectedDiscipline}>
                      <option value="">Seleccionar grupo</option>
                      {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                    </select>
                  </div>
                </div>
                {selectedGroupData && (
                  <div className="bg-cyan-500/5 border border-cyan-500/15 rounded-lg p-3 mb-2 text-xs space-y-1">
                    {selectedGroupData.instructor && <p className="text-zinc-400">Profesor: <span className="text-white">{selectedGroupData.instructor.first_name} {selectedGroupData.instructor.last_name}</span></p>}
                    {selectedGroupData.schedule?.length > 0 && (
                      <p className="text-zinc-400">Horarios: <span className="text-white">{selectedGroupData.schedule.map((s: any) => `${s.day} ${s.start_time}-${s.end_time}`).join(', ')}</span></p>
                    )}
                    {selectedGroupData.monthly_fee && <p className="text-zinc-400">Cuota: <span className="text-cyan-400 font-semibold">${(selectedGroupData.monthly_fee / 100).toLocaleString('es-AR')}</span></p>}
                  </div>
                )}
                {student && selectedGroup && (
                  <button onClick={handleAddGroup} className="text-cyan-400 text-xs font-medium hover:text-cyan-300 transition-colors">
                    + Agregar grupo
                  </button>
                )}
                {!student && selectedGroup && (
                  <p className="text-zinc-500 text-xs">El grupo se asignará al guardar</p>
                )}
              </div>
            </div>
          )}

          {/* ── Contacto ── */}
          {activeTab === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelClass}>Teléfono</label><input className={inputClass} placeholder="+54 9 11..." value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
                <div><label className={labelClass}>WhatsApp</label><input className={inputClass} placeholder="+54 9 11..." value={form.whatsapp} onChange={e => setForm({ ...form, whatsapp: e.target.value })} /></div>
              </div>
              <div><label className={labelClass}>Email</label><input type="email" className={inputClass} placeholder="alumno@email.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
              <div><label className={labelClass}>Dirección</label><input className={inputClass} placeholder="Calle 123, Ciudad" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
              <div className="border-t border-[#1a1a1a] pt-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-white text-xs font-semibold">Padres / Tutores</p>
                  <button onClick={addGuardian} className="flex items-center gap-1 text-cyan-400 text-xs font-medium hover:text-cyan-300 transition-colors"><Plus className="w-3 h-3" />Agregar</button>
                </div>
                <div className="space-y-3">
                  {guardians.map((g, idx) => (
                    <div key={idx} className="bg-[#0d0d0d] border border-[#2a2a2a] rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-400 text-xs font-medium">Tutor {idx + 1}</span>
                        {guardians.length > 1 && <button onClick={() => removeGuardian(idx)} className="text-zinc-600 hover:text-red-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div><label className={labelClass}>Nombre completo</label><input className={inputClass} placeholder="María García" value={g.full_name} onChange={e => updateGuardian(idx, 'full_name', e.target.value)} /></div>
                        <div>
                          <label className={labelClass}>Vínculo</label>
                          <select className={inputClass} value={g.relationship} onChange={e => updateGuardian(idx, 'relationship', e.target.value)}>
                            <option value="mother">Madre</option>
                            <option value="father">Padre</option>
                            <option value="guardian">Tutor/a</option>
                            <option value="grandparent">Abuelo/a</option>
                            <option value="sibling">Hermano/a</option>
                            <option value="other">Otro</option>
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div><label className={labelClass}>Tel. / WhatsApp</label><input className={inputClass} placeholder="+54 9..." value={g.whatsapp || g.phone} onChange={e => updateGuardian(idx, 'whatsapp', e.target.value)} /></div>
                        <div><label className={labelClass}>Email</label><input type="email" className={inputClass} placeholder="email@..." value={g.email} onChange={e => updateGuardian(idx, 'email', e.target.value)} /></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Médico ── */}
          {activeTab === 2 && (
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Observaciones médicas</label>
                <textarea className="w-full rounded-lg bg-[#0d0d0d] border border-[#2a2a2a] px-3 py-2.5 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-cyan-500/40 resize-none" rows={4} placeholder="Alergias, condiciones, restricciones..." value={form.medical_notes} onChange={e => setForm({ ...form, medical_notes: e.target.value })} />
              </div>
              <div>
                <label className={labelClass}>Grupo sanguíneo</label>
                <select className={inputClass} value={form.blood_type} onChange={e => setForm({ ...form, blood_type: e.target.value })}>
                  <option value="">No especificado</option>
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bt => <option key={bt} value={bt}>{bt}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-3 p-4 bg-[#0d0d0d] border border-[#2a2a2a] rounded-xl">
                <input type="checkbox" id="insurance" checked={form.has_medical_insurance} onChange={e => setForm({ ...form, has_medical_insurance: e.target.checked })} className="w-4 h-4 rounded border-zinc-600 accent-cyan-500" />
                <label htmlFor="insurance" className="text-white text-sm cursor-pointer">Tiene obra social / seguro médico</label>
              </div>
              {form.has_medical_insurance && (
                <div><label className={labelClass}>Detalle de obra social</label><input className={inputClass} placeholder="Nombre, nro. afiliado..." value={form.insurance_details} onChange={e => setForm({ ...form, insurance_details: e.target.value })} /></div>
              )}
            </div>
          )}

          {/* ── Financiero ── */}
          {activeTab === 3 && (
            <div className="space-y-4">
              <div className="bg-[#0d0d0d] border border-[#2a2a2a] rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <input type="checkbox" id="scholarship" checked={form.has_scholarship} onChange={e => setForm({ ...form, has_scholarship: e.target.checked })} className="w-4 h-4 rounded accent-cyan-500" />
                  <label htmlFor="scholarship" className="text-white text-sm font-medium cursor-pointer">Beca</label>
                </div>
                {form.has_scholarship && (
                  <div>
                    <label className={labelClass}>Porcentaje de beca</label>
                    <div className="flex items-center gap-3">
                      <input type="range" min={0} max={100} value={form.scholarship_percentage} onChange={e => setForm({ ...form, scholarship_percentage: parseInt(e.target.value) })} className="flex-1 accent-cyan-500" />
                      <span className="text-cyan-400 text-sm font-bold w-12 text-right">{form.scholarship_percentage}%</span>
                    </div>
                  </div>
                )}
              </div>
              <div className="bg-[#0d0d0d] border border-[#2a2a2a] rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <input type="checkbox" id="sibling" checked={form.sibling_discount} onChange={e => setForm({ ...form, sibling_discount: e.target.checked })} className="w-4 h-4 rounded accent-cyan-500" />
                  <label htmlFor="sibling" className="text-white text-sm font-medium cursor-pointer">Descuento por hermano</label>
                </div>
                {form.sibling_discount && (
                  <div>
                    <label className={labelClass}>Porcentaje de descuento</label>
                    <div className="flex items-center gap-3">
                      <input type="range" min={0} max={50} value={form.sibling_discount_percentage} onChange={e => setForm({ ...form, sibling_discount_percentage: parseInt(e.target.value) })} className="flex-1 accent-cyan-500" />
                      <span className="text-cyan-400 text-sm font-bold w-12 text-right">{form.sibling_discount_percentage}%</span>
                    </div>
                  </div>
                )}
              </div>
              <div className="bg-cyan-500/5 border border-cyan-500/15 rounded-xl p-4">
                <p className="text-cyan-400 text-xs font-medium mb-1">Descuento total aplicable</p>
                <p className="text-white text-2xl font-bold">
                  {Math.min((form.has_scholarship ? form.scholarship_percentage : 0) + (form.sibling_discount ? form.sibling_discount_percentage : 0), 100)}%
                </p>
              </div>
            </div>
          )}

          {/* ── Inscripción anual ── */}
          {activeTab === 4 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-[#0d0d0d] border border-[#2a2a2a] rounded-xl">
                <Clock className="w-4 h-4 text-zinc-500 shrink-0" />
                <p className="text-zinc-400 text-xs">Inscripción anual {enrollment.year}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Estado</label>
                  <select className={inputClass} value={enrollment.status} onChange={e => setEnrollment({ ...enrollment, status: e.target.value })}>
                    <option value="enrolled">Inscripto</option>
                    <option value="pending">Pendiente</option>
                    <option value="cancelled">Cancelado</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Fecha de inscripción</label>
                  <input type="date" className={inputClass} value={enrollment.enrollment_date} onChange={e => setEnrollment({ ...enrollment, enrollment_date: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Talle de remera</label>
                  <select className={inputClass} value={enrollment.shirt_size} onChange={e => setEnrollment({ ...enrollment, shirt_size: e.target.value })}>
                    <option value="">Sin asignar</option>
                    {SHIRT_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="flex flex-col justify-end">
                  <div className="flex items-center gap-3 h-10 px-3 bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg cursor-pointer" onClick={() => setEnrollment({ ...enrollment, contract_signed: !enrollment.contract_signed })}>
                    <input type="checkbox" checked={enrollment.contract_signed} readOnly className="w-4 h-4 accent-cyan-500 pointer-events-none" />
                    <span className="text-white text-sm">Contrato firmado</span>
                  </div>
                </div>
              </div>
              <div>
                <label className={labelClass}>Observaciones</label>
                <textarea className="w-full rounded-lg bg-[#0d0d0d] border border-[#2a2a2a] px-3 py-2.5 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-cyan-500/40 resize-none" rows={3} placeholder="Notas sobre la inscripción anual..." value={enrollment.observations} onChange={e => setEnrollment({ ...enrollment, observations: e.target.value })} />
              </div>

              {/* Status indicator */}
              <div className={cn('rounded-xl p-3 border flex items-center gap-3',
                enrollment.status === 'enrolled' ? 'bg-emerald-500/5 border-emerald-500/15' :
                enrollment.status === 'pending'  ? 'bg-amber-500/5 border-amber-500/15' :
                'bg-red-500/5 border-red-500/15'
              )}>
                <div className={cn('w-2 h-2 rounded-full',
                  enrollment.status === 'enrolled' ? 'bg-emerald-400' :
                  enrollment.status === 'pending'  ? 'bg-amber-400' : 'bg-red-400'
                )} />
                <p className={cn('text-xs font-medium',
                  enrollment.status === 'enrolled' ? 'text-emerald-400' :
                  enrollment.status === 'pending'  ? 'text-amber-400' : 'text-red-400'
                )}>
                  {enrollment.status === 'enrolled' ? 'Inscripción confirmada' : enrollment.status === 'pending' ? 'Inscripción pendiente de confirmación' : 'Inscripción cancelada'}
                  {enrollment.shirt_size && enrollment.status === 'enrolled' ? ` · Remera talle ${enrollment.shirt_size}` : ''}
                  {enrollment.contract_signed && enrollment.status === 'enrolled' ? ' · Contrato firmado' : ''}
                </p>
              </div>
            </div>
          )}

          {/* ── Documentos ── */}
          {activeTab === 5 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-1">
                <p className="text-zinc-400 text-xs">Adjuntar PDFs, imágenes u otros archivos</p>
                <button onClick={addDocument} className="flex items-center gap-1 text-cyan-400 text-xs font-medium hover:text-cyan-300 transition-colors">
                  <Plus className="w-3 h-3" /> Agregar
                </button>
              </div>
              {documents.length === 0 ? (
                <div className="border-2 border-dashed border-[#2a2a2a] rounded-xl p-8 text-center">
                  <Paperclip className="w-6 h-6 text-zinc-700 mx-auto mb-2" />
                  <p className="text-zinc-600 text-sm">Sin documentos adjuntos</p>
                  <button onClick={addDocument} className="mt-2 text-cyan-400 text-xs font-medium hover:text-cyan-300">Agregar documento →</button>
                </div>
              ) : (
                <div className="space-y-3">
                  {documents.map((doc, idx) => (
                    <div key={idx} className="bg-[#0d0d0d] border border-[#2a2a2a] rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-400 text-xs font-medium">Documento {idx + 1}</span>
                        <button onClick={() => removeDocument(idx)} className="text-zinc-600 hover:text-red-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div><label className={labelClass}>Nombre</label><input className={inputClass} placeholder="Ej: Contrato 2025" value={doc.name} onChange={e => updateDocument(idx, 'name', e.target.value)} /></div>
                        <div>
                          <label className={labelClass}>Tipo</label>
                          <select className={inputClass} value={doc.type} onChange={e => updateDocument(idx, 'type', e.target.value)}>
                            {DOC_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                          </select>
                        </div>
                      </div>
                      <div><label className={labelClass}>URL del archivo (Google Drive, Dropbox, etc.)</label><input className={inputClass} placeholder="https://..." value={doc.file_url} onChange={e => updateDocument(idx, 'file_url', e.target.value)} /></div>
                      <div><label className={labelClass}>Notas</label><input className={inputClass} placeholder="Notas sobre el documento..." value={doc.notes} onChange={e => updateDocument(idx, 'notes', e.target.value)} /></div>
                      {doc.file_url && (
                        <a href={doc.file_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-cyan-400 text-xs hover:text-cyan-300 transition-colors">
                          <FileText className="w-3 h-3" /> Abrir documento →
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#1a1a1a]">
          <div className="flex gap-1.5">
            {TABS.map((_, i) => (
              <button key={i} onClick={() => setActiveTab(i)} className={cn('w-1.5 h-1.5 rounded-full transition-all', activeTab === i ? 'bg-cyan-500' : 'bg-zinc-700 hover:bg-zinc-500')} />
            ))}
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-4 py-2 rounded-lg border border-[#2a2a2a] text-zinc-400 text-sm hover:text-white hover:border-[#3a3a3a] transition-all">Cancelar</button>
            <button onClick={handleSave} disabled={saving} className="px-5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-white text-sm font-semibold transition-all disabled:opacity-50 flex items-center gap-2">
              {saving && <div className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" />}
              {student ? 'Guardar cambios' : 'Crear alumno'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
