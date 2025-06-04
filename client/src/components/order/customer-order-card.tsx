import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, Clock, CheckCircle, Truck, MapPin, Phone, Mail, Calendar, DollarSign, X } from "lucide-react";
import { OrderTimelineCompact } from "./order-timeline-compact";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

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
    supermarketName?: string;
    orderItems: OrderItem[];
    pixPaymentId?: string;
    refundStatus?: string;
  };
}

export function CustomerOrderCard({ order }: CustomerOrderCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const formatPrice = (price: string) => {
    return `R$ ${parseFloat(price).toFixed(2).replace('.', ',')}`;
  };

  // Mutation para cancelar pedido
  const cancelMutation = useMutation({
    mutationFn: async ({ orderId, reason }: { orderId: number; reason?: string }) => {
      const response = await apiRequest("POST", `/api/customer/orders/${orderId}/cancel`, {
        reason: reason || "Cancelamento solicitado pelo cliente"
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        let errorMessage = "Erro ao cancelar pedido";
        try {
          const parsed = JSON.parse(errorData);
          errorMessage = parsed.message || errorMessage;
        } catch {
          // Use default message if parsing fails
        }
        throw new Error(errorMessage);
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Pedido Cancelado",
        description: data.refundProcessed 
          ? "Pedido cancelado com sucesso. Estorno PIX processado automaticamente."
          : "Pedido cancelado com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/customer/orders"] });
      setShowCancelConfirm(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao Cancelar",
        description: error.message,
        variant: "destructive",
      });
      setShowCancelConfirm(false);
    },
  });

  const handleCancelOrder = () => {
    cancelMutation.mutate({ 
      orderId: order.id, 
      reason: 'Cancelamento solicitado pelo cliente' 
    });
  };

  // Verificar se o pedido pode ser cancelado
  const canCancel = () => {
    return order.status === 'pending' || order.status === 'confirmed';
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
            {order.supermarketName && (
              <p className="text-sm text-blue-600 font-medium">
                📍 {order.supermarketName}
              </p>
            )}
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

        {/* Botão de Cancelamento */}
        {canCancel() && (
          <div className="pt-2 border-t">
            {!showCancelConfirm ? (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowCancelConfirm(true)}
                className="w-full text-red-600 border-red-200 hover:bg-red-50"
              >
                <X className="h-4 w-4 mr-1" />
                Cancelar Pedido
              </Button>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-gray-600 text-center">
                  {order.pixPaymentId ? 
                    "Deseja cancelar este pedido? O estorno PIX será processado automaticamente." :
                    "Tem certeza que deseja cancelar este pedido?"
                  }
                </p>
                <div className="flex gap-2">
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCancelConfirm(false)}
                    disabled={cancelMutation.isPending}
                    className="flex-1"
                  >
                    Voltar
                  </Button>
                  <Button 
                    variant="destructive"
                    size="sm"
                    onClick={handleCancelOrder}
                    disabled={cancelMutation.isPending}
                    className="flex-1"
                  >
                    {cancelMutation.isPending ? "Cancelando..." : "Confirmar"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}