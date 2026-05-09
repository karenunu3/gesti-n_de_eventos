import { useEffect } from 'react';
import { CheckCircle, XCircle, X, AlertTriangle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Props {
  type: ToastType;
  text: string;
  onClose: () => void;
  /** ms hasta que se autocierra; 0 o false desactiva auto-cierre. Por defecto 5000. */
  autoCloseMs?: number | false;
}

const STYLE: Record<ToastType, { bg: string; border: string; text: string; icon: typeof CheckCircle }> = {
  success: {
    bg: 'bg-emerald-50 dark:bg-emerald-900/30',
    border: 'border-emerald-300 dark:border-emerald-700',
    text: 'text-emerald-800 dark:text-emerald-200',
    icon: CheckCircle,
  },
  error: {
    bg: 'bg-red-50 dark:bg-red-900/30',
    border: 'border-red-300 dark:border-red-700',
    text: 'text-red-800 dark:text-red-200',
    icon: XCircle,
  },
  warning: {
    bg: 'bg-amber-50 dark:bg-amber-900/30',
    border: 'border-amber-300 dark:border-amber-700',
    text: 'text-amber-800 dark:text-amber-200',
    icon: AlertTriangle,
  },
  info: {
    bg: 'bg-istpet-blue/10 dark:bg-istpet-gold/10',
    border: 'border-istpet-blue/30 dark:border-istpet-gold/30',
    text: 'text-istpet-blue dark:text-istpet-gold',
    icon: Info,
  },
};

/**
 * Toast notification flotante en la esquina superior derecha (centro en móvil).
 * Aparece sobre cualquier contenido (z-50) sin importar dónde esté el scroll.
 */
const Toast = ({ type, text, onClose, autoCloseMs = 5000 }: Props) => {
  const s = STYLE[type];
  const Icon = s.icon;

  useEffect(() => {
    if (!autoCloseMs) return;
    const id = setTimeout(onClose, autoCloseMs);
    return () => clearTimeout(id);
  }, [autoCloseMs, onClose]);

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 sm:left-auto sm:right-6 sm:translate-x-0 z-[100] w-[92vw] sm:w-auto sm:max-w-md animate-[slideDown_0.25s_ease-out]">
      <div className={`flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg backdrop-blur-sm ${s.bg} ${s.border} ${s.text}`}>
        <Icon size={20} className="flex-shrink-0 mt-0.5" />
        <p className="flex-1 text-sm font-medium leading-relaxed pr-2">{text}</p>
        <button
          onClick={onClose}
          aria-label="Cerrar"
          className={`flex-shrink-0 -mt-0.5 -mr-1 p-1 rounded-md hover:bg-black/10 dark:hover:bg-white/10 transition-colors ${s.text}`}
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

export default Toast;
