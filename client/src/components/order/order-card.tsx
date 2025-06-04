import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Truck, Clock, Package, CreditCard, AlertTriangle, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { PixRefundButton } from "./pix-refund-button";
import { CancelOrderModal } from "./cancel-order-modal";
import { useState } from "react";

interface OrderCardProps {
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
    externalReference?: string;
    pixPaymentId?: string;
    pixRefundId?: string;
    refundStatus?: string;
    refundAmount?: string;
    refundDate?: string;
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
  canEditStatus?: boolean;
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
  // Se o pedido foi cancelado, não permite mais mudanças
  if (currentStatus === "cancelled") {
    return null;
  }

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

export function OrderCard({ order, canEditStatus = false }: OrderCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      // Get staff info from localStorage to add to headers
      const staffUser = JSON.parse(localStorage.getItem('staffInfo') || '{}');
      
      const response = await fetch(`/api/staff/orders/${order.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-staff-id': staffUser.id?.toString() || '1'
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Order status updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/staff/orders"] });
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

  // Mutation para estorno PIX separado
  const pixRefundMutation = useMutation({
    mutationFn: async ({ orderId, reason }: { orderId: number; reason?: string }) => {
      const response = await apiRequest("POST", "/api/pix/refund", {
        orderId,
        reason: reason || "Estorno solicitado pelo estabelecimento"
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        let errorMessage = "Erro ao processar estorno PIX";
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
        title: "Estorno PIX Processado",
        description: `Estorno PIX realizado com sucesso. ID: ${data.refundId}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/staff/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/staff/stats"] });
    },
    onError: (error: Error) => {
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
        title: "Erro no Estorno PIX",
        description: error.message,
        variant: "destructive",
      });
    },
  });



  // Mutation para cancelar pedido (sem estorno PIX)
  const cancelOrderMutation = useMutation({
    mutationFn: async ({ orderId, reason }: { orderId: number; reason?: string }) => {
      const response = await apiRequest("POST", `/api/customer/orders/${orderId}/cancel`, {
        reason: reason || "Cancelamento solicitado pelo estabelecimento"
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
      queryClient.invalidateQueries({ queryKey: ["/api/staff/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/staff/stats"] });
    },
    onError: (error: Error) => {
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
        title: "Erro ao Cancelar",
        description: error.message,
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

  const handleCancelOrder = () => {
    setShowCancelDialog(true);
  };

  const confirmCancelOrder = () => {
    // Cancelar apenas o pedido, sem estorno PIX
    updateStatusMutation.mutate("cancelled");
    setShowCancelDialog(false);
  };

  const handlePixRefund = () => {
    // Processar estorno PIX separadamente
    pixRefundMutation.mutate({ 
      orderId: order.id, 
      reason: 'Estorno solicitado pelo estabelecimento' 
    });
  };



  // Verifica se o pedido pode ser cancelado (não está cancelado nem concluído)
  const canCancelOrder = () => {
    return order.status !== "cancelled" && order.status !== "completed";
  };

  const currentStatus = statusConfig[order.status as keyof typeof statusConfig];

  return (
    <Card className="shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-semibold text-gray-900">Pedido #{order.id}</h3>
            <p className="text-sm text-gray-600 font-medium">{order.customerName}</p>
            {order.customerEmail && (
              <p className="text-xs text-gray-500">📧 {order.customerEmail}</p>
            )}
            {order.customerPhone && (
              <p className="text-xs text-gray-500">📱 {order.customerPhone}</p>
            )}
            <p className="text-xs text-gray-500">
              {order.fulfillmentMethod === "delivery" ? "🚚 Entrega" : "🏪 Retirada no Local"}
            </p>
            {order.deliveryAddress && order.fulfillmentMethod === "delivery" && (
              <p className="text-xs text-gray-500 mt-1">📍 {order.deliveryAddress}</p>
            )}
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
              <Clock className="text-gray-400 mr-1" size={14} />
              {getTimeAgo(order.createdAt)}
            </span>
            <span className="font-medium text-green-600">
              Total: R$ {parseFloat(order.totalAmount).toFixed(2)}
            </span>
          </div>
          
          {canEditStatus && (
            <div className="flex flex-col gap-2">
              <div className="flex gap-2 flex-wrap">
                {canCancelOrder() && (
                  <Button 
                    size="sm"
                    variant="destructive"
                    onClick={handleCancelOrder}
                    disabled={updateStatusMutation.isPending}
                  >
                    {updateStatusMutation.isPending ? "Cancelando..." : "Cancelar"}
                  </Button>
                )}
                
                {/* Botão separado para Estorno PIX */}
                {order.externalReference && order.pixPaymentId && !order.pixRefundId && order.status !== "cancelled" && order.status !== "completed" && (
                  <Button 
                    size="sm"
                    variant="outline"
                    onClick={handlePixRefund}
                    disabled={pixRefundMutation.isPending}
                    className="border-blue-300 text-blue-600 hover:bg-blue-50"
                  >
                    {pixRefundMutation.isPending ? "Processando..." : "Estorno PIX"}
                  </Button>
                )}


                
                {canEditStatus && getNextStatusLabel() && (
                  <Button 
                    size="sm"
                    onClick={handleStatusUpdate}
                    disabled={updateStatusMutation.isPending}
                    className="bg-green-600 hover:bg-green-700 text-white font-medium"
                  >
                    {updateStatusMutation.isPending ? "Atualizando..." : getNextStatusLabel()}
                  </Button>
                )}
              </div>

              {/* Indicador de PIX */}
              {order.externalReference && order.pixPaymentId && order.status !== "completed" && (
                <div className="text-xs text-blue-600 flex items-center gap-1">
                  <CreditCard className="h-3 w-3" />
                  {order.pixRefundId ? 
                    `PIX Estornado (${order.refundStatus})` : 
                    "PIX Pago - Estorno disponível"
                  }
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>

      {/* Modal de Confirmação de Cancelamento */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Cancelar Pedido
            </DialogTitle>
            <DialogDescription className="text-base">
              Tem certeza que deseja cancelar o pedido #{order.id}?
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
              <div className="flex justify-between">
                <span className="font-medium">Cliente:</span>
                <span>{order.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Valor Total:</span>
                <span className="font-semibold text-green-600">
                  R$ {parseFloat(order.totalAmount).toFixed(2)}
                </span>
              </div>
              
              {order.externalReference && order.pixPaymentId && (
                <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-center gap-2 text-orange-700 font-medium mb-2">
                    <CreditCard className="h-4 w-4" />
                    Pagamento PIX Detectado
                  </div>
                  <p className="text-sm text-orange-600">
                    Este pedido possui pagamento PIX. Use o botão <strong>"Estorno PIX"</strong> separadamente se necessário processar o estorno.
                  </p>
                  <div className="flex items-center gap-1 mt-2 text-xs text-orange-500">
                    <AlertTriangle className="h-3 w-3" />
                    Cancelamento não inclui estorno automático
                  </div>
                </div>
              )}
            </div>
            
            <p className="text-sm text-gray-600 mt-4">
              Esta ação não pode ser desfeita. O pedido será marcado como cancelado.
            </p>
          </div>

          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowCancelDialog(false)}
              className="flex-1"
            >
              Manter Pedido
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmCancelOrder}
              disabled={updateStatusMutation.isPending || cancelOrderMutation.isPending}
              className="flex-1"
            >
              {(updateStatusMutation.isPending || cancelOrderMutation.isPending) ? (
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Processando...
                </div>
              ) : (
                "Sim, Cancelar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
