import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, Clock, CheckCircle, Truck, MapPin, Phone, Mail, Calendar, DollarSign } from "lucide-react";
import { OrderTimelineCompact } from "./order-timeline-compact";

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

interface CustomerOrderCardProps {
  order: {
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
  };
}

export function CustomerOrderCard({ order }: CustomerOrderCardProps) {
  const formatPrice = (price: string) => {
    return `R$ ${parseFloat(price).toFixed(2).replace('.', ',')}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'preparing': return 'bg-orange-100 text-orange-800';
      case 'ready': return 'bg-green-100 text-green-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
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
      case 'shipped': return 'Enviado';
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
      case 'shipped': return <Truck className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'cancelled': return <Clock className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  return (
    <Card className="bg-white shadow-sm">
      <CardContent className="p-4 space-y-4">
        {/* Header do Pedido */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Pedido #{order.id}</h3>
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
                {item.product.imageUrl ? (
                  <img 
                    src={item.product.imageUrl} 
                    alt={item.product.name}
                    className="w-10 h-10 object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                    <Package className="h-4 w-4 text-gray-400" />
                  </div>
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
  );
}