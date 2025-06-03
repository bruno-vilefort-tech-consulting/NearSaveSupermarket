import { useState, useEffect } from 'react';
import { useLocation, useRoute } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Copy, CheckCircle, Clock, X, ArrowLeft } from 'lucide-react';

export default function PixPaymentFixed() {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute('/customer/pix-payment/:tempOrderId');
  const [pixData, setPixData] = useState<any>(null);
  const [paymentStatus, setPaymentStatus] = useState<string>('pending');
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);
  const [timeLeft, setTimeLeft] = useState(1800); // 30 minutos em segundos
  const [isExpired, setIsExpired] = useState(false);
  const { toast } = useToast();

  const tempOrderId = params?.tempOrderId;

  useEffect(() => {
    if (!tempOrderId) {
      setLocation('/customer/home');
      return;
    }

    // Carregar dados do PIX do localStorage
    const savedPixData = localStorage.getItem('pixData');
    if (savedPixData) {
      const data = JSON.parse(savedPixData);
      if (data.tempOrderId === tempOrderId) {
        setPixData(data);
        console.log('PIX data loaded:', data);
      } else {
        setLocation('/customer/home');
      }
    } else {
      setLocation('/customer/home');
    }
  }, [tempOrderId, setLocation]);

  // Timer para expiração do PIX
  useEffect(() => {
    if (!pixData) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [pixData]);

  // Verificar status do pagamento
  const checkPaymentStatus = async () => {
    if (!pixData?.pixPayment?.id) return;

    setIsCheckingPayment(true);
    try {
      const response = await apiRequest("GET", `/api/payments/pix/status/${pixData.pixPayment.id}`);
      const status = await response.json();
      
      console.log('Payment status:', status);
      
      if (status.status === 'approved') {
        // Pagamento aprovado - confirmar e criar pedido
        try {
          const confirmResponse = await apiRequest("POST", "/api/pix/confirm", {
            tempOrderId: pixData.tempOrderId,
            pixPaymentId: pixData.pixPayment.id
          });
          
          const result = await confirmResponse.json();
          console.log('Order created:', result);
          
          setPaymentStatus('approved');
          toast({
            title: "Pagamento Aprovado!",
            description: `Pedido #${result.order.id} criado com sucesso`,
          });
          
          // Limpar dados temporários
          localStorage.removeItem('pixData');
          localStorage.removeItem('orderData');
          localStorage.removeItem('cart');
          
          // Redirecionar para pedidos após 3 segundos
          setTimeout(() => {
            setLocation('/customer/orders');
          }, 3000);
          
        } catch (error) {
          console.error('Error confirming payment:', error);
          toast({
            title: "Erro",
            description: "Erro ao confirmar pagamento. Tente novamente.",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
    } finally {
      setIsCheckingPayment(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copiado!",
        description: "Código PIX copiado para a área de transferência",
      });
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      toast({
        title: "Erro",
        description: "Não foi possível copiar o código",
        variant: "destructive",
      });
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (!pixData) {
    return (
      <div className="min-h-screen bg-green-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (paymentStatus === 'approved') {
    return (
      <div className="min-h-screen bg-green-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-8">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-green-800 mb-2">Pagamento Aprovado!</h2>
            <p className="text-gray-600 mb-4">Seu pedido foi confirmado e enviado ao supermercado.</p>
            <p className="text-sm text-gray-500">Redirecionando para seus pedidos...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-green-50 p-4">
      <div className="max-w-md mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => setLocation('/customer/cart')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold text-green-800">Pagamento PIX</h1>
        </div>

        {/* Status */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              Status do Pagamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <span>Status:</span>
              <Badge variant="outline" className="text-orange-600 border-orange-600">
                Aguardando Pagamento
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Tempo restante:</span>
              <span className={`font-mono ${isExpired ? 'text-red-600' : 'text-blue-600'}`}>
                {isExpired ? 'Expirado' : formatTime(timeLeft)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* QR Code */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>QR Code PIX</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            {pixData.pixPayment.qrCodeBase64 && (
              <div className="bg-white p-4 rounded-lg mb-4 inline-block">
                <img 
                  src={`data:image/png;base64,${pixData.pixPayment.qrCodeBase64}`}
                  alt="QR Code PIX"
                  className="w-64 h-64 mx-auto"
                />
              </div>
            )}
            <p className="text-sm text-gray-600 mb-4">
              Escaneie o QR Code acima com seu app de banco ou use o código copia e cola abaixo
            </p>
          </CardContent>
        </Card>

        {/* Código Copia e Cola */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Código Copia e Cola</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-100 p-3 rounded mb-4 break-all text-sm font-mono">
              {pixData.pixPayment.pixCopyPaste}
            </div>
            <Button 
              onClick={() => copyToClipboard(pixData.pixPayment.pixCopyPaste)}
              className="w-full"
              variant="outline"
            >
              <Copy className="h-4 w-4 mr-2" />
              Copiar Código PIX
            </Button>
          </CardContent>
        </Card>

        {/* Resumo do Pedido */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Resumo do Pedido</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pixData.items?.map((item: any, index: number) => (
              <div key={index} className="flex justify-between">
                <span>{item.productName} x{item.quantity}</span>
                <span>R$ {(parseFloat(item.priceAtTime) * item.quantity).toFixed(2)}</span>
              </div>
            ))}
            <div className="border-t pt-3 font-bold">
              <div className="flex justify-between">
                <span>Total</span>
                <span>R$ {parseFloat(pixData.totalAmount).toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Botão de verificar pagamento */}
        <Button
          onClick={checkPaymentStatus}
          disabled={isCheckingPayment || isExpired}
          className="w-full mb-4"
        >
          {isCheckingPayment ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
              Verificando...
            </div>
          ) : (
            'Verificar Pagamento'
          )}
        </Button>

        <p className="text-xs text-gray-500 text-center">
          Após efetuar o pagamento PIX, clique em "Verificar Pagamento" ou aguarde alguns segundos para confirmação automática.
        </p>
      </div>
    </div>
  );
}