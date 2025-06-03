import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Smartphone, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function CustomerPaymentFixed() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [orderData, setOrderData] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Carregar dados do pedido
  useEffect(() => {
    const savedOrderData = localStorage.getItem('orderData');
    if (savedOrderData) {
      setOrderData(JSON.parse(savedOrderData));
    } else {
      navigate("/customer/cart");
    }
  }, [navigate]);

  const handlePayment = async () => {
    if (!orderData) {
      console.error('No order data available');
      return;
    }

    setIsProcessing(true);

    try {
      console.log('Generating PIX without creating order...');
      
      const response = await apiRequest("POST", "/api/pix/generate", orderData);
      const result = await response.json();
      
      console.log('PIX generated successfully:', result);
      
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
      
      const pixRoute = `/customer/pix-payment/${result.tempOrderId}`;
      console.log('Redirecting to PIX page:', pixRoute);
      navigate(pixRoute);
    } catch (error) {
      console.error('Error generating PIX:', error);
      toast({
        title: "Erro",
        description: "Erro ao gerar PIX. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
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
        <div className="flex items-center gap-4 mb-6">
          <Link href="/customer/cart">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-green-800">Pagamento</h1>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Resumo do Pedido</CardTitle>
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
                <span>Total</span>
                <span>R$ {parseFloat(orderData.totalAmount).toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

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

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Dados do Cliente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div><strong>Nome:</strong> {orderData.customerName}</div>
            <div><strong>Email:</strong> {orderData.customerEmail}</div>
            <div><strong>Telefone:</strong> {orderData.customerPhone}</div>
          </CardContent>
        </Card>

        <Button
          onClick={handlePayment}
          disabled={isProcessing}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
        >
          {isProcessing ? (
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