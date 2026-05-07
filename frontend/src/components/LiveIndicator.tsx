import { RefreshCw } from 'lucide-react';

interface Props {
  isRefreshing?: boolean;
  lastRefreshAt?: Date | null;
  onRefresh?: () => void;
  label?: string;
}

const LiveIndicator = ({ isRefreshing, lastRefreshAt, onRefresh, label = 'En vivo' }: Props) => {
  const seconds = lastRefreshAt
    ? Math.max(0, Math.round((Date.now() - lastRefreshAt.getTime()) / 1000))
    : null;

  return (
    <button
      type="button"
      onClick={onRefresh}
      title="Actualizar ahora"
      className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg bg-istpet-blue/10 dark:bg-istpet-gold/10 text-istpet-blue dark:text-istpet-gold hover:bg-istpet-blue/20 dark:hover:bg-istpet-gold/20 transition-colors font-medium"
    >
      <span className={`relative flex h-2 w-2 ${isRefreshing ? '' : ''}`}>
        <span className={`absolute inline-flex h-full w-full rounded-full bg-istpet-blue dark:bg-istpet-gold opacity-75 ${isRefreshing ? 'animate-ping' : ''}`} />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-istpet-blue dark:bg-istpet-gold" />
      </span>
      <RefreshCw size={11} className={isRefreshing ? 'animate-spin' : ''} />
      <span className="hidden sm:inline">{label}</span>
      {seconds !== null && !isRefreshing && (
        <span className="text-[10px] opacity-60">· hace {seconds < 60 ? `${seconds}s` : `${Math.floor(seconds / 60)}m`}</span>
      )}
    </button>
  );
};

export default LiveIndicator;
