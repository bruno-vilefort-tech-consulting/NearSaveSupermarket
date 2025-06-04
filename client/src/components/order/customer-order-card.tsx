import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, Clock, CheckCircle, Truck, MapPin, Phone, Mail, Calendar, DollarSign, X, Copy } from "lucide-react";
import { OrderTimelineCompact } from "./order-timeline-compact";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
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
    pixCopyPaste?: string;
    pixExpirationDate?: string;
    refundStatus?: string;
  };
}

export function CustomerOrderCard({ order }: CustomerOrderCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isExpired, setIsExpired] = useState(false);

  // Debug: Log order data to understand PIX section visibility
  console.log('Order debug:', {
    id: order.id,
    status: order.status,
    hasPixCopyPaste: !!order.pixCopyPaste,
    hasPixExpirationDate: !!order.pixExpirationDate,
    pixCopyPaste: order.pixCopyPaste?.substring(0, 50) + '...',
    pixExpirationDate: order.pixExpirationDate
  });

  const formatPrice = (price: string) => {
    return `R$ ${parseFloat(price).toFixed(2).replace('.', ',')}`;
  };

  // Função para formatar o tempo em MM:SS
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Função para copiar código PIX
  const copyPixCode = async () => {
    if (order.pixCopyPaste) {
      try {
        await navigator.clipboard.writeText(order.pixCopyPaste);
        toast({
          title: "Código copiado!",
          description: "Código PIX copiado para a área de transferência",
        });
      } catch (error) {
        toast({
          title: "Erro ao copiar",
          description: "Não foi possível copiar o código PIX",
          variant: "destructive",
        });
      }
    }
  };

  // Mutation para expirar pagamento automaticamente
  const expirePaymentMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/orders/${order.id}/expire-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!response.ok) {
        throw new Error('Erro ao expirar pagamento');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customer/orders"] });
    },
    onError: (error: Error) => {
      console.error('Error expiring payment:', error);
    }
  });

  // Mutation para verificar pagamento PIX manualmente
  const checkPixPaymentMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/orders/${order.id}/check-pix-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!response.ok) {
        throw new Error('Erro ao verificar pagamento');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Pagamento Confirmado!",
          description: "Seu pagamento PIX foi processado com sucesso.",
          variant: "default",
        });
        queryClient.invalidateQueries({ queryKey: ["/api/customer/orders"] });
      } else {
        toast({
          title: "Pagamento Pendente",
          description: "O pagamento ainda não foi processado. Tente novamente em alguns minutos.",
          variant: "default",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao Verificar",
        description: "Não foi possível verificar o status do pagamento. Tente novamente.",
        variant: "destructive",
      });
      console.error('Error checking PIX payment:', error);
    }
  });

  // useEffect para o countdown timer
  useEffect(() => {
    if (order.status === 'awaiting_payment' && order.pixExpirationDate) {
      const updateTimer = () => {
        const now = new Date().getTime();
        const expirationTime = new Date(order.pixExpirationDate!).getTime();
        const remainingTime = Math.max(0, Math.floor((expirationTime - now) / 1000));
        
        setTimeLeft(remainingTime);
        
        // Se o tempo expirou e ainda não foi marcado como expirado
        if (remainingTime <= 0 && !isExpired) {
          setIsExpired(true);
          expirePaymentMutation.mutate();
        }
      };

      updateTimer(); // Atualização inicial
      const interval = setInterval(updateTimer, 1000);

      return () => clearInterval(interval);
    }
  }, [order.status, order.pixExpirationDate, isExpired]);

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
      case 'awaiting_payment': return 'bg-orange-100 text-orange-800';
      case 'payment_confirmed': return 'bg-green-100 text-green-800';
      case 'payment_failed': return 'bg-red-100 text-red-800';
      case 'payment_expired': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendente';
      case 'confirmed': return 'Confirmado';
      case 'preparing': return 'Preparando';
      case 'ready': return 'Pronto para Retirada';
      case 'shipped': return 'Enviado';
      case 'completed': return 'Concluído';
      case 'cancelled': return 'Cancelado';
      case 'awaiting_payment': return 'Aguardando Pagamento';
      case 'payment_confirmed': return 'Pagamento Confirmado';
      case 'payment_failed': return 'Pagamento Falhou';
      case 'payment_expired': return 'Pagamento Expirado';
      default: return status;
    }
  };

  const getFulfillmentText = (method: string) => {
    switch (method) {
      case 'pickup': return 'Retirada no Local';
      case 'delivery': return 'Entrega';
      default: return method;
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
      case 'cancelled': return <X className="h-4 w-4" />;
      case 'awaiting_payment': return <Clock className="h-4 w-4" />;
      case 'payment_confirmed': return <CheckCircle className="h-4 w-4" />;
      case 'payment_failed': return <X className="h-4 w-4" />;
      case 'payment_expired': return <X className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  return (
    <Card className="w-full shadow-md hover:shadow-lg transition-shadow duration-200">
      <CardContent className="p-4 space-y-4">
        {/* Header do Pedido */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Package className="h-6 w-6 text-eco-green" />
            <div>
              <h3 className="font-semibold text-lg">Pedido #{order.id}</h3>
              {order.supermarketName && (
                <p className="text-sm text-gray-600">{order.supermarketName}</p>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-eco-green">{formatPrice(order.totalAmount)}</div>
            <div className="text-xs text-gray-500">
              {new Date(order.createdAt).toLocaleDateString('pt-BR')}
            </div>
          </div>
        </div>

        {/* Status e Método de Entrega */}
        <div className="flex items-center justify-between">
          <Badge className={`${getStatusColor(order.status)} flex items-center gap-1`}>
            {getStatusIcon(order.status)}
            {getStatusText(order.status)}
          </Badge>
          <div className="flex items-center gap-1 text-sm text-gray-600">
            <MapPin className="h-3 w-3" />
            {getFulfillmentText(order.fulfillmentMethod)}
          </div>
        </div>

        {/* Timeline do Pedido */}
        <OrderTimelineCompact 
          currentStatus={order.status} 
          fulfillmentMethod={order.fulfillmentMethod} 
        />

        {/* Lista de Itens */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Itens do Pedido</h4>
          <div className="space-y-1">
            {order.orderItems.map((item) => (
              <div key={item.id} className="flex justify-between items-center text-sm py-1">
                <div className="flex-1">
                  <span className="font-medium">{item.product.name}</span>
                  <span className="text-gray-500 ml-2">x{item.quantity}</span>
                </div>
                <div className="text-right">
                  <span className="font-medium">{formatPrice((parseFloat(item.priceAtTime) * item.quantity).toString())}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Seção PIX para pedidos aguardando pagamento */}
        {order.status === 'awaiting_payment' && order.pixCopyPaste && order.pixExpirationDate && (
          <div className="pt-2 border-t">
            <div className="bg-orange-500 rounded-lg p-4 text-white space-y-3">
              {/* Timer PIX */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  <span className="font-semibold">Tempo para Pagamento</span>
                </div>
                <div className="text-xl font-bold">
                  {timeLeft > 0 ? formatTime(timeLeft) : "EXPIRADO"}
                </div>
              </div>

              {timeLeft > 0 ? (
                <>
                  {/* Código PIX */}
                  <div>
                    <h5 className="font-medium mb-2">Código PIX Copia e Cola</h5>
                    <div className="bg-white/20 rounded p-2 text-xs font-mono break-all">
                      {order.pixCopyPaste}
                    </div>
                  </div>

                  {/* Botão Copiar */}
                  <Button 
                    onClick={copyPixCode}
                    className="w-full bg-white/20 hover:bg-white/30 text-white border border-white/30"
                    size="sm"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar Código PIX
                  </Button>
                </>
              ) : (
                <div className="text-center">
                  <p className="text-white/90">Tempo para pagamento expirou</p>
                  <p className="text-xs text-white/70">Faça um novo pedido para continuar</p>
                </div>
              )}
            </div>
          </div>
        )}

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