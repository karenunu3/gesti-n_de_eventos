import { useState, useEffect } from 'react';
import { fetchApi } from '../lib/api';
import { Link } from 'react-router-dom';
import { ArrowLeft, GraduationCap, MapPin, Laptop, MonitorPlay, Building2, BookOpen } from 'lucide-react';

const MODALITIES = [
  {
    id: 'presencial',
    name: 'Presencial',
    icon: <Building2 className="text-istpet-gold" />,
    careers: ['Desarrollo de Software (Presencial)', 'Diseño Gráfico', 'Entrenamiento Deportivo', 'Educación Inicial', 'Mecánica Automotriz']
  },
  {
    id: 'semipresencial',
    name: 'Semipresencial',
    icon: <MapPin className="text-istpet-gold" />,
    careers: ['Educación Básica', 'Electrónica', 'Gastronomía', 'Redes y Telecomunicaciones']
  },
  {
    id: 'en-linea',
    name: 'En Línea',
    icon: <Laptop className="text-istpet-gold" />,
    careers: ['Desarrollo de Software (En Línea)', 'Contabilidad y Asesoría Tributaria', 'Educación Inclusiva', 'Marketing y Comercio Electrónico']
  },
  {
    id: 'hibrida',
    name: 'Híbrida',
    icon: <MonitorPlay className="text-istpet-gold" />,
    careers: ['Talento Humano']
  }
];

const AdminCareers = () => {
  const [careers, setCareers] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchApi('/careers'),
      fetchApi('/users')
    ]).then(([careersData, usersData]) => {
      setCareers(careersData);
      setUsers(usersData);
    }).catch(err => {
      console.error(err);
    }).finally(() => {
      setLoading(false);
    });
  }, []);

  if (loading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-istpet-blue dark:border-istpet-gold border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-8 transition-colors duration-300 w-full">
      <div className="max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            to="/dashboard"
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-istpet-blue dark:hover:text-istpet-gold transition-colors font-medium shadow-sm"
          >
            <ArrowLeft size={18} />
            Volver
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-50">Gestión de Carreras</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Estadísticas de matriculación y asignación docente por modalidad.</p>
          </div>
        </div>

        {/* Modalidades Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {MODALITIES.map(mod => (
            <div key={mod.id} className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border-t-4 border-t-istpet-gold border-l border-r border-b border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col">
              <div className="p-6 bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700 flex items-center gap-3">
                <div className="p-3 bg-istpet-gold/10 rounded-xl">
                  {mod.icon}
                </div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-50">{mod.name}</h2>
              </div>
              
              <div className="flex-1 p-6 space-y-4">
                {mod.careers.map(careerName => {
                  const dbCareer = careers.find(c => c.name === careerName);
                  const studentsCount = dbCareer ? users.filter(u => u.role === 'ALUMNO' && u.careerId === dbCareer.id).length : 0;
                  const teachers = dbCareer ? users.filter(u => u.role === 'DOCENTE' && u.careerId === dbCareer.id) : [];

                  return (
                    <div key={careerName} className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-2xl border border-slate-200 dark:border-slate-600 hover:border-istpet-blue/30 dark:hover:border-istpet-gold/30 transition-colors">
                      <div className="flex justify-between items-start gap-4 mb-3">
                        <h3 className="font-bold text-istpet-blue dark:text-istpet-gold">{careerName.replace(/ \((Presencial|En Línea)\)/, '')}</h3>
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-istpet-blue/10 dark:bg-istpet-gold/10 text-istpet-blue dark:text-istpet-gold rounded-full text-xs font-bold whitespace-nowrap">
                          <GraduationCap size={14} />
                          {studentsCount} {studentsCount === 1 ? 'Alumno' : 'Alumnos'}
                        </div>
                      </div>
                      
                      <div className="text-sm">
                        <p className="text-slate-500 dark:text-slate-400 font-semibold mb-2 flex items-center gap-1.5 text-xs uppercase tracking-wider">
                          <BookOpen size={13} /> Docentes asignados
                        </p>
                        {teachers.length > 0 ? (
                          <ul className="space-y-1">
                            {teachers.map(t => (
                              <li key={t.id} className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                                <div className="w-1.5 h-1.5 rounded-full bg-istpet-gold"></div>
                                {t.firstName} {t.lastName}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-slate-400 dark:text-slate-500 italic">No hay docentes asignados.</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminCareers;
