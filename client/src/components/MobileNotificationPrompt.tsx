import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, Smartphone, CheckCircle, AlertCircle } from 'lucide-react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useToast } from '@/hooks/use-toast';

interface MobileNotificationPromptProps {
  userEmail: string;
  onPermissionResult: (granted: boolean) => void;
}

export function MobileNotificationPrompt({ userEmail, onPermissionResult }: MobileNotificationPromptProps) {
  const [permissionStep, setPermissionStep] = useState<'initial' | 'requesting' | 'completed'>('initial');
  const { subscribeToPushNotifications, isLoading, checkBrowserSupport } = usePushNotifications();
  const { toast } = useToast();

  const requestNotificationPermission = async () => {
    setPermissionStep('requesting');

    try {
      // Check browser support first
      const supportError = checkBrowserSupport();
      if (supportError) {
        throw new Error(supportError);
      }

      const success = await subscribeToPushNotifications(userEmail);
      
      setPermissionStep('completed');
      onPermissionResult(success);

      if (success) {
        toast({
          title: "Notificações Ativadas!",
          description: "Você receberá atualizações sobre seus pedidos e promoções.",
        });
      }

    } catch (error: any) {
      console.error('Erro ao ativar notificações:', error);
      setPermissionStep('completed');
      onPermissionResult(false);
      
      toast({
        title: "Erro ao Ativar Notificações",
        description: error.message || "Erro desconhecido. Tente novamente.",
        variant: "destructive",
      });
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
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                Ativando notificações...
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