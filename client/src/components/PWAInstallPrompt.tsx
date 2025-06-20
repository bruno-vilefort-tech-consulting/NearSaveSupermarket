import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Download, X } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = React.useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = React.useState(false);
  const [isInstalled, setIsInstalled] = React.useState(false);

  useEffect(() => {
    // Registrar service worker
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then((registration) => {
            console.log('SW registrado com sucesso:', registration);
          })
          .catch((error) => {
            console.log('Falha ao registrar SW:', error);
          });
      });
    }

    // Verificar se já está instalado
    if (window.matchMedia('(display-mode: standalone)').matches || 
        (window.navigator as any).standalone === true) {
      setIsInstalled(true);
      return;
    }

    // Listener para o evento beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    // Listener para quando o app é instalado
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('Usuário aceitou instalar o app');
    } else {
      console.log('Usuário dispensou a instalação');
    }
    
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Esconder por 7 dias
    localStorage.setItem('pwa-prompt-dismissed', Date.now().toString());
  };

  // Não mostrar se já foi dispensado recentemente
  useEffect(() => {
    const dismissed = localStorage.getItem('pwa-prompt-dismissed');
    if (dismissed) {
      const dismissedTime = parseInt(dismissed);
      const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      if (dismissedTime > sevenDaysAgo) {
        setShowPrompt(false);
      }
    }
  }, []);

  // Não mostrar se já está instalado ou se não há prompt disponível
  if (isInstalled || !showPrompt || !deferredPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-80">
      <Card className="p-4 bg-white shadow-lg border border-green-200">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 p-2 bg-green-100 rounded-lg">
            <Download className="w-5 h-5 text-green-600" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 text-sm mb-1">
              Instalar SaveUp
            </h3>
            <p className="text-xs text-gray-600 mb-3">
              Adicione o SaveUp à sua tela inicial para acesso rápido e uma melhor experiência de compra.
            </p>
            
            <div className="flex gap-2">
              <Button 
                size="sm" 
                onClick={handleInstallClick}
                className="bg-green-600 hover:bg-green-700 text-white flex-1"
              >
                Instalar
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={handleDismiss}
                className="px-2"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}