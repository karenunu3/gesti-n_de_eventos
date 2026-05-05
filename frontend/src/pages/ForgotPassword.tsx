import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchApi } from '../lib/api';
import { ArrowLeft, Mail, Send, CheckCircle, AlertCircle, XCircle } from 'lucide-react';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<{
    loading: boolean;
    error: string;
    success: string;
    notFound: boolean;
  }>({ loading: false, error: '', success: '', notFound: false });
  const [cooldown, setCooldown] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (cooldown > 0) {
      timer = setInterval(() => setCooldown(c => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cooldown > 0) return;

    setStatus({ loading: true, error: '', success: '', notFound: false });
    try {
      await fetchApi('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email })
      });
      setStatus({
        loading: false,
        error: '',
        success: email,
        notFound: false
      });
      setCooldown(60);
    } catch (error: any) {
      const msg: string = error.message || '';
      const isNotFound =
        msg.toLowerCase().includes('no está registrado') ||
        msg.toLowerCase().includes('not found') ||
        msg.includes('404');

      setStatus({
        loading: false,
        error: isNotFound ? '' : (msg || 'Ocurrió un error al enviar el correo. Inténtalo más tarde.'),
        success: '',
        notFound: isNotFound,
      });
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

        {/* Correo no encontrado */}
        {status.notFound && (
          <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-4 mb-5 flex items-start gap-3">
            <XCircle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-200 font-semibold text-sm">Correo no encontrado</p>
              <p className="text-red-300/80 text-xs mt-0.5">
                El correo <span className="font-bold text-red-200">{email}</span> no está registrado en el sistema. Verifica que sea el mismo con el que te registraste.
              </p>
            </div>
          </div>
        )}

        {/* Error general */}
        {status.error && (
          <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-4 mb-5 flex items-start gap-3">
            <AlertCircle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-200 font-semibold text-sm">Error al enviar</p>
              <p className="text-red-300/80 text-xs mt-0.5">{status.error}</p>
            </div>
          </div>
        )}

        {/* Correo enviado con éxito */}
        {status.success && (
          <div className="bg-istpet-gold/10 border border-istpet-gold/50 rounded-xl p-4 mb-5 flex items-start gap-3">
            <CheckCircle size={20} className="text-istpet-gold flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-istpet-gold font-semibold text-sm">¡Correo enviado!</p>
              <p className="text-istpet-gold/80 text-xs mt-0.5">
                Se envió un enlace de recuperación a <span className="font-bold">{status.success}</span>. Revisa tu bandeja de entrada y también la carpeta de <span className="italic">spam</span>.
              </p>
              <p className="text-istpet-gold/60 text-xs mt-1">El enlace expira en 1 hora.</p>
            </div>
          </div>
        )}

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
                onChange={e => {
                  setEmail(e.target.value);
                  setStatus({ loading: false, error: '', success: '', notFound: false });
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={status.loading || cooldown > 0}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-istpet-gold text-istpet-blue font-bold shadow-[0_0_15px_rgba(202,171,94,0.3)] hover:shadow-[0_0_25px_rgba(202,171,94,0.5)] transition-all hover:-translate-y-1 active:translate-y-0 disabled:opacity-50 disabled:hover:translate-y-0 disabled:shadow-none disabled:cursor-not-allowed"
          >
            {status.loading
              ? 'Enviando...'
              : cooldown > 0
              ? `Reenviar en ${cooldown}s`
              : <><Send size={18} /> Enviar Enlace</>
            }
          </button>

          {cooldown > 0 && (
            <p className="text-center text-xs text-white/40">
              ¿No lo recibiste? Espera {cooldown} segundos para reenviar o revisa tu carpeta de spam.
            </p>
          )}
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
