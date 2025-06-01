import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Truck, Clock, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";

interface OrderCardProps {
  order: {
    id: number;
    customerName: string;
    customerEmail?: string;
    status: string;
    fulfillmentMethod: string;
    totalAmount: string;
    createdAt: string;
    orderItems: Array<{
      id: number;
      quantity: number;
      priceAtTime: string;
      product: {
        id: number;
        name: string;
        imageUrl?: string;
      };
    }>;
  };
}

const statusConfig = {
  pending: { label: "Pendente", color: "bg-yellow-100 text-yellow-800" },
  confirmed: { label: "Confirmado", color: "bg-blue-100 text-blue-800" },
  preparing: { label: "Preparando", color: "bg-orange-100 text-orange-800" },
  ready: { label: "Pronto", color: "bg-purple-100 text-purple-800" },
  shipped: { label: "Em Entrega", color: "bg-indigo-100 text-indigo-800" },
  completed: { label: "Concluído", color: "bg-green-100 text-green-800" },
  cancelled: { label: "Cancelado", color: "bg-red-100 text-red-800" },
};

const getNextStatus = (currentStatus: string, fulfillmentMethod: string) => {
  switch (currentStatus) {
    case "pending":
      return "confirmed";
    case "confirmed":
      return "preparing";
    case "preparing":
      return "ready";
    case "ready":
      return fulfillmentMethod === "delivery" ? "shipped" : "completed";
    case "shipped":
      return "completed";
    default:
      return null;
  }
};

export function OrderCard({ order }: OrderCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      await apiRequest("PUT", `/api/orders/${order.id}/status`, { status: newStatus });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Order status updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update order status. Please try again.",
        variant: "destructive",
      });
    },
  });

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const getNextStatusLabel = () => {
    const nextStatus = getNextStatus(order.status, order.fulfillmentMethod);
    if (!nextStatus) return null;
    
    switch (nextStatus) {
      case "confirmed": return "Confirmar Pedido";
      case "preparing": return "Iniciar Preparo";
      case "ready": return "Marcar como Pronto";
      case "shipped": return "Enviar para Entrega";
      case "completed": return order.fulfillmentMethod === "delivery" ? "Marcar como Entregue" : "Marcar como Retirado";
      default: return "Atualizar Status";
    }
  };

  const handleStatusUpdate = () => {
    const nextStatus = getNextStatus(order.status, order.fulfillmentMethod);
    if (nextStatus) {
      updateStatusMutation.mutate(nextStatus);
    }
  };

  const currentStatus = statusConfig[order.status as keyof typeof statusConfig];

  return (
    <Card className="shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-semibold text-gray-900">Order #{order.id}</h3>
            <p className="text-sm text-gray-600">{order.customerName}</p>
          </div>
          <Badge className={currentStatus?.color || "bg-gray-100 text-gray-800"}>
            {currentStatus?.label || order.status}
          </Badge>
        </div>

        <div className="space-y-2 mb-4">
          {order.orderItems.map((item) => (
            <div key={item.id} className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                {item.product.imageUrl ? (
                  <img 
                    src={item.product.imageUrl} 
                    alt={item.product.name}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <Package className="text-gray-400" size={16} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{item.product.name}</p>
                <p className="text-sm text-gray-600">
                  Qty: {item.quantity} • ${parseFloat(item.priceAtTime).toFixed(2)} each
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <span className="flex items-center">
              {order.fulfillmentMethod === "delivery" ? (
                <Truck className="text-gray-400 mr-1" size={14} />
              ) : (
                <Package className="text-gray-400 mr-1" size={14} />
              )}
              {order.fulfillmentMethod === "delivery" ? "Delivery" : "Pickup"}
            </span>
            <span className="flex items-center">
              <Clock className="text-gray-400 mr-1" size={14} />
              {getTimeAgo(order.createdAt)}
            </span>
            <span className="font-medium">
              Total: ${parseFloat(order.totalAmount).toFixed(2)}
            </span>
          </div>
          
          {getNextStatusLabel() && (
            <Button 
              size="sm"
              onClick={handleStatusUpdate}
              disabled={updateStatusMutation.isPending}
              className="bg-primary-600 hover:bg-primary-700"
            >
              {updateStatusMutation.isPending ? "Updating..." : getNextStatusLabel()}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
