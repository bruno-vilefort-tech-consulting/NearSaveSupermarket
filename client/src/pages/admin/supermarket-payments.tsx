import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { DollarSign, Clock, CreditCard, CheckCircle, Building2 } from "lucide-react";

interface PaymentSummary {
  supermarketPaymentStatus: string;
  totalAmount: number;
  orderCount: number;
}

interface OrderWithPaymentStatus {
  id: number;
  customerName: string;
  totalAmount: string;
  supermarketPaymentStatus: string;
  supermarketPaymentAmount: string;
  supermarketPaymentDate: string | null;
  supermarketPaymentNotes: string | null;
  createdAt: string;
  status: string;
}

function SupermarketPayments() {
  const [paymentSummary, setPaymentSummary] = useState<PaymentSummary[]>([]);
  const [orders, setOrders] = useState<OrderWithPaymentStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<OrderWithPaymentStatus | null>(null);
  const [newStatus, setNewStatus] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const fetchPaymentData = async () => {
    try {
      setLoading(true);
      
      // Fetch payment summary
      const summaryResponse = await fetch("/api/admin/supermarket-payments");
      if (summaryResponse.ok) {
        const summaryData = await summaryResponse.json();
        setPaymentSummary(summaryData);
      }

      // Fetch orders with payment status (using financial statement endpoint for now)
      const ordersResponse = await fetch("/api/admin/financial-statement");
      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json();
        setOrders(ordersData);
      }
    } catch (error) {
      console.error("Erro ao carregar dados de pagamento:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados de pagamento",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentData();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "aguardando_pagamento":
        return "bg-yellow-500";
      case "pagamento_antecipado":
        return "bg-blue-500";
      case "pagamento_realizado":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "aguardando_pagamento":
        return "Aguardando Pagamento SaveUP";
      case "pagamento_antecipado":
        return "Pagamento Antecipado SaveUP";
      case "pagamento_realizado":
        return "Pagamento Realizado SaveUP";
      default:
        return status;
    }
  };

  const handleUpdatePaymentStatus = async () => {
    if (!selectedOrder || !newStatus) return;

    try {
      const response = await fetch(`/api/admin/orders/${selectedOrder.id}/supermarket-payment`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
          amount: newAmount ? parseFloat(newAmount) : undefined,
          notes: newNotes,
        }),
      });

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Status de pagamento atualizado com sucesso",
        });
        setDialogOpen(false);
        fetchPaymentData();
        setSelectedOrder(null);
        setNewStatus("");
        setNewAmount("");
        setNewNotes("");
      } else {
        throw new Error("Erro ao atualizar status");
      }
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar status de pagamento",
        variant: "destructive",
      });
    }
  };

  const openUpdateDialog = (order: OrderWithPaymentStatus) => {
    setSelectedOrder(order);
    setNewStatus(order.supermarketPaymentStatus || "aguardando_pagamento");
    setNewAmount(order.supermarketPaymentAmount || order.totalAmount);
    setNewNotes(order.supermarketPaymentNotes || "");
    setDialogOpen(true);
  };

  const formatCurrency = (value: string | number) => {
    const numValue = typeof value === "string" ? parseFloat(value) : value;
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(numValue);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pagamentos aos Supermercados</h1>
          <p className="text-muted-foreground">
            Gerencie os pagamentos devidos aos supermercados parceiros
          </p>
        </div>
      </div>

      {/* Payment Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {paymentSummary.map((summary) => (
          <Card key={summary.supermarketPaymentStatus}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {getStatusLabel(summary.supermarketPaymentStatus)}
              </CardTitle>
              {summary.supermarketPaymentStatus === "aguardando_pagamento" && <Clock className="h-4 w-4 text-yellow-500" />}
              {summary.supermarketPaymentStatus === "pagamento_antecipado" && <CreditCard className="h-4 w-4 text-blue-500" />}
              {summary.supermarketPaymentStatus === "pagamento_realizado" && <CheckCircle className="h-4 w-4 text-green-500" />}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(summary.totalAmount)}</div>
              <p className="text-xs text-muted-foreground">
                {summary.orderCount} pedido{summary.orderCount !== 1 ? 's' : ''}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Pedidos Completados
          </CardTitle>
          <CardDescription>
            Lista de todos os pedidos completados e seus status de pagamento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {orders.length === 0 ? (
              <p className="text-center text-muted-foreground">Nenhum pedido encontrado</p>
            ) : (
              <div className="grid gap-4">
                {orders
                  .filter(order => order.status === 'completed')
                  .map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Pedido #{order.id}</span>
                        <Badge 
                          className={`${getStatusColor(order.supermarketPaymentStatus || 'aguardando_pagamento')} text-white`}
                        >
                          {getStatusLabel(order.supermarketPaymentStatus || 'aguardando_pagamento')}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Cliente: {order.customerName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Data: {new Date(order.createdAt).toLocaleDateString('pt-BR')}
                      </p>
                      {order.supermarketPaymentNotes && (
                        <p className="text-sm text-blue-600">
                          Observações: {order.supermarketPaymentNotes}
                        </p>
                      )}
                    </div>
                    
                    <div className="text-right space-y-1">
                      <div className="text-lg font-semibold">
                        {formatCurrency(order.totalAmount)}
                      </div>
                      {order.supermarketPaymentDate && (
                        <p className="text-xs text-green-600">
                          Pago em: {new Date(order.supermarketPaymentDate).toLocaleDateString('pt-BR')}
                        </p>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openUpdateDialog(order)}
                      >
                        Gerenciar Pagamento
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Update Payment Status Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Atualizar Status de Pagamento</DialogTitle>
            <DialogDescription>
              Pedido #{selectedOrder?.id} - {selectedOrder?.customerName}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Status do Pagamento</label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="aguardando_pagamento">Aguardando Pagamento SaveUP</SelectItem>
                  <SelectItem value="pagamento_antecipado">Pagamento Antecipado SaveUP</SelectItem>
                  <SelectItem value="pagamento_realizado">Pagamento Realizado SaveUP</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Valor do Pagamento</label>
              <Input
                type="number"
                step="0.01"
                placeholder="Valor em reais"
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Observações</label>
              <Textarea
                placeholder="Adicione observações sobre o pagamento..."
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleUpdatePaymentStatus}>
                Atualizar Status
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default SupermarketPayments;