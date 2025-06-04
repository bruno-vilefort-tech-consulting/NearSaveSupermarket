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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando seus pedidos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-800 mb-2">Erro ao carregar pedidos</h2>
            <p className="text-red-600 mb-4">
              {error instanceof Error ? error.message : 'Ocorreu um erro inesperado'}
            </p>
            <Button 
              onClick={() => refetch()} 
              variant="outline"
              className="border-red-300 text-red-700 hover:bg-red-50"
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/customer">
              <ArrowLeft className="h-6 w-6 text-gray-600" />
            </Link>
            <div className="ml-4">
              <h1 className="text-lg font-bold text-gray-900">Meus Pedidos</h1>
              <p className="text-xs text-gray-500">
                {orders.length} {orders.length === 1 ? 'pedido' : 'pedidos'}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            className="text-green-600 hover:text-green-700 hover:bg-green-50"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-4">
        {orders.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto flex items-center justify-center mb-4">
              <Package size={32} className="text-gray-400" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Nenhum pedido encontrado</h2>
            <p className="text-sm text-gray-600 mb-6">Você ainda não fez nenhum pedido.</p>
            <Link href="/customer">
              <Button className="bg-green-600 hover:bg-green-700">
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