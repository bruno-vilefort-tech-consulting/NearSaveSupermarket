import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Clock, CreditCard } from "lucide-react";
import { Order } from "../../../../shared/schema";

interface CancelOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  order: Order;
  isLoading?: boolean;
}

export function CancelOrderModal({ isOpen, onClose, onConfirm, order, isLoading }: CancelOrderModalProps) {
  const hasPixPayment = order.pixPaymentId && order.status !== 'completed';
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Cancelar Pedido
          </DialogTitle>
          <DialogDescription>
            Tem certeza de que deseja cancelar este pedido?
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="space-y-4">
            {/* Informações do pedido */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="font-medium">Pedido:</span> #{order.id}
                </div>
                <div>
                  <span className="font-medium">Cliente:</span> {order.customerName}
                </div>
                <div>
                  <span className="font-medium">Valor:</span> R$ {parseFloat(order.totalAmount).toFixed(2)}
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span className="font-medium">Status:</span> {order.status}
                </div>
              </div>
            </div>

            {/* Aviso sobre estorno PIX */}
            {hasPixPayment && (
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <div className="flex items-start gap-2">
                  <CreditCard className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">
                      Estorno PIX Automático
                    </p>
                    <p className="text-xs text-blue-700 mt-1">
                      Como este pedido foi pago via PIX, o estorno será processado automaticamente 
                      e o valor será devolvido para o cliente em até 1 hora útil.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Aviso para pedidos já completos */}
            {order.status === 'completed' && (
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-900">
                      Pedido Completo
                    </p>
                    <p className="text-xs text-amber-700 mt-1">
                      Este pedido já foi marcado como completo. O cancelamento não processará estorno automático.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Voltar
          </Button>
          <Button 
            variant="destructive" 
            onClick={onConfirm} 
            disabled={isLoading}
            className="min-w-[120px]"
          >
            {isLoading ? "Cancelando..." : "Confirmar Cancelamento"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}