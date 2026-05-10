import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchApi } from '../lib/api';
import { getPasswordStrength } from '../lib/validators';
import type { PasswordStrength } from '../lib/validators';
import {
  ArrowLeft, User, Mail, Save, Camera,
  KeySquare, Eye, EyeOff, Trash2, Image as ImageIcon
} from 'lucide-react';
import Toast, { type ToastType } from '../components/Toast';
import { MODALITIES } from '../lib/modalities';

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrador', SECRETARIA: 'Secretaria', DOCENTE: 'Docente', ALUMNO: 'Alumno',
};

const PasswordStrengthBar = ({ strength }: { strength: PasswordStrength }) => {
  if (!strength.score && strength.label === '') return null;
  return (
    <div className="mt-2 space-y-1">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= strength.score ? strength.barColor : 'bg-slate-200 dark:bg-slate-600'}`} />
        ))}
      </div>
      {strength.label && <p className={`text-xs font-medium ${strength.textColor}`}>{strength.label}</p>}
    </div>
  );
};

const Profile = () => {
  const navigate = useNavigate();
  const goBack = () => { if (window.history.length > 1) navigate(-1); else navigate('/dashboard'); };

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: ToastType; text: string } | null>(null);

  // Form fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');

  // Cambio de contraseña
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [pwdSaving, setPwdSaving] = useState(false);
  const strength = getPasswordStrength(newPassword);

  const inputClass = 'w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-istpet-blue dark:focus:ring-istpet-gold transition-colors';

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await fetchApi('/users/me');
      setProfile(data);
      setFirstName(data.firstName || '');
      setLastName(data.lastName || '');
      setPhotoUrl(data.photoUrl || '');
    } catch (err: any) {
      setToast({ type: 'error', text: 'Error cargando perfil: ' + err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      setToast({ type: 'error', text: 'Nombres y apellidos son obligatorios.' });
      return;
    }
    setSaving(true);
    try {
      const updated = await fetchApi('/users/me', {
        method: 'PUT',
        body: JSON.stringify({ firstName: firstName.trim(), lastName: lastName.trim(), photoUrl: photoUrl.trim() || null }),
      });
      setProfile(updated);
      // Actualizar localStorage para que el navbar refleje el cambio
      try {
        const u = JSON.parse(localStorage.getItem('user') || '{}');
        localStorage.setItem('user', JSON.stringify({ ...u, firstName: updated.firstName, lastName: updated.lastName, photoUrl: updated.photoUrl }));
      } catch {}
      setToast({ type: 'success', text: 'Perfil actualizado correctamente.' });
    } catch (err: any) {
      setToast({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      setToast({ type: 'error', text: 'Completa todos los campos.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setToast({ type: 'error', text: 'La nueva contraseña y su confirmación no coinciden.' });
      return;
    }
    if (strength.score < 3) {
      setToast({ type: 'error', text: 'La contraseña debe ser al menos Fuerte.' });
      return;
    }
    setPwdSaving(true);
    try {
      await fetchApi('/users/me/password', {
        method: 'PUT',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setToast({ type: 'success', text: 'Contraseña actualizada. Recibirás un correo de confirmación.' });
    } catch (err: any) {
      setToast({ type: 'error', text: err.message });
    } finally {
      setPwdSaving(false);
    }
  };

  if (loading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-istpet-blue dark:border-istpet-gold border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!profile) return null;

  const initials = `${(profile.firstName || '?')[0]}${(profile.lastName || '?')[0]}`.toUpperCase();
  const photoOk = photoUrl && /^https?:\/\//.test(photoUrl);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6 md:p-8 transition-colors duration-300">
      {toast && <Toast type={toast.type} text={toast.text} onClose={() => setToast(null)} />}
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={goBack}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-istpet-blue dark:hover:text-istpet-gold transition-colors font-medium shadow-sm text-sm"
          >
            <ArrowLeft size={16} /> Volver
          </button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-50">Mi Perfil</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Actualiza tu información personal y contraseña</p>
          </div>
        </div>

        {/* Header card con avatar */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden mb-6">
          <div className="h-24 bg-gradient-to-r from-istpet-blue to-istpet-blue-light dark:from-slate-700 dark:to-slate-800" />
          <div className="px-6 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12">
              {/* Avatar */}
              <div className="w-24 h-24 rounded-full border-4 border-white dark:border-slate-800 bg-istpet-gold flex items-center justify-center text-istpet-blue text-2xl font-extrabold overflow-hidden flex-shrink-0 shadow-md">
                {photoOk ? (
                  <img src={photoUrl} alt="Foto perfil" className="w-full h-full object-cover" onError={() => {}} />
                ) : (
                  <span>{initials}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-50 truncate">{profile.firstName} {profile.lastName}</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{profile.email}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-istpet-blue/10 dark:bg-istpet-gold/10 text-istpet-blue dark:text-istpet-gold font-semibold">
                    {ROLE_LABELS[profile.role] || profile.role}
                  </span>
                  {profile.career && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium">
                      {profile.career.name}
                    </span>
                  )}
                  {Array.isArray(profile.modalities) && profile.modalities.length > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium">
                      {profile.modalities.map((m: string) => MODALITIES.find(x => x.id === m)?.name || m).join(' · ')}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Datos personales */}
        <form onSubmit={handleSaveProfile} className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 mb-6 space-y-5">
          <h3 className="font-bold text-lg text-slate-800 dark:text-slate-50 flex items-center gap-2">
            <User className="text-istpet-blue dark:text-istpet-gold" size={20} />
            Datos personales
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Nombres *</label>
              <input required type="text" className={inputClass} value={firstName} onChange={e => setFirstName(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Apellidos *</label>
              <input required type="text" className={inputClass} value={lastName} onChange={e => setLastName(e.target.value)} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
              <Mail size={12} /> Correo
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal ml-1">(no editable)</span>
            </label>
            <input type="email" className={`${inputClass} opacity-70 cursor-not-allowed`} value={profile.email} disabled />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
              <Camera size={12} /> Foto de perfil (URL)
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                className={inputClass}
                placeholder="https://ejemplo.com/foto.jpg"
                value={photoUrl}
                onChange={e => setPhotoUrl(e.target.value)}
              />
              {photoUrl && (
                <button
                  type="button"
                  onClick={() => setPhotoUrl('')}
                  className="flex items-center justify-center w-10 px-3 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  title="Quitar foto"
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 flex items-center gap-1">
              <ImageIcon size={11} />
              Pega aquí la URL de tu foto. Puedes subirla a Google Drive (con enlace público), Imgur, etc.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-istpet-blue dark:bg-istpet-gold text-white dark:text-slate-900 rounded-xl font-bold hover:bg-istpet-blue-light dark:hover:bg-istpet-gold-light transition-colors flex items-center gap-2 disabled:opacity-60 text-sm"
            >
              <Save size={16} />
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </form>

        {/* Cambio de contraseña */}
        <form onSubmit={handleChangePassword} className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 space-y-5">
          <h3 className="font-bold text-lg text-slate-800 dark:text-slate-50 flex items-center gap-2">
            <KeySquare className="text-istpet-blue dark:text-istpet-gold" size={20} />
            Cambiar contraseña
          </h3>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Contraseña actual *</label>
            <div className="relative">
              <input required type={showPwd ? 'text' : 'password'} className={`${inputClass} pr-10`} value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
              <button type="button" onClick={() => setShowPwd(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Nueva contraseña *</label>
              <input required type={showPwd ? 'text' : 'password'} className={inputClass} value={newPassword} onChange={e => setNewPassword(e.target.value)} />
              {newPassword && <PasswordStrengthBar strength={strength} />}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Confirmar nueva *</label>
              <input
                required type={showPwd ? 'text' : 'password'}
                className={`${inputClass} ${confirmPassword && confirmPassword !== newPassword ? 'border-red-400 focus:ring-red-400' : ''}`}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
              />
              {confirmPassword && confirmPassword !== newPassword && (
                <p className="text-red-500 text-xs mt-1">No coincide con la nueva contraseña</p>
              )}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={pwdSaving}
              className="px-6 py-2.5 bg-istpet-blue dark:bg-istpet-gold text-white dark:text-slate-900 rounded-xl font-bold hover:bg-istpet-blue-light dark:hover:bg-istpet-gold-light transition-colors flex items-center gap-2 disabled:opacity-60 text-sm"
            >
              <KeySquare size={16} />
              {pwdSaving ? 'Cambiando...' : 'Cambiar contraseña'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;
