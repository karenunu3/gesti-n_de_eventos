import { useEffect, useState } from 'react';
import { fetchApi, API_URL } from '../lib/api';
import { useNavigate } from 'react-router-dom';
import {
  Calendar, FileText, Download, Users, BarChart3,
  GraduationCap, Layers, Clock, CheckCircle, XCircle
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useTranslation } from 'react-i18next';

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrador',
  SECRETARIA: 'Secretaria',
  DOCENTE: 'Docente',
  ALUMNO: 'Alumno',
};

const Dashboard = () => {
  const { t } = useTranslation();
  const [user, setUser] = useState<any>(null);
  const [report, setReport] = useState<any>(null);
  const [reportError, setReportError] = useState(false);
  // Punto 6: historial personal del docente
  const [docenteReport, setDocenteReport] = useState<any>(null);
  const [certMessage, setCertMessage] = useState<{text: string, type: 'error'|'success'|'info'} | null>(null);
  const [eventsData, setEventsData] = useState<any[]>([]);
  const [eventStats, setEventStats] = useState({ total: 0, totalRegistrations: 0, totalAttendances: 0 });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) throw new Error('No user data found');
      const u = JSON.parse(userStr);
      if (!u || !u.id) {
        navigate('/login', { replace: true });
        return;
      }
      setUser(u);

      if (u.role === 'ALUMNO') {
        loadReport().finally(() => setLoading(false));
      } else if (['ADMIN', 'SECRETARIA', 'DOCENTE'].includes(u.role)) {
        // Para DOCENTE: cargar datos admin + su historial personal
        const tasks: Promise<any>[] = [loadAdminData()];
        if (u.role === 'DOCENTE') tasks.push(loadDocenteReport());
        Promise.all(tasks).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    } catch {
      navigate('/login', { replace: true });
    }
  }, []);

  const loadReport = async () => {
    try {
      const data = await fetchApi('/reports/student');
      setReport(data);
    } catch {
      setReportError(true);
    }
  };

  // Punto 6: historial personal del docente (igual endpoint que alumno, para sí mismo)
  const loadDocenteReport = async () => {
    try {
      const data = await fetchApi('/reports/student');
      setDocenteReport(data);
    } catch {
      // silencioso — el docente puede no tener asistencias propias
    }
  };

  const loadAdminData = async () => {
    try {
      // Obtener eventos del mes actual para el dashboard
      const data = await fetchApi('/events/current-month');
      setEventsData(data.map((e: any) => ({
        name: e.title.length > 14 ? e.title.substring(0, 14) + '…' : e.title,
        Inscritos: e._count?.registrations || 0,
        Asistencias: e._count?.attendances || 0,
      })));
      setEventStats({
        total: data.length,
        totalRegistrations: data.reduce((s: number, e: any) => s + (e._count?.registrations || 0), 0),
        totalAttendances: data.reduce((s: number, e: any) => s + (e._count?.attendances || 0), 0),
      });
    } catch (err) {
      console.error(err);
    }
  };

  const generateCert = async (eventId: number) => {
    setCertMessage(null);
    try {
      const data = await fetchApi(`/reports/certificate/${eventId}`, { method: 'POST' });
      if (data.pdfUrl) window.open(`${API_URL.replace('/api', '')}${data.pdfUrl}`, '_blank');
      setCertMessage({ text: '¡Certificado generado! Se abrió en una nueva pestaña.', type: 'success' });
    } catch (error: any) {
      if (error.message === 'SURVEY_REQUIRED') {
        setCertMessage({ text: 'Debes completar la encuesta de satisfacción antes de descargar el certificado. Ve a la sección Eventos para hacerlo.', type: 'info' });
      } else {
        setCertMessage({ text: error.message, type: 'error' });
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-istpet-blue dark:border-istpet-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const isAdminUser = ['ADMIN', 'SECRETARIA', 'DOCENTE'].includes(user.role);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto w-full fade-in">
      {/* Page header */}
      <div className="mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-50">
          {t('dashboard.welcome', { name: user.firstName })}
        </h2>
        <p className="text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2 text-sm">
          {t('dashboard.subtitle')}
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-istpet-blue/10 dark:bg-istpet-gold/10 text-istpet-blue dark:text-istpet-gold text-xs font-semibold">
            {ROLE_LABELS[user.role] || user.role}
          </span>
        </p>
      </div>

      {/* ── ALUMNO VIEW ── */}
      {user.role === 'ALUMNO' && (
        <div className="space-y-6">
          {reportError && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-2xl p-6 text-center">
              No se pudo cargar tu reporte. Intenta recargar la página.
            </div>
          )}

          {certMessage && (
            <div className={`p-4 rounded-2xl text-sm font-medium flex items-center gap-3 ${
              certMessage.type === 'success' ? 'bg-istpet-blue/10 text-istpet-blue dark:bg-istpet-gold/10 dark:text-istpet-gold border border-istpet-blue/20 dark:border-istpet-gold/20' :
              certMessage.type === 'info'    ? 'bg-istpet-gold/10 text-amber-700 dark:text-istpet-gold border border-istpet-gold/30' :
                                               'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
            }`}>
              {certMessage.type === 'error' ? <XCircle size={18} /> : <CheckCircle size={18} />}
              {certMessage.text}
            </div>
          )}

          {report && (
            <>
              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-istpet-blue to-istpet-blue-light dark:from-slate-800 dark:to-slate-700 border-b-4 border-istpet-gold rounded-2xl p-6 text-white shadow-lg">
                  <p className="text-sm opacity-80 mb-1 flex items-center gap-2">
                    <Clock size={14} /> {t('dashboard.total_hours')}
                  </p>
                  <div className="text-4xl font-extrabold">
                    {report.totalHours} <span className="text-xl font-medium opacity-70">hrs</span>
                  </div>
                </div>
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm">
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-2">
                    <FileText size={14} /> Asistencias
                  </p>
                  <div className="text-4xl font-extrabold text-slate-800 dark:text-slate-50">
                    {report.attendances.length}
                  </div>
                </div>
              </div>

              {/* Attendances list */}
              <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                  <h3 className="font-bold text-lg text-slate-800 dark:text-slate-50">{t('dashboard.my_attendances')}</h3>
                  <FileText className="text-slate-400" size={18} />
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-700">
                  {report.attendances.map((att: any) => (
                    <div key={att.id} className="p-5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors gap-4">
                      <div className="min-w-0">
                        <h4 className="font-semibold text-slate-800 dark:text-slate-100 truncate">{att.event.title}</h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {new Date(att.event.startDate).toLocaleDateString('es-EC', { day: 'numeric', month: 'long', year: 'numeric' })}
                          {' • '}{att.event.hours} horas
                        </p>
                      </div>
                      <button
                        onClick={() => generateCert(att.eventId)}
                        className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-istpet-blue/10 dark:bg-istpet-gold/10 text-istpet-blue dark:text-istpet-gold hover:bg-istpet-blue/20 dark:hover:bg-istpet-gold/20 rounded-xl text-sm font-medium transition-colors"
                      >
                        <Download size={15} />
                        {t('dashboard.cert_btn')}
                      </button>
                    </div>
                  ))}
                  {report.attendances.length === 0 && (
                    <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                      {t('dashboard.no_attendances')}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── ADMIN / SECRETARIA / DOCENTE VIEW ── */}
      {isAdminUser && (
        <div className="space-y-6 fade-in">
          {/* Quick stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: 'Total Eventos', value: eventStats.total, icon: <Calendar size={14} /> },
              { label: 'Inscripciones totales', value: eventStats.totalRegistrations, icon: <Users size={14} /> },
              { label: 'Asistencias registradas', value: eventStats.totalAttendances, icon: <CheckCircle size={14} /> },
            ].map(stat => (
              <div key={stat.label} className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <p className="text-xs uppercase font-semibold text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
                  {stat.icon} {stat.label}
                </p>
                <p className="text-4xl font-extrabold text-istpet-blue dark:text-istpet-gold">{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Chart */}
          {eventsData.length > 0 && (
            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700">
              <h3 className="text-base font-bold text-slate-700 dark:text-slate-200 mb-6 flex items-center gap-2">
                <BarChart3 className="text-istpet-blue dark:text-istpet-gold" size={18} />
                Flujo de Alumnos por Evento
              </h3>
              <div className="h-64 w-full" style={{ minWidth: 0, minHeight: 0 }}>
                <ResponsiveContainer width="99%" height="100%">
                  <BarChart data={eventsData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0/0.1)' }} isAnimationActive={false} />
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '12px', fontSize: '12px' }} />
                    <Bar dataKey="Inscritos" fill="#BCA75B" radius={[4, 4, 0, 0]} barSize={26} isAnimationActive={false} />
                    <Bar dataKey="Asistencias" fill="#1F295B" radius={[4, 4, 0, 0]} barSize={26} isAnimationActive={false} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Punto 6: Historial personal del docente */}
          {user.role === 'DOCENTE' && certMessage && (
            <div className={`p-4 rounded-2xl text-sm font-medium flex items-center gap-3 ${
              certMessage.type === 'success' ? 'bg-istpet-blue/10 text-istpet-blue dark:bg-istpet-gold/10 dark:text-istpet-gold border border-istpet-blue/20 dark:border-istpet-gold/20' :
              certMessage.type === 'info'    ? 'bg-istpet-gold/10 text-amber-700 dark:text-istpet-gold border border-istpet-gold/30' :
                                               'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
            }`}>
              {certMessage.type === 'error' ? <XCircle size={18} /> : <CheckCircle size={18} />}
              {certMessage.text}
            </div>
          )}
          {user.role === 'DOCENTE' && docenteReport && (
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg text-slate-800 dark:text-slate-50 flex items-center gap-2">
                    <GraduationCap size={18} className="text-istpet-blue dark:text-istpet-gold" />
                    Mi historial de participación
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Eventos en los que has participado como asistente</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-2xl font-extrabold text-istpet-blue dark:text-istpet-gold">{docenteReport.totalHours}</div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">horas acumuladas</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-extrabold text-slate-700 dark:text-slate-200">{docenteReport.attendances.length}</div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">asistencias</p>
                  </div>
                </div>
              </div>
              {docenteReport.attendances.length === 0 ? (
                <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                  Aún no has asistido a ningún evento como participante.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-700">
                  {docenteReport.attendances.slice(0, 5).map((att: any) => (
                    <div key={att.id} className="p-5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors gap-4">
                      <div className="min-w-0">
                        <h4 className="font-semibold text-slate-800 dark:text-slate-100 truncate">{att.event.title}</h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {new Date(att.event.startDate).toLocaleDateString('es-EC', { day: 'numeric', month: 'long', year: 'numeric' })}
                          {' · '}{att.event.hours} horas
                        </p>
                      </div>
                      <button
                        onClick={() => generateCert(att.eventId)}
                        className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-istpet-blue/10 dark:bg-istpet-gold/10 text-istpet-blue dark:text-istpet-gold hover:bg-istpet-blue/20 dark:hover:bg-istpet-gold/20 rounded-xl text-sm font-medium transition-colors"
                      >
                        <Download size={15} /> Certificado
                      </button>
                    </div>
                  ))}
                  {docenteReport.attendances.length > 5 && (
                    <div className="p-4 text-center">
                      <button onClick={() => navigate('/eventos')} className="text-sm text-istpet-blue dark:text-istpet-gold hover:underline font-medium">
                        Ver todos ({docenteReport.attendances.length} eventos) →
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Quick-access cards */}
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Accesos rápidos</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <QuickCard
              icon={<Calendar size={20} className="text-istpet-blue dark:text-istpet-gold" />}
              iconBg="bg-istpet-blue/10 dark:bg-istpet-gold/10"
              title={t('dashboard.admin_events')}
              desc="Crea y gestiona eventos, proyecta QR para asistencia y audita registros."
              btnLabel="Ir a Eventos"
              btnClass="bg-istpet-blue dark:bg-istpet-gold text-white dark:text-slate-900 hover:bg-istpet-blue-light dark:hover:bg-istpet-gold-light"
              onClick={() => navigate('/admin/events')}
            />
            {['ADMIN', 'SECRETARIA'].includes(user.role) && (
              <QuickCard
                icon={<Layers size={20} className="text-istpet-gold" />}
                iconBg="bg-istpet-gold/10"
                title={t('dashboard.admin_careers')}
                desc="Administra las carreras del instituto. Asócialas con eventos específicos."
                btnLabel="Ir a Carreras"
                btnClass="bg-istpet-gold text-istpet-blue hover:bg-istpet-gold-dark"
                onClick={() => navigate('/admin/careers')}
              />
            )}
            {user.role === 'ADMIN' && (
              <QuickCard
                icon={<Users size={20} className="text-istpet-blue dark:text-istpet-gold" />}
                iconBg="bg-istpet-blue/10 dark:bg-istpet-gold/10"
                title={t('dashboard.admin_users')}
                desc="Gestiona el personal y alumnado. Asigna roles y permisos."
                btnLabel="Ir a Usuarios"
                btnClass="bg-istpet-blue dark:bg-istpet-gold text-white dark:text-slate-900 hover:bg-istpet-blue-light dark:hover:bg-istpet-gold-light"
                onClick={() => navigate('/admin/users')}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const QuickCard = ({ icon, iconBg, title, desc, btnLabel, btnClass, onClick }: any) => (
  <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow flex flex-col">
    <div className={`p-3 ${iconBg} rounded-xl w-fit mb-4`}>{icon}</div>
    <h4 className="text-base font-bold text-slate-800 dark:text-slate-50 mb-1">{title}</h4>
    <p className="text-slate-500 dark:text-slate-400 mb-5 text-sm flex-1">{desc}</p>
    <button onClick={onClick} className={`px-5 py-2.5 rounded-xl font-bold w-full transition-colors text-sm ${btnClass}`}>
      {btnLabel}
    </button>
  </div>
);

export default Dashboard;
