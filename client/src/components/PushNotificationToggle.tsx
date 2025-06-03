import { useState } from 'react';
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
    isSupported, 
    isSubscribed, 
    isLoading, 
    subscribe, 
    unsubscribe 
  } = usePushNotifications(customerEmail);

  const handleToggle = async () => {
    if (isSubscribed) {
      const success = await unsubscribe();
      if (success) {
        toast({
          title: "Notificações Desativadas",
          description: "Você não receberá mais notificações push.",
        });
      } else {
        toast({
          title: "Erro",
          description: "Não foi possível desativar as notificações.",
          variant: "destructive",
        });
      }
    } else {
      const success = await subscribe();
      if (success) {
        toast({
          title: "Notificações Ativadas!",
          description: "Você receberá atualizações sobre seus pedidos.",
        });
      } else {
        toast({
          title: "Erro",
          description: "Não foi possível ativar as notificações. Verifique as permissões do navegador.",
          variant: "destructive",
        });
      }
    }
  };

  if (!isSupported) {
    return (
      <div className="text-sm text-gray-500 text-center p-2">
        Notificações não suportadas neste navegador
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 p-2">
      <Button
        variant={isSubscribed ? "default" : "outline"}
        size="sm"
        onClick={handleToggle}
        disabled={isLoading}
        className="flex items-center gap-2"
      >
        {isSubscribed ? (
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
      
      {isSubscribed && (
        <span className="text-xs text-green-600 font-medium">
          ✓ Ativo
        </span>
      )}
    </div>
  );
}