import { useEffect, useState } from 'react';
import { useLocation, useRoute, Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Copy, CheckCircle, Clock, X, ArrowLeft, ExternalLink } from 'lucide-react';

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
      setLocation('/customer/orders');
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
        

      } else {
        checkOrderStatus();
      }
    } else {
      checkOrderStatus();
    }
  }, [orderId]);

  // Timer countdown
  useEffect(() => {
    if (timeLeft > 0 && !isExpired && paymentStatus === 'awaiting_payment') {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !isExpired && paymentStatus === 'awaiting_payment') {
      // Tempo expirou - marcar como expirado e atualizar status
      setIsExpired(true);
      markPaymentAsExpired();
    }
  }, [timeLeft, isExpired, paymentStatus]);

  // Verificação automática do status do pagamento
  useEffect(() => {
    if (paymentStatus === 'awaiting_payment' && !isExpired) {
      const interval = setInterval(() => {
        checkOrderStatus();
      }, 10000); // Verificar a cada 10 segundos

      return () => clearInterval(interval);
    }
  }, [paymentStatus, isExpired, orderId]);

  const markPaymentAsExpired = async () => {
    try {
      // Chamar API para marcar o pagamento como expirado
      const response = await fetch(`/api/orders/${orderId}/expire-payment`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setPaymentStatus('payment_expired');
        toast({
          title: "PIX Expirado",
          description: "O tempo para pagamento expirou. Status atualizado para 'Pagamento não confirmado'.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Erro ao marcar pagamento como expirado:', error);
    }
  };

  const checkOrderStatus = async () => {
    if (!orderId || isCheckingPayment) return;
    
    setIsCheckingPayment(true);
    console.log('🔍 Checking order status for:', orderId);
    
    try {
      const response = await fetch(`/api/orders/${orderId}/payment-status`);
      
      if (!response.ok) {
        throw new Error('Erro ao verificar status');
      }

      const result = await response.json();
      console.log('Order status response:', result);

      if (result.status === 'confirmed' || result.status === 'payment_confirmed') {
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
        
      } else if (result.status === 'expired' || result.status === 'payment_expired') {
        // PIX expirado
        setPaymentStatus('payment_expired');
        setIsExpired(true);
        console.log('❌ PIX expired');
        
      } else if (result.pixCopyPaste) {
        // Carregar dados do PIX do servidor
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

  const getStatusInPortuguese = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'awaiting_payment': 'Aguardando Pagamento',
      'payment_confirmed': 'Pagamento Confirmado',
      'payment_failed': 'Pagamento Falhou',
      'payment_expired': 'Pagamento não confirmado',
      'pending': 'Pendente',
      'completed': 'Concluído',
      'shipped': 'Enviado',
      'picked_up': 'Retirado'
    };
    return statusMap[status] || status;
  };

  const handleGoBack = () => {
    // Limpar dados do PIX ao voltar e ir para pedidos
    localStorage.removeItem('pixPaymentData');
    setLocation('/customer/orders');
  };



  // Tela de carregamento enquanto busca dados
  if (!pixData && !isExpired && paymentStatus === 'awaiting_payment') {
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
            <button onClick={handleGoBack}>
              <ArrowLeft className="h-6 w-6 text-eco-gray" />
            </button>
            <h1 className="ml-4 text-lg font-bold text-eco-gray-dark">Pagamento Confirmado</h1>
          </div>
        </div>

        <div className="max-w-md mx-auto p-4">
          <Card className="bg-white border-eco-green-light">
            <CardContent className="p-6 text-center">
              <CheckCircle className="h-16 w-16 text-eco-green mx-auto mb-4" />
              <h2 className="text-xl font-bold text-eco-green mb-2">Pagamento Confirmado!</h2>
              <p className="text-eco-gray-dark mb-4">
                Seu pedido #{orderId} foi processado com sucesso.
              </p>
              <p className="text-sm text-eco-gray">
                Redirecionando para seus pedidos...
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Status de pagamento expirado
  if (isExpired || paymentStatus === 'payment_expired') {
    return (
      <div className="min-h-screen bg-eco-gray-light">
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-md mx-auto px-4 py-4 flex items-center">
            <button onClick={handleGoBack}>
              <ArrowLeft className="h-6 w-6 text-eco-gray" />
            </button>
            <h1 className="ml-4 text-lg font-bold text-eco-gray-dark">PIX Expirado</h1>
          </div>
        </div>

        <div className="max-w-md mx-auto p-4">
          <Card className="bg-white border-eco-orange-light">
            <CardContent className="p-6 text-center">
              <X className="h-16 w-16 text-eco-orange mx-auto mb-4" />
              <h2 className="text-xl font-bold text-eco-orange mb-2">Pagamento não confirmado</h2>
              <p className="text-eco-gray-dark mb-4">
                O tempo para pagamento do pedido #{orderId} expirou.
              </p>
              <p className="text-sm text-eco-gray mb-6">
                Status: {getStatusInPortuguese(paymentStatus)}
              </p>
              <Button 
                onClick={handleGoBack}
                className="w-full bg-eco-blue hover:bg-eco-blue-dark text-white"
              >
                Ver Meus Pedidos
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
          <button onClick={handleGoBack}>
            <ArrowLeft className="h-6 w-6 text-eco-gray" />
          </button>
          <h1 className="ml-4 text-lg font-bold text-eco-gray-dark">Pagamento PIX</h1>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-4">
        
        {/* Status do Pedido */}
        <Card className="bg-white border-eco-blue-light">
          <CardHeader className="pb-3">
            <CardTitle className="text-eco-blue text-sm">Status do Pedido #{orderId}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-eco-orange rounded-full animate-pulse"></div>
              <span className="font-medium text-eco-gray-dark">
                {getStatusInPortuguese(paymentStatus)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Timer destacado com melhor visibilidade */}
        <div className="bg-orange-500 rounded-lg p-6 text-center shadow-lg">
          <Clock className="h-8 w-8 text-white mx-auto mb-2" />
          <h3 className="text-white font-bold text-lg mb-1">Tempo Restante</h3>
          <div className="text-3xl font-bold text-white mb-2">
            {timeLeft > 0 ? formatTime(timeLeft) : "00:00"}
          </div>
          <p className="text-white/90 text-sm">
            Complete o pagamento antes que o tempo expire
          </p>
        </div>



        {/* Código Copia e Cola destacado */}
        <Card className="bg-white border-eco-blue-light">
          <CardHeader className="pb-3">
            <CardTitle className="text-eco-blue flex items-center gap-2">
              <ExternalLink className="h-4 w-4" />
              Código Copia e Cola PIX
            </CardTitle>
            <CardDescription>
              Copie o código abaixo e cole no seu app bancário
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-eco-gray-light p-4 rounded-lg border-2 border-dashed border-eco-blue-light">
              <p className="text-xs font-mono text-eco-gray-dark break-all leading-relaxed">
                {pixData?.pixCopyPaste}
              </p>
            </div>
            
            <Button 
              onClick={handleCopyPix}
              className="w-full bg-eco-blue hover:bg-eco-blue-dark text-white font-semibold h-12 rounded-xl transition-colors flex items-center gap-2"
            >
              <Copy className="h-4 w-4" />
              Copiar Código PIX
            </Button>

            <div className="flex items-center gap-2 text-sm text-eco-gray">
              <ExternalLink className="h-3 w-3" />
              <span>Cole este código no seu aplicativo bancário</span>
            </div>
          </CardContent>
        </Card>

        {/* Informações do Pedido */}
        {orderData && (
          <Card className="bg-white border-eco-green-light">
            <CardHeader className="pb-3">
              <CardTitle className="text-eco-green">Informações do Pedido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-eco-gray">Cliente:</span>
                <span className="text-eco-gray-dark font-medium">{orderData.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-eco-gray">Total:</span>
                <span className="text-eco-green font-bold">
                  R$ {parseFloat(orderData.totalAmount).toFixed(2).replace('.', ',')}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Status de verificação */}
        {isCheckingPayment && (
          <Card className="bg-eco-blue-light border-eco-blue">
            <CardContent className="p-4 text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-eco-blue mx-auto mb-2"></div>
              <p className="text-eco-blue text-sm">Verificando status do pagamento...</p>
            </CardContent>
          </Card>
        )}

        <div className="text-center text-xs text-eco-gray mt-6">
          <p>O pagamento será confirmado automaticamente após a transação PIX</p>
        </div>
      </div>
    </div>
  );
}