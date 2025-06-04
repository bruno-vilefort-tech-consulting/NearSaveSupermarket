import { useEffect, useState } from 'react';
import { useLocation, useRoute, Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Copy, CheckCircle, Clock, X, ArrowLeft } from 'lucide-react';

export default function PixPaymentFixed() {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute('/customer/pix-payment/:orderId');
  const [orderData, setOrderData] = useState<any>(null);
  const [pixData, setPixData] = useState<any>(null);
  const [paymentStatus, setPaymentStatus] = useState<string>('awaiting_payment');
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutos em segundos
  const [isExpired, setIsExpired] = useState(false);
  const { toast } = useToast();

  const orderId = params?.orderId;

  useEffect(() => {
    if (!orderId) {
      setLocation('/customer/home');
      return;
    }

    // Carregar dados do PIX do localStorage
    const savedPixData = localStorage.getItem('pixPaymentData');
    if (savedPixData) {
      const data = JSON.parse(savedPixData);
      if (data.orderId === parseInt(orderId)) {
        setPixData(data.pixPayment);
        setOrderData(data.customerData);
        
        // Calcular tempo restante baseado na data de expiração
        const expirationTime = new Date(data.expirationDate).getTime();
        const now = new Date().getTime();
        const remainingTime = Math.max(0, Math.floor((expirationTime - now) / 1000));
        
        setTimeLeft(remainingTime);
        setIsExpired(remainingTime <= 0);
        
        console.log('PIX data loaded:', data);
      } else {
        // Se não tem dados do PIX no localStorage, buscar do servidor
        checkOrderStatus();
      }
    } else {
      // Se não tem dados do PIX no localStorage, buscar do servidor
      checkOrderStatus();
    }
  }, [orderId, setLocation]);

  // Timer para expiração do PIX
  useEffect(() => {
    if (!pixData || isExpired || paymentStatus === 'payment_confirmed') return;

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        const newTime = prev - 1;
        if (newTime <= 0) {
          setIsExpired(true);
          toast({
            title: "PIX Expirado",
            description: "O código PIX expirou. Volte ao carrinho para gerar um novo.",
            variant: "destructive",
          });
          setTimeout(() => {
            setLocation('/customer/home');
          }, 3000);
          return 0;
        }
        return newTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [pixData, isExpired, paymentStatus, toast, setLocation]);

  // Verificação automática do pagamento a cada 10 segundos
  useEffect(() => {
    if (!orderId || isExpired || paymentStatus === 'payment_confirmed') return;

    const checkInterval = setInterval(() => {
      checkOrderStatus();
    }, 10000); // 10 segundos

    return () => clearInterval(checkInterval);
  }, [orderId, isExpired, paymentStatus]);

  // Verificar status do pedido e pagamento
  const checkOrderStatus = async () => {
    if (!orderId || isCheckingPayment || paymentStatus === 'payment_confirmed') return;

    console.log('🔍 Checking order status for:', orderId);
    setIsCheckingPayment(true);
    
    try {
      const response = await fetch(`/api/orders/${orderId}/payment-status`);
      
      if (!response.ok) {
        throw new Error('Erro ao verificar status');
      }

      const result = await response.json();
      console.log('Order status response:', result);

      if (result.status === 'confirmed') {
        // Pagamento confirmado
        setPaymentStatus('payment_confirmed');
        
        // Limpar dados temporários do PIX
        localStorage.removeItem('pixPaymentData');
        
        toast({
          title: "Pagamento Confirmado!",
          description: "Seu pedido foi processado com sucesso.",
        });

        // Redirecionar para a página de pedidos após 2 segundos
        setTimeout(() => {
          setLocation('/customer/orders');
        }, 2000);
        
      } else if (result.status === 'expired') {
        // PIX expirado
        setPaymentStatus('payment_failed');
        setIsExpired(true);
        console.log('❌ PIX expired');
        toast({
          title: "PIX Expirado",
          description: "O código PIX expirou. Volte ao carrinho para gerar um novo.",
          variant: "destructive",
        });
        
      } else if (result.pixCopyPaste && !pixData) {
        // Carregar dados do PIX do servidor se não estiverem no localStorage
        setPixData({
          pixCopyPaste: result.pixCopyPaste,
          id: orderId
        });
        
        if (result.expirationDate) {
          const expirationTime = new Date(result.expirationDate).getTime();
          const now = new Date().getTime();
          const remainingTime = Math.max(0, Math.floor((expirationTime - now) / 1000));
          setTimeLeft(remainingTime);
          setIsExpired(remainingTime <= 0);
        }
      }
    } catch (error) {
      console.error('Erro ao verificar status do pedido:', error);
    } finally {
      setIsCheckingPayment(false);
    }
  };

  const handleCopyPix = () => {
    if (pixData?.pixCopyPaste) {
      navigator.clipboard.writeText(pixData.pixCopyPaste);
      toast({
        title: "PIX Copiado!",
        description: "O código PIX foi copiado para a área de transferência.",
      });
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleGoBack = () => {
    // Limpar dados do PIX ao voltar
    localStorage.removeItem('pixPaymentData');
    setLocation('/customer/home');
  };

  // Tela de carregamento enquanto busca dados
  if (!pixData && !isExpired) {
    return (
      <div className="min-h-screen bg-eco-gray-light flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-eco-blue mx-auto mb-4"></div>
          <p className="text-eco-gray">Carregando dados do pagamento...</p>
        </div>
      </div>
    );
  }

  // Status de pagamento confirmado
  if (paymentStatus === 'payment_confirmed') {
    return (
      <div className="min-h-screen bg-eco-gray-light">
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-md mx-auto px-4 py-4 flex items-center">
            <Link href="/customer/orders">
              <ArrowLeft className="h-6 w-6 text-eco-gray" />
            </Link>
            <h1 className="ml-4 text-lg font-bold text-eco-gray-dark">Pagamento Confirmado</h1>
          </div>
        </div>

        <div className="max-w-md mx-auto p-4">
          <Card className="border-eco-green bg-green-50">
            <CardContent className="text-center py-8">
              <CheckCircle className="h-16 w-16 text-eco-green mx-auto mb-4" />
              <h2 className="text-xl font-bold text-eco-gray-dark mb-2">Pagamento Confirmado!</h2>
              <p className="text-eco-gray">Seu pedido foi processado com sucesso.</p>
              <p className="text-sm text-eco-gray mt-2">Redirecionando para seus pedidos...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // PIX expirado
  if (isExpired) {
    return (
      <div className="min-h-screen bg-eco-gray-light">
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-md mx-auto px-4 py-4 flex items-center">
            <button onClick={handleGoBack} className="p-1">
              <ArrowLeft className="h-6 w-6 text-eco-gray" />
            </button>
            <h1 className="ml-4 text-lg font-bold text-eco-gray-dark">PIX Expirado</h1>
          </div>
        </div>

        <div className="max-w-md mx-auto p-4">
          <Card className="border-red-300 bg-red-50">
            <CardContent className="text-center py-8">
              <X className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-eco-gray-dark mb-2">PIX Expirado</h2>
              <p className="text-eco-gray mb-4">O tempo para pagamento expirou.</p>
              <Button 
                onClick={handleGoBack}
                className="bg-eco-green hover:bg-eco-green/90 text-white"
              >
                Voltar ao Início
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-eco-gray-light">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center">
          <button onClick={handleGoBack} className="p-1">
            <ArrowLeft className="h-6 w-6 text-eco-gray" />
          </button>
          <h1 className="ml-4 text-lg font-bold text-eco-gray-dark">Pagamento PIX</h1>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-4">
        {/* Timer */}
        <Card className="border-eco-orange bg-orange-50">
          <CardContent className="flex items-center justify-center py-4">
            <Clock className="h-5 w-5 text-eco-orange mr-2" />
            <span className="text-lg font-bold text-eco-orange">
              Tempo restante: {formatTime(timeLeft)}
            </span>
          </CardContent>
        </Card>

        {/* Instruções */}
        <Card>
          <CardHeader>
            <CardTitle className="text-eco-blue">Como pagar com PIX</CardTitle>
            <CardDescription>
              Siga os passos abaixo para finalizar seu pagamento
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-eco-blue text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
              <p className="text-sm text-eco-gray-dark">Abra o app do seu banco</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-eco-blue text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
              <p className="text-sm text-eco-gray-dark">Escolha a opção PIX</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-eco-blue text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
              <p className="text-sm text-eco-gray-dark">Cole o código PIX abaixo</p>
            </div>
          </CardContent>
        </Card>

        {/* Código PIX */}
        <Card>
          <CardHeader>
            <CardTitle className="text-eco-green">Código PIX</CardTitle>
            <CardDescription>
              Pedido #{orderId} - {orderData?.customerName}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-eco-gray-light p-3 rounded-lg mb-4">
              <p className="text-xs text-eco-gray break-all font-mono">
                {pixData?.pixCopyPaste}
              </p>
            </div>
            <Button 
              onClick={handleCopyPix}
              className="w-full bg-eco-green hover:bg-eco-green/90 text-white"
            >
              <Copy className="h-4 w-4 mr-2" />
              Copiar Código PIX
            </Button>
          </CardContent>
        </Card>

        {/* Status */}
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-eco-gray">Status do pagamento:</span>
              <div className="flex items-center">
                {isCheckingPayment && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-eco-blue mr-2"></div>
                )}
                <span className="text-sm font-medium text-eco-orange">
                  {paymentStatus === 'awaiting_payment' ? 'Aguardando pagamento' : paymentStatus}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Valor */}
        {orderData?.totalAmount && (
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-eco-gray">Valor total:</span>
                <span className="text-lg font-bold text-eco-green">
                  R$ {parseFloat(orderData.totalAmount).toFixed(2)}
                </span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}