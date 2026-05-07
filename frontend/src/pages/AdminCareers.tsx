import React, { useState, useEffect } from 'react';
import { fetchApi } from '../lib/api';
import { Link } from 'react-router-dom';
import { ArrowLeft, GraduationCap, MapPin, Laptop, MonitorPlay, Building2, BookOpen, Settings, X, Plus, Trash2, UserPlus, CreditCard, KeySquare, User, Mail, Eye, EyeOff, Check } from 'lucide-react';
import { validateDocument, getPasswordStrength } from '../lib/validators';
import type { PasswordStrength } from '../lib/validators';
import { MODALITIES, userInModality } from '../lib/modalities';
import type { ModalityId } from '../lib/modalities';

const PasswordStrengthBar = ({ strength }: { strength: PasswordStrength }) => {
  if (!strength.score && strength.label === '') return null;
  return (
    <div className="mt-1.5 space-y-1">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map(i => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
              i <= strength.score ? strength.barColor : 'bg-slate-200 dark:bg-slate-600'
            }`}
          />
        ))}
      </div>
      {strength.label && (
        <p className={`text-xs font-medium ${strength.textColor}`}>{strength.label}</p>
      )}
      <ul className="grid grid-cols-2 gap-0.5 text-xs">
        {[
          { key: 'length',    label: 'Mín. 8 caracteres' },
          { key: 'uppercase', label: 'Mayúscula' },
          { key: 'lowercase', label: 'Minúscula' },
          { key: 'number',    label: 'Número' },
          { key: 'special',   label: 'Carácter especial' },
        ].map(({ key, label }) => {
          const ok = strength.checks[key as keyof typeof strength.checks];
          return (
            <li key={key} className={`flex items-center gap-1 ${ok ? 'text-green-500 dark:text-green-400' : 'text-slate-400 dark:text-slate-500'}`}>
              {ok ? <Check size={10} /> : <X size={10} />} {label}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

const MODALITY_ICONS: Record<ModalityId, React.ReactNode> = {
  'presencial': <Building2 className="text-istpet-gold" />,
  'semipresencial': <MapPin className="text-istpet-gold" />,
  'en-linea': <Laptop className="text-istpet-gold" />,
  'hibrida': <MonitorPlay className="text-istpet-gold" />,
};

const AdminCareers = () => {
  const [careers, setCareers] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal: career + modality context (which card was clicked)
  const [selectedCareer, setSelectedCareer] = useState<any>(null);
  const [selectedModality, setSelectedModality] = useState<ModalityId | null>(null);
  const [modalTab, setModalTab] = useState<'ALUMNO' | 'DOCENTE'>('ALUMNO');
  const [addMode, setAddMode] = useState<'EXISTING' | 'NEW'>('EXISTING');

  const [selectedExistingUserId, setSelectedExistingUserId] = useState('');
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', ci: '', docType: 'CI' as 'CI' | 'PASAPORTE', password: '', confirmPassword: '' });
  const [docError, setDocError] = useState('');
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const strength = getPasswordStrength(form.password);

  const loadData = async () => {
    try {
      const [cData, uData] = await Promise.all([fetchApi('/careers'), fetchApi('/users')]);
      setCareers(cData);
      setUsers(uData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const setF = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const handleDocChange = (value: string) => {
    const cleaned = form.docType === 'CI'
      ? value.replace(/\D/g, '').slice(0, 10)
      : value.replace(/[^A-Za-z0-9]/g, '').slice(0, 15).toUpperCase();
    setF('ci', cleaned);
    if (cleaned.length > 0) setDocError(validateDocument(form.docType, cleaned) ?? '');
    else setDocError('');
  };

  const openCard = (dbCareer: any, modalityId: ModalityId) => {
    setSelectedCareer(dbCareer);
    setSelectedModality(modalityId);
    setModalTab('ALUMNO');
    setAddMode('EXISTING');
    setSelectedExistingUserId('');
  };

  const closeModal = () => {
    setSelectedCareer(null);
    setSelectedModality(null);
  };

  const handleAssignExisting = async () => {
    if (!selectedExistingUserId || !selectedCareer || !selectedModality) return;
    try {
      await fetchApi(`/users/${selectedExistingUserId}/career`, {
        method: 'PUT',
        body: JSON.stringify({ careerId: selectedCareer.id, addModality: selectedModality }),
      });
      loadData();
      setSelectedExistingUserId('');
    } catch (err: any) {
      alert('Error al asignar usuario: ' + err.message);
    }
  };

  const handleCreateNew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCareer || !selectedModality) return;
    setFormError('');

    const docErr = validateDocument(form.docType, form.ci);
    if (docErr) { setFormError(docErr); return; }
    if (strength.score < 3) { setFormError('La contraseña debe ser al menos Fuerte.'); return; }
    if (form.password !== form.confirmPassword) { setFormError('Las contraseñas no coinciden.'); return; }

    setFormLoading(true);
    try {
      await fetchApi('/users', {
        method: 'POST',
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          dni: form.ci,
          password: form.password,
          role: modalTab,
          careerId: selectedCareer.id,
          modalities: [selectedModality],
        }),
      });
      loadData();
      setForm({ firstName: '', lastName: '', email: '', ci: '', docType: 'CI', password: '', confirmPassword: '' });
      setDocError('');
      setAddMode('EXISTING');
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleRemoveUser = async (userId: number, name: string) => {
    if (!selectedModality) return;
    if (!confirm(`¿Retirar a "${name}" de esta modalidad?`)) return;
    try {
      await fetchApi(`/users/${userId}/career`, {
        method: 'PUT',
        body: JSON.stringify({ removeModality: selectedModality }),
      });
      loadData();
    } catch (err: any) {
      alert('Error al retirar usuario: ' + err.message);
    }
  };

  const inputClass = 'w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-istpet-blue dark:focus:ring-istpet-gold transition-colors';

  const modalUsers = (selectedCareer && selectedModality)
    ? users.filter(u => u.role === modalTab && u.career?.id === selectedCareer.id && userInModality(u, selectedModality))
    : [];
  const unassignedUsers = (selectedCareer && selectedModality)
    ? users.filter(u => u.role === modalTab && !(u.career?.id === selectedCareer.id && userInModality(u, selectedModality)))
    : [];

  if (loading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-istpet-blue dark:border-istpet-gold border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-8 transition-colors duration-300 w-full relative">
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
            <p className="text-slate-500 dark:text-slate-400 mt-1">Administra el alumnado y personal de cada modalidad.</p>
          </div>
        </div>

        {/* Modalidades Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {MODALITIES.map(mod => (
            <div key={mod.id} className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border-t-4 border-t-istpet-gold border-l border-r border-b border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col">
              <div className="p-6 bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700 flex items-center gap-3">
                <div className="p-3 bg-istpet-gold/10 rounded-xl">
                  {MODALITY_ICONS[mod.id]}
                </div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-50">{mod.name}</h2>
              </div>

              <div className="flex-1 p-6 space-y-4">
                {mod.careerNames.map(careerName => {
                  const dbCareer = careers.find(c => c.name === careerName);
                  const studentsCount = dbCareer
                    ? users.filter(u => u.role === 'ALUMNO' && u.career?.id === dbCareer.id && userInModality(u, mod.id)).length
                    : 0;
                  const teachersCount = dbCareer
                    ? users.filter(u => u.role === 'DOCENTE' && u.career?.id === dbCareer.id && userInModality(u, mod.id)).length
                    : 0;

                  return (
                    <div key={`${mod.id}-${careerName}`} className="p-5 bg-slate-50 dark:bg-slate-700/50 rounded-2xl border border-slate-200 dark:border-slate-600 hover:border-istpet-blue/30 dark:hover:border-istpet-gold/30 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h3 className="font-bold text-istpet-blue dark:text-istpet-gold text-lg mb-2">{careerName}</h3>
                        <div className="flex gap-3 text-sm font-medium">
                          <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 bg-slate-200/50 dark:bg-slate-800/50 px-2.5 py-1 rounded-lg">
                            <GraduationCap size={14} className="text-istpet-blue dark:text-istpet-gold" />
                            {studentsCount} Alumnos
                          </span>
                          <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 bg-slate-200/50 dark:bg-slate-800/50 px-2.5 py-1 rounded-lg">
                            <BookOpen size={14} className="text-istpet-blue dark:text-istpet-gold" />
                            {teachersCount} Docentes
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => dbCareer && openCard(dbCareer, mod.id)}
                        disabled={!dbCareer}
                        className="w-full sm:w-auto px-4 py-2.5 bg-istpet-blue hover:bg-istpet-blue-light dark:bg-istpet-gold dark:hover:bg-istpet-gold-light text-white dark:text-slate-900 font-bold rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                        title={dbCareer ? 'Gestionar' : 'Carrera no encontrada en BD'}
                      >
                        <Settings size={16} /> Gestionar
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL CRUD */}
      {selectedCareer && selectedModality && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80">
              <div>
                <h2 className="text-2xl font-bold text-istpet-blue dark:text-istpet-gold flex items-center gap-2">
                  <Settings size={24} />
                  {selectedCareer.name}
                </h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                  Modalidad: <span className="font-semibold text-istpet-blue dark:text-istpet-gold">{MODALITIES.find(m => m.id === selectedModality)?.name}</span>
                </p>
              </div>
              <button onClick={closeModal} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
              {/* Left: list */}
              <div className="w-full md:w-1/2 border-r border-slate-100 dark:border-slate-700 flex flex-col">
                <div className="flex p-4 border-b border-slate-100 dark:border-slate-700 gap-2">
                  <button
                    onClick={() => { setModalTab('ALUMNO'); setAddMode('EXISTING'); }}
                    className={`flex-1 py-2 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2 ${modalTab === 'ALUMNO' ? 'bg-istpet-blue dark:bg-istpet-gold text-white dark:text-slate-900' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}
                  >
                    <GraduationCap size={16} /> Alumnos
                  </button>
                  <button
                    onClick={() => { setModalTab('DOCENTE'); setAddMode('EXISTING'); }}
                    className={`flex-1 py-2 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2 ${modalTab === 'DOCENTE' ? 'bg-istpet-blue dark:bg-istpet-gold text-white dark:text-slate-900' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}
                  >
                    <BookOpen size={16} /> Docentes
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {modalUsers.length === 0 ? (
                    <div className="text-center p-8 text-slate-400 dark:text-slate-500 italic">
                      No hay {modalTab.toLowerCase()}s en esta modalidad.
                    </div>
                  ) : (
                    modalUsers.map(u => (
                      <div key={u.id} className="flex items-center justify-between bg-slate-50 dark:bg-slate-700/50 p-3 rounded-xl border border-slate-200 dark:border-slate-600">
                        <div>
                          <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm">{u.firstName} {u.lastName}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{u.dni} • {u.email}</p>
                          {modalTab === 'DOCENTE' && Array.isArray(u.modalities) && u.modalities.length > 1 && (
                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                              También en: {u.modalities.filter((m: string) => m !== selectedModality).map((m: string) => MODALITIES.find(x => x.id === m)?.name).join(', ')}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => handleRemoveUser(u.id, `${u.firstName} ${u.lastName}`)}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title="Retirar de esta modalidad"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Right: add */}
              <div className="w-full md:w-1/2 flex flex-col bg-slate-50/50 dark:bg-slate-800/30">
                <div className="p-6 border-b border-slate-100 dark:border-slate-700">
                  <h3 className="font-bold text-lg text-slate-800 dark:text-slate-50 mb-4 flex items-center gap-2">
                    <UserPlus className="text-istpet-blue dark:text-istpet-gold" size={20} />
                    Añadir {modalTab === 'ALUMNO' ? 'Alumno' : 'Docente'}
                  </h3>

                  <div className="flex bg-slate-200/50 dark:bg-slate-700/50 p-1 rounded-xl mb-6">
                    <button
                      onClick={() => setAddMode('EXISTING')}
                      className={`flex-1 py-1.5 text-sm font-semibold rounded-lg transition-colors ${addMode === 'EXISTING' ? 'bg-white dark:bg-slate-600 shadow-sm text-istpet-blue dark:text-istpet-gold' : 'text-slate-500 dark:text-slate-400'}`}
                    >
                      Asignar Existente
                    </button>
                    <button
                      onClick={() => setAddMode('NEW')}
                      className={`flex-1 py-1.5 text-sm font-semibold rounded-lg transition-colors ${addMode === 'NEW' ? 'bg-white dark:bg-slate-600 shadow-sm text-istpet-blue dark:text-istpet-gold' : 'text-slate-500 dark:text-slate-400'}`}
                    >
                      Crear Nuevo
                    </button>
                  </div>

                  {addMode === 'EXISTING' ? (
                    <div className="space-y-4">
                      <p className="text-sm text-slate-500 dark:text-slate-400">Selecciona un {modalTab.toLowerCase()} para añadirlo a esta modalidad de la carrera.</p>
                      <select
                        value={selectedExistingUserId}
                        onChange={e => setSelectedExistingUserId(e.target.value)}
                        className={inputClass}
                      >
                        <option value="">-- Seleccionar usuario --</option>
                        {unassignedUsers.map(u => (
                          <option key={u.id} value={u.id}>{u.firstName} {u.lastName} ({u.dni})</option>
                        ))}
                      </select>
                      <button
                        onClick={handleAssignExisting}
                        disabled={!selectedExistingUserId}
                        className="w-full py-3 bg-istpet-blue hover:bg-istpet-blue-light dark:bg-istpet-gold dark:hover:bg-istpet-gold-light text-white dark:text-slate-900 font-bold rounded-xl flex justify-center items-center gap-2 transition-colors disabled:opacity-50"
                      >
                        <Plus size={18} /> Asignar a {MODALITIES.find(m => m.id === selectedModality)?.name}
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleCreateNew} className="space-y-3 overflow-y-auto max-h-[50vh] pr-2 custom-scrollbar">
                      {formError && <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-xl border border-red-200 dark:border-red-800">{formError}</div>}

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Nombres *</label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <input required type="text" className={`${inputClass} pl-9`} placeholder="Juan" value={form.firstName} onChange={e => setF('firstName', e.target.value)} />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Apellidos *</label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <input required type="text" className={`${inputClass} pl-9`} placeholder="Pérez" value={form.lastName} onChange={e => setF('lastName', e.target.value)} />
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Correo *</label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                          <input required type="email" className={`${inputClass} pl-9`} placeholder="correo@istpet.edu.ec" value={form.email} onChange={e => setF('email', e.target.value)} />
                        </div>
                      </div>

                      <div>
                        <div className="grid grid-cols-2 gap-2 mb-2">
                          {(['CI', 'PASAPORTE'] as const).map(type => (
                            <button
                              key={type} type="button" onClick={() => { setF('docType', type); setF('ci', ''); setDocError(''); }}
                              className={`py-1.5 rounded-lg font-medium text-xs border ${form.docType === type ? 'bg-istpet-blue/10 dark:bg-istpet-gold/10 border-istpet-blue dark:border-istpet-gold text-istpet-blue dark:text-istpet-gold' : 'bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-500'}`}
                            >
                              {type === 'CI' ? 'Cédula' : 'Pasaporte'}
                            </button>
                          ))}
                        </div>
                        <div className="relative">
                          <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                          <input required type="text" className={`${inputClass} pl-9 ${docError ? 'border-red-400' : ''}`} placeholder={form.docType === 'CI' ? '0123456789' : 'AB123456'} value={form.ci} onChange={e => handleDocChange(e.target.value)} />
                        </div>
                        {docError && <p className="text-red-500 text-xs mt-1">{docError}</p>}
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Contraseña *</label>
                        <div className="relative">
                          <KeySquare className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                          <input required type={showPassword ? 'text' : 'password'} className={`${inputClass} pl-9 pr-10`} placeholder="Contraseña" value={form.password} onChange={e => setF('password', e.target.value)} />
                          <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                            {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                          </button>
                        </div>
                        {form.password && <PasswordStrengthBar strength={strength} />}
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Confirmar *</label>
                        <div className="relative">
                          <KeySquare className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                          <input required type={showPassword ? 'text' : 'password'} className={`${inputClass} pl-9 ${form.confirmPassword && form.confirmPassword !== form.password ? 'border-red-400' : ''}`} placeholder="Repetir contraseña" value={form.confirmPassword} onChange={e => setF('confirmPassword', e.target.value)} />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={formLoading}
                        className="w-full mt-2 py-3 bg-istpet-blue hover:bg-istpet-blue-light dark:bg-istpet-gold dark:hover:bg-istpet-gold-light text-white dark:text-slate-900 font-bold rounded-xl flex justify-center items-center gap-2 transition-colors disabled:opacity-50"
                      >
                        {formLoading ? 'Creando...' : <><UserPlus size={18} /> Crear y Matricular</>}
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCareers;
