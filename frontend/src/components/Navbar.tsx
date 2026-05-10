import { useNavigate, useLocation, Link } from 'react-router-dom';
import { LogOut, User, Moon, Sun, Monitor, Globe, Calendar, LayoutDashboard, Settings2, ChevronDown, Layers, Users as UsersIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../lib/ThemeContext';
import { useState } from 'react';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [showAdminMenu, setShowAdminMenu] = useState(false);

  // useLocation() triggers a re-render on every route change,
  // so reading localStorage here is always fresh — no useState/useEffect needed.
  const user = (() => {
    try { return JSON.parse(localStorage.getItem('user') || 'null'); }
    catch { return null; }
  })();

  const isAuthenticated = !!user?.id;
  const isAdmin = ['ADMIN', 'SECRETARIA', 'DOCENTE'].includes(user?.role);

  // Hide on public pages
  const isPublicPage = ['/login', '/register', '/forgot-password', '/reset-password', '/verify'].some(
    p => location.pathname === p || location.pathname.startsWith(p + '/')
  );
  if (isPublicPage || !isAuthenticated) return null;

  const toggleLanguage = () => {
    const newLang = i18n.language === 'es' ? 'en' : 'es';
    i18n.changeLanguage(newLang);
    localStorage.setItem('app_lang', newLang);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const navLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={15} />, show: true },
    // "Eventos Institucionales" solo visible para alumnos — los admins gestionan eventos vía Admin → Eventos
    { to: '/events', label: t('events.title'), icon: <Calendar size={15} />, show: user?.role === 'ALUMNO' },
  ];

  const adminSubLinks = [
    { to: '/admin/events', label: 'Eventos', icon: <Calendar size={14} />, show: true },
    { to: '/admin/careers', label: 'Carreras', icon: <Layers size={14} />, show: ['ADMIN', 'SECRETARIA'].includes(user?.role) },
    { to: '/admin/users', label: 'Usuarios', icon: <UsersIcon size={14} />, show: user?.role === 'ADMIN' },
  ];

  const isActive = (to: string) =>
    to === '/dashboard'
      ? location.pathname === to
      : location.pathname === to || location.pathname.startsWith(to + '/');

  const isAdminActive = location.pathname.startsWith('/admin');

  return (
    <nav className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 shadow-sm transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-14 items-center gap-4">

          {/* Left: Brand + Desktop nav links */}
          <div className="flex items-center gap-1 min-w-0">
            <button
              onClick={() => navigate('/dashboard')}
              className="text-base font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-istpet-blue to-istpet-gold dark:from-istpet-gold dark:to-white shrink-0 mr-2"
            >
              ISTPET
            </button>

            <div className="hidden md:flex items-center gap-0.5">
              {navLinks.filter(l => l.show).map(link => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive(link.to)
                      ? 'bg-istpet-blue/10 dark:bg-istpet-gold/10 text-istpet-blue dark:text-istpet-gold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-50'
                  }`}
                >
                  {link.icon}
                  {link.label}
                </Link>
              ))}

              {/* Admin dropdown */}
              {isAdmin && (
                <div className="relative">
                  <button
                    onClick={() => setShowAdminMenu(v => !v)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      isAdminActive
                        ? 'bg-istpet-blue/10 dark:bg-istpet-gold/10 text-istpet-blue dark:text-istpet-gold'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-50'
                    }`}
                  >
                    <Settings2 size={15} /> Admin <ChevronDown size={13} className={`transition-transform ${showAdminMenu ? 'rotate-180' : ''}`} />
                  </button>
                  {showAdminMenu && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowAdminMenu(false)} />
                      <div className="absolute left-0 mt-1 w-44 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700 overflow-hidden py-1 z-50">
                        {adminSubLinks.filter(l => l.show).map(sub => (
                          <Link
                            key={sub.to}
                            to={sub.to}
                            onClick={() => setShowAdminMenu(false)}
                            className={`flex items-center gap-2 w-full px-3 py-2 text-sm transition-colors ${
                              location.pathname === sub.to
                                ? 'text-istpet-blue dark:text-istpet-gold font-semibold bg-slate-50 dark:bg-slate-700'
                                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                            }`}
                          >
                            {sub.icon} {sub.label}
                          </Link>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right: Controls */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Language */}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
              title="Cambiar idioma"
            >
              <Globe size={13} />
              <span className="uppercase hidden sm:inline">{i18n.language}</span>
            </button>

            {/* Theme */}
            <div className="relative">
              <button
                onClick={() => setShowThemeMenu(v => !v)}
                className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                title="Tema"
              >
                {theme === 'light' ? <Sun size={14} /> : theme === 'dark' ? <Moon size={14} /> : <Monitor size={14} />}
              </button>

              {showThemeMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowThemeMenu(false)} />
                  <div className="absolute right-0 mt-1 w-32 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700 overflow-hidden py-1 z-50">
                    {([
                      { id: 'light' as const,  icon: <Sun size={12} />,     label: t('theme.light') },
                      { id: 'dark' as const,   icon: <Moon size={12} />,    label: t('theme.dark') },
                      { id: 'system' as const, icon: <Monitor size={12} />, label: t('theme.system') },
                    ]).map(opt => (
                      <button
                        key={opt.id}
                        onClick={() => { setTheme(opt.id); setShowThemeMenu(false); }}
                        className={`flex items-center gap-2 w-full px-3 py-2 text-xs text-left transition-colors ${
                          theme === opt.id
                            ? 'text-istpet-blue dark:text-istpet-gold font-semibold bg-slate-50 dark:bg-slate-700'
                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                        }`}
                      >
                        {opt.icon} {opt.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* User chip — link a Mi Perfil. En móvil solo avatar; en desktop avatar + nombre */}
            <Link
              to="/profile"
              className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-istpet-blue/10 dark:hover:bg-istpet-gold/10 hover:text-istpet-blue dark:hover:text-istpet-gold p-1.5 sm:px-2.5 rounded-lg transition-colors"
              title="Mi perfil"
              aria-label="Mi perfil"
            >
              {user?.photoUrl
                ? <img src={user.photoUrl} alt="" className="w-6 h-6 sm:w-5 sm:h-5 rounded-full object-cover" onError={() => {}} />
                : <User size={16} className="text-istpet-blue dark:text-istpet-gold sm:w-3 sm:h-3" />
              }
              <span className="hidden sm:inline">{user?.firstName}</span>
            </Link>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              title={t('navbar.logout')}
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">{t('navbar.logout')}</span>
            </button>
          </div>
        </div>

        {/* Mobile nav links row */}
        <div className="md:hidden flex items-center gap-1 pb-2 overflow-x-auto">
          {navLinks.filter(l => l.show).map(link => (
            <Link
              key={link.to}
              to={link.to}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors shrink-0 ${
                isActive(link.to)
                  ? 'bg-istpet-blue/10 dark:bg-istpet-gold/10 text-istpet-blue dark:text-istpet-gold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {link.icon}
              {link.label}
            </Link>
          ))}
          {isAdmin && adminSubLinks.filter(l => l.show).map(sub => (
            <Link
              key={sub.to}
              to={sub.to}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors shrink-0 ${
                location.pathname === sub.to
                  ? 'bg-istpet-blue/10 dark:bg-istpet-gold/10 text-istpet-blue dark:text-istpet-gold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {sub.icon}
              <span>{sub.label}</span>
            </Link>
          ))}
          {/* Mi Perfil siempre visible al final en móvil */}
          <Link
            to="/profile"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors shrink-0 ${
              location.pathname === '/profile'
                ? 'bg-istpet-blue/10 dark:bg-istpet-gold/10 text-istpet-blue dark:text-istpet-gold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <User size={14} />
            <span>Mi Perfil</span>
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
