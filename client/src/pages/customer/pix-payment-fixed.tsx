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
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [orderCompleted, setOrderCompleted] = useState(false);
  const { toast } = useToast();

  const tempOrderId = params?.tempOrderId;

  useEffect(() => {
    if (!tempOrderId) {
      setLocation('/customer/home');
      return;
    }

    // Verificar se o pedido já foi completado
    const completedOrders = JSON.parse(localStorage.getItem('completedOrders') || '[]');
    if (completedOrders.includes(tempOrderId)) {
      console.log('Order already completed:', tempOrderId);
      setOrderCompleted(true);
      setPaymentStatus('approved');
      toast({
        title: "Pedido Já Processado",
        description: "Este pedido já foi confirmado anteriormente.",
      });
      setTimeout(() => {
        setLocation('/customer/orders');
      }, 2000);
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
  }, [tempOrderId, setLocation, toast]);

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
    if (!pixData?.pixPayment?.id || isProcessingPayment || paymentStatus === 'approved' || orderCompleted) return;

    console.log('🔍 Checking payment status for:', pixData.pixPayment.id);
    setIsCheckingPayment(true);
    
    try {
      const response = await apiRequest("GET", `/api/payments/pix/status/${pixData.pixPayment.id}`);
      
      if (!response.ok) {
        console.warn(`⚠️ Payment status check failed: HTTP ${response.status}`);
        return; // Continue verificando em vez de abortar
      }
      
      const status = await response.json();
      console.log('✅ Payment status received:', status);
      
      if (status.status === 'approved' && !isProcessingPayment && !orderCompleted) {
        console.log('💳 Payment approved! Starting confirmation process...');
        setIsProcessingPayment(true);
        
        try {
          console.log('📤 Sending confirmation request with data:', {
            tempOrderId: pixData.tempOrderId,
            pixPaymentId: pixData.pixPayment.id,
            customerEmail: pixData.customerEmail
          });
          
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
          
          if (!confirmResponse.ok) {
            const errorText = await confirmResponse.text();
            console.error('❌ Confirmation failed:', confirmResponse.status, errorText);
            throw new Error(`Confirmation failed: ${confirmResponse.status} - ${errorText}`);
          }
          
          const result = await confirmResponse.json();
          console.log('✅ Order confirmation successful:', result);
          
          // Marcar pedido como completado no localStorage
          const completedOrders = JSON.parse(localStorage.getItem('completedOrders') || '[]');
          if (!completedOrders.includes(pixData.tempOrderId)) {
            completedOrders.push(pixData.tempOrderId);
            localStorage.setItem('completedOrders', JSON.stringify(completedOrders));
          }
          
          setPaymentStatus('approved');
          setOrderCompleted(true);
          
          toast({
            title: "Pagamento Identificado!",
            description: `Seu pedido #${result.order?.id || 'N/A'} foi confirmado e enviado ao supermercado`,
          });
          
          console.log('🧹 Cleaning up localStorage...');
          // Limpar dados temporários
          localStorage.removeItem('pixData');
          localStorage.removeItem('orderData');
          localStorage.removeItem('cart');
          
          // Redirecionar para pedidos após 2 segundos
          console.log('🔄 Redirecting to orders page...');
          setTimeout(() => {
            try {
              setLocation('/customer/orders');
            } catch (navError) {
              console.error('❌ Navigation error:', navError);
              window.location.href = '/customer/orders';
            }
          }, 2000);
          
        } catch (confirmError) {
          console.error('❌ Error during confirmation:', confirmError);
          setIsProcessingPayment(false);
          
          try {
            // Se o erro for de pedido já existente, redirecionar para pedidos
            const errorMessage = confirmError instanceof Error ? confirmError.message : String(confirmError);
            if (errorMessage.includes('já existe') || errorMessage.includes('already exists')) {
              console.log('✅ Order already exists, redirecting to orders...');
              setTimeout(() => {
                try {
                  setLocation('/customer/orders');
                } catch (navError) {
                  console.error('❌ Navigation error:', navError);
                  window.location.href = '/customer/orders';
                }
              }, 1500);
              toast({
                title: "Pedido Já Processado",
                description: "Seu pedido já foi confirmado anteriormente",
              });
            } else {
              // Para outros erros, tentar redirecionar também mas mostrar erro
              toast({
                title: "Erro ao Confirmar Pagamento",
                description: errorMessage || "Erro desconhecido ao confirmar pagamento",
                variant: "destructive",
              });
              
              // Redirecionar após 3 segundos mesmo com erro
              setTimeout(() => {
                try {
                  setLocation('/customer/orders');
                } catch (navError) {
                  console.error('❌ Navigation error:', navError);
                  window.location.href = '/customer/orders';
                }
              }, 3000);
            }
          } catch (handlingError) {
            console.error('❌ Error handling confirmation error:', handlingError);
            // Fallback: forçar redirecionamento
            window.location.href = '/customer/orders';
          }
        }
      } else if (status.status === 'rejected' || status.status === 'cancelled') {
        console.log('❌ Payment rejected/cancelled:', status.status);
        setPaymentStatus('rejected');
      } else {
        console.log('⏳ Payment still pending:', status.status);
        setPaymentStatus(status.status);
      }
    } catch (statusError) {
      console.error('❌ Error checking payment status:', statusError);
      
      // Se for erro de rede, apenas log sem mostrar toast repetitivo
      if (statusError instanceof TypeError && statusError.message.includes('fetch')) {
        console.log('🔄 Network error, will retry on next interval...');
      } else {
        // Outros erros mostrar toast
        toast({
          title: "Erro de Conexão",
          description: "Erro ao verificar status do pagamento. Tentando novamente...",
          variant: "destructive",
        });
      }
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
      <div className="min-h-screen bg-eco-gray-light flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-eco-green border-t-transparent rounded-full" />
      </div>
    );
  }

  if (paymentStatus === 'approved') {
    return (
      <div className="min-h-screen bg-eco-gray-light flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-eco-green-light">
          <CardContent className="text-center py-8">
            <CheckCircle className="h-16 w-16 text-eco-green mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-eco-green mb-2">Pagamento Aprovado!</h2>
            <p className="text-eco-gray-dark mb-4">Seu pedido foi confirmado e enviado ao supermercado.</p>
            <p className="text-sm text-eco-gray">Redirecionando para seus pedidos...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-eco-gray-light p-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center justify-center mb-8 relative">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setLocation('/customer/cart')}
            className="absolute left-0 top-1/2 -translate-y-1/2 text-eco-gray hover:text-eco-gray-dark"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="text-center">
            <h1 className="text-3xl font-bold text-eco-gray-dark mb-2">Pagamento PIX</h1>
            <p className="text-sm text-eco-gray">Finalize seu pagamento em instantes</p>
          </div>
        </div>

        {/* Status Card - Centralizado e destacado */}
        <Card className="mb-8 shadow-lg border border-eco-orange-light bg-white">
          <CardContent className="pt-6">
            <div className="text-center mb-6">
              <div className="mx-auto w-16 h-16 bg-eco-orange-light rounded-full flex items-center justify-center mb-4">
                <Clock className="h-8 w-8 text-eco-orange" />
              </div>
              <h3 className="text-xl font-semibold text-eco-gray-dark mb-2">Aguardando Pagamento</h3>
              <p className="text-eco-gray text-sm">Efetue o pagamento antes do tempo esgotar</p>
            </div>
            
            <div className="bg-eco-orange-light p-4 rounded-lg border border-eco-orange">
              <div className="text-center">
                <p className="text-sm text-eco-gray mb-1">Tempo restante</p>
                <div className={`text-2xl font-mono font-bold ${isExpired ? 'text-red-600' : 'text-eco-orange'}`}>
                  {isExpired ? 'EXPIRADO' : formatTime(timeLeft)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Código PIX - Melhorado e centralizado */}
        <Card className="mb-8 shadow-lg border border-eco-blue-light bg-white">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl text-eco-gray-dark">Código PIX</CardTitle>
            <p className="text-sm text-eco-gray mt-2">
              Copie o código e cole no seu app bancário
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-eco-blue-light p-4 rounded-xl border-2 border-dashed border-eco-blue">
                <div className="text-center mb-3">
                  <p className="text-xs uppercase tracking-wide text-eco-blue font-semibold">CÓDIGO PIX</p>
                </div>
                <div className="bg-white p-3 rounded-lg border break-all text-sm font-mono text-center shadow-sm">
                  {pixData.pixPayment.pixCopyPaste}
                </div>
              </div>
              
              <Button 
                onClick={() => copyToClipboard(pixData.pixPayment.pixCopyPaste)}
                className="w-full bg-eco-green hover:bg-eco-green/90 py-3 text-lg font-semibold shadow-lg rounded-xl"
                size="lg"
              >
                <Copy className="h-5 w-5 mr-2" />
                Copiar Código PIX
              </Button>
            </div>
          </CardContent>
        </Card>



        {/* Botão de verificar pagamento */}
        <div className="text-center mb-8">
          <Button
            onClick={checkPaymentStatus}
            disabled={isCheckingPayment || isExpired}
            className="w-full bg-eco-blue hover:bg-eco-blue/90 py-3 text-lg font-semibold shadow-lg rounded-xl"
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
          <p className="text-xs text-eco-gray mt-2">
            O pagamento é verificado automaticamente a cada 10 segundos
          </p>
        </div>

        <div className="bg-eco-blue-light border border-eco-blue rounded-lg p-4 text-center">
          <p className="text-sm text-eco-blue font-medium mb-2">
            🔍 Verificação Automática Ativa
          </p>
          <p className="text-xs text-eco-blue">
            Após efetuar o pagamento PIX, aguarde. O sistema verificará automaticamente a cada 10 segundos. 
            Quando o pagamento for identificado, você será redirecionado automaticamente.
          </p>
        </div>
      </div>
    </div>
  );
}