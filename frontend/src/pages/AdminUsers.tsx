import { useEffect, useState } from 'react';
import { fetchApi } from '../lib/api';
import { validateDocument, getPasswordStrength } from '../lib/validators';
import type { PasswordStrength } from '../lib/validators';
import { useNavigate } from 'react-router-dom';
import {
  Users, Shield, ShieldAlert, BookOpen, GraduationCap, ArrowLeft,
  Lock, UserPlus, X, Eye, EyeOff, Trash2, Check, CreditCard
} from 'lucide-react';

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrador',
  SECRETARIA: 'Secretaria',
  DOCENTE: 'Docente',
  ALUMNO: 'Alumno',
};

const emptyForm = {
  firstName: '', lastName: '', email: '', ci: '', docType: 'CI' as 'CI' | 'PASAPORTE',
  role: 'ALUMNO', careerId: '', password: '', confirmPassword: '',
};

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

const AdminUsers = () => {
  const [users, setUsers]     = useState<any[]>([]);
  const [careers, setCareers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm]       = useState({ ...emptyForm });
  const [docError, setDocError] = useState('');
  const [formError, setFormError]   = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [careerFilter, setCareerFilter] = useState('ALL');
  const navigate = useNavigate();

  const strength = getPasswordStrength(form.password);

  useEffect(() => {
    loadUsers();
    fetchApi('/careers').then(setCareers).catch(() => {});
  }, []);

  const loadUsers = async () => {
    try {
      const data = await fetchApi('/users');
      setUsers(data);
    } catch (err: any) {
      alert('Error cargando usuarios: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const set = (field: string, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const handleDocChange = (value: string) => {
    const cleaned = form.docType === 'CI'
      ? value.replace(/\D/g, '').slice(0, 10)
      : value.replace(/[^A-Za-z0-9]/g, '').slice(0, 15).toUpperCase();
    set('ci', cleaned);
    if (cleaned.length > 0) {
      setDocError(validateDocument(form.docType, cleaned) ?? '');
    } else {
      setDocError('');
    }
  };

  const handleDocTypeChange = (type: 'CI' | 'PASAPORTE') => {
    setForm(prev => ({ ...prev, docType: type, ci: '' }));
    setDocError('');
  };

  const openModal = () => {
    setForm({ ...emptyForm });
    setFormError('');
    setDocError('');
    setShowModal(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const docErr = validateDocument(form.docType, form.ci);
    if (docErr) { setFormError(docErr); return; }

    if (strength.score < 3) {
      setFormError('La contraseña debe ser al menos Fuerte (mayúscula, minúscula, número y símbolo).');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setFormError('Las contraseñas no coinciden.'); return;
    }

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
          role: form.role,
          careerId: form.careerId || null,
        }),
      });
      setShowModal(false);
      loadUsers();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleRoleChange = async (id: number, newRole: string) => {
    try {
      await fetchApi(`/users/${id}/role`, {
        method: 'PUT',
        body: JSON.stringify({ role: newRole }),
      });
      loadUsers();
    } catch (err: any) {
      alert('Error al cambiar rol: ' + err.message);
    }
  };

  const handleCareerChange = async (id: number, newCareerId: string) => {
    try {
      await fetchApi(`/users/${id}/career`, {
        method: 'PUT',
        body: JSON.stringify({ careerId: newCareerId || null }),
      });
      loadUsers();
    } catch (err: any) {
      alert('Error al cambiar carrera: ' + err.message);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`¿Eliminar al usuario "${name}"? Esta acción no se puede deshacer.`)) return;
    try {
      await fetchApi(`/users/${id}`, { method: 'DELETE' });
      loadUsers();
    } catch (err: any) {
      alert('Error al eliminar: ' + err.message);
    }
  };

  const getStudentCategory = (user: any) => {
    if (user.role !== 'ALUMNO') return null;
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
    return new Date(user.createdAt) >= twoYearsAgo ? 'Actual' : 'Antiguo';
  };

  const RoleIcon = ({ role }: { role: string }) => {
    switch (role) {
      case 'ADMIN':      return <ShieldAlert size={15} className="text-red-500 dark:text-red-400" />;
      case 'SECRETARIA': return <Shield size={15} className="text-istpet-blue dark:text-istpet-gold" />;
      case 'DOCENTE':    return <BookOpen size={15} className="text-istpet-blue dark:text-istpet-gold" />;
      case 'ALUMNO':     return <GraduationCap size={15} className="text-istpet-blue dark:text-istpet-gold" />;
      default:           return <Users size={15} />;
    }
  };

  const tabs = [
    { id: 'ALL', label: 'Todos' },
    { id: 'ALUMNO', label: 'Alumnos' },
    { id: 'DOCENTE', label: 'Docentes' },
    { id: 'SECRETARIA', label: 'Secretaría' },
    { id: 'ADMIN', label: 'Administradores' },
  ];

  const filteredUsers = users.filter(u => {
    if (roleFilter !== 'ALL' && u.role !== roleFilter) return false;
    if (careerFilter !== 'ALL' && u.career?.name !== careerFilter) return false;
    return true;
  });

  const inputClass = 'w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-istpet-blue dark:focus:ring-istpet-gold transition-colors';

  if (loading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-istpet-blue dark:border-istpet-gold border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-istpet-blue dark:hover:text-istpet-gold transition-colors font-medium shadow-sm text-sm"
          >
            <ArrowLeft size={16} /> Volver
          </button>
          <div className="p-2.5 bg-istpet-blue/10 dark:bg-istpet-gold/10 text-istpet-blue dark:text-istpet-gold rounded-xl hidden md:block">
            <Users size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-50">Gestión de Usuarios</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm hidden md:block">
              {users.length} usuarios registrados
            </p>
          </div>
        </div>

        <button
          onClick={openModal}
          className="flex items-center gap-2 px-5 py-2.5 bg-istpet-blue dark:bg-istpet-gold text-white dark:text-slate-900 rounded-xl font-bold hover:bg-istpet-blue-light dark:hover:bg-istpet-gold-light transition-colors shadow-sm text-sm"
        >
          <UserPlus size={16} /> Crear Usuario
        </button>
      </div>

      {/* Tabs y Filtros */}
      <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
        <div className="flex overflow-x-auto gap-2 pb-1 flex-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => { setRoleFilter(tab.id); if(!['ALL', 'ALUMNO', 'DOCENTE'].includes(tab.id)) setCareerFilter('ALL'); }}
              className={`px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-all text-sm ${
                roleFilter === tab.id
                  ? 'bg-istpet-blue dark:bg-istpet-gold text-white dark:text-slate-900 shadow-md'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              {tab.label}
              <span className={`ml-1.5 text-xs py-0.5 px-1.5 rounded-full ${
                roleFilter === tab.id ? 'bg-white/20 text-white dark:text-slate-900 dark:bg-slate-900/20' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
              }`}>
                {tab.id === 'ALL' ? users.length : users.filter(u => u.role === tab.id).length}
              </span>
            </button>
          ))}
        </div>
        
        {['ALL', 'ALUMNO', 'DOCENTE'].includes(roleFilter) && (
          <select 
            value={careerFilter}
            onChange={(e) => setCareerFilter(e.target.value)}
            className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-istpet-blue dark:focus:ring-istpet-gold text-sm max-w-full md:max-w-xs transition-colors"
          >
            <option value="ALL">Todas las carreras</option>
            {careers.map(c => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>
        )}
      </div>

      {/* Tabla */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
              <tr>
                {['Nombre', 'Email', 'CI / Pasaporte', 'Carrera', 'Rol', 'Cambiar Rol', ''].map(h => (
                  <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {filteredUsers.map(u => {
                const isAdmin = u.role === 'ADMIN';
                const cat = getStudentCategory(u);
                return (
                  <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <td className="px-5 py-4 font-medium text-slate-800 dark:text-slate-100">
                      <div className="flex items-center gap-2 flex-wrap">
                        {u.firstName} {u.lastName}
                        {cat && (
                          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                            cat === 'Actual'
                              ? 'bg-istpet-blue/10 text-istpet-blue dark:bg-istpet-gold/10 dark:text-istpet-gold'
                              : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                          }`}>
                            Alumno {cat}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-600 dark:text-slate-300 text-sm">{u.email}</td>
                    <td className="px-5 py-4 text-slate-600 dark:text-slate-300 font-mono text-sm">{u.dni}</td>
                    <td className="px-5 py-4 text-slate-600 dark:text-slate-300 text-sm">
                      {isAdmin || u.role === 'SECRETARIA' ? (
                        <span className="italic text-slate-400 dark:text-slate-500">N/A</span>
                      ) : (
                        <select
                          value={u.career?.id || ''}
                          onChange={e => handleCareerChange(u.id, e.target.value)}
                          className="text-xs bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-istpet-blue dark:focus:ring-istpet-gold transition-colors w-full min-w-[120px]"
                        >
                          <option value="">Sin carrera</option>
                          {careers.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg w-max border text-xs font-semibold ${
                        isAdmin
                          ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400'
                          : 'bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200'
                      }`}>
                        <RoleIcon role={u.role} />
                        {ROLE_LABELS[u.role] || u.role}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      {isAdmin ? (
                        <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 text-xs italic">
                          <Lock size={13} /> Protegido
                        </div>
                      ) : (
                        <select
                          value={u.role}
                          onChange={e => handleRoleChange(u.id, e.target.value)}
                          className="text-xs bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-istpet-blue dark:focus:ring-istpet-gold transition-colors"
                        >
                          <option value="ALUMNO">Alumno</option>
                          <option value="DOCENTE">Docente</option>
                          <option value="SECRETARIA">Secretaria</option>
                        </select>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      {!isAdmin && (
                        <button
                          onClick={() => handleDelete(u.id, `${u.firstName} ${u.lastName}`)}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title="Eliminar usuario"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-slate-400 dark:text-slate-500">
                    No hay usuarios con este rol.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Modal Crear Usuario ── */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-700 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800 z-10 rounded-t-3xl">
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-50 flex items-center gap-2">
                <UserPlus size={20} className="text-istpet-blue dark:text-istpet-gold" />
                Nuevo Usuario
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal form */}
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              {formError && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl text-sm">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Nombres *</label>
                  <input required type="text" className={inputClass} placeholder="Juan" value={form.firstName} onChange={e => set('firstName', e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Apellidos *</label>
                  <input required type="text" className={inputClass} placeholder="Pérez" value={form.lastName} onChange={e => set('lastName', e.target.value)} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Correo *</label>
                <input required type="email" className={inputClass} placeholder="usuario@istpet.edu.ec" value={form.email} onChange={e => set('email', e.target.value)} />
              </div>

              {/* Documento */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Documento de identidad *</label>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  {(['CI', 'PASAPORTE'] as const).map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => handleDocTypeChange(type)}
                      className={`py-2 rounded-xl font-medium text-sm transition-all border ${
                        form.docType === type
                          ? 'bg-istpet-blue/10 dark:bg-istpet-gold/10 border-istpet-blue dark:border-istpet-gold text-istpet-blue dark:text-istpet-gold'
                          : 'bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-500'
                      }`}
                    >
                      {type === 'CI' ? 'Cédula (CI)' : 'Pasaporte'}
                    </button>
                  ))}
                </div>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    required
                    type="text"
                    className={`${inputClass} pl-9 ${docError ? 'border-red-400 dark:border-red-500 focus:ring-red-400' : ''}`}
                    placeholder={form.docType === 'CI' ? '0123456789' : 'AB123456'}
                    value={form.ci}
                    onChange={e => handleDocChange(e.target.value)}
                  />
                </div>
                {docError && <p className="text-red-500 dark:text-red-400 text-xs mt-1">{docError}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Rol *</label>
                <select className={inputClass} value={form.role} onChange={e => set('role', e.target.value)}>
                  <option value="ALUMNO">Alumno</option>
                  <option value="DOCENTE">Docente</option>
                  <option value="SECRETARIA">Secretaria</option>
                  <option value="ADMIN">Administrador</option>
                </select>
              </div>

              {(form.role === 'ALUMNO' || form.role === 'DOCENTE') && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Carrera</label>
                  <select className={inputClass} value={form.careerId} onChange={e => set('careerId', e.target.value)}>
                    <option value="">Sin carrera</option>
                    {careers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Contraseña *</label>
                <div className="relative">
                  <input
                    required
                    type={showPassword ? 'text' : 'password'}
                    className={`${inputClass} pr-10`}
                    placeholder="Crea una contraseña segura"
                    value={form.password}
                    onChange={e => set('password', e.target.value)}
                  />
                  <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {form.password && <PasswordStrengthBar strength={strength} />}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Confirmar contraseña *</label>
                <input
                  required
                  type={showPassword ? 'text' : 'password'}
                  className={`${inputClass} ${form.confirmPassword && form.confirmPassword !== form.password ? 'border-red-400 focus:ring-red-400' : ''}`}
                  placeholder="Repite la contraseña"
                  value={form.confirmPassword}
                  onChange={e => set('confirmPassword', e.target.value)}
                />
                {form.confirmPassword && form.confirmPassword !== form.password && (
                  <p className="text-red-500 text-xs mt-1">Las contraseñas no coinciden</p>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl font-medium transition-colors text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 py-2.5 bg-istpet-blue dark:bg-istpet-gold text-white dark:text-slate-900 rounded-xl font-bold hover:bg-istpet-blue-light dark:hover:bg-istpet-gold-light transition-colors disabled:opacity-60 text-sm"
                >
                  {formLoading ? 'Creando...' : 'Crear Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
