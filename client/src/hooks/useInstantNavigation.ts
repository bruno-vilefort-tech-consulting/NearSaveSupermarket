import { useCallback } from 'react';
import { useLocation } from 'wouter';
import { queryClient } from '@/lib/queryClient';

// Hook para navegação instantânea com preload de dados
export function useInstantNavigation() {
  const [, setLocation] = useLocation();

  const navigateWithPreload = useCallback(async (path: string) => {
    // Navega imediatamente
    setLocation(path);
    
    // Preload dados da nova rota em background
    const staffInfo = localStorage.getItem('staffInfo');
    if (!staffInfo) return;

    try {
      const parsed = JSON.parse(staffInfo);
      const staffId = parsed.id;

      // Define preloads específicos por rota
      const routePreloads: Record<string, string[]> = {
        '/staff/products': ['/api/staff/products'],
        '/staff/orders': ['/api/staff/orders'],
        '/supermercado/gestao-financeira': ['/api/staff/pending-payments', '/api/staff/stats'],
        '/supermercado/marketing': ['/api/staff/marketing-subscription'],
      };

      const urlsToPreload = routePreloads[path] || [];
      
      // Executa preloads em paralelo
      urlsToPreload.forEach(url => {
        const queryKey = [url, staffId];
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
            staleTime: 2 * 60 * 1000, // 2 minutes
          }).catch(() => {
            // Ignore preload errors
          });
        }
      });
    } catch (error) {
      // Ignore errors, navigation already happened
    }
  }, [setLocation]);

  return navigateWithPreload;
}