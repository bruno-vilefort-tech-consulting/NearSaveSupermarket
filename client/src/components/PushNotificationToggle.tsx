import { Bell, BellOff, AlertCircle, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useState } from 'react';

interface PushNotificationToggleProps {
  customerEmail: string;
}

export function PushNotificationToggle({ customerEmail }: PushNotificationToggleProps) {
  const { 
    isEnabled, 
    isLoading, 
    subscribeToPushNotifications, 
    unsubscribeFromPushNotifications,
    checkBrowserSupport
  } = usePushNotifications();
  
  const [showBlockedHelp, setShowBlockedHelp] = useState(false);

  const handleToggle = async () => {
    try {
      if (isEnabled) {
        await unsubscribeFromPushNotifications(customerEmail);
      } else {
        await subscribeToPushNotifications(customerEmail);
      }
    } catch (error: any) {
      console.error('Erro ao alterar notificações:', error);
      console.log('Error type:', typeof error);
      console.log('Error message:', error?.message);
      console.log('Current permission:', Notification.permission);
      
      // Check if notifications are blocked based on permission status
      if (Notification.permission === 'denied' || error?.message?.includes('bloqueadas') || error?.message?.includes('denied')) {
        setShowBlockedHelp(true);
      } else {
        alert('Erro: ' + (error?.message || 'Erro desconhecido'));
      }
    }
  };

  const supportError = checkBrowserSupport();
  if (supportError) {
    return (
      <div className="text-sm text-gray-500 text-center p-2">
        {supportError}
      </div>
    );
  }

  if (showBlockedHelp) {
    return (
      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="p-3">
          <div className="flex items-start gap-3">
            <Lock className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="font-medium text-orange-900 mb-2">
                Notificações Bloqueadas
              </h4>
              <p className="text-sm text-orange-800 mb-3">
                Para receber atualizações sobre seus pedidos:
              </p>
              <ol className="text-sm text-orange-800 space-y-1 mb-3">
                <li>1. Clique no ícone 🔒 ao lado da URL</li>
                <li>2. Mude "Notificações" para "Permitir"</li>
                <li>3. Recarregue a página</li>
              </ol>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.location.reload()}
                  className="text-orange-700 border-orange-300"
                >
                  Recarregar Página
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowBlockedHelp(false)}
                  className="text-orange-700"
                >
                  Fechar
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex items-center gap-2 p-2">
      <Button
        variant={isEnabled ? "default" : "outline"}
        size="sm"
        onClick={handleToggle}
        disabled={isLoading}
        className="flex items-center gap-2"
      >
        {isEnabled ? (
          <>
            <Bell className="h-4 w-4" />
            Notificações Ativas
          </>
        ) : (
          <>
            <BellOff className="h-4 w-4" />
            Ativar Notificações
          </>
        )}
      </Button>
      
      {isEnabled && (
        <span className="text-xs text-green-600 font-medium">
          ✓ Ativo
        </span>
      )}
    </div>
  );
}