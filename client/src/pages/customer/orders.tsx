import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Search, MapPin, Package } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { OrderTimeline } from "@/components/order/order-timeline";

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
  customerPhone: string;
  status: string;
  fulfillmentMethod: string;
  deliveryAddress?: string;
  totalAmount: string;
  createdAt: string;
  orderItems: OrderItem[];
}

export default function CustomerOrders() {
  const [customerInfo, setCustomerInfo] = useState<any>(null);
  const [searchTriggered, setSearchTriggered] = useState(false);
  const { toast } = useToast();

  // Carregar informações do cliente do localStorage
  useEffect(() => {
    const savedCustomer = localStorage.getItem('customerInfo');
    if (savedCustomer) {
      const customer = JSON.parse(savedCustomer);
      setCustomerInfo(customer);
      if (customer.phone) {
        setSearchTriggered(true);
      }
    }
  }, []);

  const { data: orders, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/public/orders', customerInfo?.phone],
    queryFn: async () => {
      if (!customerInfo?.phone) throw new Error("Phone number required");
      const response = await fetch(`/api/public/orders/${encodeURIComponent(customerInfo.phone)}`);
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      return response.json();
    },
    enabled: searchTriggered && !!customerInfo?.phone,
    retry: false,
    refetchInterval: 10000, // Atualizar a cada 10 segundos
  });

  const formatPrice = (price: string) => {
    return `R$ ${parseFloat(price).toFixed(2).replace('.', ',')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "Pendente", variant: "secondary" as const, color: "bg-yellow-100 text-yellow-800" },
      confirmed: { label: "Confirmado", variant: "default" as const, color: "bg-blue-100 text-blue-800" },
      preparing: { label: "Preparando", variant: "default" as const, color: "bg-orange-100 text-orange-800" },
      ready: { label: "Pronto", variant: "default" as const, color: "bg-purple-100 text-purple-800" },
      shipped: { label: "Em Entrega", variant: "default" as const, color: "bg-indigo-100 text-indigo-800" },
      completed: { label: "Concluído", variant: "default" as const, color: "bg-green-100 text-green-800" },
      cancelled: { label: "Cancelado", variant: "destructive" as const, color: "bg-red-100 text-red-800" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  if (!customerInfo) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-md mx-auto px-4 py-4 flex items-center">
            <Link href="/customer">
              <ArrowLeft className="h-6 w-6 text-gray-600" />
            </Link>
            <h1 className="ml-4 text-lg font-semibold">Meus Pedidos</h1>
          </div>
        </div>
        <div className="max-w-md mx-auto p-4 pt-8">
          <div className="text-center">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Nenhuma informação encontrada</h2>
            <p className="text-gray-600 mb-4">Faça pelo menos um pedido primeiro para poder acompanhar suas compras.</p>
            <Link href="/customer">
              <Button className="bg-green-600 hover:bg-green-700">
                Fazer Primeiro Pedido
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center">
          <Link href="/customer">
            <ArrowLeft className="h-6 w-6 text-gray-600" />
          </Link>
          <h1 className="ml-4 text-lg font-semibold">Meus Pedidos</h1>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-4">
        {/* Informações do cliente */}
        <Card className="bg-white">
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-semibold">Olá, {customerInfo.name}!</h3>
                <p className="text-sm text-gray-600">Tel: {customerInfo.phone}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                disabled={isLoading}
              >
                <Search className="h-4 w-4 mr-2" />
                {isLoading ? "Atualizando..." : "Atualizar"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Resultados */}
        {isLoading && (
          <div className="text-center py-8">
            <div className="animate-spin w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-2 text-gray-600">Carregando seus pedidos...</p>
          </div>
        )}

        {error && (
          <div className="text-center py-8">
            <p className="text-gray-600">Erro ao carregar pedidos. Tente novamente.</p>
          </div>
        )}

        {!isLoading && !error && orders && orders.length === 0 && (
          <div className="text-center py-8">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Nenhum pedido encontrado</h2>
            <p className="text-gray-600 mb-4">Você ainda não fez nenhum pedido.</p>
            <Link href="/customer">
              <Button className="bg-green-600 hover:bg-green-700">
                Fazer Primeiro Pedido
              </Button>
            </Link>
          </div>
        )}

        {!isLoading && !error && orders && orders.length > 0 && (
          <div className="space-y-4">
            <h2 className="font-semibold text-gray-900">
              {orders.length} pedido{orders.length > 1 ? 's' : ''} encontrado{orders.length > 1 ? 's' : ''}
            </h2>
            
            {orders.map((order: Order) => (
              <div key={order.id} className="space-y-4">
                <Card className="bg-white">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold">Pedido #{order.id}</h3>
                        <p className="text-sm text-gray-600">{formatDate(order.createdAt)}</p>
                        <p className="text-sm text-green-600 font-medium">Supermercado Silva</p>
                        <p className="text-xs text-gray-500">Rua das Flores, 123 - Centro</p>
                      </div>
                      {getStatusBadge(order.status)}
                    </div>

                    <div className="space-y-2 mb-3">
                      <div className="flex items-center gap-2 text-sm">
                        {order.fulfillmentMethod === "delivery" ? (
                          <MapPin className="h-4 w-4 text-blue-500" />
                        ) : (
                          <Package className="h-4 w-4 text-green-500" />
                        )}
                        <span>
                          {order.fulfillmentMethod === "delivery" ? "Entrega" : "Retirada no Local"}
                        </span>
                      </div>
                      
                      {order.deliveryAddress && (
                        <p className="text-sm text-gray-600 ml-6">{order.deliveryAddress}</p>
                      )}
                    </div>

                    <div className="space-y-2 mb-3">
                      {order.orderItems.map((item) => (
                        <div key={item.id} className="flex justify-between items-center text-sm">
                          <div className="flex gap-2">
                            {item.product.imageUrl && (
                              <img 
                                src={item.product.imageUrl} 
                                alt={item.product.name}
                                className="w-8 h-8 object-cover rounded"
                              />
                            )}
                            <div>
                              <span className="font-medium">{item.quantity}x</span> {item.product.name}
                            </div>
                          </div>
                          <span className="text-green-600 font-medium">
                            {formatPrice(item.priceAtTime)}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="border-t pt-2 flex justify-between items-center">
                      <span className="font-semibold">Total</span>
                      <span className="font-semibold text-lg text-green-600">
                        {formatPrice(order.totalAmount)}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Timeline de Status */}
                <OrderTimeline 
                  currentStatus={order.status}
                  fulfillmentMethod={order.fulfillmentMethod}
                  createdAt={order.createdAt}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}