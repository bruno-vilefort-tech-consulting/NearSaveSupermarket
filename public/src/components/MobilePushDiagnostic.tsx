import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DiagnosticResult {
  test: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: string;
}

export function MobilePushDiagnostic() {
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runDiagnostic = async () => {
    setIsRunning(true);
    const diagnosticResults: DiagnosticResult[] = [];

    // Test 1: Browser Support
    try {
      const hasServiceWorker = 'serviceWorker' in navigator;
      const hasPushManager = 'PushManager' in window;
      const hasNotifications = 'Notification' in window;
      
      diagnosticResults.push({
        test: 'Suporte do Navegador',
        status: hasServiceWorker && hasPushManager && hasNotifications ? 'pass' : 'fail',
        message: hasServiceWorker && hasPushManager && hasNotifications 
          ? 'Navegador suporta notificações push' 
          : 'Navegador não suporta algumas funcionalidades',
        details: `Service Worker: ${hasServiceWorker}, Push Manager: ${hasPushManager}, Notifications: ${hasNotifications}`
      });
    } catch (error) {
      diagnosticResults.push({
        test: 'Suporte do Navegador',
        status: 'fail',
        message: 'Erro ao verificar suporte do navegador',
        details: String(error)
      });
    }

    // Test 2: Device Detection
    try {
      const userAgent = navigator.userAgent;
      const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
      const isIOS = /iPad|iPhone|iPod/.test(userAgent);
      const isAndroid = /Android/.test(userAgent);
      
      diagnosticResults.push({
        test: 'Detecção de Dispositivo',
        status: 'pass',
        message: `Dispositivo: ${isMobile ? 'Mobile' : 'Desktop'}`,
        details: `iOS: ${isIOS}, Android: ${isAndroid}, User Agent: ${userAgent.substring(0, 100)}...`
      });
    } catch (error) {
      diagnosticResults.push({
        test: 'Detecção de Dispositivo',
        status: 'fail',
        message: 'Erro na detecção do dispositivo',
        details: String(error)
      });
    }

    // Test 3: Notification Permission
    try {
      const permission = Notification.permission;
      diagnosticResults.push({
        test: 'Permissão de Notificações',
        status: permission === 'granted' ? 'pass' : permission === 'denied' ? 'fail' : 'warning',
        message: `Status: ${permission}`,
        details: permission === 'denied' 
          ? 'Notificações foram negadas pelo usuário' 
          : permission === 'default' 
          ? 'Permissão ainda não foi solicitada'
          : 'Notificações permitidas'
      });
    } catch (error) {
      diagnosticResults.push({
        test: 'Permissão de Notificações',
        status: 'fail',
        message: 'Erro ao verificar permissões',
        details: String(error)
      });
    }

    // Test 4: Service Worker Registration
    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        diagnosticResults.push({
          test: 'Service Worker',
          status: registration ? 'pass' : 'warning',
          message: registration ? 'Service Worker registrado' : 'Service Worker não encontrado',
          details: registration 
            ? `Scope: ${registration.scope}, State: ${registration.active?.state || 'unknown'}`
            : 'Nenhum service worker ativo encontrado'
        });
      }
    } catch (error) {
      diagnosticResults.push({
        test: 'Service Worker',
        status: 'fail',
        message: 'Erro ao verificar Service Worker',
        details: String(error)
      });
    }

    // Test 5: VAPID Key Retrieval
    try {
      const response = await fetch('/api/push/vapid-public-key');
      const data = await response.json();
      
      diagnosticResults.push({
        test: 'Chave VAPID',
        status: data.publicKey ? 'pass' : 'fail',
        message: data.publicKey ? 'Chave VAPID disponível' : 'Chave VAPID não encontrada',
        details: data.publicKey ? `Key: ${data.publicKey.substring(0, 20)}...` : 'Servidor não retornou chave VAPID'
      });
    } catch (error) {
      diagnosticResults.push({
        test: 'Chave VAPID',
        status: 'fail',
        message: 'Erro ao buscar chave VAPID',
        details: String(error)
      });
    }

    // Test 6: Push Manager Support
    try {
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          const subscription = await registration.pushManager.getSubscription();
          diagnosticResults.push({
            test: 'Push Manager',
            status: 'pass',
            message: subscription ? 'Subscrição ativa encontrada' : 'Push Manager disponível',
            details: subscription ? `Endpoint: ${subscription.endpoint.substring(0, 50)}...` : 'Pronto para criar subscrição'
          });
        }
      }
    } catch (error) {
      diagnosticResults.push({
        test: 'Push Manager',
        status: 'fail',
        message: 'Erro no Push Manager',
        details: String(error)
      });
    }

    setResults(diagnosticResults);
    setIsRunning(false);
  };

  const getStatusColor = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'pass': return 'text-green-600';
      case 'fail': return 'text-red-600';
      case 'warning': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'pass': return '✓';
      case 'fail': return '✗';
      case 'warning': return '⚠';
      default: return '?';
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Diagnóstico de Notificações Push (Mobile)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={runDiagnostic} 
          disabled={isRunning}
          className="w-full"
        >
          {isRunning ? 'Executando Diagnóstico...' : 'Executar Diagnóstico'}
        </Button>

        {results.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold">Resultados:</h3>
            {results.map((result, index) => (
              <div key={index} className="border rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{result.test}</span>
                  <span className={`font-bold ${getStatusColor(result.status)}`}>
                    {getStatusIcon(result.status)} {result.status.toUpperCase()}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{result.message}</p>
                {result.details && (
                  <details className="text-xs text-gray-500">
                    <summary className="cursor-pointer">Detalhes técnicos</summary>
                    <p className="mt-1 font-mono bg-gray-100 p-2 rounded">{result.details}</p>
                  </details>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}