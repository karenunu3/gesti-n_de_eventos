import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface CalendarEvent {
  id: number;
  title: string;
  startDate: string;
  endDate: string;
  isTransversal?: boolean;
}

interface Props {
  events: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
  /** Etiqueta opcional encima del título del mes (ej. "Calendario de eventos") */
  title?: string;
}

const MiniCalendar = ({ events, onEventClick, title }: Props) => {
  const [calMonth, setCalMonth] = useState(new Date());

  const calY = calMonth.getFullYear();
  const calM = calMonth.getMonth();
  const firstDay = new Date(calY, calM, 1).getDay();
  const daysInMonth = new Date(calY, calM + 1, 0).getDate();
  const today = new Date();

  const eventsByDay: Record<number, CalendarEvent[]> = {};
  events.forEach(e => {
    const d = new Date(e.startDate);
    if (d.getFullYear() === calY && d.getMonth() === calM) {
      const day = d.getDate();
      eventsByDay[day] = eventsByDay[day] || [];
      eventsByDay[day].push(e);
    }
  });

  return (
    <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
      <div className="flex items-center justify-between mb-4">
        <div>
          {title && <p className="text-xs uppercase font-semibold text-slate-400 dark:text-slate-500 tracking-wider mb-0.5">{title}</p>}
          <h3 className="font-bold text-base text-slate-800 dark:text-slate-50 capitalize">
            {calMonth.toLocaleDateString('es-EC', { month: 'long', year: 'numeric' })}
          </h3>
        </div>
        <div className="flex gap-1">
          <button onClick={() => setCalMonth(new Date(calY, calM - 1))} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-500"><ChevronLeft size={16} /></button>
          <button onClick={() => setCalMonth(new Date())} className="text-[10px] px-1.5 hover:text-istpet-blue dark:hover:text-istpet-gold text-slate-500 self-center font-semibold">Hoy</button>
          <button onClick={() => setCalMonth(new Date(calY, calM + 1))} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-500"><ChevronRight size={16} /></button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-1">
        {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((d, i) => <div key={i}>{d}</div>)}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {Array(firstDay).fill(0).map((_, i) => <div key={`empty-${i}`} />)}
        {Array(daysInMonth).fill(0).map((_, i) => {
          const day = i + 1;
          const isToday = today.getFullYear() === calY && today.getMonth() === calM && today.getDate() === day;
          const dayEvents = eventsByDay[day] || [];
          const hasEvents = dayEvents.length > 0;
          return (
            <button
              key={day}
              onClick={() => hasEvents && onEventClick && onEventClick(dayEvents[0])}
              disabled={!hasEvents}
              className={`aspect-square flex flex-col items-center justify-center rounded-lg text-xs relative transition-colors ${
                isToday
                  ? 'bg-istpet-blue text-white dark:bg-istpet-gold dark:text-slate-900 font-bold'
                  : hasEvents
                  ? 'bg-istpet-gold/20 text-istpet-blue dark:text-istpet-gold hover:bg-istpet-gold/40 cursor-pointer font-semibold'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
              title={hasEvents ? dayEvents.map(e => e.title).join('\n') : ''}
            >
              {day}
              {hasEvents && !isToday && (
                <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-istpet-gold" />
              )}
              {dayEvents.length > 1 && !isToday && (
                <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-istpet-blue dark:bg-istpet-gold text-white dark:text-slate-900 text-[8px] flex items-center justify-center font-bold">
                  {dayEvents.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Leyenda */}
      <div className="flex flex-wrap items-center gap-3 mt-4 pt-3 border-t border-slate-100 dark:border-slate-700 text-[10px] text-slate-500 dark:text-slate-400">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-istpet-blue dark:bg-istpet-gold" /> Hoy</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-istpet-gold/40" /> Con eventos</span>
        <span className="text-slate-400">· Click en el día para ver el evento</span>
      </div>
    </div>
  );
};

export default MiniCalendar;
