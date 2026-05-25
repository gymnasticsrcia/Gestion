'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Header from '@/components/layout/Header';
import { Plus, ChevronLeft, ChevronRight, X, Calendar as CalendarIcon, Clock, Trash2, CreditCard as Edit2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const DAYS_OF_WEEK = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTHS_ES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

const EVENT_TYPES: Record<string, { label: string; color: string; bg: string }> = {
  class:         { label: 'Clase',       color: '#10b981', bg: '#10b98118' },
  event:         { label: 'Evento',      color: '#f59e0b', bg: '#f59e0b18' },
  birthday:      { label: 'Cumpleaños',  color: '#ec4899', bg: '#ec489918' },
  tournament:    { label: 'Torneo',      color: '#ef4444', bg: '#ef444418' },
  meeting:       { label: 'Reunión',     color: '#3b82f6', bg: '#3b82f618' },
  rental:        { label: 'Alquiler',    color: '#6b7280', bg: '#6b728018' },
  holiday:       { label: 'Feriado',     color: '#f97316', bg: '#f9731618' },
  vacation_camp: { label: 'Colonia',     color: '#06b6d4', bg: '#06b6d418' },
  payment_due:   { label: 'Vencimiento', color: '#eab308', bg: '#eab30818' },
  other:         { label: 'Otro',        color: '#71717a', bg: '#71717a18' },
};

export default function CalendarPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [editEvent, setEditEvent] = useState<any | null>(null);

  useEffect(() => { fetchEvents(); }, [currentDate]);

  const fetchEvents = async () => {
    setLoading(true);
    const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString();
    const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59).toISOString();
    const { data } = await supabase
      .from('events')
      .select('*')
      .gte('start_datetime', start)
      .lte('start_datetime', end)
      .order('start_datetime');
    if (data) setEvents(data);
    setLoading(false);
  };

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const goToday = () => setCurrentDate(new Date());

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: (Date | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
    return days;
  };

  const getEventsForDay = (date: Date) =>
    events.filter(e => {
      const d = new Date(e.start_datetime);
      return d.getDate() === date.getDate() && d.getMonth() === date.getMonth() && d.getFullYear() === date.getFullYear();
    });

  const isToday = (date: Date) => {
    const t = new Date();
    return date.getDate() === t.getDate() && date.getMonth() === t.getMonth() && date.getFullYear() === t.getFullYear();
  };

  const days = getDaysInMonth();
  const upcomingEvents = events
    .filter(e => new Date(e.start_datetime) >= new Date())
    .sort((a, b) => new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime())
    .slice(0, 7);

  const typeCounts = Object.keys(EVENT_TYPES).reduce<Record<string, number>>((acc, t) => {
    acc[t] = events.filter(e => e.type === t).length;
    return acc;
  }, {});

  return (
    <div className="flex-1 flex flex-col">
      <Header title="Calendario" subtitle="Agenda operativa completa" />

      <div className="flex-1 p-6 space-y-5 animate-fade-in">
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-5">
          {/* Calendar panel */}
          <div className="bg-[#111111] border border-[#1f1f1f] rounded-xl overflow-hidden">
            {/* Navigation */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#1a1a1a]">
              <div className="flex items-center gap-2">
                <button onClick={prevMonth} className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/[0.08] transition-all">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <h3 className="text-white font-semibold text-sm min-w-[160px] text-center">
                  {MONTHS_ES[currentDate.getMonth()]} {currentDate.getFullYear()}
                </h3>
                <button onClick={nextMonth} className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/[0.08] transition-all">
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={goToday}
                  className="ml-1 h-7 px-3 rounded-lg border border-[#2a2a2a] text-zinc-500 text-xs hover:text-white hover:border-[#3a3a3a] transition-all"
                >
                  Hoy
                </button>
              </div>
              <button
                onClick={() => { setSelectedDate(new Date()); setEditEvent(null); setShowModal(true); }}
                className="flex items-center gap-2 h-9 px-4 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-white text-sm font-semibold transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                Nuevo evento
              </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 border-b border-[#1a1a1a]">
              {DAYS_OF_WEEK.map(d => (
                <div key={d} className="py-2.5 text-center text-zinc-600 text-[11px] font-semibold tracking-wide">{d}</div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7">
              {days.map((day, i) => {
                const dayEvents = day ? getEventsForDay(day) : [];
                const isWeekend = i % 7 === 0 || i % 7 === 6;
                return (
                  <div
                    key={i}
                    onClick={() => { if (day) { setSelectedDate(day); setEditEvent(null); setShowModal(true); } }}
                    className={cn(
                      'min-h-[90px] p-1.5 border-b border-r border-[#1a1a1a] transition-colors',
                      day ? 'cursor-pointer hover:bg-white/[0.015]' : 'cursor-default',
                      isWeekend && day ? 'bg-white/[0.006]' : '',
                      i % 7 === 6 && 'border-r-0',
                    )}
                  >
                    {day && (
                      <>
                        <div className="flex justify-end mb-1">
                          <span className={cn(
                            'inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium',
                            isToday(day) ? 'bg-cyan-500 text-white font-bold' : 'text-zinc-500 hover:text-white',
                          )}>
                            {day.getDate()}
                          </span>
                        </div>
                        <div className="space-y-0.5">
                          {dayEvents.slice(0, 3).map(event => {
                            const info = EVENT_TYPES[event.type] || EVENT_TYPES.other;
                            return (
                              <div
                                key={event.id}
                                onClick={(e) => { e.stopPropagation(); setSelectedEvent(event); }}
                                className="text-[10px] px-1.5 py-0.5 rounded-sm truncate font-medium cursor-pointer hover:opacity-80 transition-opacity"
                                style={{ backgroundColor: info.bg, color: info.color, borderLeft: `2px solid ${info.color}` }}
                              >
                                {event.title}
                              </div>
                            );
                          })}
                          {dayEvents.length > 3 && (
                            <span className="text-[10px] text-zinc-600 pl-1">+{dayEvents.length - 3} más</span>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right sidebar */}
          <div className="space-y-4">
            {/* Legend */}
            <div className="bg-[#111111] border border-[#1f1f1f] rounded-xl p-4">
              <p className="text-zinc-500 text-[10px] font-semibold uppercase tracking-widest mb-3">Tipos de evento</p>
              <div className="space-y-1.5">
                {Object.entries(EVENT_TYPES).map(([type, info]) => (
                  <div key={type} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: info.color }} />
                      <span className="text-zinc-400 text-xs">{info.label}</span>
                    </div>
                    {typeCounts[type] > 0 && (
                      <span className="text-[10px] text-zinc-600 font-medium">{typeCounts[type]}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Upcoming events */}
            <div className="bg-[#111111] border border-[#1f1f1f] rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-[#1a1a1a] flex items-center justify-between">
                <p className="text-white font-semibold text-sm">Próximos eventos</p>
                <span className="text-zinc-600 text-xs">{upcomingEvents.length}</span>
              </div>
              <div className="divide-y divide-[#1a1a1a] max-h-[380px] overflow-y-auto">
                {upcomingEvents.length === 0 ? (
                  <div className="p-6 text-center">
                    <CalendarIcon className="w-6 h-6 text-zinc-700 mx-auto mb-1.5" />
                    <p className="text-zinc-600 text-xs">Sin eventos próximos</p>
                  </div>
                ) : upcomingEvents.map(event => {
                  const info = EVENT_TYPES[event.type] || EVENT_TYPES.other;
                  const eventDate = new Date(event.start_datetime);
                  return (
                    <div key={event.id} className="px-4 py-3 hover:bg-white/[0.02] transition-colors cursor-pointer" onClick={() => setSelectedEvent(event)}>
                      <div className="flex items-start gap-2.5">
                        <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: info.color }} />
                        <div className="min-w-0 flex-1">
                          <p className="text-white text-xs font-medium truncate">{event.title}</p>
                          <div className="flex items-center gap-1 mt-0.5">
                            <Clock className="w-2.5 h-2.5 text-zinc-700" />
                            <span className="text-zinc-600 text-[10px]">
                              {eventDate.getDate()} {MONTHS_ES[eventDate.getMonth()]}
                              {!event.all_day && ` · ${eventDate.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}`}
                            </span>
                          </div>
                        </div>
                        <span className="text-[9px] px-1.5 py-0.5 rounded font-semibold shrink-0" style={{ backgroundColor: info.bg, color: info.color }}>
                          {info.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <EventModal
          defaultDate={selectedDate}
          event={editEvent}
          onClose={() => { setShowModal(false); setSelectedDate(null); setEditEvent(null); }}
          onSave={() => { setShowModal(false); setSelectedDate(null); setEditEvent(null); fetchEvents(); }}
        />
      )}

      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onEdit={ev => { setSelectedEvent(null); setEditEvent(ev); setShowModal(true); }}
          onDelete={async id => {
            await supabase.from('events').delete().eq('id', id);
            setSelectedEvent(null);
            fetchEvents();
          }}
        />
      )}
    </div>
  );
}

function EventModal({
  defaultDate,
  event,
  onClose,
  onSave,
}: {
  defaultDate: Date | null;
  event: any | null;
  onClose: () => void;
  onSave: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const defaultDateStr = defaultDate ? defaultDate.toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16);

  const [form, setForm] = useState({
    title: event?.title || '',
    type: event?.type || 'event',
    start_datetime: event?.start_datetime?.slice(0, 16) || defaultDateStr,
    end_datetime: event?.end_datetime?.slice(0, 16) || '',
    all_day: event?.all_day || false,
    description: event?.description || '',
  });

  const handleSave = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    const info = EVENT_TYPES[form.type] || EVENT_TYPES.other;
    const payload = { ...form, color: info.color, end_datetime: form.end_datetime || null };
    if (event) {
      await supabase.from('events').update(payload as any).eq('id', event.id);
    } else {
      await supabase.from('events').insert(payload as any);
    }
    setSaving(false);
    onSave();
  };

  const inputClass = "w-full h-10 rounded-lg bg-[#0d0d0d] border border-[#2a2a2a] px-3 text-white text-sm focus:outline-none focus:border-cyan-500/40";
  const labelClass = "text-xs font-medium text-zinc-400 mb-1 block";
  const typeInfo = EVENT_TYPES[form.type] || EVENT_TYPES.other;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#111111] border border-[#2a2a2a] rounded-2xl w-full max-w-md shadow-2xl animate-slide-up">
        <div className="flex items-center justify-between p-5 border-b border-[#1a1a1a]">
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: typeInfo.color }} />
            <h2 className="text-white font-semibold">{event ? 'Editar evento' : 'Nuevo evento'}</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/[0.08]">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className={labelClass}>Título *</label>
            <input className={inputClass} placeholder="Nombre del evento" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          </div>
          <div>
            <label className={labelClass}>Tipo</label>
            <select className={inputClass} value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
              {Object.entries(EVENT_TYPES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Inicio</label>
              <input type={form.all_day ? 'date' : 'datetime-local'} className={inputClass} value={form.start_datetime} onChange={e => setForm({ ...form, start_datetime: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>Fin</label>
              <input type={form.all_day ? 'date' : 'datetime-local'} className={inputClass} value={form.end_datetime} onChange={e => setForm({ ...form, end_datetime: e.target.value })} />
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.all_day} onChange={e => setForm({ ...form, all_day: e.target.checked })} className="w-4 h-4 rounded accent-cyan-500" />
            <span className="text-zinc-400 text-sm">Todo el día</span>
          </label>
          <div>
            <label className={labelClass}>Descripción</label>
            <textarea className="w-full rounded-lg bg-[#0d0d0d] border border-[#2a2a2a] px-3 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500/40 resize-none" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>
        </div>
        <div className="flex justify-end gap-3 p-5 border-t border-[#1a1a1a]">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border border-[#2a2a2a] text-zinc-400 text-sm hover:text-white">Cancelar</button>
          <button onClick={handleSave} disabled={saving || !form.title} className="px-5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-white text-sm font-semibold disabled:opacity-50 flex items-center gap-2">
            {saving && <div className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" />}
            {event ? 'Guardar' : 'Crear evento'}
          </button>
        </div>
      </div>
    </div>
  );
}

function EventDetailModal({
  event,
  onClose,
  onEdit,
  onDelete,
}: {
  event: any;
  onClose: () => void;
  onEdit: (ev: any) => void;
  onDelete: (id: string) => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const info = EVENT_TYPES[event.type] || EVENT_TYPES.other;
  const eventDate = new Date(event.start_datetime);
  const endDate = event.end_datetime ? new Date(event.end_datetime) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#111111] border border-[#2a2a2a] rounded-2xl w-full max-w-sm shadow-2xl animate-slide-up overflow-hidden">
        <div className="h-1" style={{ backgroundColor: info.color }} />
        <div className="p-5">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: info.bg }}>
                <CalendarIcon className="w-4 h-4" style={{ color: info.color }} />
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm leading-tight">{event.title}</h3>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded mt-0.5 inline-block" style={{ backgroundColor: info.bg, color: info.color }}>
                  {info.label}
                </span>
              </div>
            </div>
            <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/[0.08]">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2 mb-5">
            <div className="flex items-start gap-2.5 text-zinc-400">
              <CalendarIcon className="w-3.5 h-3.5 text-zinc-600 mt-0.5 shrink-0" />
              <span className="text-xs capitalize">
                {eventDate.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </div>
            {!event.all_day && (
              <div className="flex items-center gap-2.5 text-zinc-400">
                <Clock className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
                <span className="text-xs">
                  {eventDate.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                  {endDate && ` → ${endDate.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}`}
                </span>
              </div>
            )}
            {event.all_day && (
              <div className="flex items-center gap-2.5 text-zinc-500">
                <Clock className="w-3.5 h-3.5 text-zinc-700 shrink-0" />
                <span className="text-xs">Todo el día</span>
              </div>
            )}
            {event.description && (
              <p className="text-zinc-500 text-xs pl-6">{event.description}</p>
            )}
          </div>

          {confirmDelete ? (
            <div className="space-y-3">
              <p className="text-zinc-400 text-xs text-center">¿Confirmar eliminación del evento?</p>
              <div className="flex gap-2">
                <button onClick={() => setConfirmDelete(false)} className="flex-1 h-9 rounded-lg border border-[#2a2a2a] text-zinc-400 text-sm hover:text-white transition-colors">Cancelar</button>
                <button onClick={() => onDelete(event.id)} className="flex-1 h-9 rounded-lg bg-red-500 hover:bg-red-400 text-white text-sm font-semibold transition-colors">Eliminar</button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmDelete(true)}
                className="flex items-center gap-1.5 h-9 px-3 rounded-lg border border-[#2a2a2a] text-zinc-500 text-xs hover:text-red-400 hover:border-red-500/30 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Eliminar
              </button>
              <button
                onClick={() => onEdit(event)}
                className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-lg bg-white/[0.06] hover:bg-white/[0.10] text-zinc-300 text-xs transition-all"
              >
                <Edit2 className="w-3.5 h-3.5" />
                Editar evento
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
