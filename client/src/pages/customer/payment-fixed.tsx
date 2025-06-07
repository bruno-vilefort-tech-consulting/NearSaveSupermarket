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
      <div className="min-h-screen bg-eco-gray-light flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-eco-green border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-eco-gray-light p-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center justify-center mb-8 relative">
          <Link href="/customer/cart">
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute left-0 top-1/2 -translate-y-1/2 text-eco-gray hover:text-eco-gray-dark"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="text-center">
            <h1 className="text-lg font-bold text-eco-gray-dark mb-2">Finalizar Pedido</h1>
            <p className="text-xs text-eco-gray">Confirme seu pedido e pague com PIX</p>
          </div>
        </div>

        {/* Resumo do Pedido */}
        <Card className="mb-8 shadow-lg border border-eco-green-light bg-white">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-lg font-bold text-eco-gray-dark">Resumo do Pedido</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-eco-gray-light p-4 rounded-lg">
                {orderData.items?.map((item: any, index: number) => (
                  <div key={index} className="flex justify-between items-center py-2 border-b border-eco-gray-light last:border-b-0">
                    <div className="flex-1 min-w-0">
                      <div className="text-eco-gray-dark font-medium text-sm truncate">
                        {item.quantity}x {item.productName}
                      </div>
                    </div>
                    <span className="font-semibold text-eco-green text-sm ml-2 flex-shrink-0">
                      R$ {(parseFloat(item.priceAtTime) * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
              
              <div className="bg-gradient-to-r from-eco-green-light to-eco-green-light p-4 rounded-lg border border-eco-green">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-eco-gray-dark">Total</span>
                  <span className="text-lg font-bold text-eco-green">
                    R$ {parseFloat(orderData.totalAmount).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* PIX Payment Card */}
        <Card className="mb-8 shadow-lg border border-eco-blue-light bg-white">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-16 h-16 bg-eco-blue-light rounded-full flex items-center justify-center mb-4">
              <Smartphone className="h-8 w-8 text-eco-blue" />
            </div>
            <CardTitle className="text-lg font-bold text-eco-gray-dark mb-2">Pagamento PIX</CardTitle>
            <p className="text-xs text-eco-gray">
              Pagamento instantâneo e seguro
            </p>
          </CardHeader>
          <CardContent>
            <div className="bg-eco-blue-light p-4 rounded-lg border border-eco-blue">
              <div className="flex items-center gap-3 mb-3">
                <Lock className="h-5 w-5 text-eco-blue" />
                <span className="font-medium text-eco-blue">Transação Segura</span>
              </div>
              <p className="text-sm text-eco-blue">
                Após confirmar, você receberá o código PIX para pagamento instantâneo no seu aplicativo bancário.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Dados do Cliente */}
        <Card className="mb-8 shadow-lg border border-eco-gray-light bg-white">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-lg font-bold text-eco-gray-dark">Dados do Cliente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-eco-gray-light p-4 rounded-lg space-y-3">
              <div className="flex justify-between">
                <span className="text-eco-gray">Nome:</span>
                <span className="font-medium text-eco-gray-dark">{orderData.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-eco-gray">Email:</span>
                <span className="font-medium text-eco-gray-dark">{orderData.customerEmail}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-eco-gray">Telefone:</span>
                <span className="font-medium text-eco-gray-dark">{orderData.customerPhone}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Botão de Pagamento */}
        <div className="space-y-4 mb-8">
          {/* PIX Payment Button */}
          <Button
            onClick={handlePayment}
            disabled={isProcessing}
            className="w-full bg-eco-green hover:bg-eco-green/90 py-4 text-sm font-semibold shadow-lg rounded-xl"
            size="lg"
          >
            {isProcessing ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                Gerando PIX...
              </div>
            ) : (
              `Pagar R$ ${parseFloat(orderData.totalAmount).toFixed(2)} via PIX`
            )}
          </Button>
          
          <div className="text-center">
            <p className="text-sm text-eco-gray mb-3">ou</p>
          </div>
          
          {/* Stripe Card Payment Button */}
          <Button
            onClick={() => navigate(`/customer/stripe-checkout/${orderData.id}`)}
            disabled={isProcessing}
            className="w-full bg-blue-600 hover:bg-blue-700 py-4 text-sm font-semibold shadow-lg rounded-xl text-white"
            size="lg"
          >
            Pagar R$ {parseFloat(orderData.totalAmount).toFixed(2)} com Cartão
          </Button>
          
          <p className="text-xs text-eco-gray text-center mt-3">
            Escolha entre PIX (instantâneo) ou cartão de crédito/débito
          </p>
        </div>
      </div>
    </div>
  );
}