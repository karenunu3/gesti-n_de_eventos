import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchApi, API_URL } from '../lib/api';
import {
  Calendar, Clock, Award, MapPin, Sparkles,
  CheckCircle, Download, User, FileText, ArrowRight, Hourglass, Info
} from 'lucide-react';
import { fmtDate, fmtTime, humanCountdown } from '../lib/dates';
import Toast, { type ToastType } from './Toast';
import { useAutoRefresh } from '../hooks/useAutoRefresh';
import MiniCalendar from './MiniCalendar';

interface DashboardData {
  totalHours: number;
  attendances: any[];
  upcomingRegistered: any[];
  suggested: any[];
  pendingCertificates: any[];
  monthEvents: { id: number; title: string; startDate: string; endDate: string; isTransversal: boolean }[];
}

const ISTPET_MAPS_URL = 'https://maps.google.com/?q=-0.281660,-78.555455';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ type: ToastType; text: string } | null>(null);

  const load = async () => {
    try {
      const d = await fetchApi('/reports/student-dashboard');
      setData(d);
    } catch (err: any) {
      setToast({ type: 'error', text: 'Error cargando datos: ' + err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);
  useAutoRefresh(load, 30000, true);

  const registerToEvent = async (eventId: number) => {
    try {
      await fetchApi(`/events/${eventId}/register`, { method: 'POST' });
      setToast({ type: 'success', text: '¡Inscripción exitosa!' });
      load();
    } catch (err: any) {
      setToast({ type: 'error', text: err.message });
    }
  };

  const handleCertificate = async (eventId: number) => {
    try {
      const res = await fetchApi(`/reports/certificate/${eventId}`, { method: 'POST' });
      if (res.pdfUrl) {
        const link = document.createElement('a');
        link.href = `${API_URL.replace('/api', '')}${res.pdfUrl}`;
        link.target = '_blank';
        link.download = `Certificado_${eventId}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setToast({ type: 'success', text: 'Certificado descargado correctamente.' });
      }
    } catch (err: any) {
      if (err.message === 'SURVEY_REQUIRED') {
        setToast({ type: 'info', text: 'Debes completar la encuesta antes de descargar el certificado.' });
      } else {
        setToast({ type: 'error', text: err.message });
      }
    }
  };

  if (loading) return (
    <div className="min-h-[40vh] flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-istpet-blue dark:border-istpet-gold border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!data) return null;

  return (
    <div className="space-y-6">
      {toast && <Toast type={toast.type} text={toast.text} onClose={() => setToast(null)} />}

      {/* ACCESOS RÁPIDOS */}
      <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Accesos rápidos</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button onClick={() => navigate('/events')} className="text-left bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all group">
          <div className="p-3 bg-istpet-blue/10 dark:bg-istpet-gold/10 rounded-xl w-fit mb-3 group-hover:scale-110 transition-transform">
            <Calendar size={22} className="text-istpet-blue dark:text-istpet-gold" />
          </div>
          <h4 className="font-bold text-slate-800 dark:text-slate-50 text-base mb-1">Eventos institucionales</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">Explora e inscríbete a los eventos disponibles</p>
        </button>
        <button onClick={() => navigate('/events?filter=enrolled')} className="text-left bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all group">
          <div className="p-3 bg-istpet-gold/10 rounded-xl w-fit mb-3 group-hover:scale-110 transition-transform">
            <FileText size={22} className="text-istpet-gold" />
          </div>
          <h4 className="font-bold text-slate-800 dark:text-slate-50 text-base mb-1">Mis certificados</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">Descarga los certificados de eventos a los que asististe</p>
        </button>
        <button onClick={() => navigate('/profile')} className="text-left bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all group">
          <div className="p-3 bg-istpet-blue/10 dark:bg-istpet-gold/10 rounded-xl w-fit mb-3 group-hover:scale-110 transition-transform">
            <User size={22} className="text-istpet-blue dark:text-istpet-gold" />
          </div>
          <h4 className="font-bold text-slate-800 dark:text-slate-50 text-base mb-1">Mi perfil</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">Actualiza tu foto y datos personales</p>
        </button>
      </div>

      {/* STATS (sin gamificación) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-istpet-blue to-istpet-blue-light text-white rounded-2xl p-5 shadow-lg border-b-4 border-istpet-gold">
          <Clock size={22} className="mb-2 opacity-80" />
          <div className="text-3xl font-extrabold">{data.totalHours}<span className="text-base font-medium opacity-70 ml-1">hrs</span></div>
          <p className="text-xs opacity-80 mt-1">Horas certificadas</p>
        </div>
        <div className="bg-gradient-to-br from-istpet-gold to-istpet-gold-light text-istpet-blue rounded-2xl p-5 shadow-lg border-b-4 border-istpet-blue">
          <CheckCircle size={22} className="mb-2 opacity-80" />
          <div className="text-3xl font-extrabold">{data.attendances.length}</div>
          <p className="text-xs opacity-80 mt-1">Asistencias</p>
        </div>
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
          <Award size={22} className="mb-2 text-istpet-blue dark:text-istpet-gold" />
          <div className="text-3xl font-extrabold text-slate-800 dark:text-slate-50">{data.pendingCertificates.length}</div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Certificados disponibles</p>
        </div>
      </div>

      {/* CERTIFICADOS DISPONIBLES (destacado) */}
      {data.pendingCertificates.length > 0 && (
        <div className="bg-gradient-to-r from-istpet-gold/10 to-istpet-gold/5 dark:from-istpet-gold/10 dark:to-slate-800 border-2 border-istpet-gold/30 rounded-3xl p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-istpet-gold rounded-2xl text-istpet-blue flex-shrink-0">
              <Award size={28} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-lg text-slate-800 dark:text-slate-50">Tienes {data.pendingCertificates.length} certificado{data.pendingCertificates.length !== 1 ? 's' : ''} listo{data.pendingCertificates.length !== 1 ? 's' : ''} para descargar</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">Has completado los eventos y tu asistencia fue validada.</p>
              <div className="flex flex-wrap gap-2 mt-3">
                {data.pendingCertificates.slice(0, 3).map((att: any) => (
                  <button
                    key={att.id}
                    onClick={() => handleCertificate(att.eventId)}
                    className="flex items-center gap-2 px-4 py-2 bg-istpet-blue dark:bg-istpet-gold text-white dark:text-slate-900 rounded-xl font-bold text-sm hover:bg-istpet-blue-light dark:hover:bg-istpet-gold-light transition-colors"
                  >
                    <Download size={14} /> {att.event.title.length > 30 ? att.event.title.slice(0, 30) + '…' : att.event.title}
                  </button>
                ))}
                {data.pendingCertificates.length > 3 && (
                  <button onClick={() => navigate('/events')} className="text-sm text-istpet-blue dark:text-istpet-gold font-semibold hover:underline px-3 py-2">
                    Ver {data.pendingCertificates.length - 3} más →
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PRÓXIMOS EVENTOS INSCRITOS */}
      {data.upcomingRegistered.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg text-slate-800 dark:text-slate-50 flex items-center gap-2">
              <Calendar size={20} className="text-istpet-blue dark:text-istpet-gold" />
              Tus próximos eventos
              <span className="text-xs px-2 py-0.5 rounded-full bg-istpet-blue/10 dark:bg-istpet-gold/10 text-istpet-blue dark:text-istpet-gold font-semibold">{data.upcomingRegistered.length}</span>
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.upcomingRegistered.slice(0, 6).map((ev: any) => {
              const hasCheckIn = ev.attendances && ev.attendances.length > 0;
              const now = Date.now();
              const startMs = new Date(ev.startDate).getTime();
              const endMs = new Date(ev.endDate).getTime();
              const isActive = startMs <= now && endMs > now;
              const countdownTarget = isActive ? ev.endDate : ev.startDate;
              const cd = humanCountdown(countdownTarget);
              return (
                <div key={ev.id} className="bg-gradient-to-br from-slate-50 to-white dark:from-slate-700 dark:to-slate-800 border border-slate-200 dark:border-slate-600 rounded-2xl p-4 hover:shadow-md transition-shadow flex flex-col">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 line-clamp-2 flex-1">{ev.title}</h4>
                    {ev.isTransversal
                      ? <span className="text-[10px] px-2 py-0.5 rounded-full bg-istpet-gold/20 text-istpet-blue dark:text-istpet-gold font-bold flex-shrink-0">General</span>
                      : <span className="text-[10px] px-2 py-0.5 rounded-full bg-istpet-blue/10 dark:bg-slate-700 text-istpet-blue dark:text-slate-300 font-bold flex-shrink-0">Específico</span>
                    }
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1 mb-3 flex-1">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={11} /> {fmtDate(ev.startDate)}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock size={11} /> {fmtTime(ev.startDate)} · {ev.hours}h
                    </div>
                  </div>
                  {cd && (
                    <div className={`text-xs font-bold px-2 py-1.5 rounded-lg mb-2 flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                        : 'bg-istpet-blue/10 dark:bg-istpet-gold/10 text-istpet-blue dark:text-istpet-gold'
                    }`}>
                      <Hourglass size={11} className={isActive ? 'animate-pulse' : ''} />
                      {isActive ? `Termina en ${cd}` : `Empieza en ${cd}`}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <a
                      href={ISTPET_MAPS_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-slate-100 dark:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold hover:bg-slate-200 transition-colors"
                    >
                      <MapPin size={11} /> Cómo llegar
                    </a>
                    <button
                      onClick={() => navigate(`/events?eventId=${ev.id}`)}
                      className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                        isActive && !hasCheckIn
                          ? 'bg-istpet-gold text-istpet-blue hover:bg-istpet-gold-light'
                          : 'bg-istpet-blue text-white hover:bg-istpet-blue-light'
                      }`}
                    >
                      {isActive && !hasCheckIn ? <>Asistir <ArrowRight size={11} /></> : <>Ver detalle <ArrowRight size={11} /></>}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          {data.upcomingRegistered.length > 6 && (
            <button onClick={() => navigate('/events?filter=enrolled')} className="mt-4 text-sm font-semibold text-istpet-blue dark:text-istpet-gold hover:underline">
              Ver todos los inscritos ({data.upcomingRegistered.length}) →
            </button>
          )}
        </div>
      )}

      {/* GRID 2 COLS: Sugeridos + Calendario */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SUGERIDOS PARA TI */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-lg text-slate-800 dark:text-slate-50 flex items-center gap-2">
              <Sparkles size={20} className="text-istpet-gold" />
              Sugeridos para ti
            </h3>
            <button onClick={() => navigate('/events')} className="text-xs font-semibold text-istpet-blue dark:text-istpet-gold hover:underline">
              Ver todos →
            </button>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 flex items-start gap-1.5">
            <Info size={12} className="flex-shrink-0 mt-0.5" />
            <span>Eventos futuros donde aún no estás inscrito, que son generales o de tu carrera, y tienen cupo disponible.</span>
          </p>
          {data.suggested.length === 0 ? (
            <div className="text-center py-8 text-slate-400 dark:text-slate-500">
              <Sparkles size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">No hay nuevos eventos sugeridos.</p>
              <p className="text-xs mt-1">Cuando el ISTPET cree eventos para tu carrera, aparecerán aquí.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.suggested.slice(0, 4).map((ev: any) => (
                <div key={ev.id} className="flex items-center gap-4 p-3 rounded-2xl bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-600 hover:border-istpet-blue/40 dark:hover:border-istpet-gold/40 transition-colors">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-istpet-blue to-istpet-blue-light flex flex-col items-center justify-center text-white flex-shrink-0">
                    <span className="text-[9px] uppercase opacity-80">{new Date(ev.startDate).toLocaleDateString('es-EC', { timeZone: 'America/Guayaquil', month: 'short' })}</span>
                    <span className="text-lg font-extrabold leading-none">{new Date(ev.startDate).toLocaleDateString('es-EC', { timeZone: 'America/Guayaquil', day: 'numeric' })}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 truncate">{ev.title}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {ev.isTransversal ? 'General · ' : 'Específico · '}{fmtTime(ev.startDate)} · {ev.hours}h{ev.capacity && ` · ${ev._count.registrations}/${ev.capacity} cupos`}
                    </p>
                  </div>
                  <button
                    onClick={() => registerToEvent(ev.id)}
                    className="flex items-center gap-1 px-3 py-2 bg-istpet-blue dark:bg-istpet-gold text-white dark:text-slate-900 rounded-lg text-xs font-bold hover:bg-istpet-blue-light dark:hover:bg-istpet-gold-light transition-colors flex-shrink-0"
                  >
                    Inscribirme
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* MINI CALENDARIO */}
        <MiniCalendar
          events={data.monthEvents}
          onEventClick={(ev) => navigate(`/events?eventId=${ev.id}`)}
        />
      </div>
    </div>
  );
};

export default StudentDashboard;
