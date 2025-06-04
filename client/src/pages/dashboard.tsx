import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, ShoppingCart, Plus, List, Check, Calendar, Settings } from "lucide-react";
import { useLocation } from "wouter";
import { useStaffAuth } from "@/hooks/useStaffAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { LanguageSelector } from "@/components/ui/language-selector";

export default function Dashboard() {
  const [, navigate] = useLocation();
  const { isStaffAuthenticated } = useStaffAuth();
  const { t, setLanguage } = useLanguage();
  
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: isStaffAuthenticated ? ["/api/staff/stats"] : ["/api/stats"],
  });

  return (
    <div className="min-h-screen bg-eco-gray-light">
      <Header />
      
      <main className="pb-20">
        <div className="p-4 space-y-6">

          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="shadow-sm border-eco-green-light hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-eco-gray">{t('dashboard.stats.products')}</p>
                    <p className="text-2xl font-bold text-eco-gray-dark">
                      {statsLoading ? "..." : stats?.activeProducts || 0}
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-eco-green-light rounded-lg flex items-center justify-center shadow-sm">
                    <Package className="text-eco-green" size={20} />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="shadow-sm border-eco-orange-light hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-eco-gray">{t('dashboard.stats.orders')}</p>
                    <p className="text-2xl font-bold text-eco-gray-dark">
                      {statsLoading ? "..." : stats?.pendingOrders || 0}
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-eco-orange-light rounded-lg flex items-center justify-center shadow-sm">
                    <ShoppingCart className="text-eco-orange" size={20} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card className="shadow-sm border-eco-blue-light hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <h2 className="font-semibold text-eco-gray-dark mb-4">{t('dashboard.quickActions')}</h2>
              <div className="space-y-3">
                <Button
                  onClick={() => navigate("/add-product")}
                  variant="outline"
                  className="w-full flex items-center justify-between p-4 bg-eco-green-light border-eco-green rounded-xl hover:bg-eco-green hover:text-white transition-colors h-auto"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-eco-green rounded-lg flex items-center justify-center shadow-sm">
                      <Plus className="text-white" size={20} />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-eco-gray-dark">{t('dashboard.addProduct')}</p>
                      <p className="text-xs text-eco-gray">{t('dashboard.addProductDesc')}</p>
                    </div>
                  </div>
                </Button>
                
                <Button
                  onClick={() => navigate("/products")}
                  variant="outline"
                  className="w-full flex items-center justify-between p-4 bg-eco-blue-light border-eco-blue rounded-xl hover:bg-eco-blue hover:text-white transition-colors h-auto"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-eco-blue rounded-lg flex items-center justify-center shadow-sm">
                      <List className="text-white" size={20} />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-eco-gray-dark">{t('dashboard.manageProducts')}</p>
                      <p className="text-xs text-eco-gray">{t('dashboard.manageProductsDesc')}</p>
                    </div>
                  </div>
                </Button>
                
                <Button
                  onClick={() => navigate("/monthly-orders")}
                  variant="outline"
                  className="w-full flex items-center justify-between p-4 bg-eco-green-light border-eco-green-dark rounded-xl hover:bg-eco-green-dark hover:text-white transition-colors h-auto"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-eco-green-dark rounded-lg flex items-center justify-center shadow-sm">
                      <Calendar className="text-white" size={20} />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-eco-gray-dark">{t('dashboard.monthlyReport')}</p>
                      <p className="text-xs text-eco-gray">{t('dashboard.monthlyReportDesc')}</p>
                    </div>
                  </div>
                </Button>
                
                <Button
                  onClick={() => navigate("/settings")}
                  variant="outline"
                  className="w-full flex items-center justify-between p-4 bg-eco-orange-light border-eco-orange rounded-xl hover:bg-eco-orange hover:text-white transition-colors h-auto"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-eco-orange rounded-lg flex items-center justify-center shadow-sm">
                      <Settings className="text-white" size={20} />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-eco-gray-dark">Configurações</p>
                      <p className="text-xs text-eco-gray">Localização do supermercado</p>
                    </div>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="shadow-sm border-eco-gray-light hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <h2 className="font-semibold text-eco-gray-dark mb-4">{t('dashboard.recentActivity')}</h2>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 bg-eco-green-light rounded-lg">
                  <div className="w-8 h-8 bg-eco-green rounded-full flex items-center justify-center shadow-sm">
                    <Check className="text-white" size={16} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-eco-gray-dark">{t('dashboard.systemInitialized')}</p>
                    <p className="text-xs text-eco-gray">{t('dashboard.systemReady')}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      
      <BottomNavigation />
    </div>
  );
}
