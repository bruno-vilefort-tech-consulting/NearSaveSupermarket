import { Bell, BellOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { usePushNotifications } from '@/hooks/usePushNotifications';

interface PushNotificationToggleProps {
  customerEmail: string;
}

export function PushNotificationToggle({ customerEmail }: PushNotificationToggleProps) {
  const { toast } = useToast();
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
        const success = await unsubscribeFromPushNotifications(customerEmail);
        if (success) {
          toast({
            title: "Notificações Desativadas",
            description: "Você não receberá mais notificações push.",
          });
        }
      } else {
        const success = await subscribeToPushNotifications(customerEmail);
        if (success) {
          toast({
            title: "Notificações Ativadas!",
            description: "Você receberá atualizações sobre seus pedidos.",
          });
        }
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível alterar as notificações.",
        variant: "destructive",
      });
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