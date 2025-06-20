import { Bell, BellOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePushNotifications } from '@/hooks/usePushNotifications';

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

  const handleToggle = async () => {
    try {
      if (isEnabled) {
        await unsubscribeFromPushNotifications(customerEmail);
      } else {
        await subscribeToPushNotifications(customerEmail);
      }
    } catch (error: any) {
      console.error('Erro ao alterar notificações:', error);
      
      // Check if notifications are blocked and show immediate help
      if (Notification.permission === 'denied' || error?.message?.includes('bloqueadas') || error?.message?.includes('denied')) {
        // Show help immediately with confirm dialog
        const helpMessage = `Notificações estão bloqueadas no seu navegador.

Para ativar:
1. Clique no ícone 🔒 ao lado da URL
2. Mude "Notificações" para "Permitir" 
3. Recarregue a página

Deseja recarregar a página agora?`;
        
        if (confirm(helpMessage)) {
          window.location.reload();
        }
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