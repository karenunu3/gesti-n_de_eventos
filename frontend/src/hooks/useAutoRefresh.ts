import { useEffect, useRef, useState } from 'react';

/**
 * Auto-refresca datos invocando `callback` cada `intervalMs` mientras la pestaña esté visible.
 * - Pausa automáticamente si el tab está oculto (ahorra peticiones)
 * - Re-ejecuta inmediatamente cuando el tab vuelve a ser visible
 * - `enabled=false` desactiva todo (útil cuando hay un modal abierto, por ejemplo)
 *
 * Devuelve `{ isRefreshing, lastRefreshAt, refreshNow }` para mostrar indicador en UI.
 */
export function useAutoRefresh(
  callback: () => void | Promise<void>,
  intervalMs = 20000,
  enabled = true
) {
  const cbRef = useRef(callback);
  cbRef.current = callback;

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshAt, setLastRefreshAt] = useState<Date | null>(null);

  const run = async () => {
    if (document.visibilityState !== 'visible') return;
    try {
      setIsRefreshing(true);
      await Promise.resolve(cbRef.current());
      setLastRefreshAt(new Date());
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (!enabled) return;

    const id = setInterval(() => { run(); }, intervalMs);

    const onVis = () => { if (document.visibilityState === 'visible') run(); };
    document.addEventListener('visibilitychange', onVis);

    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVis);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intervalMs, enabled]);

  return { isRefreshing, lastRefreshAt, refreshNow: run };
}
