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

  const { data: orders = [], isLoading, refetch } = useQuery({
    queryKey: ["/api/customer/orders", customerInfo?.email, customerInfo?.phone],
    enabled: !!(customerInfo?.email || customerInfo?.phone),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (customerInfo?.email) params.append('email', customerInfo.email);
      if (customerInfo?.phone) params.append('phone', customerInfo.phone);
      
      console.log('🔍 Buscando pedidos com:', {
        email: customerInfo?.email,
        phone: customerInfo?.phone,
        fullCustomerInfo: customerInfo
      });
      
      const response = await fetch(`/api/customer/orders?${params}`);
      if (!response.ok) throw new Error('Falha ao carregar pedidos');
      const data = await response.json();
      console.log('📦 Pedidos encontrados:', data.length, 'pedidos:', data);
      return data;
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
              <h1 className="text-lg font-semibold">Meus Pedidos</h1>
              <p className="text-sm text-gray-500">
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
            <h2 className="text-xl font-semibold mb-2">Nenhum pedido encontrado</h2>
            <p className="text-gray-600 mb-6">Você ainda não fez nenhum pedido.</p>
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