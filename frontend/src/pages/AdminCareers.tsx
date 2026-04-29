import React, { useState, useEffect } from 'react';
import { fetchApi } from '../lib/api';
import { Link } from 'react-router-dom';
import { ArrowLeft, Plus, Briefcase } from 'lucide-react';

const AdminCareers = () => {
  const [careers, setCareers] = useState<any[]>([]);
  const [newCareer, setNewCareer] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadCareers();
  }, []);

  const loadCareers = async () => {
    try {
      const data = await fetchApi('/careers');
      setCareers(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCareer.trim()) return;
    try {
      await fetchApi('/careers', {
        method: 'POST',
        body: JSON.stringify({ name: newCareer })
      });
      setNewCareer('');
      setError('');
      loadCareers();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-8 transition-colors duration-300">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link
            to="/dashboard"
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-istpet-blue dark:hover:text-istpet-gold transition-colors font-medium shadow-sm"
          >
            <ArrowLeft size={18} />
            Volver
          </Link>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-50">Gestión de Carreras</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Formulario de creación */}
          <div className="md:col-span-1 bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 h-fit">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-800 dark:text-slate-50">
              <Briefcase size={20} className="text-istpet-blue dark:text-istpet-gold" />
              Nueva Carrera
            </h2>
            <form onSubmit={handleCreate} className="space-y-4">
              {error && <p className="text-red-500 dark:text-red-400 text-sm">{error}</p>}
              <div>
                <input
                  type="text"
                  placeholder="Nombre de la carrera"
                  value={newCareer}
                  onChange={(e) => setNewCareer(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 rounded-xl focus:ring-2 focus:ring-istpet-blue dark:focus:ring-istpet-gold outline-none transition-colors"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 bg-istpet-blue dark:bg-istpet-gold hover:bg-istpet-blue-light dark:hover:bg-istpet-gold-light text-white dark:text-slate-900 py-3 rounded-xl font-bold transition-colors"
              >
                <Plus size={18} /> Añadir Carrera
              </button>
            </form>
          </div>

          {/* Lista de carreras */}
          <div className="md:col-span-2 bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700">
                <tr>
                  <th className="p-4 font-semibold text-slate-600 dark:text-slate-400">ID</th>
                  <th className="p-4 font-semibold text-slate-600 dark:text-slate-400">Nombre</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Eventos Asociados</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {careers.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <td className="p-4 text-slate-500 dark:text-slate-400">{c.id}</td>
                    <td className="p-4 font-medium text-slate-800 dark:text-slate-100">{c.name}</td>
                    <td className="px-6 py-4">
                      <span className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-3 py-1 rounded-full text-xs font-medium border border-slate-200 dark:border-slate-600">
                        {c._count?.events || 0} eventos
                      </span>
                    </td>
                  </tr>
                ))}
                {careers.length === 0 && (
                  <tr>
                    <td colSpan={3} className="p-8 text-center text-slate-500 dark:text-slate-400">No hay carreras registradas.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminCareers;
