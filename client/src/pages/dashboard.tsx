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
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="pb-20">
        <div className="p-4 space-y-6">

          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{t('dashboard.stats.products')}</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {statsLoading ? "..." : stats?.activeProducts || 0}
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Package className="text-blue-600" size={20} />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{t('dashboard.stats.orders')}</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {statsLoading ? "..." : stats?.pendingOrders || 0}
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                    <ShoppingCart className="text-amber-600" size={20} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card className="shadow-sm">
            <CardContent className="p-6">
              <h2 className="font-semibold text-gray-900 mb-4">{t('dashboard.quickActions')}</h2>
              <div className="space-y-3">
                <Button
                  onClick={() => navigate("/add-product")}
                  variant="outline"
                  className="w-full flex items-center justify-between p-4 bg-primary-50 border-primary-200 rounded-xl hover:bg-primary-100 transition-colors h-auto"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                      <Plus className="text-white" size={20} />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900">{t('dashboard.addProduct')}</p>
                      <p className="text-xs text-gray-600">{t('dashboard.addProductDesc')}</p>
                    </div>
                  </div>
                </Button>
                
                <Button
                  onClick={() => navigate("/products")}
                  variant="outline"
                  className="w-full flex items-center justify-between p-4 bg-gray-50 border-gray-200 rounded-xl hover:bg-gray-100 transition-colors h-auto"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-600 rounded-lg flex items-center justify-center">
                      <List className="text-white" size={20} />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900">{t('dashboard.manageProducts')}</p>
                      <p className="text-xs text-gray-600">{t('dashboard.manageProductsDesc')}</p>
                    </div>
                  </div>
                </Button>
                
                <Button
                  onClick={() => navigate("/monthly-orders")}
                  variant="outline"
                  className="w-full flex items-center justify-between p-4 bg-green-50 border-green-200 rounded-xl hover:bg-green-100 transition-colors h-auto"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                      <Calendar className="text-white" size={20} />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900">{t('dashboard.monthlyReport')}</p>
                      <p className="text-xs text-gray-600">{t('dashboard.monthlyReportDesc')}</p>
                    </div>
                  </div>
                </Button>
                
                <Button
                  onClick={() => navigate("/settings")}
                  variant="outline"
                  className="w-full flex items-center justify-between p-4 bg-orange-50 border-orange-200 rounded-xl hover:bg-orange-100 transition-colors h-auto"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center">
                      <Settings className="text-white" size={20} />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900">Configurações</p>
                      <p className="text-xs text-gray-600">Localização do supermercado</p>
                    </div>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="shadow-sm">
            <CardContent className="p-6">
              <h2 className="font-semibold text-gray-900 mb-4">{t('dashboard.recentActivity')}</h2>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <Check className="text-green-600" size={16} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{t('dashboard.systemInitialized')}</p>
                    <p className="text-xs text-gray-500">{t('dashboard.systemReady')}</p>
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
