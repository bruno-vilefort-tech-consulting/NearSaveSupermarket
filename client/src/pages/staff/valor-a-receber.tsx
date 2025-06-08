import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Calendar, BarChart3, Clock } from "lucide-react";
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";

interface StaffUser {
  id: number;
  email: string;
  companyName: string;
  phone: string;
  address: string;
  isActive: number;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  cnpj: string;
}

interface PendingPayment {
  id: number;
  customerName: string;
  totalAmount: string;
  completedAt: string;
  dueDate: string;
  netAmount: string;
  status: string;
  orderItems: {
    id: number;
    quantity: number;
    product: {
      name: string;
    };
  }[];
}

function ValorAReceber() {
  const [staffUser, setStaffUser] = useState<StaffUser | null>(null);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const staffInfo = localStorage.getItem('staffInfo');
    if (!staffInfo) {
      setLocation('/staff');
      return;
    }

    try {
      const parsedStaffInfo = JSON.parse(staffInfo);
      setStaffUser(parsedStaffInfo);
    } catch (error) {
      localStorage.removeItem('staffInfo');
      setLocation('/staff');
    }
  }, [setLocation]);

  const { data: pendingPayments = [], isLoading } = useQuery({
    queryKey: ["/api/staff/pending-payments", staffUser?.email],
    enabled: !!staffUser?.email,
    queryFn: async () => {
      const response = await fetch(`/api/staff/pending-payments?email=${encodeURIComponent(staffUser!.email)}`);
      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }
      return response.json();
    },
  });

  const totalPending = pendingPayments.reduce((sum: number, payment: PendingPayment) => 
    sum + parseFloat(payment.netAmount), 0
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  const getDaysUntilDue = (dueDateString: string) => {
    const today = new Date();
    const dueDate = new Date(dueDateString);
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getStatusBadge = (daysUntilDue: number) => {
    if (daysUntilDue < 0) {
      return <Badge variant="destructive">Pagamento Atrasado</Badge>;
    } else if (daysUntilDue <= 2) {
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Próximo ao Prazo</Badge>;
    } else {
      return <Badge variant="outline">Dentro do Prazo</Badge>;
    }
  };

  if (isLoading || !staffUser) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                onClick={() => setLocation('/supermercado/dashboard')}
                className="p-2"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="bg-eco-green/10 p-2 rounded-full">
                <BarChart3 className="h-6 w-6 text-eco-green" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Valor a Receber
                </h1>
                <p className="text-sm text-gray-600">{staffUser.companyName}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Summary Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>Resumo dos Pagamentos da SaveUp</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-500">
                  R$ {totalPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
                <div className="text-sm text-gray-500">Total a Receber da SaveUp</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-700">
                  {pendingPayments.length}
                </div>
                <div className="text-sm text-gray-500">Pedidos Aguardando Pagamento</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {pendingPayments.filter((p: PendingPayment) => getDaysUntilDue(p.dueDate) >= 0).length}
                </div>
                <div className="text-sm text-gray-500">Dentro do Prazo</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payments List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Pagamentos Pendentes ({pendingPayments.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pendingPayments.length === 0 ? (
              <div className="text-center py-12">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum pagamento pendente</h3>
                <p className="text-gray-500">
                  Todos os seus pedidos foram pagos pela SaveUp.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingPayments.map((payment: PendingPayment) => {
                  const daysUntilDue = getDaysUntilDue(payment.dueDate);
                  return (
                    <div key={payment.id} className="border rounded-lg p-3 hover:bg-gray-50 transition-colors">
                      <div className="flex justify-between items-center">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold text-gray-900">
                              Pedido #{payment.id}
                            </h3>
                            <div className="text-lg font-bold text-blue-500">
                              R$ {parseFloat(payment.netAmount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-gray-600">
                              {payment.customerName}
                            </p>
                            {getStatusBadge(daysUntilDue)}
                          </div>
                          <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                            <span>Concluído: {formatDate(payment.completedAt)}</span>
                            <span>Prazo: {formatDate(payment.dueDate)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default ValorAReceber;