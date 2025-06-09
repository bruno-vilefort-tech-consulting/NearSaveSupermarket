import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Smartphone, Share2, QrCode } from 'lucide-react';

export default function TestePWA() {
  const appUrl = window.location.origin;
  
  const shareApp = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'SaveUp - Supermercado Sustentável',
          text: 'Teste o app SaveUp - compras sustentáveis com economia',
          url: appUrl,
        });
      } catch (error) {
        console.log('Erro ao compartilhar:', error);
      }
    } else {
      // Fallback - copiar para clipboard
      navigator.clipboard.writeText(appUrl);
      alert('Link copiado para a área de transferência!');
    }
  };

  const installInstructions = [
    "1. Abra este link no seu celular",
    "2. Acesse pelo navegador (Chrome, Safari, etc.)",
    "3. Procure o botão 'Instalar SaveUp' que aparece na tela",
    "4. Toque em 'Instalar' quando o prompt aparecer",
    "5. O SaveUp será adicionado à sua tela inicial como um app"
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="text-center py-6">
          <h1 className="text-2xl font-bold text-green-600 mb-2">
            SaveUp PWA
          </h1>
          <p className="text-gray-600">
            Teste o aplicativo SaveUp
          </p>
        </div>

        {/* URL Card */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Smartphone className="w-5 h-5 text-green-600" />
            <h2 className="font-semibold">Link para Testers</h2>
          </div>
          
          <div className="bg-gray-100 p-3 rounded-lg mb-4 break-all text-sm">
            {appUrl}
          </div>
          
          <Button 
            onClick={shareApp}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            <Share2 className="w-4 h-4 mr-2" />
            Compartilhar App
          </Button>
        </Card>

        {/* Instructions Card */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Download className="w-5 h-5 text-blue-600" />
            <h2 className="font-semibold">Como Instalar</h2>
          </div>
          
          <ol className="space-y-2 text-sm text-gray-700">
            {installInstructions.map((instruction, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="bg-blue-100 text-blue-600 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                  {index + 1}
                </span>
                {instruction.slice(2)}
              </li>
            ))}
          </ol>
        </Card>

        {/* QR Code Placeholder */}
        <Card className="p-6 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <QrCode className="w-5 h-5 text-purple-600" />
            <h2 className="font-semibold">QR Code</h2>
          </div>
          
          <div className="w-48 h-48 mx-auto bg-gray-100 rounded-lg flex items-center justify-center mb-4">
            <div className="text-center text-gray-500">
              <QrCode className="w-12 h-12 mx-auto mb-2" />
              <p className="text-xs">
                Gere um QR code com o link<br />
                usando qualquer gerador online
              </p>
            </div>
          </div>
          
          <p className="text-xs text-gray-600">
            Use o link acima em qualquer gerador de QR code online
          </p>
        </Card>

        {/* Testing Notes */}
        <Card className="p-6 bg-yellow-50 border-yellow-200">
          <h3 className="font-semibold text-yellow-800 mb-2">
            Notas para Teste
          </h3>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• Funciona melhor no Chrome e Safari mobile</li>
            <li>• O prompt pode demorar alguns segundos para aparecer</li>
            <li>• Teste em modo retrato e paisagem</li>
            <li>• Verifique se o ícone aparece na tela inicial</li>
            <li>• Teste funcionamento offline básico</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}