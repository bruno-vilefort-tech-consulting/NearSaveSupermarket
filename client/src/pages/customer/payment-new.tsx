import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Smartphone, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLanguage } from "@/hooks/useLanguage";

export default function CustomerPaymentNew() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [orderData, setOrderData] = useState<any>(null);
  
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

  // Gerar PIX sem criar pedido
  const generatePixMutation = useMutation({
    mutationFn: async () => {
      console.log('Generating PIX without creating order:', orderData);
      const response = await apiRequest("POST", "/api/pix/generate", orderData);
      const result = await response.json();
      
      console.log('PIX generated successfully:', result);
      
      // Salvar dados temporários para a página PIX
      const pixData = {
        tempOrderId: result.tempOrderId,
        pixPayment: result.pixPayment,
        expiresAt: result.expiresAt,
        customerName: orderData.customerName,
        customerEmail: orderData.customerEmail,
        customerPhone: orderData.customerPhone,
        totalAmount: orderData.totalAmount,
        items: orderData.items
      };
      
      localStorage.setItem('pixData', JSON.stringify(pixData));
      console.log('PIX data saved to localStorage:', pixData);
      
      // Redirecionar para página PIX com tempOrderId
      console.log('Redirecting to PIX page:', `/pix-payment/${result.tempOrderId}`);
      navigate(`/pix-payment/${result.tempOrderId}`);
      
      return result;
    },
    onError: (error) => {
      console.error('PIX generation error:', error);
      toast({
        title: t.payment.error,
        description: t.payment.errorDescription,
        variant: "destructive",
      });
    },
  });

  const handlePayment = async () => {
    if (!orderData) {
      console.error('No order data available');
      return;
    }

    generatePixMutation.mutate();
  };

  if (!orderData) {
    return (
      <div className="min-h-screen bg-green-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-green-50 p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/cart">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-green-800">{t.payment.title}</h1>
        </div>

        {/* Resumo do pedido */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">{t.payment.orderSummary}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {orderData.items?.map((item: any, index: number) => (
              <div key={index} className="flex justify-between">
                <span>{item.productName} x{item.quantity}</span>
                <span>R$ {(parseFloat(item.priceAtTime) * item.quantity).toFixed(2)}</span>
              </div>
            ))}
            <div className="border-t pt-3 font-bold">
              <div className="flex justify-between">
                <span>{t.payment.total}</span>
                <span>R$ {parseFloat(orderData.totalAmount).toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Método de pagamento PIX */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-blue-600" />
              Pagamento PIX
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Pagamento instantâneo e seguro via PIX. Após confirmar, você receberá o código PIX para efetuar o pagamento.
            </p>
            
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
              <Lock className="h-4 w-4" />
              <span>Transação segura e criptografada</span>
            </div>
          </CardContent>
        </Card>

        {/* Dados do cliente */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">{t.payment.customerInfo}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div><strong>Nome:</strong> {orderData.customerName}</div>
            <div><strong>Email:</strong> {orderData.customerEmail}</div>
            <div><strong>Telefone:</strong> {orderData.customerPhone}</div>
          </CardContent>
        </Card>

        {/* Botão de pagamento */}
        <Button
          onClick={handlePayment}
          disabled={generatePixMutation.isPending}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
        >
          {generatePixMutation.isPending ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
              Gerando PIX...
            </div>
          ) : (
            `Pagar R$ ${parseFloat(orderData.totalAmount).toFixed(2)} via PIX`
          )}
        </Button>

        <p className="text-xs text-gray-500 text-center mt-4">
          Ao confirmar, você será redirecionado para a tela de pagamento PIX.
          O pedido só será criado após a confirmação do pagamento.
        </p>
      </div>
    </div>
  );
}