import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";

interface PixRefundButtonProps {
  order: {
    id: number;
    status: string;
    totalAmount: string;
    externalReference?: string;
    refundStatus?: string;
    refundAmount?: string;
    refundDate?: string;
  };
}

export function PixRefundButton({ order }: PixRefundButtonProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showConfirm, setShowConfirm] = useState(false);

  // Verificar se o pedido pode ser estornado via PIX
  const canRefundPix = () => {
    return order.externalReference && 
           order.status !== 'completed' && 
           (!order.refundStatus || order.refundStatus === 'failed');
  };

  // Mutation para estorno PIX
  const refundMutation = useMutation({
    mutationFn: async ({ orderId, reason }: { orderId: number; reason?: string }) => {
      const response = await apiRequest("POST", "/api/pix/refund", {
        orderId,
        reason: reason || "Cancelamento de pedido"
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        let errorMessage = "Erro ao processar estorno";
        try {
          const parsed = JSON.parse(errorData);
          errorMessage = parsed.message || errorMessage;
        } catch {
          // Use default message
        }
        throw new Error(errorMessage);
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Estorno Processado",
        description: `Estorno PIX processado com sucesso. ID: ${data.refundId}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/staff/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      setShowConfirm(false);
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Não autorizado",
          description: "Sessão expirada. Redirecionando...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/staff-login";
        }, 1000);
        return;
      }
      toast({
        title: "Erro no Estorno",
        description: error.message,
        variant: "destructive",
      });
      setShowConfirm(false);
    },
  });

  const handlePixRefund = () => {
    refundMutation.mutate({ 
      orderId: order.id, 
      reason: 'Cancelamento solicitado pelo estabelecimento' 
    });
  };

  // Se já foi estornado, mostrar status
  if (order.refundStatus === 'processing' || order.refundStatus === 'refunded') {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-green-600 border-green-200">
          <RefreshCw size={12} className="mr-1" />
          {order.refundStatus === 'processing' ? 'Estorno Processado' : 'Estornado'}
        </Badge>
        {order.refundAmount && (
          <span className="text-xs text-gray-500">
            R$ {parseFloat(order.refundAmount).toFixed(2)}
          </span>
        )}
      </div>
    );
  }

  // Se não pode estornar, não mostrar botão
  if (!canRefundPix()) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      {!showConfirm ? (
        <Button 
          size="sm"
          variant="outline"
          onClick={() => setShowConfirm(true)}
          className="text-blue-600 border-blue-200 hover:bg-blue-50"
        >
          <DollarSign size={14} className="mr-1" />
          Estornar PIX
        </Button>
      ) : (
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-600">Confirmar estorno?</span>
          <Button 
            size="sm"
            variant="destructive"
            onClick={handlePixRefund}
            disabled={refundMutation.isPending}
          >
            {refundMutation.isPending ? (
              <>
                <RefreshCw size={12} className="mr-1 animate-spin" />
                Processando...
              </>
            ) : (
              'Sim, estornar'
            )}
          </Button>
          <Button 
            size="sm"
            variant="outline"
            onClick={() => setShowConfirm(false)}
            disabled={refundMutation.isPending}
          >
            Cancelar
          </Button>
        </div>
      )}
    </div>
  );
}