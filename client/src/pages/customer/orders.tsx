import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Package, RefreshCw } from "lucide-react";
import { CustomerOrderCard } from "@/components/order/customer-order-card";

interface OrderItem {
  id: number;
  quantity: number;
  priceAtTime: string;
  product: {
    id: number;
    name: string;
    imageUrl?: string;
  };
}

interface Order {
  id: number;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  deliveryAddress?: string;
  status: string;
  fulfillmentMethod: string;
  totalAmount: string;
  createdAt: string;
  orderItems: OrderItem[];
}

export default function CustomerOrders() {
  const [customerInfo, setCustomerInfo] = useState<any>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const savedCustomer = localStorage.getItem('customerInfo');
    if (savedCustomer) {
      setCustomerInfo(JSON.parse(savedCustomer));
    }
  }, []);

  const { data: orders = [], isLoading, error, refetch } = useQuery({
    queryKey: ["/api/customer/orders", customerInfo?.email, customerInfo?.phone],
    enabled: !!(customerInfo?.email || customerInfo?.phone),
    refetchInterval: 3000, // Auto-refresh every 3 seconds for real-time updates
    retry: 3,
    retryDelay: 1000,
    queryFn: async () => {
      try {
        const params = new URLSearchParams();
        if (customerInfo?.email) params.append('email', customerInfo.email);
        if (customerInfo?.phone) params.append('phone', customerInfo.phone);
        
        console.log('🔍 Buscando pedidos com:', {
          email: customerInfo?.email,
          phone: customerInfo?.phone,
          fullCustomerInfo: customerInfo
        });
        
        const response = await fetch(`/api/customer/orders?${params}`);
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Erro na API:', response.status, errorText);
          throw new Error(`Erro ${response.status}: ${errorText}`);
        }
        
        const data = await response.json();
        console.log('📦 Pedidos encontrados:', data.length, 'pedidos:', data);
        
        // Validar estrutura dos dados
        if (!Array.isArray(data)) {
          console.error('Dados inválidos recebidos:', data);
          throw new Error('Formato de dados inválido recebido do servidor');
        }
        
        return data;
      } catch (error) {
        console.error('Erro completo ao buscar pedidos:', error);
        throw error;
      }
    }
  });

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/customer/orders"] });
    refetch();
  };



  if (isLoading) {
    return (
      <div className="min-h-screen bg-eco-gray-light flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-eco-green border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-eco-gray">Carregando seus pedidos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-eco-gray-light flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="bg-eco-orange-light border border-eco-orange rounded-lg p-6">
            <h2 className="text-lg font-semibold text-eco-orange-dark mb-2">Erro ao carregar pedidos</h2>
            <p className="text-eco-gray-dark mb-4">
              {error instanceof Error ? error.message : 'Ocorreu um erro inesperado'}
            </p>
            <Button 
              onClick={() => refetch()} 
              variant="outline"
              className="border-eco-orange text-eco-orange hover:bg-eco-orange hover:text-white"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Tentar novamente
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-eco-gray-light">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-eco-gray-light">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/customer">
              <ArrowLeft className="h-6 w-6 text-eco-gray" />
            </Link>
            <div className="ml-4">
              <h1 className="text-lg font-bold text-eco-gray-dark">Meus Pedidos</h1>
              <p className="text-xs text-eco-gray">
                {orders.length} {orders.length === 1 ? 'pedido' : 'pedidos'}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            className="text-eco-green hover:text-eco-green-dark hover:bg-eco-green-light"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-4">
        {orders.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-eco-gray-light rounded-full mx-auto flex items-center justify-center mb-4">
              <Package size={32} className="text-eco-gray" />
            </div>
            <h2 className="text-lg font-semibold text-eco-gray-dark mb-2">Nenhum pedido encontrado</h2>
            <p className="text-sm text-eco-gray mb-6">Você ainda não fez nenhum pedido.</p>
            <Link href="/customer">
              <Button className="bg-eco-green hover:bg-eco-green-dark text-white">
                Fazer Primeiro Pedido
              </Button>
            </Link>
          </div>
        ) : (
          orders.map((order: Order) => (
            <CustomerOrderCard key={order.id} order={order} />
          ))
        )}
      </div>
    </div>
  );
}