import { useEffect } from "react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MapPin, Package } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";

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
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const { data: orders, isLoading, error } = useQuery({
    queryKey: ['/api/my-orders'],
    enabled: isAuthenticated && !!user,
    retry: false,
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
      pending: { label: "Pendente", variant: "secondary" as const },
      confirmed: { label: "Confirmado", variant: "default" as const },
      preparing: { label: "Preparando", variant: "default" as const },
      ready: { label: "Pronto", variant: "default" as const },
      completed: { label: "Concluído", variant: "default" as const },
      cancelled: { label: "Cancelado", variant: "destructive" as const },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (authLoading) {
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
        <div className="text-center py-8">
          <div className="animate-spin w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-2 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
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
            <h2 className="text-lg font-semibold mb-2">Login necessário</h2>
            <p className="text-gray-600 mb-4">Faça login para ver seus pedidos.</p>
            <Link href="/">
              <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded">
                Fazer Login
              </button>
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
              <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded">
                Fazer Primeiro Pedido
              </button>
            </Link>
          </div>
        )}

        {!isLoading && !error && orders && orders.length > 0 && (
          <div className="space-y-4">
            <h2 className="font-semibold text-gray-900">
              {orders.length} pedido{orders.length > 1 ? 's' : ''} encontrado{orders.length > 1 ? 's' : ''}
            </h2>
            
            {orders.map((order: Order) => (
              <Card key={order.id} className="bg-white">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold">Pedido #{order.id}</h3>
                      <p className="text-sm text-gray-600">{formatDate(order.createdAt)}</p>
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
}