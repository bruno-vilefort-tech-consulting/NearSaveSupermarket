import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Package, TrendingUp, Receipt } from "lucide-react";
import { useStaffAuth } from "@/hooks/useStaffAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useEffect } from "react";

interface MonthlyOrderData {
  month: string;
  orders: Array<{
    id: number;
    date: string;
    amount: string;
  }>;
  totalAmount: string;
}

export default function MonthlyOrders() {
  const { user, isAuthenticated, isLoading: authLoading } = useStaffAuth();
  const { toast } = useToast();

  const {
    data: monthlyData,
    isLoading,
    error,
    refetch
  } = useQuery<MonthlyOrderData[]>({
    queryKey: ['/api/staff/monthly-orders'],
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 30000, // Refresh every 30 seconds
    queryFn: async () => {
      const response = await fetch('/api/staff/monthly-orders', {
        headers: {
          'x-staff-id': user?.id?.toString() || ''
        }
      });
      
      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }
      
      return response.json();
    }
  });

  // Handle authentication errors
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Não autorizado",
        description: "Você precisa estar logado como staff. Redirecionando...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/staff-login";
      }, 1000);
      return;
    }
  }, [isAuthenticated, authLoading, toast]);

  useEffect(() => {
    if (error && isUnauthorizedError(error as Error)) {
      toast({
        title: "Não autorizado",
        description: "Você foi desconectado. Fazendo login novamente...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/staff-login";
      }, 1000);
      return;
    }
  }, [error, toast]);

  if (authLoading || isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Receipt className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Erro ao carregar dados</h3>
              <p className="text-muted-foreground mb-4">
                Não foi possível carregar o resumo mensal dos pedidos.
              </p>
              <button 
                onClick={() => refetch()}
                className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90"
              >
                Tentar novamente
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalRevenue = monthlyData?.reduce((sum, month) => 
    sum + parseFloat(month.totalAmount), 0
  ) || 0;

  const totalOrders = monthlyData?.reduce((sum, month) => 
    sum + month.orders.length, 0
  ) || 0;

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Calendar className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Resumo Mensal de Pedidos</h1>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Pedidos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              Pedidos concluídos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Valor total recebido
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Data */}
      {!monthlyData || monthlyData.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Receipt className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum pedido encontrado</h3>
              <p className="text-muted-foreground">
                Você ainda não possui pedidos concluídos.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {monthlyData.map((monthData, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="text-lg">{monthData.month}</span>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">
                      {monthData.orders.length} pedidos
                    </div>
                    <div className="text-lg font-bold text-green-600">
                      R$ {monthData.totalAmount}
                    </div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {monthData.orders.map((order) => (
                    <div 
                      key={order.id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <div>
                          <div className="font-medium">Pedido #{order.id}</div>
                          <div className="text-sm text-muted-foreground">
                            {order.date}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-green-600">
                          R$ {order.amount}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}