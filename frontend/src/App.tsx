import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Component, ReactNode } from 'react';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Events from './pages/Events';
import VerifyCertificate from './pages/VerifyCertificate';
import AdminEvents from './pages/AdminEvents';
import AdminCareers from './pages/AdminCareers';
import AdminUsers from './pages/AdminUsers';
import Footer from './components/Footer';
import Navbar from './components/Navbar';

// ─── Route guards ────────────────────────────────────────────────
const getUser = () => {
  try { return JSON.parse(localStorage.getItem('user') || 'null'); }
  catch { return null; }
};

const PrivateRoute = ({ children }: { children: JSX.Element }) => {
  const user = getUser();
  if (!user?.id) return <Navigate to="/login" replace />;
  return children;
};

const AdminRoute = ({ children }: { children: JSX.Element }) => {
  const user = getUser();
  if (!user?.id) return <Navigate to="/login" replace />;
  if (!['ADMIN', 'SECRETARIA', 'DOCENTE'].includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
};

const SuperAdminRoute = ({ children }: { children: JSX.Element }) => {
  const user = getUser();
  if (!user?.id) return <Navigate to="/login" replace />;
  if (user.role !== 'ADMIN') return <Navigate to="/dashboard" replace />;
  return children;
};

// ─── Error boundary — catches render crashes, shows a recovery UI ─
class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; message: string }
> {
  state = { hasError: false, message: '' };

  static getDerivedStateFromError(err: Error) {
    return { hasError: true, message: err.message };
  }

  componentDidCatch(err: Error, info: any) {
    console.error('[ErrorBoundary]', err, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 p-8 text-center">
          <div className="text-4xl">⚠️</div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-50">Algo salió mal</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm">{this.state.message}</p>
          <button
            onClick={() => { this.setState({ hasError: false, message: '' }); window.location.href = '/dashboard'; }}
            className="px-6 py-2.5 bg-istpet-blue dark:bg-istpet-gold text-white dark:text-slate-900 rounded-xl font-bold text-sm hover:bg-istpet-blue-light dark:hover:bg-istpet-gold-light transition-colors"
          >
            Volver al Dashboard
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── App ─────────────────────────────────────────────────────────
function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-50 font-sans flex flex-col transition-colors duration-300">
        {/* Global navbar — hidden on public routes, shows nav links + controls */}
        <Navbar />

        <main className="flex-1 w-full flex flex-col">
          <ErrorBoundary>
            <Routes>
              {/* Public */}
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password/:token" element={<ResetPassword />} />
              <Route path="/verify/:code" element={<VerifyCertificate />} />

              {/* Authenticated */}
              <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
              <Route path="/events" element={<PrivateRoute><Events /></PrivateRoute>} />

              {/* Admin / Staff */}
              <Route path="/admin/events" element={<AdminRoute><AdminEvents /></AdminRoute>} />
              <Route path="/admin/careers" element={<AdminRoute><AdminCareers /></AdminRoute>} />
              <Route path="/admin/users" element={<SuperAdminRoute><AdminUsers /></SuperAdminRoute>} />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </ErrorBoundary>
        </main>

        <Footer />
      </div>
    </Router>
  );
}

export default App;
