import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { fetchApi } from '../lib/api';
import { LogIn, KeySquare, Mail, MapPin, Phone, Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await fetchApi('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      
      if (!data || !data.user || !data.user.id) {
        throw new Error('Respuesta del servidor inválida. Faltan datos del usuario.');
      }
      
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row">
      {/* Lado izquierdo: Formulario */}
      <div className="w-full md:w-1/2 lg:w-1/3 flex items-center justify-center animated-gradient p-4 min-h-screen md:min-h-0">
        <div className="glass-dark w-full max-w-md p-8 rounded-3xl fade-in relative overflow-hidden">
          {/* Decoraciones de fondo */}
          <div className="absolute top-[-50px] right-[-50px] w-32 h-32 bg-blue-500 rounded-full blur-3xl opacity-20"></div>
          <div className="absolute bottom-[-50px] left-[-50px] w-40 h-40 bg-indigo-500 rounded-full blur-3xl opacity-20"></div>

          <div className="relative z-10">
            <div className="text-center mb-10">
              <div className="flex justify-center mb-4">
                <img src="https://evainstitutotraversari.edu.ec/pluginfile.php/1/theme_alpha/customsidebarlogo/1765890840/logo-lateral2.png" alt="Logo ISTPET" className="h-20 object-contain drop-shadow-md" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight mb-2 text-transparent bg-clip-text bg-gradient-to-r from-istpet-gold to-yellow-200">
                ISTPET Eventos
              </h1>
              <p className="text-slate-300">Gestión y Control de Asistencia</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              {error && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-200 px-4 py-3 rounded-xl text-sm text-center">
                  {error}
                </div>
              )}
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Correo Electrónico</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-400" />
                  </div>
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-white placeholder-slate-500"
                    placeholder="usuario@istpet.edu.ec"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium text-slate-300">Contraseña</label>
                  <Link to="/forgot-password" className="text-xs text-istpet-gold hover:underline font-medium">¿Olvidaste tu contraseña?</Link>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <KeySquare className="h-5 w-5 text-slate-400" />
                  </div>
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-3 bg-slate-800/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-white placeholder-slate-500"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-3.5 px-4 bg-gradient-to-r from-istpet-blue to-istpet-blue-light border border-istpet-gold/50 hover:from-istpet-blue-light hover:to-istpet-blue text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed transform hover:-translate-y-0.5 active:translate-y-0"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <LogIn className="w-5 h-5" />
                    Ingresar
                  </>
                )}
              </button>

              <p className="text-center text-sm text-slate-400 pt-1">
                ¿No tienes cuenta?{' '}
                <Link to="/register" className="text-istpet-gold hover:underline font-medium">
                  Regístrate aquí
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>

      {/* Lado derecho: Imagen institucional */}
      <div className="hidden md:flex flex-1 bg-white dark:bg-slate-900 items-center justify-center relative overflow-hidden transition-colors duration-300">
        {/* Usamos el FONDO-WEB1.png que contiene la mascota/gallito */}
        <img 
          src="https://institutotraversari.edu.ec/wp-content/uploads/2025/09/FONDO-WEB1.png" 
          alt="ISTPET Mascot" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-istpet-blue/90 via-istpet-blue/40 to-transparent flex flex-col justify-end p-12">
          <h2 className="text-4xl font-bold text-white mb-2 shadow-sm drop-shadow-lg">Bienvenido a la plataforma</h2>
          <p className="text-xl text-white/90 font-medium drop-shadow-md mb-8">Instituto Superior Tecnológico Mayor Pedro Traversari</p>
          
          {/* Información de Contacto Overlay */}
          <div className="flex flex-col md:flex-row justify-between items-end border-t border-white/20 pt-6">
            <div className="flex justify-between items-center text-sm">
              <label className="flex items-center text-white/70">
                <input type="checkbox" className="mr-2 rounded border-white/20 bg-white/5 text-istpet-gold focus:ring-istpet-gold" />
                Recordarme
              </label>
              <Link to="/forgot-password" className="text-istpet-gold hover:underline font-medium">¿Olvidaste tu contraseña?</Link>
            </div>
            <div className="text-white/90 text-sm space-y-2">
              <p className="flex items-center gap-2 drop-shadow-md">
                <MapPin size={16} className="text-istpet-gold" />
                Av. Matilde Álvarez y Hugo Díaz Romero. Sector Chillogallo
              </p>
              <p className="flex items-center gap-2 drop-shadow-md">
                <Phone size={16} className="text-istpet-gold" />
                02 303 2894 / 098 4033166
              </p>
              <p className="flex items-center gap-2 drop-shadow-md">
                <Mail size={16} className="text-istpet-gold" />
                admisiones@istpet.edu.ec
              </p>
            </div>
            
            {/* Redes Sociales */}
            <div className="flex gap-4 mt-6 md:mt-0">
              <a href="https://www.facebook.com/institutotraversari" target="_blank" rel="noopener noreferrer" className="bg-white/10 backdrop-blur-sm p-3 rounded-full hover:bg-istpet-gold hover:text-istpet-blue transition-colors text-white">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
              </a>
              <a href="https://www.instagram.com/tecnologico_traversari/" target="_blank" rel="noopener noreferrer" className="bg-white/10 backdrop-blur-sm p-3 rounded-full hover:bg-istpet-gold hover:text-istpet-blue transition-colors text-white">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
              </a>
              <a href="https://www.tiktok.com/@tecnologico_traversari" target="_blank" rel="noopener noreferrer" className="bg-white/10 backdrop-blur-sm p-3 rounded-full hover:bg-istpet-gold hover:text-istpet-blue transition-colors text-white">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" /></svg>
              </a>
              <a href="https://www.youtube.com/@tecnologico_traversari" target="_blank" rel="noopener noreferrer" className="bg-white/10 backdrop-blur-sm p-3 rounded-full hover:bg-istpet-gold hover:text-istpet-blue transition-colors text-white">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33 2.78 2.78 0 0 0 1.94 2c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.33 29 29 0 0 0-.46-5.33z"></path><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon></svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
