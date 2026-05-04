import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { fetchApi } from '../lib/api';
import { validateDocument, getPasswordStrength } from '../lib/validators';
import type { PasswordStrength } from '../lib/validators';
import { UserPlus, Mail, KeySquare, User, CreditCard, GraduationCap, BookOpen, Eye, EyeOff, Check, X } from 'lucide-react';

const PasswordStrengthBar = ({ strength }: { strength: PasswordStrength }) => {
  if (!strength.score && strength.label === '') return null;
  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map(i => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
              i <= strength.score ? strength.barColor : 'bg-slate-700'
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
            <li key={key} className={`flex items-center gap-1 ${ok ? 'text-green-400' : 'text-slate-500'}`}>
              {ok ? <Check size={10} /> : <X size={10} />} {label}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

const Register = () => {
  const navigate = useNavigate();

  const [careers, setCareers] = useState<any[]>([]);
  const [docType, setDocType] = useState<'CI' | 'PASAPORTE'>('CI');
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    ci: '',
    role: 'ALUMNO',
    careerId: '',
    password: '',
    confirmPassword: '',
  });
  const [docError, setDocError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const strength = getPasswordStrength(form.password);

  useEffect(() => {
    fetchApi('/careers')
      .then(data => setCareers(data))
      .catch(() => {});
  }, []);

  const set = (field: string, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const handleDocChange = (value: string) => {
    const cleaned = docType === 'CI'
      ? value.replace(/\D/g, '').slice(0, 10)
      : value.replace(/[^A-Za-z0-9]/g, '').slice(0, 15).toUpperCase();
    set('ci', cleaned);
    if (cleaned.length > 0) {
      setDocError(validateDocument(docType, cleaned) ?? '');
    } else {
      setDocError('');
    }
  };

  const handleDocTypeChange = (type: 'CI' | 'PASAPORTE') => {
    setDocType(type);
    set('ci', '');
    setDocError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const docErr = validateDocument(docType, form.ci);
    if (docErr) { setError(docErr); return; }

    if (strength.score < 3) {
      setError('La contraseña debe ser al menos Fuerte (mayúscula, minúscula, número y símbolo).');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    try {
      const data = await fetchApi('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          dni: form.ci,
          password: form.password,
          role: form.role,
          careerId: form.careerId ? parseInt(form.careerId) : null,
        }),
      });

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-istpet-gold focus:border-transparent outline-none transition-all text-white placeholder-slate-500 text-sm';

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row">
      {/* Panel izquierdo — formulario */}
      <div className="w-full md:w-1/2 lg:w-2/5 flex items-center justify-center animated-gradient p-4 min-h-screen md:min-h-0">
        <div className="glass-dark w-full max-w-lg p-8 rounded-3xl fade-in relative overflow-hidden">
          <div className="absolute top-[-50px] right-[-50px] w-32 h-32 bg-istpet-gold rounded-full blur-3xl opacity-10" />
          <div className="absolute bottom-[-50px] left-[-50px] w-40 h-40 bg-blue-500 rounded-full blur-3xl opacity-10" />

          <div className="relative z-10">
            <div className="text-center mb-8">
              <div className="flex justify-center mb-3">
                <img
                  src="https://evainstitutotraversari.edu.ec/pluginfile.php/1/theme_alpha/customsidebarlogo/1765890840/logo-lateral2.png"
                  alt="Logo ISTPET"
                  className="h-16 object-contain drop-shadow-md"
                  onError={e => { e.currentTarget.style.display = 'none'; }}
                />
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight mb-1 text-transparent bg-clip-text bg-gradient-to-r from-istpet-gold to-yellow-200">
                Crear Cuenta
              </h1>
              <p className="text-slate-400 text-sm">Sistema de Eventos ISTPET</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-200 px-4 py-3 rounded-xl text-sm text-center">
                  {error}
                </div>
              )}

              {/* Nombres */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">Nombres</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <input
                      required
                      type="text"
                      className={inputClass}
                      placeholder="Juan"
                      value={form.firstName}
                      onChange={e => set('firstName', e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">Apellidos</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <input
                      required
                      type="text"
                      className={inputClass}
                      placeholder="Pérez"
                      value={form.lastName}
                      onChange={e => set('lastName', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">Correo Institucional</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    required
                    type="email"
                    className={inputClass}
                    placeholder="usuario@istpet.edu.ec"
                    value={form.email}
                    onChange={e => set('email', e.target.value)}
                  />
                </div>
              </div>

              {/* Tipo de documento */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">Documento de identidad</label>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  {(['CI', 'PASAPORTE'] as const).map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => handleDocTypeChange(type)}
                      className={`py-2 rounded-xl font-medium text-sm transition-all border ${
                        docType === type
                          ? 'bg-istpet-gold/20 border-istpet-gold text-istpet-gold'
                          : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-500'
                      }`}
                    >
                      {type === 'CI' ? 'Cédula (CI)' : 'Pasaporte'}
                    </button>
                  ))}
                </div>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    required
                    type="text"
                    className={`${inputClass} ${docError ? 'border-red-500/70 focus:ring-red-500' : ''}`}
                    placeholder={docType === 'CI' ? '0123456789' : 'AB123456'}
                    value={form.ci}
                    onChange={e => handleDocChange(e.target.value)}
                  />
                </div>
                {docError && <p className="text-red-400 text-xs mt-1">{docError}</p>}
              </div>

              {/* Carrera (Opcional) */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">Carrera</label>
                <div className="relative">
                  <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <select
                    className={`${inputClass} appearance-none`}
                    value={form.careerId}
                    onChange={e => set('careerId', e.target.value)}
                  >
                    <option value="">Sin carrera asignada</option>
                    {careers.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Contraseña */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">Contraseña</label>
                <div className="relative">
                  <KeySquare className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    required
                    type={showPassword ? 'text' : 'password'}
                    className={`${inputClass} pr-10`}
                    placeholder="Crea una contraseña segura"
                    value={form.password}
                    onChange={e => set('password', e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {form.password && <PasswordStrengthBar strength={strength} />}
              </div>

              {/* Confirmar contraseña */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">Confirmar Contraseña</label>
                <div className="relative">
                  <KeySquare className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    required
                    type={showPassword ? 'text' : 'password'}
                    className={`${inputClass} ${form.confirmPassword && form.confirmPassword !== form.password ? 'border-red-500/70 focus:ring-red-500' : ''}`}
                    placeholder="Repite la contraseña"
                    value={form.confirmPassword}
                    onChange={e => set('confirmPassword', e.target.value)}
                  />
                </div>
                {form.confirmPassword && form.confirmPassword !== form.password && (
                  <p className="text-red-400 text-xs mt-1">Las contraseñas no coinciden</p>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-3.5 px-4 bg-gradient-to-r from-istpet-blue to-istpet-blue-light border border-istpet-gold/50 hover:from-istpet-blue-light hover:to-istpet-blue text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed transform hover:-translate-y-0.5 active:translate-y-0 mt-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <UserPlus className="w-5 h-5" />
                    Crear Cuenta
                  </>
                )}
              </button>

              <p className="text-center text-sm text-slate-400 pt-1">
                ¿Ya tienes cuenta?{' '}
                <Link to="/login" className="text-istpet-gold hover:underline font-medium">
                  Inicia sesión
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>

      {/* Panel derecho — imagen institucional */}
      <div className="hidden md:flex flex-1 bg-white dark:bg-slate-900 items-center justify-center relative overflow-hidden transition-colors duration-300">
        <img
          src="https://institutotraversari.edu.ec/wp-content/uploads/2025/09/FONDO-WEB1.png"
          alt="ISTPET"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-istpet-blue/90 via-istpet-blue/40 to-transparent flex flex-col justify-end p-12">
          <h2 className="text-4xl font-bold text-white mb-2 drop-shadow-lg">Únete a ISTPET Eventos</h2>
          <p className="text-xl text-white/90 font-medium drop-shadow-md mb-4">
            Registra tu asistencia a eventos institucionales y obtén certificados digitales.
          </p>
          <ul className="space-y-2 text-white/80 text-sm">
            {[
              '✅ Inscríbete a eventos académicos y culturales',
              '📱 Registra tu entrada y salida con QR',
              '📄 Descarga certificados de participación',
            ].map(item => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Register;
