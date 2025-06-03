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
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutos em segundos
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

  // Timer para expiração do PIX e verificação automática
  useEffect(() => {
    if (!pixData) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsExpired(true);
          toast({
            title: "PIX Expirado",
            description: "O tempo para pagamento expirou. Tente novamente.",
            variant: "destructive",
          });
          setTimeout(() => {
            setLocation('/customer/cart');
          }, 3000);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [pixData, toast, setLocation]);

  // Verificação automática do pagamento a cada 10 segundos
  useEffect(() => {
    if (!pixData?.pixPayment?.id || isExpired || paymentStatus === 'approved') return;

    const checkInterval = setInterval(() => {
      checkPaymentStatus();
    }, 10000); // 10 segundos

    return () => clearInterval(checkInterval);
  }, [pixData, isExpired, paymentStatus]);

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
            title: "Pagamento Identificado!",
            description: `Seu pedido #${result.order.id} foi confirmado e enviado ao supermercado`,
          });
          
          // Limpar dados temporários
          localStorage.removeItem('pixData');
          localStorage.removeItem('orderData');
          localStorage.removeItem('cart');
          
          // Redirecionar para pedidos após 2 segundos
          setTimeout(() => {
            setLocation('/customer/orders');
          }, 2000);
          
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



        {/* Código PIX */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Código PIX</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-3">
                Copie o código abaixo e cole no seu app de banco para fazer o pagamento PIX:
              </p>
              <div className="bg-gray-100 p-3 rounded mb-4 break-all text-sm font-mono border">
                {pixData.pixPayment.pixCopyPaste}
              </div>
              <Button 
                onClick={() => copyToClipboard(pixData.pixPayment.pixCopyPaste)}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copiar Código PIX
              </Button>
            </div>
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

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <p className="text-sm text-blue-800 font-medium mb-2">
            🔍 Verificação Automática Ativa
          </p>
          <p className="text-xs text-blue-600">
            Após efetuar o pagamento PIX, aguarde. O sistema verificará automaticamente a cada 10 segundos. 
            Quando o pagamento for identificado, você será redirecionado automaticamente.
          </p>
        </div>
      </div>
    </div>
  );
}