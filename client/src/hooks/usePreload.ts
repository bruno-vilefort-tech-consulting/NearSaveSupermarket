import { useEffect } from 'react';
import { queryClient } from '@/lib/queryClient';

// Hook para pre-carregar dados de rotas frequentemente acessadas
export function usePreload() {
  useEffect(() => {
    const staffInfo = localStorage.getItem('staffInfo');
    if (!staffInfo) return;

    const preloadData = async () => {
      try {
        const parsed = JSON.parse(staffInfo);
        const staffId = parsed.id;

        // Pre-carrega dados críticos
        const preloadQueries = [
          { queryKey: ["/api/staff/stats", staffId], url: "/api/staff/stats" },
          { queryKey: ["/api/staff/products", staffId], url: "/api/staff/products" },
          { queryKey: ["/api/staff/orders", staffId], url: "/api/staff/orders" },
        ];

        // Executa preloads em paralelo sem bloquear a UI
        preloadQueries.forEach(({ queryKey, url }) => {
          if (!queryClient.getQueryData(queryKey)) {
            queryClient.prefetchQuery({
              queryKey,
              queryFn: async () => {
                const response = await fetch(url, {
                  headers: { "X-Staff-Id": staffId.toString() }
                });
                if (!response.ok) throw new Error("Preload failed");
                return response.json();
              },
              staleTime: 5 * 60 * 1000, // 5 minutes
            }).catch(() => {
              // Silently fail preloads to not affect user experience
            });
          }
        });
      } catch (error) {
        // Ignore preload errors
      }
    };

    // Delay preload to not block initial render
    const timeoutId = setTimeout(preloadData, 100);
    return () => clearTimeout(timeoutId);
  }, []);
}