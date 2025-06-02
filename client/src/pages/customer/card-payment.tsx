import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, CreditCard, Lock, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLanguage } from "@/hooks/useLanguage";

export default function CustomerCardPayment() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [orderData, setOrderData] = useState<any>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  
  // Dados do cartão
  const [cardData, setCardData] = useState({
    number: "",
    name: "",
    expiry: "",
    cvv: ""
  });

  // Carregar dados do pedido da URL
  useEffect(() => {
    console.log('Card payment page loaded');
    console.log('Current URL:', window.location.href);
    
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('order');
    const amount = urlParams.get('amount');
    
    console.log('URL params:', { orderId, amount });
    
    if (orderId && amount) {
      // Buscar dados completos do pedido do localStorage
      const savedOrderData = localStorage.getItem('orderData');
      console.log('Saved order data:', savedOrderData);
      
      if (savedOrderData) {
        const parsedData = JSON.parse(savedOrderData);
        const finalOrderData = {
          ...parsedData,
          id: orderId,
          totalAmount: amount
        };
        console.log('Setting order data:', finalOrderData);
        setOrderData(finalOrderData);
      } else {
        console.log('No saved order data found, redirecting to cart');
        navigate("/customer/cart");
      }
    } else {
      console.log('Missing URL params, redirecting to cart');
      navigate("/customer/cart");
    }
  }, [navigate]);

  // Formatação de número do cartão
  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  // Formatação de data de validade
  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  // Processar pagamento com cartão
  const processCardPaymentMutation = useMutation({
    mutationFn: async (cardDetails: any) => {
      console.log('Processing card payment with details:', {
        orderId: orderData.id,
        amount: orderData.totalAmount,
        cardData: cardDetails
      });

      const response = await apiRequest("POST", "/api/create-card-payment", {
        orderId: orderData.id,
        amount: parseFloat(orderData.totalAmount),
        cardData: cardDetails,
        customerData: {
          name: orderData.customerName,
          email: orderData.customerEmail,
          phone: orderData.customerPhone
        }
      });

      return response;
    },
    onSuccess: (result: any) => {
      console.log('Card payment result:', result);
      
      if (result.success) {
        setPaymentSuccess(true);
        
        // Invalidar cache dos produtos
        queryClient.invalidateQueries({ queryKey: ["/api/public/products"] });
        
        // Limpar carrinho e dados do pedido
        localStorage.removeItem('cart');
        localStorage.removeItem('orderData');
        
        toast({
          title: t('payment.paymentApproved'),
          description: t('payment.orderCreated'),
        });
        
        // Redirecionar após 3 segundos
        setTimeout(() => {
          navigate("/customer/orders");
        }, 3000);
      } else {
        toast({
          title: t('payment.paymentError'),
          description: result.message || t('payment.tryAgain'),
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      console.error('Card payment error:', error);
      toast({
        title: t('payment.paymentError'),
        description: error.message || t('payment.tryAgain'),
        variant: "destructive",
      });
    },
  });

  const handleCardPayment = () => {
    console.log('Card payment button clicked');
    console.log('Card data:', cardData);
    console.log('Order data:', orderData);
    
    // Validar campos do cartão
    if (!cardData.number || !cardData.name || !cardData.expiry || !cardData.cvv) {
      console.log('Card data validation failed - missing fields');
      toast({
        title: t('payment.incompleteData'),
        description: t('payment.fillAllFields'),
        variant: "destructive",
      });
      return;
    }

    // Validar formato básico
    const cleanNumber = cardData.number.replace(/\s/g, '');
    if (cleanNumber.length < 16) {
      console.log('Card number validation failed - length:', cleanNumber.length);
      toast({
        title: t('payment.incompleteData'),
        description: "Número do cartão deve ter 16 dígitos",
        variant: "destructive",
      });
      return;
    }

    if (cardData.cvv.length < 3) {
      console.log('CVV validation failed - length:', cardData.cvv.length);
      toast({
        title: t('payment.incompleteData'),
        description: "CVV deve ter 3 ou 4 dígitos",
        variant: "destructive",
      });
      return;
    }

    console.log('All validations passed, starting payment mutation');
    processCardPaymentMutation.mutate(cardData);
  };

  if (paymentSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto p-4">
          <Card className="text-center">
            <CardContent className="p-8">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">{t('payment.paymentSuccess')}</h2>
              <p className="text-gray-600 mb-4">{t('payment.orderCreated')}</p>
              <p className="text-sm text-gray-500">Redirecionando para seus pedidos...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!orderData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center">
          <Link href="/customer/payment">
            <ArrowLeft className="h-6 w-6 text-gray-600" />
          </Link>
          <div className="ml-4">
            <h1 className="text-lg font-semibold">{t('payment.cardDetails')}</h1>
            <p className="text-sm text-gray-500">Pagamento seguro por cartão</p>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-4">
        {/* Resumo do pedido */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t('payment.orderSummary')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">{t('payment.total')}</span>
                <span className="font-semibold text-lg">
                  R$ {parseFloat(orderData.totalAmount).toFixed(2).replace('.', ',')}
                </span>
              </div>
              <div className="text-sm text-gray-500">
                {orderData.items?.length || 0} itens
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dados do cartão */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <CreditCard className="h-5 w-5 mr-2" />
              {t('payment.cardDetails')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="cardNumber">{t('payment.cardNumber')}</Label>
              <Input
                id="cardNumber"
                placeholder={t('payment.cardNumberPlaceholder')}
                value={cardData.number}
                onChange={(e) => setCardData({
                  ...cardData,
                  number: formatCardNumber(e.target.value)
                })}
                maxLength={19}
              />
            </div>

            <div>
              <Label htmlFor="cardName">{t('payment.cardHolder')}</Label>
              <Input
                id="cardName"
                placeholder={t('payment.cardHolderPlaceholder')}
                value={cardData.name}
                onChange={(e) => setCardData({
                  ...cardData,
                  name: e.target.value.toUpperCase()
                })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="expiry">{t('payment.expiryDate')}</Label>
                <Input
                  id="expiry"
                  placeholder={t('payment.expiryPlaceholder')}
                  value={cardData.expiry}
                  onChange={(e) => setCardData({
                    ...cardData,
                    expiry: formatExpiry(e.target.value)
                  })}
                  maxLength={5}
                />
              </div>
              <div>
                <Label htmlFor="cvv">{t('payment.cvv')}</Label>
                <Input
                  id="cvv"
                  placeholder={t('payment.cvvPlaceholder')}
                  value={cardData.cvv}
                  onChange={(e) => setCardData({
                    ...cardData,
                    cvv: e.target.value.replace(/\D/g, '')
                  })}
                  maxLength={4}
                />
              </div>
            </div>

            <div className="flex items-center justify-center text-sm text-gray-500 pt-2">
              <Lock className="h-4 w-4 mr-1" />
              {t('payment.securePayment')}
            </div>
          </CardContent>
        </Card>

        {/* Botão de pagamento */}
        <Button
          onClick={handleCardPayment}
          disabled={processCardPaymentMutation.isPending}
          className="w-full bg-green-600 hover:bg-green-700 h-12 text-lg"
        >
          {processCardPaymentMutation.isPending ? (
            <div className="flex items-center">
              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
              {t('payment.processing')}
            </div>
          ) : (
            `${t('payment.completePayment')} - R$ ${parseFloat(orderData.totalAmount).toFixed(2).replace('.', ',')}`
          )}
        </Button>

        <p className="text-xs text-gray-500 text-center">
          Ao finalizar o pagamento, você concorda com nossos termos de uso.
        </p>
      </div>
    </div>
  );
}