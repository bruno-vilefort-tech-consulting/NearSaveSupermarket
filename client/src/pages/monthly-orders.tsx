import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Package, TrendingUp, Receipt, ArrowLeft } from "lucide-react";
import { useStaffAuth } from "@/hooks/useStaffAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useLanguage } from "@/hooks/useLanguage";
import { useEffect } from "react";
import { useLocation } from "wouter";

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
  const { staffUser, isStaffAuthenticated, isLoading: authLoading } = useStaffAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [, navigate] = useLocation();

  // Function to translate month names from Portuguese to current language
  const translateMonth = (portugueseMonth: string): string => {
    const monthMap: Record<string, string> = {
      'janeiro': 'month.january',
      'fevereiro': 'month.february',
      'março': 'month.march',
      'abril': 'month.april',
      'maio': 'month.may',
      'junho': 'month.june',
      'julho': 'month.july',
      'agosto': 'month.august',
      'setembro': 'month.september',
      'outubro': 'month.october',
      'novembro': 'month.november',
      'dezembro': 'month.december'
    };

    // Extract month name and year from string like "junho de 2025"
    const parts = portugueseMonth.split(' de ');
    if (parts.length === 2) {
      const monthName = parts[0].toLowerCase();
      const year = parts[1];
      const translationKey = monthMap[monthName];
      if (translationKey) {
        return `${t(translationKey as any)} ${t('common.of')} ${year}`;
      }
    }
    
    return portugueseMonth; // Fallback to original if translation fails
  };

  const {
    data: monthlyData,
    isLoading,
    error,
    refetch
  } = useQuery<MonthlyOrderData[]>({
    queryKey: ['/api/staff/monthly-orders'],
    enabled: !!staffUser?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 30000, // Refresh every 30 seconds
    queryFn: async () => {
      const response = await fetch('/api/staff/monthly-orders', {
        headers: {
          'x-staff-id': staffUser?.id?.toString() || ''
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
    if (!authLoading && !isStaffAuthenticated) {
      toast({
        title: t('messages.unauthorized'),
        description: t('auth.loginRedirect'),
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/staff-login";
      }, 1000);
      return;
    }
  }, [isStaffAuthenticated, authLoading, toast]);

  useEffect(() => {
    if (error && isUnauthorizedError(error as Error)) {
      toast({
        title: t('messages.unauthorized'),
        description: t('messages.sessionExpired'),
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

  if (!isStaffAuthenticated) {
    return null; // Will redirect
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Receipt className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t('monthly.errorLoadingTitle')}</h3>
              <p className="text-muted-foreground mb-4">
                {t('monthly.errorLoadingMessage')}
              </p>
              <button 
                onClick={() => refetch()}
                className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90"
              >
                {t('common.tryAgain')}
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
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Calendar className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">{t('monthly.title')}</h1>
        </div>
        <Button
          variant="outline"
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('monthly.totalOrders')}</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              {t('monthly.completedOrdersLabel')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('monthly.totalRevenueLabel')}</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {t('monthly.totalReceived')}
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
              <h3 className="text-lg font-semibold mb-2">{t('monthly.noOrdersFoundTitle')}</h3>
              <p className="text-muted-foreground">
                {t('monthly.noOrdersFoundMessage')}
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
                  <span className="text-lg">{translateMonth(monthData.month)}</span>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">
                      {monthData.orders.length} {t('monthly.ordersCount')}
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