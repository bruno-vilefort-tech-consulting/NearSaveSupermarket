import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Store, Users, DollarSign, LogOut, Shield, Receipt } from "lucide-react";
import { useLocation } from "wouter";

interface AdminUser {
  id: number;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
}

function AdminDashboard() {
  const [, setLocation] = useLocation();
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);

  useEffect(() => {
    // Check if admin is logged in
    const adminInfo = localStorage.getItem('adminInfo');
    if (!adminInfo) {
      setLocation('/admin');
      return;
    }

    try {
      const parsedAdminInfo = JSON.parse(adminInfo);
      setAdminUser(parsedAdminInfo);
    } catch (error) {
      localStorage.removeItem('adminInfo');
      setLocation('/admin');
    }
  }, [setLocation]);

  const handleLogout = () => {
    localStorage.removeItem('adminInfo');
    setLocation('/admin');
  };

  if (!adminUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex">
      {/* Sidebar */}
      <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col">
        {/* Logo/Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-100 p-2 rounded-lg">
              <Shield className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">SaveUp</h1>
              <p className="text-xs text-gray-500">Administração</p>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-4 space-y-2">
          <Button
            variant="ghost"
            className="w-full justify-start h-12 text-left hover:bg-gray-100"
            onClick={() => setLocation('/admin/supermarkets')}
          >
            <Store className="h-5 w-5 mr-3 text-eco-green" />
            <span className="text-gray-700">Supermercados</span>
          </Button>

          <Button
            variant="ghost"
            className="w-full justify-start h-12 text-left hover:bg-gray-100"
            onClick={() => setLocation('/admin/customers')}
          >
            <Users className="h-5 w-5 mr-3 text-blue-600" />
            <span className="text-gray-700">Clientes</span>
          </Button>

          <Button
            variant="ghost"
            className="w-full justify-start h-12 text-left hover:bg-gray-100"
            onClick={() => setLocation('/admin/financial-statement')}
          >
            <Receipt className="h-5 w-5 mr-3 text-green-600" />
            <span className="text-gray-700">Demonstrativo Financeiro</span>
          </Button>

          <Button
            variant="ghost"
            className="w-full justify-start h-12 text-left hover:bg-gray-100"
            onClick={() => setLocation('/admin/supermarket-payments')}
          >
            <DollarSign className="h-5 w-5 mr-3 text-orange-600" />
            <span className="text-gray-700">Pagamentos aos Supermercados</span>
          </Button>


        </nav>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-gray-200">
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-900">{adminUser.name}</p>
            <p className="text-xs text-gray-500">{adminUser.email}</p>
          </div>
          <Button
            variant="outline"
            className="w-full justify-start h-10"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            <span>Sair</span>
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="h-16 border-b border-gray-200 flex items-center px-6">
          <h2 className="text-xl font-semibold text-gray-900">Dashboard</h2>
        </div>

        {/* Content */}
        <div className="flex-1 p-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center py-20">
              <div className="bg-gray-50 rounded-full p-6 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                <Shield className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                Bem-vindo ao Painel Administrativo
              </h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Use o menu lateral para navegar pelas diferentes seções do sistema SaveUp.
              </p>
              <div className="flex justify-center space-x-4">
                <Button 
                  onClick={() => setLocation('/admin/supermarkets')}
                  className="bg-eco-green hover:bg-eco-green/90"
                >
                  <Store className="h-4 w-4 mr-2" />
                  Gerenciar Supermercados
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setLocation('/admin/customers')}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Ver Clientes
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;