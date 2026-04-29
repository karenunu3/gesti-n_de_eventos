import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { fetchApi } from '../lib/api';
import { ArrowLeft, Mail, Send } from 'lucide-react';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState({ loading: false, error: '', success: '' });
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus({ loading: true, error: '', success: '' });
    try {
      await fetchApi('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email })
      });
      setStatus({ loading: false, error: '', success: 'Si el correo existe, te hemos enviado un enlace para restablecer tu contraseña. Revisa tu bandeja de entrada.' });
    } catch (error: any) {
      setStatus({ loading: false, error: error.message, success: '' });
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center animated-gradient p-4">
      <div className="glass-dark w-full max-w-md p-8 rounded-3xl fade-in relative overflow-hidden">
        <button onClick={() => navigate('/login')} className="absolute top-4 left-4 text-white/50 hover:text-white transition-colors">
          <ArrowLeft size={24} />
        </button>
        <div className="text-center mt-6 mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">Recuperar Contraseña</h2>
          <p className="text-sm text-white/70">Ingresa tu correo institucional y te enviaremos un enlace de recuperación.</p>
        </div>

        {status.error && <div className="bg-red-500/10 border border-red-500/50 text-red-200 p-3 rounded-xl mb-4 text-sm">{status.error}</div>}
        {status.success && <div className="bg-istpet-gold/10 border border-istpet-gold/50 text-istpet-gold p-3 rounded-xl mb-4 text-sm">{status.success}</div>}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-white/80 text-sm font-medium mb-1">Correo Electrónico</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-white/40" />
              </div>
              <input 
                type="email" 
                required 
                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-istpet-gold transition-all"
                placeholder="ejemplo@istpet.edu.ec" 
                value={email} 
                onChange={e => setEmail(e.target.value)}
              />
            </div>
          </div>
          
          <button 
            type="submit" 
            disabled={status.loading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-istpet-gold text-istpet-blue font-bold shadow-[0_0_15px_rgba(202,171,94,0.3)] hover:shadow-[0_0_25px_rgba(202,171,94,0.5)] transition-all hover:-translate-y-1 active:translate-y-0 disabled:opacity-50"
          >
            {status.loading ? 'Enviando...' : <><Send size={18} /> Enviar Enlace</>}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
