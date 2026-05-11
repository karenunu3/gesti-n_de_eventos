import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchApi, API_URL } from '../lib/api';
import {
  Calendar, Clock, Award, TrendingUp, MapPin, Sparkles,
  CheckCircle, Download, ChevronLeft, ChevronRight, User, FileText, ArrowRight, Trophy, Hourglass
} from 'lucide-react';
import { fmtDate, fmtTime, humanCountdown } from '../lib/dates';
import Toast, { type ToastType } from '../components/Toast';
import { useAutoRefresh } from '../hooks/useAutoRefresh';

interface DashboardData {
  totalHours: number;
  attendances: any[];
  upcomingRegistered: any[];
  suggested: any[];
  pendingCertificates: any[];
  monthEvents: { id: number; title: string; startDate: string; endDate: string; isTransversal: boolean }[];
  badges: { id: string; label: string; icon: string; desc: string; target: number; current: number; unlocked: boolean }[];
  progressTarget: number;
}

const ISTPET_MAPS_URL = 'https://maps.google.com/?q=-0.281660,-78.555455';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ type: ToastType; text: string } | null>(null);
  const [calMonth, setCalMonth] = useState(new Date());

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
        setToast({ type: 'success', text: '¡Certificado descargado!' });
      }
    } catch (err: any) {
      if (err.message === 'SURVEY_REQUIRED') {
        setToast({ type: 'info', text: 'Debes completar la encuesta antes de descargar. Ve a /events.' });
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

  const progress = Math.min((data.totalHours / data.progressTarget) * 100, 100);
  const unlockedBadges = data.badges.filter(b => b.unlocked).length;

  // Mini calendario
  const calY = calMonth.getFullYear();
  const calM = calMonth.getMonth();
  const firstDay = new Date(calY, calM, 1).getDay();
  const daysInMonth = new Date(calY, calM + 1, 0).getDate();
  const today = new Date();
  const eventsByDay: Record<number, any[]> = {};
  data.monthEvents.forEach(e => {
    const d = new Date(e.startDate);
    if (d.getFullYear() === calY && d.getMonth() === calM) {
      const day = d.getDate();
      eventsByDay[day] = eventsByDay[day] || [];
      eventsByDay[day].push(e);
    }
  });

  return (
    <div className="space-y-6">
      {toast && <Toast type={toast.type} text={toast.text} onClose={() => setToast(null)} />}

      {/* HERO STATS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
          <Trophy size={22} className="mb-2 text-istpet-gold" />
          <div className="text-3xl font-extrabold text-slate-800 dark:text-slate-50">{unlockedBadges}<span className="text-base font-medium text-slate-400 ml-1">/ {data.badges.length}</span></div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Logros</p>
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
              <h3 className="font-bold text-lg text-slate-800 dark:text-slate-50">¡Tienes {data.pendingCertificates.length} certificado{data.pendingCertificates.length !== 1 ? 's' : ''} listo{data.pendingCertificates.length !== 1 ? 's' : ''} para descargar! 🎉</h3>
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

      {/* PROGRESO ANUAL */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-lg text-slate-800 dark:text-slate-50 flex items-center gap-2">
            <TrendingUp size={20} className="text-istpet-blue dark:text-istpet-gold" />
            Progreso anual
          </h3>
          <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            <span className="text-istpet-blue dark:text-istpet-gold text-lg">{data.totalHours}</span> / {data.progressTarget} hrs
          </span>
        </div>
        <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-istpet-blue via-istpet-blue-light to-istpet-gold transition-all duration-700 ease-out rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
          {data.totalHours >= data.progressTarget
            ? '🎉 ¡Felicidades! Has completado tu meta anual de horas.'
            : `Solo te faltan ${data.progressTarget - data.totalHours} horas para tu objetivo anual.`}
        </p>
      </div>

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
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg text-slate-800 dark:text-slate-50 flex items-center gap-2">
              <Sparkles size={20} className="text-istpet-gold" />
              Sugeridos para ti
            </h3>
            <button onClick={() => navigate('/events')} className="text-xs font-semibold text-istpet-blue dark:text-istpet-gold hover:underline">
              Ver todos →
            </button>
          </div>
          {data.suggested.length === 0 ? (
            <div className="text-center py-8 text-slate-400 dark:text-slate-500">
              <Sparkles size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">No hay nuevos eventos sugeridos. ¡Vuelve pronto!</p>
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
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-base text-slate-800 dark:text-slate-50 capitalize">
              {calMonth.toLocaleDateString('es-EC', { month: 'long', year: 'numeric' })}
            </h3>
            <div className="flex gap-1">
              <button onClick={() => setCalMonth(new Date(calY, calM - 1))} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-500"><ChevronLeft size={16} /></button>
              <button onClick={() => setCalMonth(new Date())} className="text-[10px] px-1.5 hover:text-istpet-blue dark:hover:text-istpet-gold text-slate-500 self-center font-semibold">Hoy</button>
              <button onClick={() => setCalMonth(new Date(calY, calM + 1))} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-500"><ChevronRight size={16} /></button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-1">
            {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((d, i) => <div key={i}>{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array(firstDay).fill(0).map((_, i) => <div key={`empty-${i}`} />)}
            {Array(daysInMonth).fill(0).map((_, i) => {
              const day = i + 1;
              const isToday = today.getFullYear() === calY && today.getMonth() === calM && today.getDate() === day;
              const dayEvents = eventsByDay[day] || [];
              const hasEvents = dayEvents.length > 0;
              return (
                <button
                  key={day}
                  onClick={() => hasEvents && navigate(`/events?eventId=${dayEvents[0].id}`)}
                  disabled={!hasEvents}
                  className={`aspect-square flex flex-col items-center justify-center rounded-lg text-xs relative transition-colors ${
                    isToday
                      ? 'bg-istpet-blue text-white dark:bg-istpet-gold dark:text-slate-900 font-bold'
                      : hasEvents
                      ? 'bg-istpet-gold/20 text-istpet-blue dark:text-istpet-gold hover:bg-istpet-gold/40 cursor-pointer font-semibold'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                  title={hasEvents ? dayEvents.map(e => e.title).join(', ') : ''}
                >
                  {day}
                  {hasEvents && !isToday && (
                    <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-istpet-gold" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* LOGROS / BADGES */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
        <h3 className="font-bold text-lg text-slate-800 dark:text-slate-50 flex items-center gap-2 mb-4">
          <Trophy size={20} className="text-istpet-gold" />
          Tus logros
          <span className="text-xs px-2 py-0.5 rounded-full bg-istpet-gold/10 text-istpet-gold font-semibold">{unlockedBadges} / {data.badges.length}</span>
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {data.badges.map(b => (
            <div
              key={b.id}
              className={`relative p-4 rounded-2xl text-center transition-all ${
                b.unlocked
                  ? 'bg-gradient-to-br from-istpet-gold/20 to-istpet-gold/5 border-2 border-istpet-gold/40'
                  : 'bg-slate-50 dark:bg-slate-700/50 border-2 border-slate-200 dark:border-slate-700 opacity-60'
              }`}
              title={b.desc}
            >
              <div className="text-3xl mb-1">{b.unlocked ? b.icon : '🔒'}</div>
              <div className={`text-xs font-bold ${b.unlocked ? 'text-istpet-blue dark:text-istpet-gold' : 'text-slate-500 dark:text-slate-400'}`}>
                {b.label}
              </div>
              <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{b.current} / {b.target}</div>
              {!b.unlocked && (
                <div className="mt-2 h-1 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
                  <div className="h-full bg-istpet-gold/60 rounded-full" style={{ width: `${(b.current / b.target) * 100}%` }} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* QUICK ACTIONS */}
      <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 pt-2">Accesos rápidos</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button onClick={() => navigate('/events')} className="text-left bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all group">
          <div className="p-3 bg-istpet-blue/10 dark:bg-istpet-gold/10 rounded-xl w-fit mb-3 group-hover:scale-110 transition-transform">
            <Calendar size={22} className="text-istpet-blue dark:text-istpet-gold" />
          </div>
          <h4 className="font-bold text-slate-800 dark:text-slate-50 text-base mb-1">Eventos institucionales</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">Explora e inscríbete a los eventos disponibles</p>
        </button>
        <button onClick={() => navigate('/events?filter=enrolled')} className="text-left bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all group">
          <div className="p-3 bg-istpet-gold/10 rounded-xl w-fit mb-3 group-hover:scale-110 transition-transform">
            <FileText size={22} className="text-istpet-gold" />
          </div>
          <h4 className="font-bold text-slate-800 dark:text-slate-50 text-base mb-1">Mis certificados</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">Descarga los certificados de eventos a los que asististe</p>
        </button>
        <button onClick={() => navigate('/profile')} className="text-left bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all group">
          <div className="p-3 bg-istpet-blue/10 dark:bg-istpet-gold/10 rounded-xl w-fit mb-3 group-hover:scale-110 transition-transform">
            <User size={22} className="text-istpet-blue dark:text-istpet-gold" />
          </div>
          <h4 className="font-bold text-slate-800 dark:text-slate-50 text-base mb-1">Mi perfil</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">Actualiza tu foto y datos personales</p>
        </button>
      </div>
    </div>
  );
};

export default StudentDashboard;
