import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Clock, DollarSign, Calendar } from "lucide-react";
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

function ValorAReceberDetalhes() {
  const [staffUser, setStaffUser] = useState<StaffUser | null>(null);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const staffInfo = localStorage.getItem('staffInfo');
    if (!staffInfo) {
      setLocation('/supermercado/login');
      return;
    }

    try {
      const parsedInfo = JSON.parse(staffInfo);
      setStaffUser(parsedInfo);
    } catch (error) {
      console.error('Erro ao processar informações do staff:', error);
      setLocation('/supermercado/login');
    }
  }, [setLocation]);

  const { data: pendingPayments = [], isLoading } = useQuery<PendingPayment[]>({
    queryKey: ['/api/staff/pending-payments', staffUser?.id],
    enabled: !!staffUser?.id,
    queryFn: async () => {
      const response = await fetch('/api/staff/pending-payments', {
        headers: {
          'x-staff-id': staffUser!.id.toString()
        }
      });
      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }
      return response.json();
    },
  });

  // Ordenar por data crescente (mais antigos primeiro)
  const sortedPayments = [...pendingPayments].sort((a, b) => 
    new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime()
  );

  const totalPending = pendingPayments.reduce((sum: number, payment: PendingPayment) => 
    sum + parseFloat(payment.netAmount), 0
  );

  const getDaysUntilDue = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getStatusBadge = (daysUntilDue: number) => {
    if (daysUntilDue < 0) {
      return <Badge className="bg-red-500 hover:bg-red-600 text-white">Vencido</Badge>;
    } else if (daysUntilDue <= 3) {
      return <Badge className="bg-eco-orange hover:bg-eco-orange text-white">Vence em breve</Badge>;
    } else {
      return <Badge className="bg-eco-sage hover:bg-eco-sage text-white">No prazo</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-eco-cream">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-eco-gray-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation('/supermercado/gestao-financeira')}
                className="flex items-center space-x-2 hover:bg-eco-orange-light text-eco-blue"
              >
                <ArrowLeft className="h-4 w-4 text-eco-orange" />
                <span>Voltar</span>
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-eco-blue">Valor a Receber</h1>
                <p className="text-sm text-eco-gray">
                  Pedidos aguardando pagamento da SaveUp
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="border-eco-gray-light">
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="p-2 bg-eco-green-light rounded-lg">
                  <DollarSign className="h-5 w-5 text-eco-green" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-eco-gray">Total Pendente</p>
                  <p className="text-lg font-bold text-eco-blue">
                    R$ {totalPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-eco-gray-light">
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="p-2 bg-eco-blue-light rounded-lg">
                  <Calendar className="h-5 w-5 text-eco-blue" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-eco-gray">Total de Pedidos</p>
                  <p className="text-lg font-bold text-eco-blue">{sortedPayments.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-eco-gray-light">
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="p-2 bg-eco-sage-light rounded-lg">
                  <Clock className="h-5 w-5 text-eco-sage" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-eco-gray">No Prazo</p>
                  <p className="text-lg font-bold text-eco-blue">
                    {sortedPayments.filter(p => getDaysUntilDue(p.dueDate) >= 0).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-eco-gray-light">
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="p-2 bg-eco-orange-light rounded-lg">
                  <Clock className="h-5 w-5 text-eco-orange" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-eco-gray">Vencidos</p>
                  <p className="text-lg font-bold text-eco-blue">
                    {sortedPayments.filter(p => getDaysUntilDue(p.dueDate) < 0).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payments List */}
        <Card className="border-eco-gray-light">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-eco-blue">
              <Calendar className="h-5 w-5 text-eco-orange" />
              <span>Pedidos Pendentes - Ordenados por Data</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {sortedPayments.length === 0 ? (
              <div className="text-center py-12">
                <DollarSign className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum pagamento pendente</h3>
                <p className="text-gray-500">
                  Todos os seus pedidos foram pagos pela SaveUp.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {sortedPayments.map((payment: PendingPayment) => {
                  const daysUntilDue = getDaysUntilDue(payment.dueDate);
                  return (
                    <div key={payment.id} className="border border-eco-gray-light rounded-lg p-4 bg-white hover:bg-eco-cream transition-colors">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h3 className="font-semibold text-eco-blue text-lg">
                                Pedido #{payment.id}
                              </h3>
                              <p className="text-sm text-eco-gray">
                                Cliente: {payment.customerName}
                              </p>
                            </div>
                            <div className="text-right">
                              <div className="text-xl font-bold text-eco-green">
                                R$ {parseFloat(payment.netAmount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </div>
                              {getStatusBadge(daysUntilDue)}
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div className="bg-eco-sage-light p-3 rounded">
                              <span className="font-medium text-eco-gray-dark">Data de Conclusão:</span>
                              <p className="text-eco-blue">{formatDate(payment.completedAt)}</p>
                            </div>
                            <div className="bg-eco-sage-light p-3 rounded">
                              <span className="font-medium text-eco-gray-dark">Vencimento do Pagamento:</span>
                              <p className="text-eco-blue">{formatDate(payment.dueDate)}</p>
                            </div>
                            <div className="bg-eco-sage-light p-3 rounded">
                              <span className="font-medium text-eco-gray-dark">Status:</span>
                              <Badge variant="outline" className="text-eco-orange border-eco-orange mt-1">
                                Aguardando SaveUp
                              </Badge>
                            </div>
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

export default ValorAReceberDetalhes;