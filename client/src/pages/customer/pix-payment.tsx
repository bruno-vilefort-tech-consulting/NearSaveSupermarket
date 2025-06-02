import { useState, useEffect } from 'react';
import { useLocation, useRoute } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/useLanguage';
import { apiRequest } from '@/lib/queryClient';
import { Copy, CheckCircle, Clock, X, ArrowLeft } from 'lucide-react';

interface PixPaymentData {
  id: string;
  status: string;
  pixCopyPaste: string;
  qrCodeBase64?: string;
  expirationDate: string;
}

interface OrderData {
  id: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  totalAmount: string;
  items: Array<{
    productName: string;
    quantity: number;
    priceAtTime: string;
  }>;
}

export default function PixPayment() {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute('/customer/pix-payment/:orderId');
  const [pixData, setPixData] = useState<PixPaymentData | null>(null);
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<string>('pending');
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutos em segundos
  const [isExpired, setIsExpired] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();

  const orderId = params?.orderId;

  useEffect(() => {
    if (!orderId) {
      setLocation('/customer/home');
      return;
    }

    initializePayment();
  }, [orderId]);

  // Timer de 5 minutos
  useEffect(() => {
    if (!pixData || isExpired) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setIsExpired(true);
          toast({
            title: "Código PIX Expirado",
            description: "O tempo para pagamento expirou. Retornando ao início.",
            variant: "destructive",
          });
          setTimeout(() => setLocation('/customer/home'), 3000);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [pixData, isExpired]);

  useEffect(() => {
    if (pixData && paymentStatus === 'pending' && !isExpired) {
      const interval = setInterval(() => {
        checkPaymentStatus();
      }, 3000); // Check every 3 seconds for faster detection

      return () => clearInterval(interval);
    }
  }, [pixData, paymentStatus, isExpired]);

  const initializePayment = async () => {
    try {
      setIsLoading(true);
      
      // Get order data from localStorage (passed from cart)
      const orderDataStr = localStorage.getItem(`order_${orderId}`);
      if (!orderDataStr) {
        toast({
          title: "Erro",
          description: "Dados do pedido não encontrados",
          variant: "destructive",
        });
        setLocation('/customer/home');
        return;
      }

      const order = JSON.parse(orderDataStr);
      setOrderData(order);

      // Create PIX payment
      const response = await apiRequest('POST', '/api/payments/pix/create', {
        orderId: orderId,
        amount: parseFloat(order.totalAmount),
        description: `Pedido #${orderId} - ${order.customerName}`,
        customerEmail: order.customerEmail,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
      });

      const pixData = await response.json();
      console.log('Response from Mercado Pago API:', pixData);
      console.log('PIX code received:', pixData.pixCopyPaste);
      console.log('Payment ID received:', pixData.id);
      
      setPixData(pixData);
      setPaymentStatus(pixData.status);
    } catch (error) {
      console.error('Error creating PIX payment:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar pagamento PIX",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const checkPaymentStatus = async () => {
    if (!pixData || isCheckingPayment) return;

    try {
      setIsCheckingPayment(true);
      const response = await apiRequest('GET', `/api/payments/pix/status/${pixData.id}`);
      const statusData = await response.json();
      
      console.log('Payment status check:', statusData);
      
      if (statusData.status !== paymentStatus) {
        setPaymentStatus(statusData.status);
        
        if (statusData.status === 'approved') {
          toast({
            title: t('payment.paymentApproved'),
            description: "Seu pagamento foi confirmado!",
          });
          
          // Clean up order data
          localStorage.removeItem(`order_${orderId}`);
          localStorage.removeItem('cart');
          
          // Redirect to success page or home
          setTimeout(() => {
            setLocation('/customer/home');
          }, 2000);
        }
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
    } finally {
      setIsCheckingPayment(false);
    }
  };

  const copyPixCode = async () => {
    if (!pixData?.pixCopyPaste) return;

    try {
      await navigator.clipboard.writeText(pixData.pixCopyPaste);
      toast({
        title: t('payment.codeCopied'),
        description: "Cole no seu aplicativo bancário",
      });
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = pixData.pixCopyPaste;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      
      toast({
        title: t('payment.codeCopied'),
        description: "Cole no seu aplicativo bancário",
      });
    }
  };

  const getStatusBadge = () => {
    switch (paymentStatus) {
      case 'approved':
        return <Badge className="bg-green-500 text-white"><CheckCircle className="w-4 h-4 mr-1" />{t('payment.paymentApproved')}</Badge>;
      case 'pending':
        return <Badge variant="outline"><Clock className="w-4 h-4 mr-1" />{t('payment.paymentPending')}</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><X className="w-4 h-4 mr-1" />{t('payment.paymentRejected')}</Badge>;
      case 'expired':
        return <Badge variant="destructive"><X className="w-4 h-4 mr-1" />{t('payment.paymentExpired')}</Badge>;
      default:
        return <Badge variant="outline">{paymentStatus}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!pixData || !orderData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-gray-600">Erro ao carregar dados do pagamento</p>
            <Button 
              onClick={() => setLocation('/customer/home')} 
              className="mt-4"
              variant="outline"
            >
              Voltar ao início
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation('/customer/cart')}
            className="mr-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-2xl font-bold">{t('payment.pixTitle')}</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* PIX Payment Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {t('payment.pixPayment')}
                {getStatusBadge()}
              </CardTitle>
              {!isExpired && timeLeft > 0 && (
                <div className="flex items-center justify-center space-x-2 text-orange-600">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    Expira em: {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
                  </span>
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-4">
                  {t('payment.pixInstructions')}
                </p>
                
                <div className="bg-gray-50 p-4 rounded-lg border-2 border-dashed border-gray-300">
                  <p className="text-xs text-gray-500 mb-2">{t('payment.pixCode')}:</p>
                  <p className="text-xs font-mono bg-white p-2 rounded border break-all">
                    {pixData.pixCopyPaste}
                  </p>
                </div>

                <Button
                  onClick={copyPixCode}
                  className="w-full mt-4 bg-blue-600 hover:bg-blue-700"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  {t('payment.copyCode')}
                </Button>

                {paymentStatus === 'pending' && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      {isCheckingPayment ? t('payment.checkingPayment') : t('payment.processingPayment')}
                    </p>
                  </div>
                )}

                {paymentStatus === 'approved' && (
                  <div className="mt-4 p-3 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-800">
                      Pagamento confirmado! Redirecionando...
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Resumo do Pedido #{orderId}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="font-medium">{orderData.customerName}</p>
                <p className="text-sm text-gray-600">{orderData.customerEmail}</p>
                <p className="text-sm text-gray-600">{orderData.customerPhone}</p>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Itens:</h4>
                {orderData.items.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span>{item.quantity}x {item.productName}</span>
                    <span>R$ {item.priceAtTime}</span>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between font-bold">
                  <span>{t('payment.orderTotal')}:</span>
                  <span>R$ {orderData.totalAmount}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}