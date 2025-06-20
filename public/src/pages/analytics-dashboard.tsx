import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { Package, TrendingUp, DollarSign, Clock, Users, ShoppingCart } from "lucide-react";
import { BottomNavigation } from "@/components/staff/bottom-navigation";
import { useTranslation } from "@/hooks/useTranslation";
import { format, subDays, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AnalyticsData {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  productsSold: number;
  topCategories: Array<{
    category: string;
    revenue: number;
    orders: number;
    percentage: number;
  }>;
  dailyRevenue: Array<{
    date: string;
    revenue: number;
    orders: number;
  }>;
  hourlyDistribution: Array<{
    hour: number;
    orders: number;
  }>;
  expiringSoon: Array<{
    id: number;
    name: string;
    expirationDate: string;
    daysLeft: number;
  }>;
}

const COLORS = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#6B7280'];

export function AnalyticsDashboard() {
  const { t } = useTranslation();

  const { data: analytics, isLoading } = useQuery<AnalyticsData>({
    queryKey: ['/api/staff/analytics'],
  });

  if (isLoading || !analytics) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-eco-green mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando análises...</p>
        </div>
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-6 pb-20">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Analítico</h1>
          <p className="text-gray-600">Visão detalhada do desempenho do seu supermercado</p>
        </div>

        {/* Cards de Métricas Principais */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Receita Total</p>
                  <p className="text-2xl font-bold text-eco-green">
                    {formatCurrency(analytics.totalRevenue)}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-eco-green" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total de Pedidos</p>
                  <p className="text-2xl font-bold text-blue-600">{analytics.totalOrders}</p>
                </div>
                <ShoppingCart className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Ticket Médio</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {formatCurrency(analytics.averageOrderValue)}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Produtos Vendidos</p>
                  <p className="text-2xl font-bold text-orange-600">{analytics.productsSold}</p>
                </div>
                <Package className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Gráfico de Receita Diária */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Receita dos Últimos 7 Dias</CardTitle>
            <CardDescription>Evolução da receita e número de pedidos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics.dailyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => format(parseISO(value), 'dd/MM', { locale: ptBR })}
                  />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip 
                    labelFormatter={(value) => format(parseISO(value as string), 'dd/MM/yyyy', { locale: ptBR })}
                    formatter={(value, name) => [
                      name === 'revenue' ? formatCurrency(value as number) : value,
                      name === 'revenue' ? 'Receita' : 'Pedidos'
                    ]}
                  />
                  <Bar yAxisId="left" dataKey="revenue" fill="#10B981" name="revenue" />
                  <Line yAxisId="right" type="monotone" dataKey="orders" stroke="#3B82F6" strokeWidth={2} name="orders" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          {/* Top Categorias */}
          <Card>
            <CardHeader>
              <CardTitle>Categorias Mais Vendidas</CardTitle>
              <CardDescription>Distribuição de vendas por categoria</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics.topCategories}
                      dataKey="percentage"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ category, percentage }) => `${category} (${percentage.toFixed(1)}%)`}
                    >
                      {analytics.topCategories.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name) => [`${(value as number).toFixed(1)}%`, 'Participação']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Distribuição por Horário */}
          <Card>
            <CardHeader>
              <CardTitle>Pedidos por Horário</CardTitle>
              <CardDescription>Distribuição de pedidos ao longo do dia</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.hourlyDistribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="hour" 
                      tickFormatter={(value) => `${value}h`}
                    />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(value) => `${value}:00h`}
                      formatter={(value) => [value, 'Pedidos']}
                    />
                    <Bar dataKey="orders" fill="#8B5CF6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Produtos Expirando */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-red-500" />
              Produtos Próximos ao Vencimento
            </CardTitle>
            <CardDescription>Produtos que expiram nos próximos 3 dias</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.expiringSoon.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Nenhum produto expirando nos próximos dias</p>
            ) : (
              <div className="space-y-3">
                {analytics.expiringSoon.map((product) => (
                  <div key={product.id} className="flex justify-between items-center p-3 bg-red-50 rounded-lg border-l-4 border-red-400">
                    <div>
                      <p className="font-medium text-gray-900">{product.name}</p>
                      <p className="text-sm text-gray-600">
                        Expira em: {format(parseISO(product.expirationDate), 'dd/MM/yyyy', { locale: ptBR })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-red-600">
                        {product.daysLeft === 0 ? 'Hoje' : 
                         product.daysLeft === 1 ? 'Amanhã' : 
                         `${product.daysLeft} dias`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <BottomNavigation />
    </div>
  );
}