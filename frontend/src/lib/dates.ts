// Helpers de fecha estandarizados a la zona horaria del Ecuador (UTC-5)
const TZ = 'America/Guayaquil';

export const fmtDate = (d: Date | string) =>
  new Date(d).toLocaleDateString('es-EC', { timeZone: TZ, day: 'numeric', month: 'long', year: 'numeric' });

export const fmtDateShort = (d: Date | string) =>
  new Date(d).toLocaleDateString('es-EC', { timeZone: TZ, day: 'numeric', month: 'short' });

export const fmtTime = (d: Date | string) =>
  new Date(d).toLocaleTimeString('es-EC', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hour12: false });

export const fmtDateTime = (d: Date | string) =>
  new Date(d).toLocaleString('es-EC', { timeZone: TZ, dateStyle: 'short', timeStyle: 'short' });

/** Devuelve los componentes restantes hasta `target`, o null si ya pasó. */
export function timeUntil(target: Date | string): { days: number; hours: number; minutes: number; seconds: number; totalMs: number } | null {
  const ms = new Date(target).getTime() - Date.now();
  if (ms <= 0) return null;
  const totalSec = Math.floor(ms / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  return { days, hours, minutes, seconds, totalMs: ms };
}

/** Texto humano del tiempo restante: "5d 3h", "12h 45m", "8m 20s", o null si pasó. */
export function humanCountdown(target: Date | string): string | null {
  const t = timeUntil(target);
  if (!t) return null;
  if (t.days > 0) return `${t.days}d ${t.hours}h`;
  if (t.hours > 0) return `${t.hours}h ${t.minutes}m`;
  if (t.minutes > 0) return `${t.minutes}m ${t.seconds.toString().padStart(2, '0')}s`;
  return `${t.seconds}s`;
}

/**
 * Convierte un Date/ISO en el string que necesita <input type="datetime-local"> ("YYYY-MM-DDTHH:mm")
 * garantizando la hora exacta en la zona horaria de Ecuador (America/Guayaquil - UTC-5),
 * independientemente de la zona horaria del dispositivo del usuario.
 */
export function toDateTimeLocalInput(d: Date | string): string {
  if (!d) return '';
  const date = new Date(d);
  if (isNaN(date.getTime())) return '';

  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const get = (type: string) => parts.find(p => p.type === type)?.value || '00';
  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`;
}

/**
 * Convierte un valor de <input type="datetime-local"> ("YYYY-MM-DDTHH:mm") a ISO UTC,
 * fijando explícitamente la hora en zona Ecuador (-05:00).
 */
export function parseEcuadorDateTimeLocal(dtLocal: string): string {
  if (!dtLocal) return new Date().toISOString();
  const fullString = dtLocal.length === 16 ? `${dtLocal}:00-05:00` : dtLocal;
  return new Date(fullString).toISOString();
}

/** ¿La fecha cae en un día anterior al actual (zona local)? */
export function isBeforeToday(d: Date | string): boolean {
  const target = new Date(d);
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  return target < startOfToday;
}
