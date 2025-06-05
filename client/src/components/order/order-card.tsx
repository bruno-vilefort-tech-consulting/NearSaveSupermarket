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
import { Truck, Clock, Package, CreditCard, AlertTriangle, RefreshCw, CheckCircle } from "lucide-react";
import { useLocation } from "wouter";
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
      confirmationStatus?: string;
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
  "cancelled-customer": { label: "Cancelado pelo Cliente", color: "bg-red-100 text-red-800" },
  "cancelled-staff": { label: "Cancelado pelo Estabelecimento", color: "bg-red-100 text-red-800" },
  awaiting_payment: { label: "Aguardando Pagamento", color: "bg-gray-100 text-gray-800" },
  payment_expired: { label: "Pagamento Expirado", color: "bg-red-100 text-red-800" },
  payment_failed: { label: "Pagamento Falhou", color: "bg-red-100 text-red-800" },
};

const getNextStatus = (currentStatus: string, fulfillmentMethod: string) => {
  // Se o pedido foi cancelado de qualquer forma, não permite mais mudanças
  if (currentStatus === "cancelled" || currentStatus === "cancelled-customer" || currentStatus === "cancelled-staff") {
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
  const [, navigate] = useLocation();
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
        title: "Sucesso",
        description: "Status do pedido atualizado com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/staff/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Não autorizado",
          description: "Você foi desconectado. Fazendo login novamente...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Erro",
        description: "Falha ao atualizar status do pedido. Tente novamente.",
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
          title: "Não autorizado",
          description: "Você foi desconectado. Fazendo login novamente...",
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



  // Mutation para cancelar pedido pelo staff (com estorno PIX automático)
  const cancelOrderMutation = useMutation({
    mutationFn: async ({ orderId, reason }: { orderId: number; reason?: string }) => {
      const response = await apiRequest("POST", `/api/staff/orders/${orderId}/cancel`, {
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
    // Usar a nova mutation de cancelamento que inclui estorno PIX automático
    cancelOrderMutation.mutate({ 
      orderId: order.id, 
      reason: "Cancelamento solicitado pelo estabelecimento" 
    });
    setShowCancelDialog(false);
  };

  const handlePixRefund = () => {
    // Processar estorno PIX separadamente
    pixRefundMutation.mutate({ 
      orderId: order.id, 
      reason: 'Estorno solicitado pelo estabelecimento' 
    });
  };

  const canConfirmOrder = () => {
    // Pedido pode ser confirmado se estiver com status "pending" ou "awaiting_payment" 
    // e tiver pagamento PIX aprovado
    return (order.status === "pending" || order.status === "awaiting_payment") && 
           order.externalReference && 
           order.pixPaymentId;
  };

  const handleConfirmOrder = () => {
    navigate(`/orders/${order.id}/confirm`);
  };



  // Verifica se o pedido pode ser cancelado (não está cancelado nem concluído)
  const canCancelOrder = () => {
    return order.status !== "cancelled" && 
           order.status !== "cancelled-customer" && 
           order.status !== "cancelled-staff" && 
           order.status !== "completed";
  };

  const currentStatus = statusConfig[order.status as keyof typeof statusConfig];

  return (
    <Card className="shadow-sm border-eco-blue-light">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-semibold text-eco-blue-dark">Pedido #{order.id}</h3>
            <p className="text-sm text-eco-gray font-medium">{order.customerName}</p>
            {order.customerEmail && (
              <p className="text-xs text-eco-gray">📧 {order.customerEmail}</p>
            )}
            {order.customerPhone && (
              <p className="text-xs text-eco-gray">📱 {order.customerPhone}</p>
            )}
            <p className="text-xs text-eco-gray">
              {order.fulfillmentMethod === "delivery" ? "🚚 Entrega" : "🏪 Retirada no Local"}
            </p>
            {order.deliveryAddress && order.fulfillmentMethod === "delivery" && (
              <p className="text-xs text-eco-gray mt-1">📍 {order.deliveryAddress}</p>
            )}
          </div>
          <Badge className={currentStatus?.color || "bg-eco-blue-light text-eco-blue-dark"}>
            {currentStatus?.label || order.status}
          </Badge>
        </div>

        <div className="space-y-2 mb-4">
          {order.orderItems.map((item) => {
            const isConfirmed = order.status === "confirmed" && item.confirmationStatus === "confirmed";
            const isRemoved = order.status === "confirmed" && item.confirmationStatus === "removed";
            const isPending = order.status === "confirmed" && (!item.confirmationStatus || item.confirmationStatus === "pending");
            
            return (
              <div key={item.id} className={`flex items-center space-x-3 p-2 rounded-lg ${
                isRemoved ? "bg-red-50 border border-red-200" : 
                isConfirmed ? "bg-green-50 border border-green-200" :
                "bg-transparent"
              }`}>
                <div className="w-12 h-12 bg-eco-blue-light rounded-lg flex items-center justify-center flex-shrink-0 relative">
                  {item.product.imageUrl ? (
                    <img 
                      src={item.product.imageUrl} 
                      alt={item.product.name}
                      className={`w-full h-full object-cover rounded-lg ${isRemoved ? "opacity-50 grayscale" : ""}`}
                    />
                  ) : (
                    <Package className={`text-eco-blue ${isRemoved ? "opacity-50" : ""}`} size={16} />
                  )}
                  
                  {/* Status indicator overlay */}
                  {order.status === "confirmed" && (
                    <div className="absolute -top-1 -right-1">
                      {isConfirmed && (
                        <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                          <CheckCircle className="text-white" size={12} />
                        </div>
                      )}
                      {isRemoved && (
                        <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                          <AlertTriangle className="text-white" size={12} />
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`font-medium truncate ${
                      isRemoved ? "text-red-600 line-through" : 
                      isConfirmed ? "text-green-700" : 
                      "text-eco-blue-dark"
                    }`}>
                      {item.product.name}
                    </p>
                    
                    {/* Status badge for confirmed orders */}
                    {order.status === "confirmed" && (
                      <>
                        {isConfirmed && (
                          <Badge className="bg-green-100 text-green-800 text-xs px-2 py-0.5">
                            Aceito
                          </Badge>
                        )}
                        {isRemoved && (
                          <Badge className="bg-red-100 text-red-800 text-xs px-2 py-0.5">
                            Removido
                          </Badge>
                        )}
                        {isPending && (
                          <Badge className="bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5">
                            Pendente
                          </Badge>
                        )}
                      </>
                    )}
                  </div>
                  
                  <p className={`text-sm ${
                    isRemoved ? "text-red-500" : 
                    isConfirmed ? "text-green-600" : 
                    "text-eco-gray"
                  }`}>
                    Qty: {item.quantity} • R$ {parseFloat(item.priceAtTime).toFixed(2)} cada
                    {isRemoved && (
                      <span className="block text-xs text-red-600 font-medium mt-1">
                        ❌ Item removido - valor estornado via PIX
                      </span>
                    )}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-eco-blue-light">
          <div className="flex items-center space-x-4 text-sm text-eco-gray">
            <span className="flex items-center">
              <Clock className="text-eco-blue mr-1" size={14} />
              {getTimeAgo(order.createdAt)}
            </span>
            <span className="font-medium text-eco-blue">
              Total: R$ {parseFloat(order.totalAmount).toFixed(2)}
            </span>
          </div>
          
          {canEditStatus && (
            <div className="flex flex-col gap-2">
              <div className="flex gap-2 flex-wrap">
                {canConfirmOrder() && (
                  <Button 
                    size="sm"
                    onClick={handleConfirmOrder}
                    className="bg-eco-blue hover:bg-eco-blue-dark text-white font-medium"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Confirmar Pedido
                  </Button>
                )}

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
                
                {/* Botão separado para Estorno PIX - apenas para cancelamentos manuais pelo staff sem estorno processado */}
                {order.externalReference && order.pixPaymentId && !order.pixRefundId && !order.refundStatus && order.status === "cancelled-staff" && (
                  <Button 
                    size="sm"
                    variant="outline"
                    onClick={handlePixRefund}
                    disabled={pixRefundMutation.isPending}
                    className="border-eco-blue text-eco-blue hover:bg-eco-blue-light"
                  >
                    {pixRefundMutation.isPending ? "Processando..." : "Estorno PIX"}
                  </Button>
                )}
                
                {canEditStatus && getNextStatusLabel() && !canConfirmOrder() && (
                  <Button 
                    size="sm"
                    onClick={handleStatusUpdate}
                    disabled={updateStatusMutation.isPending}
                    className="bg-eco-blue hover:bg-eco-blue-dark text-white font-medium"
                  >
                    {updateStatusMutation.isPending ? "Atualizando..." : getNextStatusLabel()}
                  </Button>
                )}
              </div>

              {/* Indicador de PIX */}
              {order.externalReference && order.pixPaymentId && order.status !== "completed" && (
                <div className="text-xs text-eco-blue flex items-center gap-1">
                  <CreditCard className="h-3 w-3" />
                  {order.pixRefundId ? 
                    `PIX Estornado (${order.refundStatus})` : 
                    order.status === "cancelled-customer" ? 
                      "PIX Pago - Estorno disponível" :
                      order.status === "cancelled-staff" ?
                        "PIX Pago - Cancelado pelo estabelecimento" :
                        "PIX Pago"
                  }
                </div>
              )}

              {/* Informação sobre estorno parcial */}
              {order.status === "confirmed" && order.pixRefundId && order.refundAmount && (
                <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2 text-blue-700 text-xs">
                    <CreditCard className="h-3 w-3" />
                    <span className="font-medium">Estorno PIX processado</span>
                  </div>
                  <p className="text-xs text-blue-600 mt-1">
                    R$ {parseFloat(order.refundAmount).toFixed(2)} estornado por itens indisponíveis
                  </p>
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
                <div className="mt-4 p-3 bg-eco-blue-light border border-eco-blue rounded-lg">
                  <div className="flex items-center gap-2 text-eco-blue-dark font-medium mb-2">
                    <CreditCard className="h-4 w-4" />
                    Estorno PIX Automático
                  </div>
                  <p className="text-sm text-eco-blue-dark">
                    Este pedido possui pagamento PIX que será <strong>estornado automaticamente</strong> durante o cancelamento.
                  </p>
                  <div className="flex items-center gap-1 mt-2 text-xs text-eco-blue">
                    <AlertTriangle className="h-3 w-3" />
                    O cliente será notificado sobre o estorno
                  </div>
                </div>
              )}
            </div>
            
            <p className="text-sm text-eco-gray mt-4">
              Esta ação não pode ser desfeita. O pedido será marcado como <strong>"Cancelado-lojista"</strong>
              {order.externalReference && order.pixPaymentId && " e o estorno PIX será processado automaticamente"}.
            </p>
          </div>

          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowCancelDialog(false)}
              className="flex-1 border-eco-blue text-eco-blue hover:bg-eco-blue-light"
            >
              Manter Pedido
            </Button>
            <Button 
              onClick={confirmCancelOrder}
              disabled={updateStatusMutation.isPending || cancelOrderMutation.isPending}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            >
              {(updateStatusMutation.isPending || cancelOrderMutation.isPending) ? (
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Processando...
                </div>
              ) : (
                order.externalReference && order.pixPaymentId ? "Cancelar e Estornar" : "Sim, Cancelar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
