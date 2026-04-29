import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchApi } from '../lib/api';
import { KeySquare, CheckCircle } from 'lucide-react';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState({ loading: false, error: '', success: false });
  const navigate = useNavigate();
  const { token } = useParams<{ token: string }>();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setStatus({ loading: false, error: 'Las contraseñas no coinciden', success: false });
      return;
    }
    if (password.length < 6) {
      setStatus({ loading: false, error: 'La contraseña debe tener al menos 6 caracteres', success: false });
      return;
    }

    setStatus({ loading: true, error: '', success: false });
    try {
      await fetchApi(`/auth/reset-password/${token}`, {
        method: 'POST',
        body: JSON.stringify({ password })
      });
      setStatus({ loading: false, error: '', success: true });
      setTimeout(() => navigate('/login'), 3000);
    } catch (error: any) {
      setStatus({ loading: false, error: error.message, success: false });
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center animated-gradient p-4">
      <div className="glass-dark w-full max-w-md p-8 rounded-3xl fade-in relative overflow-hidden">
        <div className="text-center mt-2 mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">Crear Nueva Contraseña</h2>
          <p className="text-sm text-white/70">Ingresa tu nueva contraseña para el sistema.</p>
        </div>

        {status.error && <div className="bg-red-500/10 border border-red-500/50 text-red-200 p-3 rounded-xl mb-4 text-sm">{status.error}</div>}
        
        {status.success ? (
          <div className="text-center">
            <CheckCircle className="mx-auto h-16 w-16 text-istpet-gold mb-4" />
            <p className="text-istpet-gold text-lg font-medium mb-2">¡Contraseña restablecida!</p>
            <p className="text-sm text-white/70 mb-6">Serás redirigido al inicio de sesión...</p>
            <button onClick={() => navigate('/login')} className="text-istpet-gold hover:underline text-sm font-semibold">Ir al Login ahora</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-white/80 text-sm font-medium mb-1">Nueva Contraseña</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <KeySquare className="h-5 w-5 text-white/40" />
                </div>
                <input 
                  type="password" 
                  required 
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-istpet-gold transition-all"
                  placeholder="Mínimo 6 caracteres" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="block text-white/80 text-sm font-medium mb-1">Confirmar Contraseña</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <KeySquare className="h-5 w-5 text-white/40" />
                </div>
                <input 
                  type="password" 
                  required 
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-istpet-gold transition-all"
                  placeholder="Repite tu contraseña" 
                  value={confirmPassword} 
                  onChange={e => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>
            
            <button 
              type="submit" 
              disabled={status.loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-istpet-gold text-istpet-blue font-bold shadow-[0_0_15px_rgba(202,171,94,0.3)] hover:shadow-[0_0_25px_rgba(202,171,94,0.5)] transition-all hover:-translate-y-1 active:translate-y-0 disabled:opacity-50"
            >
              {status.loading ? 'Guardando...' : 'Guardar Contraseña'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
