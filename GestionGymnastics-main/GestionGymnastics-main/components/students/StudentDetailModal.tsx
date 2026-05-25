'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { Student, Payment } from '@/lib/types';
import { X, Phone, MapPin, Calendar, CreditCard as Edit2, User, Heart, Users, CircleCheck as CheckCircle, CircleAlert as AlertCircle, Clock, QrCode, Printer, UserX, UserMinus, Trash2, Paperclip, FileText, ClipboardList, ShieldCheck, ShieldX } from 'lucide-react';
import { cn } from '@/lib/utils';

const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

const DOC_TYPE_LABELS: Record<string, string> = {
  enrollment_contract: 'Contrato', insurance: 'Seguro', medical_certificate: 'Certif. médico',
  authorization: 'Autorización', id_copy: 'DNI', other: 'Otro',
};

interface StudentDetailModalProps {
  student: Student;
  onClose: () => void;
  onEdit: () => void;
  onRefresh?: () => void;
}

type ActiveSection = 'info' | 'groups' | 'payments' | 'enrollment' | 'documents';

export default function StudentDetailModal({ student, onClose, onEdit, onRefresh }: StudentDetailModalProps) {
  const [payments, setPayments]       = useState<Payment[]>([]);
  const [groups, setGroups]           = useState<any[]>([]);
  const [enrollment, setEnrollment]   = useState<any>(null);
  const [documents, setDocuments]     = useState<any[]>([]);
  const [loading, setLoading]         = useState(true);
  const [section, setSection]         = useState<ActiveSection>('info');
  const [confirming, setConfirming]   = useState<string | null>(null);

  useEffect(() => { fetchDetails(); }, [student.id]);

  const fetchDetails = async () => {
    setLoading(true);
    const [paymentsRes, groupsRes, enrollmentRes, docsRes] = await Promise.all([
      supabase.from('payments').select('*').eq('student_id', student.id).order('year', { ascending: false }).order('month', { ascending: false }),
      supabase.from('student_groups').select('*, group:groups(*, discipline:disciplines(*))').eq('student_id', student.id).eq('status', 'active'),
      supabase.from('student_annual_enrollments').select('*').eq('student_id', student.id).eq('year', new Date().getFullYear()).maybeSingle(),
      supabase.from('student_documents').select('*').eq('student_id', student.id).order('created_at'),
    ]);
    if (paymentsRes.data) setPayments(paymentsRes.data as Payment[]);
    if (groupsRes.data) setGroups(groupsRes.data);
    if (enrollmentRes.data) setEnrollment(enrollmentRes.data);
    if (docsRes.data) setDocuments(docsRes.data);
    setLoading(false);
  };

  const getAge = () => {
    if (!student.birth_date) return null;
    return Math.floor((Date.now() - new Date(student.birth_date).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  };

  const formatCurrency = (cents: number) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(cents / 100);

  const overdueCount = payments.filter(p => p.status === 'overdue').length;
  const totalPaid    = payments.filter(p => p.status === 'paid').reduce((s, p) => s + p.final_amount, 0);
  const totalPending = payments.filter(p => p.status !== 'paid' && p.status !== 'cancelled').reduce((s, p) => s + p.final_amount, 0);

  const statusMeta: Record<string, { label: string; class: string; bg: string; border: string }> = {
    active:    { label: 'Activo',         class: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    inactive:  { label: 'Inactivo',       class: 'text-zinc-400',    bg: 'bg-zinc-500/10',    border: 'border-zinc-500/20' },
    suspended: { label: 'Suspendido',     class: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/20' },
    waiting:   { label: 'Lista espera',   class: 'text-blue-400',    bg: 'bg-blue-500/10',    border: 'border-blue-500/20' },
  };
  const sm = statusMeta[student.status] ?? statusMeta.inactive;

  const handleChangeStatus = async (newStatus: string) => {
    await supabase.from('students').update({ status: newStatus }).eq('id', student.id);
    setConfirming(null);
    onRefresh?.();
    onClose();
  };

  const handleDelete = async () => {
    await supabase.from('students').delete().eq('id', student.id);
    setConfirming(null);
    onRefresh?.();
    onClose();
  };

  const handlePrintCard = () => window.print();

  const navItems: { key: ActiveSection; label: string; icon: typeof User; badge?: number }[] = [
    { key: 'info',       label: 'Datos',       icon: User },
    { key: 'groups',     label: 'Grupos',      icon: Users,         badge: groups.length },
    { key: 'payments',   label: 'Pagos',        icon: CheckCircle,   badge: overdueCount || undefined },
    { key: 'enrollment', label: 'Inscripción',  icon: ClipboardList },
    { key: 'documents',  label: 'Documentos',   icon: Paperclip,     badge: documents.length || undefined },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#111111] border border-[#252525] rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl" style={{ animation: 'slideUp 0.2s ease-out' }}>

        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-[#1a1a1a]">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-cyan-500/20 to-cyan-700/10 border border-cyan-500/15 flex items-center justify-center shrink-0">
              <span className="text-cyan-400 font-bold text-base">{student.first_name.charAt(0)}{student.last_name.charAt(0)}</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-white font-semibold text-sm">{student.first_name} {student.last_name}</h2>
                <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded border', sm.class, sm.bg, sm.border)}>{sm.label}</span>
                {overdueCount >= 3 && (
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-red-500/15 border border-red-500/25 text-red-400">
                    {overdueCount} vencidas
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                {getAge() && <span className="text-zinc-500 text-xs">{getAge()} años</span>}
                {student.dni && <span className="text-zinc-600 text-xs">· DNI {student.dni}</span>}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Quick actions */}
            <button onClick={handlePrintCard} title="Imprimir carnet" className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/[0.07] transition-all">
              <Printer className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => alert('QR generado · Funcionalidad disponible con módulo de QR')} title="Generar QR" className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-500 hover:text-cyan-400 hover:bg-cyan-500/10 transition-all">
              <QrCode className="w-3.5 h-3.5" />
            </button>
            <button onClick={onEdit} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-cyan-500/20 text-cyan-400 text-xs font-medium hover:bg-cyan-500/10 transition-all">
              <Edit2 className="w-3 h-3" /> Editar
            </button>
            <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/[0.07] transition-all">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Nav tabs */}
        <div className="flex border-b border-[#1a1a1a] px-2">
          {navItems.map(item => {
            const Icon = item.icon;
            return (
              <button key={item.key} onClick={() => setSection(item.key)} className={cn(
                'flex items-center gap-1.5 px-3 py-3 text-xs font-medium border-b-2 transition-all relative',
                section === item.key ? 'text-cyan-400 border-cyan-500' : 'text-zinc-500 border-transparent hover:text-zinc-300'
              )}>
                <Icon className="w-3 h-3" />
                {item.label}
                {item.badge !== undefined && item.badge > 0 && (
                  <span className={cn('ml-0.5 text-[9px] font-bold px-1 py-0.5 rounded',
                    item.key === 'payments' && overdueCount > 0 ? 'bg-red-500/15 text-red-400' : 'bg-zinc-700 text-zinc-400'
                  )}>{item.badge}</span>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex-1 overflow-y-auto">

          {/* ── Info ── */}
          {section === 'info' && (
            <div className="p-5 space-y-5">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: Phone, label: 'WhatsApp / Tel.', value: student.whatsapp || student.phone },
                  { icon: MapPin, label: 'Dirección', value: student.address },
                  { icon: Calendar, label: 'Inscripción', value: student.enrollment_date ? new Date(student.enrollment_date).toLocaleDateString('es-AR') : null },
                  { icon: Heart, label: 'Grupo sanguíneo', value: student.blood_type },
                ].filter(i => i.value).map(item => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="flex items-center gap-2.5 p-3 bg-[#0d0d0d] border border-[#1e1e1e] rounded-xl">
                      <div className="w-7 h-7 rounded-lg bg-white/[0.04] flex items-center justify-center shrink-0">
                        <Icon className="w-3.5 h-3.5 text-zinc-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-zinc-600 text-[10px]">{item.label}</p>
                        <p className="text-white text-xs truncate">{item.value}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Medical */}
              {(student.medical_notes || student.has_medical_insurance) && (
                <div className="p-4 bg-[#0d0d0d] border border-[#1e1e1e] rounded-xl space-y-2">
                  <p className="text-zinc-500 text-[10px] font-semibold uppercase tracking-wider">Salud</p>
                  {student.medical_notes && <p className="text-zinc-300 text-xs">{student.medical_notes}</p>}
                  {student.has_medical_insurance && (
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <p className="text-emerald-400 text-xs">{student.insurance_details || 'Tiene obra social'}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Discounts */}
              {(student.has_scholarship || student.sibling_discount) && (
                <div className="p-4 bg-cyan-500/5 border border-cyan-500/15 rounded-xl">
                  <p className="text-cyan-400 text-[10px] font-semibold uppercase tracking-wider mb-2">Descuentos activos</p>
                  <div className="flex flex-wrap gap-2">
                    {student.has_scholarship && <span className="text-xs bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 px-2 py-1 rounded-lg">Beca {student.scholarship_percentage}%</span>}
                    {student.sibling_discount && <span className="text-xs bg-blue-500/10 text-blue-300 border border-blue-500/20 px-2 py-1 rounded-lg">Hermano {student.sibling_discount_percentage}%</span>}
                  </div>
                </div>
              )}

              {/* Guardians */}
              {student.guardians && student.guardians.length > 0 && (
                <div>
                  <p className="text-zinc-500 text-[10px] font-semibold uppercase tracking-wider mb-2">Padres / Tutores</p>
                  <div className="space-y-2">
                    {student.guardians.map(g => (
                      <div key={g.id} className="flex items-center justify-between p-3 bg-[#0d0d0d] border border-[#1e1e1e] rounded-xl">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center"><User className="w-3 h-3 text-zinc-500" /></div>
                          <div>
                            <p className="text-white text-xs font-medium">{g.full_name}</p>
                            <p className="text-zinc-600 text-[10px] capitalize">{g.relationship}</p>
                          </div>
                        </div>
                        {(g.whatsapp || g.phone) && (
                          <a href={`tel:${g.whatsapp || g.phone}`} className="text-zinc-400 text-xs hover:text-white transition-colors">{g.whatsapp || g.phone}</a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Danger actions */}
              <div className="border-t border-[#1a1a1a] pt-4">
                <p className="text-zinc-600 text-[10px] font-semibold uppercase tracking-wider mb-3">Acciones</p>
                <div className="flex flex-wrap gap-2">
                  {student.status !== 'suspended' && (
                    <button onClick={() => setConfirming('suspend')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/8 border border-amber-500/15 text-amber-400 text-xs font-medium hover:bg-amber-500/15 transition-all">
                      <UserMinus className="w-3.5 h-3.5" /> Suspender
                    </button>
                  )}
                  {student.status !== 'inactive' && (
                    <button onClick={() => setConfirming('inactive')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-500/8 border border-zinc-500/15 text-zinc-400 text-xs font-medium hover:bg-zinc-500/15 transition-all">
                      <UserX className="w-3.5 h-3.5" /> Inactivar
                    </button>
                  )}
                  {student.status !== 'active' && (
                    <button onClick={() => setConfirming('active')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/8 border border-emerald-500/15 text-emerald-400 text-xs font-medium hover:bg-emerald-500/15 transition-all">
                      <CheckCircle className="w-3.5 h-3.5" /> Activar
                    </button>
                  )}
                  <button onClick={() => setConfirming('delete')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/8 border border-red-500/15 text-red-400 text-xs font-medium hover:bg-red-500/15 transition-all">
                    <Trash2 className="w-3.5 h-3.5" /> Eliminar
                  </button>
                </div>

                {/* Confirm dialogs */}
                {confirming && (
                  <div className="mt-3 p-3 bg-[#0d0d0d] border border-[#2a2a2a] rounded-xl">
                    <p className="text-white text-xs font-medium mb-2">
                      {confirming === 'delete' ? '¿Eliminar alumno permanentemente?' :
                       confirming === 'suspend' ? '¿Suspender este alumno?' :
                       confirming === 'inactive' ? '¿Marcar como inactivo?' :
                       '¿Reactivar este alumno?'}
                    </p>
                    <div className="flex gap-2">
                      <button onClick={() => setConfirming(null)} className="px-3 py-1.5 rounded-lg border border-[#2a2a2a] text-zinc-400 text-xs hover:text-white transition-all">Cancelar</button>
                      <button
                        onClick={() => confirming === 'delete' ? handleDelete() : handleChangeStatus(confirming === 'inactive' ? 'inactive' : confirming === 'suspend' ? 'suspended' : 'active')}
                        className={cn('px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                          confirming === 'delete' ? 'bg-red-500 hover:bg-red-400 text-white' :
                          confirming === 'active' ? 'bg-emerald-500 hover:bg-emerald-400 text-white' :
                          'bg-amber-500 hover:bg-amber-400 text-black'
                        )}
                      >
                        Confirmar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Groups ── */}
          {section === 'groups' && (
            <div className="p-5">
              {loading ? (
                <div className="space-y-2">{[1,2].map(i => <div key={i} className="h-14 bg-zinc-900 rounded-xl animate-pulse" />)}</div>
              ) : groups.length === 0 ? (
                <div className="py-10 text-center">
                  <Users className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                  <p className="text-zinc-600 text-sm">Sin grupos asignados</p>
                  <button onClick={onEdit} className="mt-2 text-cyan-400 text-xs font-medium hover:text-cyan-300">Asignar grupo →</button>
                </div>
              ) : (
                <div className="space-y-2">
                  {groups.map(sg => (
                    <div key={sg.id} className="p-4 bg-[#0d0d0d] border border-[#1e1e1e] rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: sg.group?.discipline?.color || '#06b6d4' }} />
                        <div className="flex-1">
                          <p className="text-white text-sm font-medium">{sg.group?.name}</p>
                          <p className="text-zinc-500 text-xs">{sg.group?.discipline?.name}</p>
                        </div>
                      </div>
                      {sg.group?.schedule?.length > 0 && (
                        <div className="mt-2.5 flex flex-wrap gap-1.5">
                          {sg.group.schedule.map((s: any, i: number) => (
                            <span key={i} className="text-[10px] bg-white/[0.04] border border-white/[0.06] text-zinc-400 px-2 py-0.5 rounded-lg">
                              {s.day} {s.start_time}–{s.end_time}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Payments ── */}
          {section === 'payments' && (
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-xl p-3 text-center">
                  <p className="text-emerald-400 text-sm font-bold">{formatCurrency(totalPaid)}</p>
                  <p className="text-zinc-600 text-[10px]">Total pagado</p>
                </div>
                <div className="bg-red-500/5 border border-red-500/15 rounded-xl p-3 text-center">
                  <p className="text-red-400 text-sm font-bold">{formatCurrency(totalPending)}</p>
                  <p className="text-zinc-600 text-[10px]">Pendiente</p>
                </div>
              </div>
              {overdueCount >= 3 && (
                <div className="flex items-center gap-2.5 p-3 bg-red-500/8 border border-red-500/20 rounded-xl">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <p className="text-red-300 text-xs font-medium">{overdueCount} cuotas vencidas — el alumno será marcado como inactivo automáticamente.</p>
                </div>
              )}
              {loading ? (
                <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-10 bg-zinc-900 rounded-lg animate-pulse" />)}</div>
              ) : payments.length === 0 ? (
                <p className="text-zinc-600 text-sm py-6 text-center">Sin pagos registrados</p>
              ) : (
                <div className="space-y-1.5">
                  {payments.map(p => {
                    const isPaid = p.status === 'paid';
                    const isOverdue = p.status === 'overdue';
                    return (
                      <div key={p.id} className="flex items-center justify-between p-3 bg-[#0d0d0d] border border-[#1e1e1e] rounded-lg hover:border-[#2a2a2a] transition-colors">
                        <div className="flex items-center gap-2">
                          {isPaid ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : isOverdue ? <AlertCircle className="w-3.5 h-3.5 text-red-400" /> : <Clock className="w-3.5 h-3.5 text-amber-400" />}
                          <span className="text-white text-xs font-medium">{MONTHS[p.month - 1]} {p.year}</span>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <span className="text-white text-xs font-semibold">{formatCurrency(p.final_amount)}</span>
                          <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded',
                            isPaid ? 'bg-emerald-500/10 text-emerald-400' : isOverdue ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400'
                          )}>
                            {isPaid ? 'Pagado' : isOverdue ? 'Vencido' : 'Pendiente'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── Enrollment ── */}
          {section === 'enrollment' && (
            <div className="p-5 space-y-4">
              {!enrollment ? (
                <div className="py-10 text-center">
                  <ClipboardList className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                  <p className="text-zinc-600 text-sm">Sin inscripción anual registrada</p>
                  <button onClick={onEdit} className="mt-2 text-cyan-400 text-xs font-medium hover:text-cyan-300">Registrar inscripción →</button>
                </div>
              ) : (
                <>
                  <div className={cn('flex items-center gap-3 p-4 rounded-xl border',
                    enrollment.status === 'enrolled' ? 'bg-emerald-500/5 border-emerald-500/15' :
                    enrollment.status === 'pending'  ? 'bg-amber-500/5 border-amber-500/15' :
                    'bg-red-500/5 border-red-500/15'
                  )}>
                    <div className={cn('w-2.5 h-2.5 rounded-full shrink-0',
                      enrollment.status === 'enrolled' ? 'bg-emerald-400' : enrollment.status === 'pending' ? 'bg-amber-400' : 'bg-red-400'
                    )} />
                    <div>
                      <p className={cn('text-sm font-semibold',
                        enrollment.status === 'enrolled' ? 'text-emerald-400' : enrollment.status === 'pending' ? 'text-amber-400' : 'text-red-400'
                      )}>
                        {enrollment.status === 'enrolled' ? 'Inscripto' : enrollment.status === 'pending' ? 'Pendiente' : 'Cancelado'} {enrollment.year}
                      </p>
                      {enrollment.enrollment_date && <p className="text-zinc-500 text-xs mt-0.5">{new Date(enrollment.enrollment_date).toLocaleDateString('es-AR')}</p>}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-[#0d0d0d] border border-[#1e1e1e] rounded-xl">
                      <p className="text-zinc-500 text-[10px] mb-1">Talle de remera</p>
                      <p className="text-white text-sm font-semibold">{enrollment.shirt_size || '—'}</p>
                    </div>
                    <div className="p-3 bg-[#0d0d0d] border border-[#1e1e1e] rounded-xl flex items-center gap-2.5">
                      {enrollment.contract_signed ? (
                        <><ShieldCheck className="w-4 h-4 text-emerald-400" /><div><p className="text-emerald-400 text-xs font-semibold">Contrato firmado</p></div></>
                      ) : (
                        <><ShieldX className="w-4 h-4 text-zinc-600" /><div><p className="text-zinc-500 text-xs">Sin contrato</p></div></>
                      )}
                    </div>
                  </div>
                  {enrollment.observations && (
                    <div className="p-3 bg-[#0d0d0d] border border-[#1e1e1e] rounded-xl">
                      <p className="text-zinc-500 text-[10px] mb-1">Observaciones</p>
                      <p className="text-zinc-300 text-xs">{enrollment.observations}</p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── Documents ── */}
          {section === 'documents' && (
            <div className="p-5">
              {documents.length === 0 ? (
                <div className="py-10 text-center">
                  <Paperclip className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                  <p className="text-zinc-600 text-sm">Sin documentos adjuntos</p>
                  <button onClick={onEdit} className="mt-2 text-cyan-400 text-xs font-medium hover:text-cyan-300">Adjuntar documentos →</button>
                </div>
              ) : (
                <div className="space-y-2">
                  {documents.map((doc: any) => (
                    <div key={doc.id} className="flex items-center gap-3 p-3 bg-[#0d0d0d] border border-[#1e1e1e] rounded-xl hover:border-[#2a2a2a] transition-colors">
                      <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center shrink-0">
                        <FileText className="w-3.5 h-3.5 text-zinc-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-xs font-medium truncate">{doc.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-zinc-600 text-[10px]">{DOC_TYPE_LABELS[doc.type] || doc.type}</span>
                          {doc.notes && <span className="text-zinc-700 text-[10px]">· {doc.notes}</span>}
                        </div>
                      </div>
                      {doc.file_url && (
                        <a href={doc.file_url} target="_blank" rel="noreferrer" className="text-cyan-400 hover:text-cyan-300 transition-colors shrink-0">
                          <FileText className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
