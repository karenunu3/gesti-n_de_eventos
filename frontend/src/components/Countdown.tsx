import { useEffect, useState } from 'react';
import { Clock, Hourglass, CheckCircle2 } from 'lucide-react';
import { humanCountdown } from '../lib/dates';

interface Props {
  startDate: string | Date;
  endDate: string | Date;
}

/**
 * Muestra un contador en vivo:
 * - Antes de empezar: "Empieza en X" (azul)
 * - En curso: "Termina en X" (dorado pulsante)
 * - Finalizado: "Finalizado" (gris)
 */
const Countdown = ({ startDate, endDate }: Props) => {
  const [, tick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => tick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const now = Date.now();
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();

  if (now >= end) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-lg">
        <CheckCircle2 size={11} /> Finalizado
      </span>
    );
  }

  if (now < start) {
    const txt = humanCountdown(startDate);
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-istpet-blue dark:text-istpet-gold bg-istpet-blue/10 dark:bg-istpet-gold/10 px-2 py-1 rounded-lg">
        <Hourglass size={11} /> Empieza en {txt}
      </span>
    );
  }

  // En curso
  const txt = humanCountdown(endDate);
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-lg">
      <Clock size={11} className="animate-pulse" /> Termina en {txt}
    </span>
  );
};

export default Countdown;
