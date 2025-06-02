import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, CreditCard, Smartphone, CheckCircle, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLanguage } from "@/hooks/useLanguage";

export default function CustomerPayment() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [paymentMethod, setPaymentMethod] = useState("pix");
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [orderData, setOrderData] = useState<any>(null);
  
  // Dados do cartão
  const [cardData, setCardData] = useState({
    number: "",
    name: "",
    expiry: "",
    cvv: ""
  });

  // Carregar dados do pedido
  useEffect(() => {
    const savedOrderData = localStorage.getItem('orderData');
    if (savedOrderData) {
      setOrderData(JSON.parse(savedOrderData));
    } else {
      // Se não há dados do pedido, voltar para o carrinho
      navigate("/customer/cart");
    }
  }, [navigate]);

  // Processar pagamento e criar pedido
  const processPaymentMutation = useMutation({
    mutationFn: async (data: { method: string; cardData?: any }) => {
      // Criar o pedido primeiro
      const response = await fetch("/api/public/orders", {
        method: "POST",
        body: JSON.stringify(orderData),
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const order = await response.json();
      
      // Se é PIX, redirecionar para página PIX
      if (data.method === 'pix') {
        console.log('PIX payment detected, saving order data and redirecting...');
        console.log('Order ID:', order.id);
        
        // Salvar dados do pedido para a página PIX
        const orderDataForPix = {
          id: order.id,
          customerName: orderData.customerName,
          customerEmail: orderData.customerEmail,
          customerPhone: orderData.customerPhone,
          totalAmount: orderData.totalAmount,
          items: orderData.items.map((item: any) => ({
            productName: item.productName,
            quantity: item.quantity,
            priceAtTime: item.priceAtTime
          }))
        };
        
        localStorage.setItem(`order_${order.id}`, JSON.stringify(orderDataForPix));
        console.log('Order data saved to localStorage:', orderDataForPix);
        
        // Redirecionar para página PIX
        console.log('Redirecting to PIX page:', `/customer/pix-payment/${order.id}`);
        navigate(`/customer/pix-payment/${order.id}`);
        return { success: true, order, redirect: 'pix' };
      }
      
      return { success: true, order, transactionId: Math.random().toString(36).substr(2, 9) };
    },
    onSuccess: (result) => {
      // Se é PIX, não fazer nada aqui (redirecionamento já foi feito)
      if (result.redirect === 'pix') {
        return;
      }
      
      setPaymentSuccess(true);
      
      // Invalidar cache dos produtos para mostrar estoque atualizado
      queryClient.invalidateQueries({ queryKey: ["/api/public/products"] });
      
      // Limpar carrinho e dados do pedido
      localStorage.removeItem('cart');
      localStorage.removeItem('orderData');
      
      toast({
        title: "Pagamento aprovado!",
        description: "Seu pedido foi confirmado com sucesso.",
      });
      
      // Redirecionar após 3 segundos
      setTimeout(() => {
        navigate("/customer");
      }, 3000);
    },
    onError: () => {
      setIsProcessing(false);
      toast({
        title: t('payment.paymentError'),
        description: t('payment.tryAgain'),
        variant: "destructive",
      });
    },
  });

  const handlePayment = () => {
    if (paymentMethod === "card") {
      if (!cardData.number || !cardData.name || !cardData.expiry || !cardData.cvv) {
        toast({
          title: t('payment.incompleteData'),
          description: t('payment.fillAllFields'),
          variant: "destructive",
        });
        return;
      }
    }

    console.log('Starting payment process with method:', paymentMethod);
    setIsProcessing(true);
    processPaymentMutation.mutate({
      method: paymentMethod,
      cardData: paymentMethod === "card" ? cardData : undefined
    });
  };

  // Formatar número do cartão
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

  // Formatar data de expiração
  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
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
              <p className="text-sm text-gray-500">Redirecionando...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center">
          <Link href="/customer/cart">
            <ArrowLeft className="h-6 w-6 text-gray-600" />
          </Link>
          <div className="ml-4">
            <h1 className="text-lg font-semibold">{t('payment.title')}</h1>
            <p className="text-sm text-green-600 font-medium">Supermercado Silva</p>
            <p className="text-xs text-gray-500">Rua das Flores, 123 - Centro</p>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-4">
        {/* Resumo do pedido */}
        {orderData && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('payment.orderSummary')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between text-sm mb-2">
                <span>{t('payment.subtotal')}</span>
                <span>R$ {(parseFloat(orderData.totalAmount) - (orderData.fulfillmentMethod === "delivery" ? 5 : 0)).toFixed(2).replace('.', ',')}</span>
              </div>
              {orderData.fulfillmentMethod === "delivery" && (
                <div className="flex justify-between text-sm mb-2">
                  <span>Taxa de entrega</span>
                  <span>R$ 5,00</span>
                </div>
              )}
              <div className="border-t pt-2 flex justify-between font-semibold">
                <span>{t('payment.total')}</span>
                <span className="text-green-600">R$ {parseFloat(orderData.totalAmount).toFixed(2).replace('.', ',')}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Método de pagamento */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t('payment.paymentMethod')}</CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
              <div className="flex items-center space-x-2 p-3 border rounded-lg">
                <RadioGroupItem value="pix" id="pix" />
                <Label htmlFor="pix" className="flex items-center cursor-pointer flex-1">
                  <Smartphone className="h-5 w-5 text-blue-600 mr-2" />
                  <div>
                    <p className="font-medium">{t('payment.pix')}</p>
                    <p className="text-sm text-gray-600">{t('payment.pixDescription')}</p>
                  </div>
                </Label>
              </div>
              
              <div className="flex items-center space-x-2 p-3 border rounded-lg">
                <RadioGroupItem value="card" id="card" />
                <Label htmlFor="card" className="flex items-center cursor-pointer flex-1">
                  <CreditCard className="h-5 w-5 text-green-600 mr-2" />
                  <div>
                    <p className="font-medium">{t('payment.card')}</p>
                    <p className="text-sm text-gray-600">{t('payment.cardDescription')}</p>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* PIX */}
        {paymentMethod === "pix" && (
          <Card>
            <CardContent className="p-6">
              <div className="text-center mb-4">
                <Smartphone className="h-12 w-12 text-blue-600 mx-auto mb-2" />
                <h3 className="font-semibold mb-1">{t('payment.pixTitle')}</h3>
                <p className="text-sm text-gray-600">
                  {t('payment.pixInstructions')}
                </p>
              </div>
              
              <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-4 mb-4">
                <Label className="text-sm font-medium text-gray-700 mb-2 block">
                  {t('payment.pixCodeLabel')}
                </Label>
                <div className="bg-white border rounded p-3 mb-3">
                  <p className="text-sm text-gray-600 mb-2">
                    Processando pagamento PIX...
                  </p>
                  <p className="text-xs text-gray-500">
                    Você será redirecionado para a página de pagamento PIX após confirmar o pedido.
                  </p>
                </div>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center text-sm text-gray-500 mb-2">
                  <Lock className="h-4 w-4 mr-1" />
                  {t('payment.securePayment')}
                </div>
                <p className="text-xs text-gray-600">
                  {t('payment.paymentConfirmation')}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Dados do cartão */}
        {paymentMethod === "card" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('payment.cardDetails')}</CardTitle>
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

              <div className="flex items-center justify-center text-sm text-gray-500">
                <Lock className="h-4 w-4 mr-1" />
                {t('payment.securePayment')}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Botão de pagamento */}
        <Button
          onClick={handlePayment}
          disabled={isProcessing}
          className="w-full bg-green-600 hover:bg-green-700 h-12 text-lg"
        >
          {isProcessing ? (
            <div className="flex items-center">
              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
              {t('payment.processing')}
            </div>
          ) : (
            `${t('payment.completePayment')} - R$ ${orderData ? parseFloat(orderData.totalAmount).toFixed(2).replace('.', ',') : '0,00'}`
          )}
        </Button>

        <p className="text-xs text-gray-500 text-center">
          Ao finalizar o pagamento, você concorda com nossos termos de uso.
        </p>
      </div>
    </div>
  );
}