import { useEffect, useState } from 'react';
import { useLocation, useRoute } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Home, Package } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function PaymentSuccess() {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute('/customer/payment-success');
  const [orderData, setOrderData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('orderId');
    
    if (!orderId) {
      setLocation('/customer');
      return;
    }

    const fetchOrderData = async () => {
      try {
        const response = await apiRequest("GET", `/api/orders/${orderId}`);
        if (response.ok) {
          const order = await response.json();
          setOrderData(order);
        }
      } catch (error) {
        console.error('Error fetching order:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderData();
  }, [setLocation]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-eco-green mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-xl text-green-600">
                Pagamento Aprovado!
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {orderData && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">Detalhes do Pedido</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Pedido:</span>
                      <span className="font-medium">#{orderData.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total:</span>
                      <span className="font-medium text-eco-green">
                        {formatCurrency(parseFloat(orderData.totalAmount))}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className="font-medium text-green-600">Pago</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-blue-800 text-sm">
                  Seu pedido foi confirmado e está sendo preparado. Você receberá atualizações sobre o status da entrega.
                </p>
              </div>

              <div className="space-y-3">
                <Button 
                  onClick={() => setLocation('/customer/orders')}
                  className="w-full bg-eco-green hover:bg-eco-green/90"
                >
                  <Package className="w-4 h-4 mr-2" />
                  Ver Meus Pedidos
                </Button>
                
                <Button 
                  onClick={() => setLocation('/customer')}
                  variant="outline"
                  className="w-full"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Voltar ao Início
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}