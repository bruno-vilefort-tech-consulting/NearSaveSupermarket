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
            pixPaymentId: pixData.pixPayment.id,
            customerData: {
              customerName: pixData.customerName,
              customerEmail: pixData.customerEmail,
              customerPhone: pixData.customerPhone,
              totalAmount: pixData.totalAmount,
              items: pixData.items
            }
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 p-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center justify-center mb-8 relative">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setLocation('/customer/cart')}
            className="absolute left-0 top-1/2 -translate-y-1/2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="text-center">
            <h1 className="text-3xl font-bold text-green-800 mb-2">Pagamento PIX</h1>
            <p className="text-sm text-gray-600">Finalize seu pagamento em instantes</p>
          </div>
        </div>

        {/* Status Card - Centralizado e destacado */}
        <Card className="mb-8 shadow-lg border-0 bg-white">
          <CardContent className="pt-6">
            <div className="text-center mb-6">
              <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                <Clock className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Aguardando Pagamento</h3>
              <p className="text-gray-600 text-sm">Efetue o pagamento antes do tempo esgotar</p>
            </div>
            
            <div className="bg-gradient-to-r from-orange-50 to-red-50 p-4 rounded-lg border border-orange-200">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">Tempo restante</p>
                <div className={`text-2xl font-mono font-bold ${isExpired ? 'text-red-600' : 'text-orange-600'}`}>
                  {isExpired ? 'EXPIRADO' : formatTime(timeLeft)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Código PIX - Melhorado e centralizado */}
        <Card className="mb-8 shadow-lg border-0 bg-white">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl text-gray-900">Código PIX</CardTitle>
            <p className="text-sm text-gray-600 mt-2">
              Copie o código e cole no seu app bancário
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-xl border-2 border-dashed border-gray-300">
                <div className="text-center mb-3">
                  <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">CÓDIGO PIX</p>
                </div>
                <div className="bg-white p-3 rounded-lg border break-all text-sm font-mono text-center shadow-sm">
                  {pixData.pixPayment.pixCopyPaste}
                </div>
              </div>
              
              <Button 
                onClick={() => copyToClipboard(pixData.pixPayment.pixCopyPaste)}
                className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 py-3 text-lg font-semibold shadow-lg"
                size="lg"
              >
                <Copy className="h-5 w-5 mr-2" />
                Copiar Código PIX
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Resumo do Pedido */}
        <Card className="mb-8 shadow-lg border-0 bg-white">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl text-gray-900">Resumo do Pedido</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                {pixData.items?.map((item: any, index: number) => (
                  <div key={index} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0">
                    <div className="flex-1">
                      <span className="text-gray-900 font-medium">{item.productName}</span>
                      <span className="text-gray-500 text-sm ml-2">x{item.quantity}</span>
                    </div>
                    <span className="font-semibold text-green-700">
                      R$ {(parseFloat(item.priceAtTime) * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
              
              <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900">Total</span>
                  <span className="text-2xl font-bold text-green-700">
                    R$ {parseFloat(pixData.totalAmount).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Botão de verificar pagamento */}
        <div className="text-center mb-8">
          <Button
            onClick={checkPaymentStatus}
            disabled={isCheckingPayment || isExpired}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 py-3 text-lg font-semibold shadow-lg"
            size="lg"
          >
            {isCheckingPayment ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                Verificando Pagamento...
              </div>
            ) : (
              'Verificar Pagamento'
            )}
          </Button>
          <p className="text-xs text-gray-500 mt-2">
            O pagamento é verificado automaticamente a cada 10 segundos
          </p>
        </div>

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