import { useState, useEffect } from 'react';
import { useRoute, useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Package, AlertTriangle, CheckCircle, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface OrderItem {
  id: number;
  productId: number;
  quantity: number;
  priceAtTime: string;
  product: {
    id: number;
    name: string;
    imageUrl: string | null;
    category: string;
  };
}

interface Order {
  id: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  totalAmount: string;
  status: string;
  pixPaymentId: string | null;
  externalReference: string | null;
  orderItems: OrderItem[];
}

interface ConfirmationItem {
  orderItemId: number;
  productId: number;
  name: string;
  quantity: number;
  priceAtTime: number;
  imageUrl: string | null;
  category: string;
  confirmed: boolean;
}

export default function ConfirmOrderPage() {
  const [, params] = useRoute("/orders/:id/confirm");
  const [, navigate] = useLocation();
  const orderId = params?.id;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [confirmationItems, setConfirmationItems] = useState<ConfirmationItem[]>([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [refundInfo, setRefundInfo] = useState<{
    missingItems: ConfirmationItem[];
    refundAmount: number;
  } | null>(null);

  // Buscar dados do pedido
  const { data: order, isLoading } = useQuery({
    queryKey: [`/api/staff/orders/${orderId}`],
    enabled: !!orderId,
  });

  // Inicializar itens de confirmação quando o pedido carregar
  useEffect(() => {
    if (order) {
      const items: ConfirmationItem[] = order.orderItems.map((item: OrderItem) => ({
        orderItemId: item.id,
        productId: item.product.id,
        name: item.product.name,
        quantity: item.quantity,
        priceAtTime: parseFloat(item.priceAtTime),
        imageUrl: item.product.imageUrl,
        category: item.product.category,
        confirmed: true, // Por padrão todos estão confirmados
      }));
      setConfirmationItems(items);
    }
  }, [order]);

  // Mutation para confirmar pedido com itens selecionados
  const confirmOrderMutation = useMutation({
    mutationFn: async (data: { orderId: number; confirmedItems: ConfirmationItem[]; refundAmount?: number }) => {
      const response = await apiRequest("POST", `/api/staff/orders/${data.orderId}/confirm`, {
        confirmedItems: data.confirmedItems.map(item => ({
          orderItemId: item.orderItemId,
          confirmed: item.confirmed,
        })),
        refundAmount: data.refundAmount,
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        let errorMessage = "Erro ao confirmar pedido";
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
        title: "Pedido Confirmado",
        description: data.refundProcessed 
          ? `Pedido confirmado com sucesso. Estorno PIX de R$ ${data.refundAmount?.toFixed(2)} processado.`
          : "Pedido confirmado com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/staff/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/staff/stats"] });
      navigate("/orders");
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao Confirmar Pedido",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const toggleItemConfirmation = (orderItemId: number) => {
    setConfirmationItems(prev => 
      prev.map(item => 
        item.orderItemId === orderItemId 
          ? { ...item, confirmed: !item.confirmed }
          : item
      )
    );
  };

  const calculateTotals = () => {
    const confirmedItems = confirmationItems.filter(item => item.confirmed);
    const missingItems = confirmationItems.filter(item => !item.confirmed);
    
    const confirmedTotal = confirmedItems.reduce((sum, item) => sum + (item.priceAtTime * item.quantity), 0);
    const refundAmount = missingItems.reduce((sum, item) => sum + (item.priceAtTime * item.quantity), 0);
    
    return { confirmedItems, missingItems, confirmedTotal, refundAmount };
  };

  const handleConfirmOrder = () => {
    const { missingItems, refundAmount } = calculateTotals();
    
    if (missingItems.length > 0) {
      setRefundInfo({ missingItems, refundAmount });
      setShowConfirmDialog(true);
    } else {
      // Confirmação total - sem estorno
      confirmOrderMutation.mutate({
        orderId: parseInt(orderId!),
        confirmedItems: confirmationItems,
      });
    }
  };

  const confirmWithRefund = () => {
    const { refundAmount } = calculateTotals();
    setShowConfirmDialog(false); // Fechar modal imediatamente
    confirmOrderMutation.mutate({
      orderId: parseInt(orderId!),
      confirmedItems: confirmationItems,
      refundAmount,
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-eco-blue mx-auto mb-4"></div>
            <p className="text-eco-gray">Carregando pedido...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="text-center">
          <p className="text-eco-gray">Pedido não encontrado</p>
          <Button 
            variant="outline" 
            onClick={() => navigate("/orders")}
            className="mt-4"
          >
            Voltar aos Pedidos
          </Button>
        </div>
      </div>
    );
  }

  const { confirmedItems, missingItems, confirmedTotal, refundAmount } = calculateTotals();

  return (
    <div className="container mx-auto px-4 py-6 pb-20">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/orders")}
          className="text-eco-blue hover:bg-eco-blue-light"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-eco-blue-dark">Confirmar Pedido #{order.id}</h1>
          <p className="text-eco-gray">{order.customerName}</p>
        </div>
      </div>

      {/* Informações do Pedido */}
      <Card className="mb-6 border-eco-blue-light">
        <CardHeader className="bg-eco-blue-light">
          <CardTitle className="text-eco-blue-dark">Informações do Pedido</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Cliente:</span>
              <span className="ml-2">{order.customerName}</span>
            </div>
            <div>
              <span className="font-medium">Total Original:</span>
              <span className="ml-2 font-semibold text-eco-blue">R$ {parseFloat(order.totalAmount).toFixed(2)}</span>
            </div>
            <div>
              <span className="font-medium">Email:</span>
              <span className="ml-2">{order.customerEmail}</span>
            </div>
            <div>
              <span className="font-medium">Telefone:</span>
              <span className="ml-2">{order.customerPhone}</span>
            </div>
          </div>
          
          {order.pixPaymentId && (
            <div className="mt-4 p-3 bg-eco-blue-light border border-eco-blue rounded-lg">
              <div className="flex items-center gap-2 text-eco-blue-dark font-medium">
                <CreditCard className="h-4 w-4" />
                Pagamento PIX Detectado
              </div>
              <p className="text-sm text-eco-blue-dark mt-1">
                Itens não confirmados terão estorno automático processado.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lista de Itens para Confirmação */}
      <Card className="mb-6 border-eco-blue-light">
        <CardHeader className="bg-eco-blue-light">
          <CardTitle className="text-eco-blue-dark">Confirmar Itens do Pedido</CardTitle>
          <p className="text-sm text-eco-blue">Marque os itens que estão disponíveis para venda</p>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-4">
            {confirmationItems.map((item) => (
              <div key={item.orderItemId} className="flex items-center space-x-4 p-3 border border-eco-gray-light rounded-lg">
                <Checkbox
                  checked={item.confirmed}
                  onCheckedChange={() => toggleItemConfirmation(item.orderItemId)}
                  className="data-[state=checked]:bg-eco-blue data-[state=checked]:border-eco-blue"
                />
                
                <div className="w-12 h-12 bg-eco-blue-light rounded-lg flex items-center justify-center flex-shrink-0">
                  {item.imageUrl ? (
                    <img 
                      src={item.imageUrl} 
                      alt={item.name}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <Package className="text-eco-blue" size={16} />
                  )}
                </div>
                
                <div className="flex-1">
                  <h3 className="font-medium text-eco-blue-dark">{item.name}</h3>
                  <p className="text-sm text-eco-gray">{item.category}</p>
                  <p className="text-sm text-eco-gray">Quantidade: {item.quantity}</p>
                </div>
                
                <div className="text-right">
                  <p className="font-semibold text-eco-blue-dark">
                    R$ {(item.priceAtTime * item.quantity).toFixed(2)}
                  </p>
                  <Badge 
                    variant={item.confirmed ? "default" : "secondary"}
                    className={item.confirmed ? "bg-eco-blue text-white" : "bg-eco-gray-light text-eco-gray"}
                  >
                    {item.confirmed ? "Confirmado" : "Indisponível"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Resumo dos Totais */}
      <Card className="mb-6 border-eco-blue-light">
        <CardHeader className="bg-eco-blue-light">
          <CardTitle className="text-eco-blue-dark">Resumo da Confirmação</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>Itens Confirmados:</span>
              <span className="font-medium">{confirmedItems.length} de {confirmationItems.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Total Confirmado:</span>
              <span className="font-semibold text-eco-blue">R$ {confirmedTotal.toFixed(2)}</span>
            </div>
            {missingItems.length > 0 && (
              <>
                <Separator />
                <div className="flex justify-between text-red-600">
                  <span>Itens Indisponíveis:</span>
                  <span className="font-medium">{missingItems.length}</span>
                </div>
                <div className="flex justify-between text-red-600">
                  <span>Valor a Estornar:</span>
                  <span className="font-semibold">R$ {refundAmount.toFixed(2)}</span>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Botão de Confirmação */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-eco-blue-light p-4">
        <Button
          onClick={handleConfirmOrder}
          disabled={confirmOrderMutation.isPending || confirmedItems.length === 0}
          className="w-full bg-eco-blue hover:bg-eco-blue-dark text-white"
        >
          {confirmOrderMutation.isPending ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Processando...
            </div>
          ) : confirmedItems.length === 0 ? (
            "Nenhum Item Selecionado"
          ) : missingItems.length > 0 ? (
            `Confirmar ${confirmedItems.length} Itens e Estornar R$ ${refundAmount.toFixed(2)}`
          ) : (
            `Confirmar Todos os ${confirmedItems.length} Itens`
          )}
        </Button>
      </div>

      {/* Diálogo de Confirmação com Estorno */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-eco-blue-dark">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Confirmar Pedido com Estorno PIX
            </AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-3">
                <p>Alguns itens não estão disponíveis e serão removidos do pedido:</p>
                
                {refundInfo && (
                  <>
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                      <h4 className="font-medium text-orange-800 mb-2">Itens Indisponíveis:</h4>
                      <ul className="text-sm text-orange-700 space-y-1">
                        {refundInfo.missingItems.map((item) => (
                          <li key={item.orderItemId}>
                            • {item.name} (Qtd: {item.quantity}) - R$ {(item.priceAtTime * item.quantity).toFixed(2)}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="bg-eco-blue-light border border-eco-blue rounded-lg p-3">
                      <div className="flex items-center gap-2 text-eco-blue-dark font-medium mb-2">
                        <CreditCard className="h-4 w-4" />
                        Estorno PIX Automático
                      </div>
                      <p className="text-sm text-eco-blue-dark">
                        Valor a ser estornado: <strong>R$ {refundInfo.refundAmount.toFixed(2)}</strong>
                      </p>
                      <p className="text-xs text-eco-blue mt-1">
                        O cliente será notificado sobre o estorno e a confirmação parcial.
                      </p>
                    </div>
                  </>
                )}
                
                <p className="text-sm font-medium">
                  Deseja prosseguir com a confirmação parcial e estorno automático?
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-eco-blue text-eco-blue hover:bg-eco-blue-light">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmWithRefund}
              className="bg-eco-blue hover:bg-eco-blue-dark text-white"
            >
              Confirmar e Estornar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}