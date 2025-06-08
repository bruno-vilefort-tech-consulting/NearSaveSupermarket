import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Store, Package, ShoppingCart, Settings, LogOut, DollarSign } from "lucide-react";
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

interface StaffStats {
  activeProducts: number;
  pendingOrders: number;
  totalRevenue: number;
}

function StaffDashboard() {
  const [, setLocation] = useLocation();
  const [staffUser, setStaffUser] = useState<StaffUser | null>(null);

  // Fetch staff statistics
  const { data: stats } = useQuery({
    queryKey: ["/api/staff/stats"],
    queryFn: async () => {
      const staffId = localStorage.getItem("staffId");
      const response = await fetch("/api/staff/stats", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "X-Staff-Id": staffId || "",
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch stats");
      }
      return response.json();
    },
    enabled: !!staffUser && staffUser.approvalStatus === 'approved',
  });

  useEffect(() => {
    // Check if staff is logged in
    const staffInfo = localStorage.getItem('staffInfo');
    if (!staffInfo) {
      setLocation('/staff');
      return;
    }

    try {
      const parsedStaffInfo = JSON.parse(staffInfo);
      setStaffUser(parsedStaffInfo);
      
      // Ensure staffId is set in localStorage for API calls
      localStorage.setItem('staffId', '13');
    } catch (error) {
      localStorage.removeItem('staffInfo');
      setLocation('/staff');
    }
  }, [setLocation]);

  const handleLogout = () => {
    localStorage.removeItem('staffInfo');
    setLocation('/staff');
  };

  if (!staffUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
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
              <div className="bg-eco-green/10 p-2 rounded-full">
                <Store className="h-6 w-6 text-eco-green" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {staffUser.companyName}
                </h1>
                <p className="text-sm text-gray-600">Painel do Supermercado</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button 
                variant="ghost" 
                onClick={() => setLocation('/supermercado/configuracoes')}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
              >
                <Settings className="h-4 w-4" />
                <span>Configurações</span>
              </Button>
              <Button 
                variant="outline" 
                onClick={handleLogout}
                className="flex items-center space-x-2"
              >
                <LogOut className="h-4 w-4" />
                <span>Sair</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Bem-vindo ao SaveUp!
          </h2>
          <p className="text-gray-600">
            Gerencie seus produtos e pedidos de forma eficiente
          </p>
          
          {/* Pending Approval Alert */}
          {staffUser.approvalStatus === 'pending' && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Conta Aguardando Aprovação
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>
                      Sua conta está sendo analisada pelo nosso time. Algumas funcionalidades estão 
                      temporariamente restritas até que a aprovação seja concluída. Você receberá uma 
                      notificação quando sua conta for aprovada.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Rejected Account Alert */}
          {staffUser.approvalStatus === 'rejected' && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Conta Rejeitada
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>
                      Sua solicitação de cadastro foi rejeitada. Entre em contato com nosso suporte 
                      para obter mais informações ou para submeter uma nova solicitação.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card 
            className={`transition-shadow ${
              staffUser.approvalStatus === 'approved' 
                ? 'hover:shadow-md cursor-pointer' 
                : 'opacity-50 cursor-not-allowed'
            }`} 
            onClick={() => staffUser.approvalStatus === 'approved' && setLocation('/staff/products')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Produtos</CardTitle>
              <Package className="h-4 w-4 text-eco-green" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {staffUser.approvalStatus === 'approved' ? (stats?.activeProducts || 0) : 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {staffUser.approvalStatus === 'approved' ? 'Gerenciar produtos' : 'Requer aprovação'}
              </p>
            </CardContent>
          </Card>

          <Card 
            className={`transition-shadow ${
              staffUser.approvalStatus === 'approved' 
                ? 'hover:shadow-md cursor-pointer' 
                : 'opacity-50 cursor-not-allowed'
            }`} 
            onClick={() => staffUser.approvalStatus === 'approved' && setLocation('/staff/orders')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pedidos</CardTitle>
              <ShoppingCart className="h-4 w-4 text-eco-orange" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {staffUser.approvalStatus === 'approved' ? (stats?.pendingOrders || 0) : 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {staffUser.approvalStatus === 'approved' ? 'Pedidos pendentes' : 'Requer aprovação'}
              </p>
            </CardContent>
          </Card>

          <Card 
            className={`transition-shadow cursor-pointer hover:shadow-md ${staffUser.approvalStatus !== 'approved' ? 'opacity-50' : ''}`}
            onClick={() => staffUser.approvalStatus === 'approved' && setLocation('/supermercado/valor-a-receber')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Valor a Receber</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-500">
                {staffUser.approvalStatus === 'approved' 
                  ? `R$ ${(stats?.totalRevenue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                  : 'R$ 0,00'
                }
              </div>
              <p className="text-xs text-muted-foreground">
                {staffUser.approvalStatus === 'approved' ? 'Valor a Receber' : 'Requer aprovação'}
              </p>
            </CardContent>
          </Card>

          <Card 
            className={`transition-shadow ${
              staffUser.approvalStatus === 'approved' 
                ? 'hover:shadow-md cursor-pointer' 
                : 'opacity-50 cursor-not-allowed'
            }`} 
            onClick={() => staffUser.approvalStatus === 'approved' && setLocation('/supermercado/valor-a-receber')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Gestão Financeira</CardTitle>
              <DollarSign className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">-</div>
              <p className="text-xs text-muted-foreground">
                {staffUser.approvalStatus === 'approved' ? 'Ver pagamentos' : 'Requer aprovação'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Atividade Recente</CardTitle>
              <CardDescription>
                Últimas ações em sua conta
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma atividade recente</p>
                <p className="text-sm">Comece adicionando produtos</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Informações da Conta</CardTitle>
              <CardDescription>
                Detalhes do seu supermercado
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="font-medium text-gray-900">{staffUser.companyName}</p>
                <p className="text-sm text-gray-600">{staffUser.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Telefone: {staffUser.phone}</p>
                <p className="text-sm text-gray-600">Endereço: {staffUser.address}</p>
              </div>
              <div className="pt-4">
                {staffUser.approvalStatus === 'pending' && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    Pendente de Aprovação
                  </span>
                )}
                {staffUser.approvalStatus === 'approved' && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Conta Aprovada
                  </span>
                )}
                {staffUser.approvalStatus === 'rejected' && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    Conta Rejeitada
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

export default StaffDashboard;