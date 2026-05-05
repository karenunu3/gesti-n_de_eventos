import { useEffect, useState, useRef } from 'react';
import { fetchApi, API_URL } from '../lib/api';
import { Calendar, MapPin, Clock, CheckCircle, XCircle, Star, QrCode, ArrowLeft, Search, Filter, Layers, GraduationCap, X } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const Events = () => {
  const { t } = useTranslation();
  const [events, setEvents] = useState<any[]>([]);
  const [careers, setCareers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [attendanceEventId, setAttendanceEventId] = useState<number | null>(null);
  const [message, setMessage] = useState<{text: string, type: 'error'|'success'} | null>(null);
  const navigate = useNavigate();

  // QR Scanner & Location state
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  // Survey state
  const [showSurvey, setShowSurvey] = useState<number | null>(null);
  const [surveyData, setSurveyData] = useState({ rating: 5, feedback: '' });
  const [submittingSurvey, setSubmittingSurvey] = useState(false);

  // Filter state
  const [searchText, setSearchText] = useState('');
  const [filterCareer, setFilterCareer] = useState<string>('ALL');
  const [filterType, setFilterType] = useState<'ALL' | 'TRANSVERSAL' | 'SPECIFIC'>('ALL');
  const [filterTime, setFilterTime] = useState<'ALL' | 'UPCOMING' | 'PAST'>('UPCOMING');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ENROLLED' | 'NOT_ENROLLED'>('ALL');

  useEffect(() => {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) throw new Error('No user data');
      const u = JSON.parse(userStr);
      if (!u || !u.id) {
        navigate('/login', { replace: true });
        return;
      }
      setUser(u);
    } catch {
      navigate('/login', { replace: true });
      return;
    }
    loadEvents();
    loadCareers();

    // Cleanup QR scanner when component unmounts (prevent DOM/camera leaks on navigation)
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
        scannerRef.current = null;
      }
    };
  }, []);

  const loadEvents = async () => {
    try {
      const data = await fetchApi('/events');
      setEvents(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadCareers = async () => {
    try {
      const data = await fetchApi('/careers');
      setCareers(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRegister = async (eventId: number) => {
    try {
      await fetchApi(`/events/${eventId}/register`, { method: 'POST' });
      setMessage({ text: 'Inscrito con éxito', type: 'success' });
      loadEvents();
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
    }
  };

  const startAttendance = async (eventId: number) => {
    setAttendanceEventId(eventId);
    setMessage(null);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setTimeout(() => {
            if (!scannerRef.current) {
              const scanner = new Html5Qrcode("qr-reader");
              scannerRef.current = scanner;
              scanner.start(
                { facingMode: "environment" },
                { fps: 10, qrbox: { width: 250, height: 250 } },
                (decodedText) => {
                  scanner.stop().catch(console.error);
                  scannerRef.current = null;
                  submitAttendance(eventId, pos.coords.latitude, pos.coords.longitude, decodedText);
                },
                undefined
              ).catch(() => {
                scannerRef.current = null;
                setMessage({ text: 'No se pudo acceder a la cámara. Verifica los permisos del navegador.', type: 'error' });
                setAttendanceEventId(null);
              });
            }
          }, 100);
        },
        () => setMessage({ text: 'Error obteniendo ubicación. Necesario para asistencia.', type: 'error' })
      );
    } else {
      setMessage({ text: 'Tu navegador no soporta geolocalización', type: 'error' });
    }
  };

  const startCheckOut = async (eventId: number) => {
    setMessage(null);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          submitAttendance(eventId, pos.coords.latitude, pos.coords.longitude, '');
        },
        () => setMessage({ text: 'Error obteniendo ubicación. Necesario para registrar salida.', type: 'error' })
      );
    } else {
      setMessage({ text: 'Tu navegador no soporta geolocalización', type: 'error' });
    }
  };

  const cancelAttendance = () => {
    if (scannerRef.current) {
      scannerRef.current.stop().catch(console.error);
      scannerRef.current = null;
    }
    setAttendanceEventId(null);
    setLocation(null);
  };

  const submitAttendance = async (eventId: number, lat: number, lng: number, qrToken: string) => {
    const formData = new FormData();
    formData.append('latitude', lat.toString());
    formData.append('longitude', lng.toString());
    formData.append('qrToken', qrToken);
    const dummyBlob = new Blob([''], { type: 'image/jpeg' });
    formData.append('photo', dummyBlob, 'qr-scan.jpg');

    try {
      const res = await fetch(`${API_URL}/attendance/${eventId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setMessage({ text: data.message + (data.isValid ? ' Dentro del radio.' : ' Fuera del radio.'), type: data.isValid ? 'success' : 'error' });
      cancelAttendance();
      loadEvents();
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
      cancelAttendance();
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
      }
    } catch (err: any) {
      if (err.message === 'SURVEY_REQUIRED') {
        setShowSurvey(eventId);
      } else {
        setMessage({ text: err.message, type: 'error' });
      }
    }
  };

  const submitSurvey = async () => {
    if (!showSurvey || submittingSurvey) return;
    setSubmittingSurvey(true);
    try {
      await fetchApi('/reports/survey', {
        method: 'POST',
        body: JSON.stringify({ eventId: showSurvey, ...surveyData })
      });
      const eventId = showSurvey;
      setShowSurvey(null);
      handleCertificate(eventId);
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
    } finally {
      setSubmittingSurvey(false);
    }
  };

  const isPast = (event: any) => new Date(event.endDate) < new Date();

  // Filtered events
  const filteredEvents = events.filter(event => {
    const now = new Date();
    const endDate = new Date(event.endDate);
    const startDate = new Date(event.startDate);

    if (searchText) {
      const searchWords = searchText.toLowerCase().split(/\s+/).filter(w => w.length > 0);
      const titleLower = event.title.toLowerCase();
      const descLower = event.description?.toLowerCase() || '';
      const matchesAllWords = searchWords.every(word => titleLower.includes(word) || descLower.includes(word));
      if (!matchesAllWords) return false;
    }

    if (filterType === 'TRANSVERSAL' && !event.isTransversal) return false;
    if (filterType === 'SPECIFIC' && event.isTransversal) return false;

    if (filterCareer !== 'ALL') {
      if (!event.isTransversal && !event.careers?.some((c: any) => c.id.toString() === filterCareer)) return false;
    }

    if (filterTime === 'UPCOMING' && endDate < now) return false;
    if (filterTime === 'PAST' && startDate > now) return false;

    if (user?.role === 'ALUMNO') {
      if (filterStatus === 'ENROLLED' && !(event.registrations && event.registrations.length > 0)) return false;
      if (filterStatus === 'NOT_ENROLLED' && event.registrations && event.registrations.length > 0) return false;
    }

    return true;
  });

  if (loading) return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-istpet-blue dark:border-istpet-gold border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      <div className="p-6 max-w-7xl mx-auto fade-in" translate="no">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="hidden md:flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-istpet-blue dark:hover:text-istpet-gold transition-colors font-medium shadow-sm"
            >
              <ArrowLeft size={18} />
              {t('events.back')}
            </button>
            <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-50">{t('events.title')}</h1>
          </div>
          <span className="text-sm text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-lg">
            {filteredEvents.length} evento{filteredEvents.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Mensaje global */}
        {message && (
          <div className={`mb-4 p-4 rounded-xl flex items-center gap-3 ${message.type === 'error' ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800' : 'bg-istpet-blue/10 dark:bg-istpet-gold/10 text-istpet-blue dark:text-istpet-gold border border-istpet-blue/20 dark:border-istpet-gold/20'}`}>
            {message.type === 'error' ? <XCircle size={20} /> : <CheckCircle size={20} />}
            {message.text}
          </div>
        )}

        {/* Filtros */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 mb-6 space-y-3">
          {/* Búsqueda */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar eventos..."
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-istpet-blue dark:focus:ring-istpet-gold text-sm transition-colors"
            />
          </div>

          {/* Chips de filtro */}
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-1.5">
              <Filter size={14} className="text-slate-400" />
              <span className="text-xs text-slate-400 font-medium">Filtros:</span>
            </div>

            {/* Tiempo */}
            {(['ALL', 'UPCOMING', 'PAST'] as const).map(v => (
              <button key={v} onClick={() => setFilterTime(v)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterTime === v ? 'bg-istpet-blue dark:bg-istpet-gold text-white dark:text-slate-900' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'}`}>
                {v === 'ALL' ? 'Todos' : v === 'UPCOMING' ? 'Próximos' : 'Pasados'}
              </button>
            ))}

            <div className="w-px bg-slate-200 dark:bg-slate-600 self-stretch" />

            {/* Tipo y Carrera (Solo para ADMIN y SECRETARIA) */}
            {user && ['ADMIN', 'SECRETARIA'].includes(user.role) && (
              <>
                {(['ALL', 'TRANSVERSAL', 'SPECIFIC'] as const).map(v => (
                  <button key={v} onClick={() => setFilterType(v)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 ${filterType === v ? 'bg-istpet-blue dark:bg-istpet-gold text-white dark:text-slate-900' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'}`}>
                    {v === 'TRANSVERSAL' && <Layers size={11} />}
                    {v === 'SPECIFIC' && <GraduationCap size={11} />}
                    {v === 'ALL' ? 'Todos los tipos' : v === 'TRANSVERSAL' ? 'General' : 'Por carrera'}
                  </button>
                ))}

                {careers.length > 0 && (
                  <select
                    value={filterCareer}
                    onChange={e => setFilterCareer(e.target.value)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-none outline-none focus:ring-2 focus:ring-istpet-blue dark:focus:ring-istpet-gold transition-colors"
                  >
                    <option value="ALL">Todas las carreras</option>
                    {careers.map(c => <option key={c.id} value={c.id.toString()}>{c.name}</option>)}
                  </select>
                )}
              </>
            )}

            {/* Estado inscripción (solo ALUMNO) */}
            {user?.role === 'ALUMNO' && (
              <>
                <div className="w-px bg-slate-200 dark:bg-slate-600 self-stretch" />
                {(['ALL', 'ENROLLED', 'NOT_ENROLLED'] as const).map(v => (
                  <button key={v} onClick={() => setFilterStatus(v)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterStatus === v ? 'bg-istpet-blue dark:bg-istpet-gold text-white dark:text-slate-900' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'}`}>
                    {v === 'ALL' ? 'Todos' : v === 'ENROLLED' ? 'Inscritos' : 'Sin inscribir'}
                  </button>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Attendance Modal — escáner QR pantalla completa */}
        {attendanceEventId && (
          <div className="fixed inset-0 z-50 bg-black flex flex-col">
            <div className="flex-1 min-h-0 relative overflow-hidden">

              {/* Feed de cámara */}
              <div
                id="qr-reader"
                className="absolute inset-0 [&_video]:!object-cover [&_video]:!w-full [&_video]:!h-full [&_img]:!hidden [&_#qr-reader__dashboard]:!hidden [&_button]:!hidden [&_select]:!hidden"
              />

              {/* Overlay oscuro — 4 paneles alrededor de la ventana de escaneo */}
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                {/* Sombra top */}
                <div className="absolute inset-x-0 top-0 h-[calc(50%-112px)] bg-black/65" />
                {/* Sombra bottom */}
                <div className="absolute inset-x-0 bottom-0 h-[calc(50%-112px)] bg-black/65" />
                {/* Sombra left */}
                <div className="absolute left-0 top-[calc(50%-112px)] bottom-[calc(50%-112px)] w-[calc(50%-112px)] bg-black/65" />
                {/* Sombra right */}
                <div className="absolute right-0 top-[calc(50%-112px)] bottom-[calc(50%-112px)] w-[calc(50%-112px)] bg-black/65" />

                {/* Ventana de escaneo con esquinas */}
                <div className="relative w-56 h-56">
                  {/* Esquina sup-izq */}
                  <span className="absolute top-0 left-0 w-7 h-7 border-t-[3px] border-l-[3px] border-white rounded-tl-md" />
                  {/* Esquina sup-der */}
                  <span className="absolute top-0 right-0 w-7 h-7 border-t-[3px] border-r-[3px] border-white rounded-tr-md" />
                  {/* Esquina inf-izq */}
                  <span className="absolute bottom-0 left-0 w-7 h-7 border-b-[3px] border-l-[3px] border-white rounded-bl-md" />
                  {/* Esquina inf-der */}
                  <span className="absolute bottom-0 right-0 w-7 h-7 border-b-[3px] border-r-[3px] border-white rounded-br-md" />
                  {/* Línea de escaneo animada */}
                  <span className="absolute left-2 right-2 h-[2px] rounded-full bg-istpet-gold/90 animate-[scanline_2s_ease-in-out_infinite]" style={{ top: '50%' }} />
                </div>

                {/* Texto de instrucción debajo del marco */}
                <p className="absolute text-white/75 text-sm font-medium tracking-wide" style={{ top: 'calc(50% + 124px)' }}>
                  Apunta al código QR proyectado
                </p>
              </div>

              {/* Barra superior */}
              <div className="absolute top-0 left-0 right-0 flex items-center gap-3 px-4 pt-10 pb-6 bg-gradient-to-b from-black/75 to-transparent">
                <button
                  onClick={cancelAttendance}
                  className="p-2 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 text-white hover:bg-white/25 transition-colors"
                >
                  <X size={18} />
                </button>
                <div className="flex items-center gap-2">
                  <QrCode size={18} className="text-istpet-gold" />
                  <h2 className="text-white font-bold text-base">{t('events.scan_qr')}</h2>
                </div>
              </div>

              {/* GPS badge — parte inferior */}
              <div className="absolute bottom-6 left-0 right-0 flex justify-center">
                <div className="flex items-center gap-2 bg-black/50 backdrop-blur-sm rounded-full px-4 py-2 border border-white/15">
                  <MapPin size={14} className={location ? 'text-green-400' : 'text-amber-400'} />
                  <span className="text-white text-xs font-medium">
                    {location ? 'Ubicación GPS obtenida' : 'Buscando GPS...'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Survey Modal */}
        {showSurvey && (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-100 dark:border-slate-700">
              <h2 className="text-xl font-bold mb-2 flex items-center gap-2 text-slate-800 dark:text-slate-50">
                <Star size={22} className="text-istpet-gold" />
                Encuesta de Satisfacción
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Completa la encuesta para obtener tu certificado.</p>
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Calificación (1-5)</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} onClick={() => setSurveyData(d => ({ ...d, rating: n }))}
                      className={`flex-1 py-2 rounded-xl font-bold transition-colors ${surveyData.rating === n ? 'bg-istpet-gold text-istpet-blue' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'}`}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Comentarios</label>
                <textarea rows={3}
                  className="w-full border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-istpet-blue dark:focus:ring-istpet-gold placeholder-slate-400 dark:placeholder-slate-500"
                  placeholder="¿Qué te pareció el evento?"
                  value={surveyData.feedback}
                  onChange={(e) => setSurveyData(d => ({ ...d, feedback: e.target.value }))}
                />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowSurvey(null)} className="flex-1 py-3 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-50 rounded-xl font-medium transition-colors">
                  Cancelar
                </button>
                <button onClick={submitSurvey} disabled={submittingSurvey}
                  className="flex-1 py-3 bg-istpet-blue dark:bg-istpet-gold hover:bg-istpet-blue-light dark:hover:bg-istpet-gold-light text-white dark:text-slate-900 rounded-xl font-bold transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
                  {submittingSurvey ? 'Enviando...' : 'Enviar y Obtener Certificado'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Event Cards */}
        {filteredEvents.length === 0 ? (
          <div className="p-16 text-center text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700">
            <Search size={40} className="mx-auto mb-3 opacity-40" />
            <p className="font-medium">No se encontraron eventos con esos filtros.</p>
            <button onClick={() => { setSearchText(''); setFilterCareer('ALL'); setFilterType('ALL'); setFilterTime('ALL'); setFilterStatus('ALL'); }}
              className="mt-3 text-sm text-istpet-blue dark:text-istpet-gold hover:underline">
              Limpiar filtros
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <div key={event.id} className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-xl dark:hover:shadow-slate-900/50 transition-all group flex flex-col">
                <div className={`h-32 p-6 flex flex-col justify-end border-b-2 relative ${
                  isPast(event)
                    ? 'bg-gradient-to-r from-slate-500 to-slate-600 dark:from-slate-700 dark:to-slate-800 border-slate-400/50'
                    : 'bg-gradient-to-r from-istpet-blue to-istpet-blue-light dark:from-slate-700 dark:to-slate-800 border-istpet-gold/50'
                }`}>
                  {/* Badges top-right */}
                  <div className="absolute top-4 right-4 flex flex-col items-end gap-1">
                    {isPast(event) && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-black/30 text-white/80 font-semibold flex items-center gap-1">
                        <XCircle size={10} /> Finalizado
                      </span>
                    )}
                    {event.isTransversal ? (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-istpet-gold/80 text-istpet-blue font-semibold flex items-center gap-1">
                        <Layers size={10} /> General
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-white/20 text-white font-semibold flex items-center gap-1">
                        <GraduationCap size={10} /> {event.careers?.length === 1 ? event.careers[0].name : `${event.careers?.length} carreras`}
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl font-bold text-white leading-tight">{event.title}</h2>
                </div>

                <div className="p-6 space-y-4 flex-1 flex flex-col">
                  <p className="text-slate-600 dark:text-slate-400 text-sm line-clamp-2 flex-1">{event.description}</p>

                  <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                    <div className="flex items-center gap-2">
                      <Calendar size={16} className="text-istpet-gold flex-shrink-0" />
                      {new Date(event.startDate).toLocaleDateString('es-EC', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={16} className="text-istpet-gold flex-shrink-0" />
                      {event.hours} hora{event.hours !== 1 ? 's' : ''}
                    </div>
                    {event.capacity && (
                      <div className="flex items-center gap-2">
                        <CheckCircle size={16} className="text-istpet-gold flex-shrink-0" />
                        Cupos: {event._count?.registrations || 0} / {event.capacity}
                      </div>
                    )}
                  </div>

                  {user?.role === 'ALUMNO' && (
                    <div className="pt-2">
                      {event.registrations && event.registrations.length > 0 ? (
                        <>
                          {(() => {
                            const hasAttendance = event.attendances && event.attendances.length > 0;
                            const attendanceRecord = hasAttendance ? event.attendances[0] : null;
                            const hasCheckOut = attendanceRecord?.checkOutAt ? true : false;

                            if (hasCheckOut) {
                              const isFullyValid = attendanceRecord.isValid && attendanceRecord.isCheckOutValid;
                              if (isFullyValid) {
                                return (
                                  <button onClick={() => handleCertificate(event.id)}
                                    className="w-full py-3 px-4 rounded-xl font-bold flex justify-center items-center gap-2 transition-all shadow-lg bg-istpet-gold hover:bg-istpet-gold-dark text-istpet-blue shadow-istpet-gold/20">
                                    <CheckCircle size={18} /> Obtener Certificado
                                  </button>
                                );
                              } else {
                                return (
                                  <div className="w-full py-3 px-4 rounded-xl font-bold flex justify-center items-center gap-2 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-sm border border-slate-200 dark:border-slate-600">
                                    <XCircle size={18} /> Asistencia Inválida o en Revisión
                                  </div>
                                );
                              }
                            } else if (hasAttendance) {
                              return (
                                <button onClick={() => startCheckOut(event.id)}
                                  className="w-full py-3 px-4 rounded-xl font-bold flex justify-center items-center gap-2 transition-all shadow-lg bg-red-500 hover:bg-red-600 text-white shadow-red-500/20">
                                  <MapPin size={18} /> Registrar Salida
                                </button>
                              );
                            } else {
                              return (
                                <button onClick={() => startAttendance(event.id)}
                                  className="w-full py-3 px-4 rounded-xl font-bold flex justify-center items-center gap-2 transition-all shadow-lg bg-istpet-blue hover:bg-istpet-blue-light text-white shadow-istpet-blue/20">
                                  <QrCode size={18} /> {t('events.register_in')}
                                </button>
                              );
                            }
                          })()}
                        </>
                      ) : isPast(event) ? (
                        <div className="w-full py-3 px-4 rounded-xl font-semibold flex justify-center items-center gap-2 bg-slate-100 dark:bg-slate-700/60 text-slate-400 dark:text-slate-500 text-sm border border-slate-200 dark:border-slate-600 cursor-not-allowed select-none">
                          <XCircle size={16} /> Inscripciones cerradas
                        </div>
                      ) : (
                        <button onClick={() => handleRegister(event.id)}
                          className="w-full bg-slate-100 dark:bg-slate-700 hover:bg-istpet-blue hover:text-white dark:hover:bg-istpet-gold dark:hover:text-slate-900 text-slate-800 dark:text-slate-50 py-3 rounded-xl font-bold transition-all text-sm">
                          {t('events.enroll')}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Events;
