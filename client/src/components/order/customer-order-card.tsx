import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, Clock, CheckCircle, Truck, MapPin, Phone, Mail, Calendar, DollarSign, X, Copy } from "lucide-react";
import { OrderTimelineCompact } from "./order-timeline-compact";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import SupermarketLocationModal from "@/components/SupermarketLocationModal";

interface OrderItem {
  id: number;
  quantity: number;
  priceAtTime: string;
  confirmationStatus?: string;
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
    externalReference?: string;
    refundStatus?: string;
    refundAmount?: string;
    refundDate?: string;
    refundReason?: string;
    pixRefundId?: string;
  };
}

export function CustomerOrderCard({ order }: CustomerOrderCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isExpired, setIsExpired] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);

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
      }
      // Não mostrar toast para pagamentos pendentes quando executado automaticamente
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

  // useEffect para o countdown timer e monitoramento automático de pagamento
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

  // useEffect para monitoramento automático de pagamento PIX
  useEffect(() => {
    if (order.status === 'awaiting_payment' && order.pixPaymentId && !isExpired) {
      // Verificar status do pagamento a cada 10 segundos
      const checkPaymentInterval = setInterval(() => {
        checkPixPaymentMutation.mutate();
      }, 10000);

      return () => clearInterval(checkPaymentInterval);
    }
  }, [order.status, order.pixPaymentId, isExpired]);

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
      let description = "Pedido cancelado com sucesso.";
      
      if (data.refundProcessed && data.refundInfo) {
        const method = data.refundInfo.method === 'Stripe' ? 'cartão' : 'PIX';
        description = `Pedido cancelado com sucesso. Estorno de R$ ${data.refundInfo.amount.toFixed(2)} processado no ${method}.`;
      } else if (data.refundProcessed) {
        description = "Pedido cancelado com sucesso. Estorno processado automaticamente.";
      }
      
      toast({
        title: "Pedido Cancelado",
        description: description,
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

  // Verificar se o pedido pode ser cancelado (até ready, antes de completed)
  const canCancel = () => {
    return order.status === 'pending' || 
           order.status === 'confirmed' || 
           order.status === 'preparing' || 
           order.status === 'ready';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-eco-orange-light text-eco-orange-dark';
      case 'confirmed': return 'bg-eco-blue-light text-eco-blue-dark';
      case 'preparing': return 'bg-eco-orange-light text-eco-orange-dark';
      case 'ready': return 'bg-eco-green-light text-eco-green-dark';
      case 'shipped': return 'bg-eco-blue-light text-eco-blue-dark';
      case 'completed': return 'bg-eco-green-light text-eco-green-dark';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'cancelled-customer': return 'bg-red-100 text-red-800';
      case 'cancelled-staff': return 'bg-red-100 text-red-800';
      case 'awaiting_payment': return 'bg-eco-orange-light text-eco-orange-dark';
      case 'payment_confirmed': return 'bg-eco-green-light text-eco-green-dark';
      case 'payment_failed': return 'bg-red-100 text-red-800';
      case 'payment_expired': return 'bg-eco-gray-light text-eco-gray-dark';
      default: return 'bg-eco-gray-light text-eco-gray-dark';
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
      case 'cancelled-customer': return 'Cancelado pelo Cliente';
      case 'cancelled-staff': return 'Cancelado pelo Estabelecimento';
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

  const getRefundReasonText = (reason: string) => {
    switch (reason) {
      case 'staff_cancellation_remaining': return 'Cancelamento pelo estabelecimento';
      case 'customer_cancellation': return 'Cancelamento pelo cliente';
      case 'payment_failed': return 'Falha no pagamento';
      case 'duplicate_charge': return 'Cobrança duplicada';
      case 'requested_by_customer': return 'Solicitado pelo cliente';
      case 'fraudulent': return 'Transação fraudulenta';
      case 'subscription_canceled': return 'Assinatura cancelada';
      case 'product_unacceptable': return 'Produto inaceitável';
      case 'product_not_received': return 'Produto não recebido';
      case 'unrecognized': return 'Transação não reconhecida';
      case 'credit_not_processed': return 'Crédito não processado';
      case 'general': return 'Motivo geral';
      default: return reason;
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
    <>
      <Card className="w-full shadow-md hover:shadow-lg transition-shadow duration-200 bg-white border-eco-green-light">
      <CardContent className="p-4 space-y-4">
        {/* Header do Pedido */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Package className="h-6 w-6 text-eco-green" />
            <div>
              <h3 className="font-semibold text-lg text-eco-gray-dark">Pedido #{order.id}</h3>
              {order.supermarketName && (
                <button
                  onClick={() => setShowLocationModal(true)}
                  className="text-sm text-eco-blue hover:text-eco-blue-dark underline text-left transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {order.supermarketName}
                  </div>
                </button>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-eco-green">{formatPrice(order.totalAmount)}</div>
            <div className="text-xs text-eco-gray">
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
          <div className="flex items-center gap-1 text-sm text-eco-gray">
            <MapPin className="h-3 w-3 text-eco-gray" />
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
          <h4 className="text-sm font-medium text-eco-gray-dark">Itens do Pedido</h4>
          <div className="space-y-1">
            {order.orderItems.map((item) => (
              <div key={item.id} className="flex justify-between items-center text-sm py-1">
                <div className="flex-1 flex items-center gap-2">
                  {/* Status do item - visual indicator */}
                  {item.confirmationStatus === 'confirmed' && (
                    <CheckCircle className="h-4 w-4 text-eco-green flex-shrink-0" />
                  )}
                  {item.confirmationStatus === 'removed' && (
                    <X className="h-4 w-4 text-red-500 flex-shrink-0" />
                  )}
                  
                  <div className={item.confirmationStatus === 'removed' ? 'line-through text-eco-gray' : ''}>
                    <span className="font-medium text-eco-gray-dark">{item.product.name}</span>
                    <span className="text-eco-gray ml-2">x{item.quantity}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`font-medium ${item.confirmationStatus === 'removed' ? 'line-through text-eco-gray' : 'text-eco-green'}`}>
                    {formatPrice((parseFloat(item.priceAtTime) * item.quantity).toString())}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Seção PIX para pedidos aguardando pagamento */}
        {order.status === 'awaiting_payment' && order.pixCopyPaste && order.pixExpirationDate && (
          <div className="pt-2 border-t border-eco-gray-light">
            <div className="bg-eco-orange rounded-lg p-4 text-white space-y-3">
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
        <div className="pt-2 border-t border-eco-gray-light">
          <h4 className="text-sm font-medium mb-2 text-eco-gray-dark">Dados de Contato</h4>
          <div className="space-y-1 text-sm">
            {order.customerPhone && (
              <div className="flex items-center gap-2">
                <Phone className="h-3 w-3 text-eco-gray" />
                <span className="text-eco-gray-dark">{order.customerPhone}</span>
              </div>
            )}
            {order.customerEmail && (
              <div className="flex items-center gap-2">
                <Mail className="h-3 w-3 text-eco-gray" />
                <span className="text-eco-gray-dark">{order.customerEmail}</span>
              </div>
            )}
          </div>
        </div>

        {/* Seção de Estorno */}
        {order.refundAmount && order.refundStatus && order.refundDate && (
          <div className="pt-2 border-t border-eco-gray-light">
            <div className="bg-eco-blue-light rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-eco-blue" />
                <h5 className="font-semibold text-eco-blue">
                  {(() => {
                    const isFullRefund = parseFloat(order.refundAmount) === parseFloat(order.totalAmount);
                    const refundType = isFullRefund ? 'Total' : 'Parcial';
                    return `Estorno ${refundType}`;
                  })()}
                </h5>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-eco-gray">Valor estornado:</span>
                  <span className="font-medium text-eco-green">{formatPrice(order.refundAmount)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-eco-gray">Status:</span>
                  <Badge className={`text-xs ${
                    (order.refundStatus === 'approved' || order.refundStatus === 'succeeded') ? 'bg-eco-green text-white' :
                    order.refundStatus === 'pending' ? 'bg-eco-orange text-white' :
                    'bg-red-500 text-white'
                  }`}>
                    {(order.refundStatus === 'approved' || order.refundStatus === 'succeeded') ? 'Aprovado' :
                     order.refundStatus === 'pending' ? 'Processando' :
                     'Rejeitado'}
                  </Badge>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-eco-gray">Data do estorno:</span>
                  <span className="font-medium text-eco-gray-dark">
                    {new Date(order.refundDate).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit', 
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                
                {order.refundReason && (
                  <div className="flex justify-between">
                    <span className="text-eco-gray">Motivo:</span>
                    <span className="font-medium text-eco-gray-dark text-right max-w-[60%]">
                      {getRefundReasonText(order.refundReason)}
                    </span>
                  </div>
                )}
                
                {order.pixRefundId && (
                  <div className="flex justify-between">
                    <span className="text-eco-gray">ID do estorno:</span>
                    <span className="font-mono text-xs text-eco-gray-dark">
                      {order.pixRefundId}
                    </span>
                  </div>
                )}
              </div>
              
              {(order.refundStatus === 'approved' || order.refundStatus === 'succeeded') && (
                <div className="bg-eco-green/10 border border-eco-green/20 rounded p-2">
                  <p className="text-xs text-eco-green font-medium">
                    ✓ Estorno processado com sucesso. O valor será creditado em sua conta em até 1 dia útil.
                  </p>
                </div>
              )}
              
              {order.refundStatus === 'pending' && (
                <div className="bg-eco-orange/10 border border-eco-orange/20 rounded p-2">
                  <p className="text-xs text-eco-orange font-medium">
                    ⏳ Estorno em processamento. Aguarde a confirmação do Mercado Pago.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Botão de Cancelamento */}
        {canCancel() && (
          <div className="pt-2 border-t border-eco-gray-light">
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
                <p className="text-sm text-eco-gray text-center">
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
                    className="flex-1 border-eco-blue text-eco-blue hover:bg-eco-blue-light"
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
      
      {/* Supermarket Location Modal */}
      {order.supermarketName && (
        <SupermarketLocationModal
          isOpen={showLocationModal}
          onClose={() => setShowLocationModal(false)}
          supermarketName={order.supermarketName}
        />
      )}
    </>
  );
}