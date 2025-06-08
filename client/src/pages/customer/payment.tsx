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
  const [paymentMethod, setPaymentMethod] = useState<"pix" | "card">("pix");
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
      navigate("/cart");
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
        console.log('Redirecting to PIX page:', `/pix-payment/${order.id}`);
        navigate(`/pix-payment/${order.id}`);
        return { success: true, order, redirect: 'pix' };
      }
      
      // Se é cartão, redirecionar para página de cartão
      if (data.method === 'card') {
        console.log('Card payment detected, saving order data and redirecting...');
        console.log('Order ID:', order.id);
        
        // Salvar dados do pedido para a página de cartão
        const orderDataForCard = {
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
        
        localStorage.setItem('orderData', JSON.stringify(orderDataForCard));
        console.log('Order data saved to localStorage for card payment:', orderDataForCard);
        
        // Redirecionar para página de cartão
        console.log('Redirecting to card payment page:', `/card-payment?order=${order.id}&amount=${orderData.totalAmount}`);
        navigate(`/card-payment?order=${order.id}&amount=${orderData.totalAmount}`);
        return { success: true, order, redirect: 'card' };
      }
      
      return { success: true, order, transactionId: Math.random().toString(36).substr(2, 9) };
    },
    onSuccess: (result) => {
      // Se é PIX ou cartão, não fazer nada aqui (redirecionamento já foi feito)
      if (result.redirect === 'pix' || result.redirect === 'card') {
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
      <div className="min-h-screen bg-eco-gray-light flex items-center justify-center">
        <div className="max-w-md mx-auto p-4">
          <Card className="text-center border-eco-green-light">
            <CardContent className="p-8">
              <CheckCircle className="h-16 w-16 text-eco-green mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2 text-eco-gray-dark">{t('payment.paymentSuccess')}</h2>
              <p className="text-eco-gray mb-4">{t('payment.orderCreated')}</p>
              <p className="text-sm text-eco-gray">Redirecionando...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-eco-gray-light">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center">
          <Link href="/cart">
            <ArrowLeft className="h-6 w-6 text-eco-gray" />
          </Link>
          <div className="ml-4">
            <h1 className="text-lg font-semibold text-eco-gray-dark">{t('payment.title')}</h1>
            <p className="text-sm text-eco-green font-medium">Supermercado Silva</p>
            <p className="text-xs text-eco-gray">Rua das Flores, 123 - Centro</p>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-4">
        {/* Resumo do pedido */}
        {orderData && (
          <Card className="border-eco-green-light">
            <CardHeader>
              <CardTitle className="text-lg text-eco-gray-dark">{t('payment.orderSummary')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-eco-gray-dark">{t('payment.subtotal')}</span>
                <span className="text-eco-gray-dark">R$ {(parseFloat(orderData.totalAmount) - (orderData.fulfillmentMethod === "delivery" ? 5 : 0)).toFixed(2).replace('.', ',')}</span>
              </div>
              {orderData.fulfillmentMethod === "delivery" && (
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-eco-gray-dark">Taxa de entrega</span>
                  <span className="text-eco-gray-dark">R$ 5,00</span>
                </div>
              )}
              <div className="border-t border-eco-green-light pt-2 flex justify-between font-semibold">
                <span className="text-eco-gray-dark">{t('payment.total')}</span>
                <span className="text-eco-green">R$ {parseFloat(orderData.totalAmount).toFixed(2).replace('.', ',')}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Método de pagamento */}
        <Card className="border-eco-blue-light">
          <CardHeader>
            <CardTitle className="text-lg text-eco-gray-dark">{t('payment.paymentMethod')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 border-2 border-eco-blue rounded-lg bg-eco-blue-light">
              <div className="flex items-center">
                <Smartphone className="h-6 w-6 text-eco-blue mr-3" />
                <div>
                  <p className="font-medium text-eco-blue-dark">{t('payment.pix')}</p>
                  <p className="text-sm text-eco-blue">{t('payment.pixDescription')}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>





        {/* Botão de pagamento */}
        <Button
          onClick={handlePayment}
          disabled={isProcessing}
          className="w-full bg-eco-green hover:bg-eco-green-dark text-white font-semibold h-12 text-lg rounded-xl transition-colors"
        >
          {isProcessing ? (
            <div className="flex items-center">
              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
              {t('payment.processing')}
            </div>
          ) : (
            `Finalizar Pagamento - R$ ${orderData ? parseFloat(orderData.totalAmount).toFixed(2).replace('.', ',') : '0,00'}`
          )}
        </Button>

        <p className="text-xs text-eco-gray text-center">
          Ao finalizar o pagamento, você concorda com nossos termos de uso.
        </p>
      </div>
    </div>
  );
}