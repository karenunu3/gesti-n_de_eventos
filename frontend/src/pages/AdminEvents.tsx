import React, { useState, useEffect } from 'react';
import { fetchApi, API_URL } from '../lib/api';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, Users, FileSpreadsheet, MapPin, CheckCircle, XCircle,
  Map, QrCode, Layers, GraduationCap, Star, MessageSquare, X
} from 'lucide-react';
import LocationPicker from '../components/LocationPicker';
import { QRCodeCanvas } from 'qrcode.react';

const ISTPET_LAT = -0.2824216;
const ISTPET_LNG = -78.5555266;

const AdminEvents = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [careers, setCareers] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingEventId, setEditingEventId] = useState<number | null>(null);

  // QR Modal — punto 5: contador en tiempo real
  const [showQrModal, setShowQrModal] = useState<number | null>(null);
  const [qrToken, setQrToken] = useState<string>('');
  const [qrAttendanceCount, setQrAttendanceCount] = useState<number>(0);
  const [qrRegistrationCount, setQrRegistrationCount] = useState<number>(0);

  // Auditoría + encuestas — puntos 3 y 4
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [selectedEventTitle, setSelectedEventTitle] = useState<string>('');
  const [attendances, setAttendances] = useState<any[]>([]);
  const [surveys, setSurveys] = useState<any[]>([]);
  const [avgRating, setAvgRating] = useState<number>(0);
  const [auditTab, setAuditTab] = useState<'attendance' | 'surveys'>('attendance');

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isTeacher = user?.role === 'DOCENTE';

  const [formData, setFormData] = useState({
    title: '', description: '', startDate: '', endDate: '', capacity: '', hours: '',
    radiusMeters: 100, isTransversal: true, careers: [] as number[]
  });

  useEffect(() => {
    loadEvents();
    loadCareers();
  }, []);

  // QR dinámico + contador de asistencias en tiempo real
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (showQrModal) {
      const fetchQr = async () => {
        try {
          const res = await fetchApi(`/events/${showQrModal}/qr-token`);
          setQrToken(res.qrToken);
          setQrAttendanceCount(res.attendanceCount ?? 0);
          setQrRegistrationCount(res.registrationCount ?? 0);
        } catch (e) {
          console.error(e);
        }
      };
      fetchQr();
      interval = setInterval(fetchQr, 20000);
    }
    return () => clearInterval(interval);
  }, [showQrModal]);

  const loadEvents = async () => {
    try {
      const data = await fetchApi('/events');
      setEvents(data);
    } catch (err) { console.error(err); }
  };

  const loadCareers = async () => {
    try {
      const data = await fetchApi('/careers');
      setCareers(data);
    } catch (err) { console.error(err); }
  };

  const toggleCareer = (careerId: number) => {
    setFormData(prev => ({
      ...prev,
      careers: prev.careers.includes(careerId)
        ? prev.careers.filter(id => id !== careerId)
        : [...prev.careers, careerId]
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return alert('El título es obligatorio.');
    if (new Date(formData.endDate) <= new Date(formData.startDate))
      return alert('La fecha de fin debe ser posterior a la fecha de inicio.');
    if (parseInt(formData.hours) <= 0) return alert('El número de horas debe ser mayor a 0.');
    if (formData.capacity && parseInt(formData.capacity) <= 0)
      return alert('El cupo debe ser un número positivo mayor a 0.');
    if (!formData.isTransversal && formData.careers.length === 0)
      return alert('Debes seleccionar al menos una carrera para un evento específico.');

    try {
      const payload = {
        ...formData,
        capacity: formData.capacity ? parseInt(formData.capacity) : null,
        hours: parseInt(formData.hours),
        latitude: ISTPET_LAT,
        longitude: ISTPET_LNG,
        radiusMeters: formData.radiusMeters,
        careers: formData.isTransversal ? [] : formData.careers,
      };
      if (editingEventId) {
        await fetchApi(`/events/${editingEventId}`, { method: 'PUT', body: JSON.stringify(payload) });
      } else {
        await fetchApi('/events', { method: 'POST', body: JSON.stringify(payload) });
      }
      closeForm();
      loadEvents();
    } catch (err: any) { alert(err.message); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar este evento? Esta acción no se puede deshacer.')) return;
    try {
      await fetchApi(`/events/${id}`, { method: 'DELETE' });
      loadEvents();
    } catch (err: any) { alert(err.message); }
  };

  const editEvent = (event: any) => {
    setFormData({
      title: event.title,
      description: event.description,
      startDate: new Date(event.startDate).toISOString().slice(0, 16),
      endDate: new Date(event.endDate).toISOString().slice(0, 16),
      capacity: event.capacity ? event.capacity.toString() : '',
      hours: event.hours.toString(),
      radiusMeters: event.radiusMeters,
      isTransversal: event.isTransversal,
      careers: event.careers ? event.careers.map((c: any) => c.id) : []
    });
    setEditingEventId(event.id);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingEventId(null);
    setFormData({ title: '', description: '', startDate: '', endDate: '', capacity: '', hours: '', radiusMeters: 100, isTransversal: true, careers: [] });
  };

  // Punto 3: abrir auditoría (ahora disponible para DOCENTE en backend)
  const openAudit = async (event: any) => {
    setSelectedEventId(event.id);
    setSelectedEventTitle(event.title);
    setAuditTab('attendance');
    await Promise.all([loadAttendances(event.id), loadSurveys(event.id)]);
  };

  const loadAttendances = async (eventId: number) => {
    try {
      const data = await fetchApi(`/attendance/event/${eventId}`);
      setAttendances(data);
    } catch (err: any) { alert(err.message); }
  };

  // Punto 4: cargar encuestas del evento
  const loadSurveys = async (eventId: number) => {
    try {
      const data = await fetchApi(`/reports/surveys/${eventId}`);
      setSurveys(data.surveys);
      setAvgRating(data.avgRating);
    } catch (err: any) { console.error(err); }
  };

  const validateManual = async (attendanceId: number, isValid: boolean) => {
    if (!confirm(`¿Cambiar el estado a ${isValid ? 'VÁLIDO' : 'INVÁLIDO'}?`)) return;
    try {
      await fetchApi(`/attendance/${attendanceId}/validate`, {
        method: 'PUT', body: JSON.stringify({ isValid })
      });
      loadAttendances(selectedEventId!);
    } catch (err: any) { alert(err.message); }
  };

  const downloadExcel = () => {
    if (!selectedEventId) return;
    window.open(`${API_URL}/reports/excel/${selectedEventId}?token=${localStorage.getItem('token')}`, '_blank');
  };

  // Helper estrellas
  const renderStars = (rating: number) =>
    Array.from({ length: 5 }, (_, i) => (
      <Star key={i} size={14} className={i < rating ? 'text-istpet-gold fill-istpet-gold' : 'text-slate-300 dark:text-slate-600'} />
    ));

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-8 w-full transition-colors duration-300">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Link to="/dashboard" className="flex items-center gap-2 px-4 py-2 shrink-0 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-istpet-blue dark:hover:text-istpet-gold transition-colors font-medium shadow-sm">
              <ArrowLeft size={18} /> Volver
            </Link>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-50">
                {isTeacher ? 'Panel de Docente' : 'Administración de Eventos'}
              </h1>
              {isTeacher && <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Gestiona asistencias y proyecta QR para tus eventos</p>}
            </div>
          </div>
          {!showForm && !selectedEventId && !isTeacher && (
            <button onClick={() => setShowForm(true)} className="bg-istpet-blue dark:bg-istpet-gold text-white dark:text-slate-900 px-6 py-2.5 rounded-xl font-bold hover:bg-istpet-blue-light dark:hover:bg-istpet-gold-light transition-colors w-full md:w-auto text-center">
              Crear Nuevo Evento
            </button>
          )}
        </div>

        {/* Formulario (solo ADMIN/SECRETARIA) */}
        {showForm && (
          <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 mb-8 fade-in">
            <h2 className="text-2xl font-bold mb-6 text-slate-800 dark:text-slate-50">{editingEventId ? 'Editar Evento' : 'Nuevo Evento'}</h2>
            <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Título</label>
                <input required type="text" className="w-full border border-slate-200 dark:border-slate-600 p-3 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-istpet-blue dark:focus:ring-istpet-gold" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Horas a certificar</label>
                <input required type="number" min="1" className="w-full border border-slate-200 dark:border-slate-600 p-3 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-istpet-blue dark:focus:ring-istpet-gold" value={formData.hours} onChange={e => setFormData({...formData, hours: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Fecha Inicio</label>
                <input required type="datetime-local" className="w-full border border-slate-200 dark:border-slate-600 p-3 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-istpet-blue dark:focus:ring-istpet-gold" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Fecha Fin</label>
                <input required type="datetime-local" className="w-full border border-slate-200 dark:border-slate-600 p-3 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-istpet-blue dark:focus:ring-istpet-gold" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Cupo Máximo (Opcional)</label>
                <input type="number" min="1" className="w-full border border-slate-200 dark:border-slate-600 p-3 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-istpet-blue dark:focus:ring-istpet-gold" value={formData.capacity} onChange={e => setFormData({...formData, capacity: e.target.value})} />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Descripción</label>
                <textarea rows={3} className="w-full border border-slate-200 dark:border-slate-600 p-3 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-istpet-blue dark:focus:ring-istpet-gold" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>
              <div className="md:col-span-2 border-t border-slate-100 dark:border-slate-700 pt-6">
                <h3 className="font-semibold flex items-center gap-2 mb-4 text-slate-800 dark:text-slate-200"><Map size={18} className="text-istpet-blue dark:text-istpet-gold" /> Área de Asistencia (Geocerca)</h3>
                <LocationPicker radiusMeters={formData.radiusMeters} />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">Radio de Validez: <span className="font-bold text-istpet-blue dark:text-istpet-gold">{formData.radiusMeters}m</span></label>
                <input type="range" min="10" max="1000" step="10" className="w-full accent-istpet-blue dark:accent-istpet-gold" value={formData.radiusMeters} onChange={e => setFormData({...formData, radiusMeters: parseInt(e.target.value)})} />
                <div className="flex justify-between text-xs text-slate-400 dark:text-slate-500 mt-1"><span>10m</span><span>1000m</span></div>
              </div>
              <div className="md:col-span-2 border-t border-slate-100 dark:border-slate-700 pt-6">
                <h3 className="font-semibold flex items-center gap-2 mb-4 text-slate-800 dark:text-slate-200"><GraduationCap size={18} className="text-istpet-blue dark:text-istpet-gold" /> Audiencia del Evento</h3>
                <label className="flex items-center gap-3 cursor-pointer p-4 rounded-xl border-2 transition-colors mb-4 select-none border-istpet-gold/60 bg-istpet-gold/5 dark:border-istpet-gold/40 dark:bg-istpet-gold/10">
                  <div className={`w-10 h-6 rounded-full transition-colors relative flex-shrink-0 ${formData.isTransversal ? 'bg-istpet-gold' : 'bg-slate-300 dark:bg-slate-600'}`}>
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${formData.isTransversal ? 'translate-x-5' : 'translate-x-1'}`} />
                  </div>
                  <input type="checkbox" className="sr-only" checked={formData.isTransversal} onChange={e => setFormData({...formData, isTransversal: e.target.checked, careers: []})} />
                  <div>
                    <div className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-100"><Layers size={16} className="text-istpet-gold" /> Evento Transversal — Todas las carreras</div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Todos los alumnos pueden inscribirse, sin importar su carrera.</p>
                  </div>
                </label>
                {!formData.isTransversal && (
                  <div className="fade-in">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Selecciona las carreras: <span className="text-red-500">*</span></p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {careers.map(career => {
                        const selected = formData.careers.includes(career.id);
                        return (
                          <label key={career.id} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all select-none ${selected ? 'border-istpet-blue dark:border-istpet-gold bg-istpet-blue/5 dark:bg-istpet-gold/10' : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500 bg-slate-50 dark:bg-slate-700/50'}`}>
                            <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 border-2 transition-colors ${selected ? 'bg-istpet-blue dark:bg-istpet-gold border-istpet-blue dark:border-istpet-gold' : 'border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700'}`}>
                              {selected && <CheckCircle size={12} className="text-white dark:text-slate-900" />}
                            </div>
                            <input type="checkbox" className="sr-only" checked={selected} onChange={() => toggleCareer(career.id)} />
                            <span className="text-sm font-medium text-slate-800 dark:text-slate-100">{career.name}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
              <div className="md:col-span-2 flex gap-4 pt-2">
                <button type="button" onClick={closeForm} className="px-6 py-3 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-xl font-medium transition-colors">Cancelar</button>
                <button type="submit" className="px-6 py-3 bg-istpet-blue dark:bg-istpet-gold text-white dark:text-slate-900 rounded-xl font-bold flex-1 hover:bg-istpet-blue-light dark:hover:bg-istpet-gold-light transition-colors">{editingEventId ? 'Actualizar Evento' : 'Guardar Evento'}</button>
              </div>
            </form>
          </div>
        )}

        {/* ── Auditoría (punto 3 + punto 4) ── */}
        {selectedEventId ? (
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden fade-in">
            {/* Header de auditoría */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-800 dark:text-slate-50 flex items-center gap-2">
                    <Users className="text-istpet-blue dark:text-istpet-gold" size={20} />
                    {selectedEventTitle}
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                    {attendances.length} asistencias · {surveys.length} encuestas
                    {surveys.length > 0 && <span className="ml-1">· Promedio: <span className="font-semibold text-istpet-gold">{avgRating} ★</span></span>}
                  </p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {auditTab === 'attendance' && (
                    <button onClick={downloadExcel} className="flex items-center gap-2 px-4 py-2 bg-istpet-blue/10 dark:bg-istpet-gold/10 text-istpet-blue dark:text-istpet-gold hover:bg-istpet-blue/20 dark:hover:bg-istpet-gold/20 rounded-lg font-medium transition-colors text-sm">
                      <FileSpreadsheet size={16} /> Exportar Excel
                    </button>
                  )}
                  <button onClick={() => setSelectedEventId(null)} className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg font-medium transition-colors text-sm">
                    Cerrar
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 mt-4 bg-slate-100 dark:bg-slate-700 p-1 rounded-xl w-fit">
                <button
                  onClick={() => setAuditTab('attendance')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${auditTab === 'attendance' ? 'bg-white dark:bg-slate-800 text-istpet-blue dark:text-istpet-gold shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                >
                  <Users size={15} /> Asistencias
                  <span className="ml-1 bg-istpet-blue/10 dark:bg-istpet-gold/10 text-istpet-blue dark:text-istpet-gold text-xs px-1.5 py-0.5 rounded-full font-bold">{attendances.length}</span>
                </button>
                <button
                  onClick={() => setAuditTab('surveys')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${auditTab === 'surveys' ? 'bg-white dark:bg-slate-800 text-istpet-blue dark:text-istpet-gold shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                >
                  <Star size={15} /> Encuestas
                  <span className="ml-1 bg-istpet-gold/10 text-istpet-gold text-xs px-1.5 py-0.5 rounded-full font-bold">{surveys.length}</span>
                </button>
              </div>
            </div>

            {/* Tab: Asistencias */}
            {auditTab === 'attendance' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800/50">
                    <tr>
                      <th className="p-4 font-medium text-slate-500 dark:text-slate-400 text-sm">Alumno</th>
                      <th className="p-4 font-medium text-slate-500 dark:text-slate-400 text-sm">CI / Doc.</th>
                      <th className="p-4 font-medium text-slate-500 dark:text-slate-400 text-sm">Carrera</th>
                      <th className="p-4 font-medium text-slate-500 dark:text-slate-400 text-sm">Entrada</th>
                      <th className="p-4 font-medium text-slate-500 dark:text-slate-400 text-sm">Salida</th>
                      <th className="p-4 font-medium text-slate-500 dark:text-slate-400 text-sm">GPS</th>
                      <th className="p-4 font-medium text-slate-500 dark:text-slate-400 text-sm">Estado</th>
                      <th className="p-4 font-medium text-slate-500 dark:text-slate-400 text-sm text-center">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {attendances.map(att => (
                      <tr key={att.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                        <td className="p-4 font-medium text-slate-800 dark:text-slate-100">{att.user.firstName} {att.user.lastName}</td>
                        <td className="p-4 text-slate-600 dark:text-slate-300 text-sm">{att.user.dni}</td>
                        <td className="p-4 text-sm text-slate-500 dark:text-slate-400">{att.user.career?.name || '—'}</td>
                        <td className="p-4 text-sm text-slate-600 dark:text-slate-300">{new Date(att.recordedAt).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}</td>
                        <td className="p-4 text-sm text-slate-600 dark:text-slate-300">
                          {att.checkOutAt ? new Date(att.checkOutAt).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' }) : <span className="text-amber-500 text-xs">Pendiente</span>}
                        </td>
                        <td className="p-4 text-xs font-mono text-slate-500 dark:text-slate-400">
                          <span className="flex items-center gap-1"><MapPin size={12} className="text-istpet-blue dark:text-istpet-gold" />{att.latitude.toFixed(4)}, {att.longitude.toFixed(4)}</span>
                        </td>
                        <td className="p-4">
                          {att.isValid && att.checkOutAt && att.isCheckOutValid
                            ? <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-lg text-xs font-bold w-fit"><CheckCircle size={13} /> Completo</span>
                            : <span className="flex items-center gap-1 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-lg text-xs font-bold w-fit">
                                <XCircle size={13} />
                                {!att.isValid ? 'GPS inválido' : !att.checkOutAt ? 'Sin salida' : 'Salida inválida'}
                              </span>
                          }
                        </td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => validateManual(att.id, !(att.isValid && att.isCheckOutValid))}
                            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${(att.isValid && att.isCheckOutValid) ? 'bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 hover:bg-amber-200' : 'bg-istpet-blue/10 dark:bg-istpet-gold/10 text-istpet-blue dark:text-istpet-gold hover:bg-istpet-blue/20'}`}
                          >
                            {(att.isValid && att.isCheckOutValid) ? 'Invalidar' : 'Aprobar manual'}
                          </button>
                        </td>
                      </tr>
                    ))}
                    {attendances.length === 0 && (
                      <tr><td colSpan={8} className="p-12 text-center text-slate-500 dark:text-slate-400">Nadie ha registrado asistencia aún.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Tab: Encuestas (punto 4) */}
            {auditTab === 'surveys' && (
              <div className="p-6">
                {surveys.length === 0 ? (
                  <div className="p-12 text-center text-slate-500 dark:text-slate-400">
                    <MessageSquare size={32} className="mx-auto mb-3 opacity-40" />
                    <p>No hay encuestas respondidas aún.</p>
                  </div>
                ) : (
                  <>
                    {/* Resumen de calificación */}
                    <div className="flex items-center gap-6 mb-6 p-5 bg-istpet-gold/5 dark:bg-istpet-gold/10 border border-istpet-gold/20 rounded-2xl">
                      <div className="text-center">
                        <div className="text-5xl font-extrabold text-istpet-gold">{avgRating}</div>
                        <div className="flex gap-0.5 justify-center mt-1">{renderStars(Math.round(avgRating))}</div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">promedio</p>
                      </div>
                      <div className="flex-1 space-y-1.5">
                        {[5, 4, 3, 2, 1].map(star => {
                          const count = surveys.filter(s => s.rating === star).length;
                          const pct = surveys.length > 0 ? (count / surveys.length) * 100 : 0;
                          return (
                            <div key={star} className="flex items-center gap-2 text-xs">
                              <span className="w-3 text-slate-500 dark:text-slate-400 text-right">{star}</span>
                              <Star size={11} className="text-istpet-gold fill-istpet-gold flex-shrink-0" />
                              <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                <div className="h-full bg-istpet-gold rounded-full transition-all" style={{ width: `${pct}%` }} />
                              </div>
                              <span className="w-5 text-slate-500 dark:text-slate-400">{count}</span>
                            </div>
                          );
                        })}
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-extrabold text-slate-700 dark:text-slate-200">{surveys.length}</div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">respuestas</p>
                      </div>
                    </div>

                    {/* Lista de respuestas */}
                    <div className="space-y-3">
                      {surveys.map((s: any) => (
                        <div key={s.id} className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-slate-800 dark:text-slate-100 text-sm">{s.user.firstName} {s.user.lastName}</span>
                            <div className="flex gap-0.5">{renderStars(s.rating)}</div>
                          </div>
                          {s.feedback ? (
                            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">"{s.feedback}"</p>
                          ) : (
                            <p className="text-xs text-slate-400 dark:text-slate-500 italic">Sin comentario</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

        ) : !showForm && (
          /* ── Lista de eventos ── */
          <div className="grid grid-cols-1 gap-4">
            {events.map(event => (
              <div key={event.id} className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:shadow-md dark:hover:shadow-slate-900 transition-shadow">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-50">{event.title}</h3>
                    {event.isTransversal
                      ? <span className="text-xs px-2 py-0.5 rounded-full bg-istpet-gold/20 text-istpet-blue dark:text-istpet-gold font-semibold flex items-center gap-1"><Layers size={11} /> Transversal</span>
                      : <span className="text-xs px-2 py-0.5 rounded-full bg-istpet-blue/10 dark:bg-slate-700 text-istpet-blue dark:text-slate-300 font-semibold flex items-center gap-1"><GraduationCap size={11} /> Específico</span>
                    }
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {new Date(event.startDate).toLocaleDateString('es-EC')} · {event.hours} horas
                    {!event.isTransversal && event.careers?.length > 0 && (
                      <span className="ml-2 text-xs text-slate-400">({event.careers.map((c: any) => c.name).join(', ')})</span>
                    )}
                  </p>
                  {/* Stats de asistencia */}
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1">
                      <Users size={12} /> {event._count?.registrations ?? 0} inscritos
                    </span>
                    <span className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1">
                      <CheckCircle size={12} /> {event._count?.attendances ?? 0} asistencias
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:flex sm:gap-2 sm:flex-wrap sm:justify-end flex-shrink-0 w-full sm:w-auto gap-2 mt-4 sm:mt-0">
                  {!isTeacher && (
                    <>
                      <button onClick={() => editEvent(event)} className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-sm flex items-center justify-center gap-2">Editar</button>
                      <button onClick={() => handleDelete(event.id)} className="px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-medium rounded-xl hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors text-sm flex items-center justify-center gap-2">Eliminar</button>
                    </>
                  )}
                  <button onClick={() => setShowQrModal(event.id)} className="px-5 py-2 bg-istpet-gold/20 dark:bg-istpet-gold/10 text-istpet-blue dark:text-istpet-gold font-medium rounded-xl hover:bg-istpet-gold/40 dark:hover:bg-istpet-gold/20 transition-colors flex items-center justify-center gap-2 text-sm">
                    <QrCode size={16} /> QR
                  </button>
                  <button onClick={() => openAudit(event)} className="px-5 py-2 bg-istpet-blue/10 dark:bg-slate-700 text-istpet-blue dark:text-slate-300 font-medium rounded-xl hover:bg-istpet-blue/20 dark:hover:bg-slate-600 transition-colors flex items-center justify-center gap-2 text-sm">
                    <Users size={16} /> Asistencias
                  </button>
                </div>
              </div>
            ))}
            {events.length === 0 && (
              <div className="p-12 text-center text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700">
                No hay eventos creados aún.
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Modal QR con contador (punto 5) ── */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 max-w-2xl w-full text-center relative shadow-2xl border border-slate-100 dark:border-slate-700">
            <button onClick={() => { setShowQrModal(null); setQrAttendanceCount(0); }} className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
              <X size={24} />
            </button>

            <h2 className="text-3xl font-bold text-istpet-blue dark:text-istpet-gold mb-2">Registro de Asistencia</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-6">Escanea este código QR para registrar tu entrada o salida.</p>

            {/* QR Code */}
            <div className="flex justify-center p-6 bg-slate-50 dark:bg-slate-700 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-600 mb-6">
              {qrToken
                ? <QRCodeCanvas value={qrToken} size={280} level="H" includeMargin bgColor="transparent" fgColor="currentColor" className="text-slate-900 dark:text-white" />
                : <div className="w-[280px] h-[280px] flex items-center justify-center text-slate-400 dark:text-slate-500 animate-pulse">Generando QR...</div>
              }
            </div>

            {/* Contador de asistencias en tiempo real */}
            <div className="flex items-center justify-center gap-8 mb-5 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-2xl border border-slate-100 dark:border-slate-700">
              <div className="text-center">
                <div className="text-4xl font-extrabold text-istpet-blue dark:text-istpet-gold">{qrAttendanceCount}</div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1 justify-center"><CheckCircle size={12} /> Asistencias</p>
              </div>
              <div className="w-px h-12 bg-slate-200 dark:bg-slate-600" />
              <div className="text-center">
                <div className="text-4xl font-extrabold text-slate-700 dark:text-slate-200">{qrRegistrationCount}</div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1 justify-center"><Users size={12} /> Inscritos</p>
              </div>
              {qrRegistrationCount > 0 && (
                <>
                  <div className="w-px h-12 bg-slate-200 dark:bg-slate-600" />
                  <div className="text-center">
                    <div className="text-4xl font-extrabold text-istpet-gold">{Math.round((qrAttendanceCount / qrRegistrationCount) * 100)}%</div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Asistencia</p>
                  </div>
                </>
              )}
            </div>

            <p className="text-xs text-slate-400 dark:text-slate-500 animate-pulse">El código se actualiza automáticamente cada 20 segundos · El contador se refresca con cada actualización</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminEvents;
