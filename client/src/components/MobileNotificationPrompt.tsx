import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, Smartphone, CheckCircle, XCircle } from 'lucide-react';

interface MobileNotificationPromptProps {
  onPermissionResult: (granted: boolean) => void;
}

export function MobileNotificationPrompt({ onPermissionResult }: MobileNotificationPromptProps) {
  const [isRequesting, setIsRequesting] = useState(false);
  const [permissionStep, setPermissionStep] = useState<'initial' | 'requesting' | 'completed'>('initial');

  const requestNotificationPermission = async () => {
    setIsRequesting(true);
    setPermissionStep('requesting');

    try {
      // Check if notifications are supported
      if (!('Notification' in window)) {
        throw new Error('Notificações não são suportadas neste dispositivo');
      }

      // Show detailed explanation before requesting
      const userWantsNotifications = confirm(
        'Deseja receber notificações sobre:\n\n' +
        '• Status dos seus pedidos\n' +
        '• Promoções especiais\n' +
        '• Produtos próximos ao vencimento\n' +
        '• Pontos eco conquistados\n\n' +
        'Toque "OK" para ativar as notificações.'
      );

      if (!userWantsNotifications) {
        setPermissionStep('completed');
        onPermissionResult(false);
        return;
      }

      // Request permission
      let permission = Notification.permission;
      
      if (permission === 'default') {
        permission = await Notification.requestPermission();
      }

      const granted = permission === 'granted';
      setPermissionStep('completed');
      onPermissionResult(granted);

      if (granted) {
        // Show a test notification to confirm it's working
        new Notification('🔔 Notificações Ativadas!', {
          body: 'Você receberá atualizações importantes sobre seus pedidos.',
          icon: '/icon-192x192.png',
          tag: 'welcome'
        });
      }

    } catch (error) {
      console.error('Erro ao solicitar permissão:', error);
      setPermissionStep('completed');
      onPermissionResult(false);
    } finally {
      setIsRequesting(false);
    }
  };

  if (permissionStep === 'completed') {
    return null;
  }

  return (
    <Card className="mb-4 border-blue-200 bg-blue-50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-blue-800">
          <Bell className="h-5 w-5" />
          Ativar Notificações
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <Smartphone className="h-5 w-5 text-blue-600 mt-1 flex-shrink-0" />
            <div>
              <p className="text-sm text-blue-800 font-medium mb-1">
                Receba atualizações em tempo real
              </p>
              <p className="text-sm text-blue-700">
                Fique por dentro dos seus pedidos, promoções e muito mais
              </p>
            </div>
          </div>

          <div className="space-y-2 text-sm text-blue-700">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Status de pedidos em tempo real</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Promoções exclusivas próximas a você</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Produtos com desconto por vencimento</span>
            </div>
          </div>

          <Button 
            onClick={requestNotificationPermission}
            disabled={isRequesting}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {isRequesting ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                Solicitando permissão...
              </>
            ) : (
              <>
                <Bell className="h-4 w-4 mr-2" />
                Ativar Notificações
              </>
            )}
          </Button>

          {permissionStep === 'requesting' && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="animate-pulse w-2 h-2 bg-yellow-500 rounded-full"></div>
                <p className="text-sm text-yellow-800">
                  Aguardando sua resposta na caixa de permissão...
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}