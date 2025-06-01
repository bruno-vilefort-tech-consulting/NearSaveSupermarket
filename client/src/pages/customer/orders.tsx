import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, 
  Package, 
  Clock, 
  CheckCircle, 
  Truck, 
  MapPin,
  Phone,
  Mail,
  Calendar,
  DollarSign
} from "lucide-react";
import { OrderTimelineCompact } from "@/components/order/order-timeline-compact";

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

  useEffect(() => {
    const savedCustomer = localStorage.getItem('customerInfo');
    if (savedCustomer) {
      setCustomerInfo(JSON.parse(savedCustomer));
    }
  }, []);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["/api/customer/orders", customerInfo?.email, customerInfo?.phone],
    enabled: !!(customerInfo?.email || customerInfo?.phone),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (customerInfo?.email) params.append('email', customerInfo.email);
      if (customerInfo?.phone) params.append('phone', customerInfo.phone);
      
      const response = await fetch(`/api/customer/orders?${params}`);
      if (!response.ok) throw new Error('Falha ao carregar pedidos');
      return response.json();
    }
  });

  const formatPrice = (price: string) => {
    return `R$ ${parseFloat(price).toFixed(2).replace('.', ',')}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'preparing': return 'bg-orange-100 text-orange-800';
      case 'ready': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-emerald-100 text-emerald-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendente';
      case 'confirmed': return 'Confirmado';
      case 'preparing': return 'Preparando';
      case 'ready': return 'Pronto';
      case 'completed': return 'Concluído';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'confirmed': return <CheckCircle className="h-4 w-4" />;
      case 'preparing': return <Package className="h-4 w-4" />;
      case 'ready': return <CheckCircle className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'cancelled': return <Clock className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
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
        <div className="max-w-md mx-auto px-4 py-4 flex items-center">
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
            <Card key={order.id} className="bg-white">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Pedido #{order.id}</CardTitle>
                    <div className="flex items-center text-sm text-gray-600 mt-1">
                      <Calendar className="h-3 w-3 mr-1" />
                      {new Date(order.createdAt).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                  <Badge className={`${getStatusColor(order.status)} border-0`}>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(order.status)}
                      {getStatusText(order.status)}
                    </div>
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Timeline do Pedido */}
                <div className="bg-gray-50 rounded-lg p-3">
                  <h4 className="text-sm font-medium mb-2">Status do Pedido</h4>
                  <OrderTimelineCompact 
                    currentStatus={order.status}
                    fulfillmentMethod={order.fulfillmentMethod}
                    showLabels={false}
                  />
                </div>

                {/* Informações do Pedido */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Valor Total:</span>
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3 text-green-600" />
                      <span className="font-semibold text-green-600">
                        {formatPrice(order.totalAmount)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Forma de Retirada:</span>
                    <div className="flex items-center gap-1">
                      {order.fulfillmentMethod === 'delivery' ? (
                        <>
                          <Truck className="h-3 w-3" />
                          <span>Entrega</span>
                        </>
                      ) : (
                        <>
                          <MapPin className="h-3 w-3" />
                          <span>Retirada</span>
                        </>
                      )}
                    </div>
                  </div>

                  {order.deliveryAddress && (
                    <div className="text-sm">
                      <span className="text-gray-600">Endereço: </span>
                      <span>{order.deliveryAddress}</span>
                    </div>
                  )}
                </div>

                {/* Itens do Pedido */}
                <div>
                  <h4 className="text-sm font-medium mb-2">
                    Itens ({order.orderItems.length})
                  </h4>
                  <div className="space-y-2">
                    {order.orderItems.map((item) => (
                      <div key={item.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                        {item.product.imageUrl && (
                          <img 
                            src={item.product.imageUrl} 
                            alt={item.product.name}
                            className="w-10 h-10 object-cover rounded-lg"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {item.product.name}
                          </p>
                          <p className="text-xs text-gray-600">
                            Qtd: {item.quantity} × {formatPrice(item.priceAtTime)}
                          </p>
                        </div>
                        <div className="text-sm font-semibold">
                          {formatPrice((parseFloat(item.priceAtTime) * item.quantity).toString())}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Informações de Contato */}
                <div className="pt-2 border-t">
                  <h4 className="text-sm font-medium mb-2">Dados de Contato</h4>
                  <div className="space-y-1 text-sm">
                    {order.customerPhone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-3 w-3 text-gray-400" />
                        <span>{order.customerPhone}</span>
                      </div>
                    )}
                    {order.customerEmail && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-3 w-3 text-gray-400" />
                        <span>{order.customerEmail}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}