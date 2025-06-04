import { Button } from "@/components/ui/button";
import { Home, Package, Plus, ShoppingCart, User, Bell } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useStaffAuth } from "@/hooks/useStaffAuth";
import { useLanguage } from "@/hooks/useLanguage";

export function BottomNavigation() {
  const [location, navigate] = useLocation();
  const { isStaffAuthenticated, logout } = useStaffAuth();
  const { t } = useLanguage();
  
  const { data: stats } = useQuery({
    queryKey: isStaffAuthenticated ? ["/api/staff/stats"] : ["/api/stats"],
    refetchInterval: 5000, // Auto-refresh every 5 seconds
  });

  const dashboardPath = isStaffAuthenticated ? "/dashboard" : "/";
  const isOnDashboard = location === "/" || location === "/dashboard";

  const navItems = [
    {
      id: "dashboard",
      label: t('nav.dashboard'),
      icon: Home,
      path: dashboardPath,
      isActive: isOnDashboard,
    },
    {
      id: "products",
      label: t('nav.products'),
      icon: Package,
      path: "/products",
      isActive: location === "/products",
    },
    {
      id: "add",
      label: t('nav.add'),
      icon: Plus,
      path: "/add-product",
      isActive: location === "/add-product",
      isSpecial: true,
    },
    {
      id: "orders",
      label: t('nav.orders'),
      icon: ShoppingCart,
      path: "/orders",
      isActive: location === "/orders",
      badge: stats?.pendingOrders || 0,
    },
    {
      id: "profile",
      label: t('nav.profile'),
      icon: User,
      path: "/profile",
      isActive: location === "/profile",
    },
  ];

  const handleLogout = () => {
    if (isStaffAuthenticated) {
      logout();
    } else {
      window.location.href = "/api/logout";
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-eco-gray-light px-4 py-2 shadow-lg">
      <div className="flex justify-around items-end">
        {navItems.map((item) => {
          const Icon = item.icon;
          
          if (item.isSpecial) {
            return (
              <Button
                key={item.id}
                variant="ghost"
                size="sm"
                onClick={() => navigate(item.path)}
                className="flex flex-col items-center p-2 text-eco-gray hover:text-eco-orange transition-colors"
              >
                <div className="w-10 h-10 bg-eco-green hover:bg-eco-green-dark rounded-full flex items-center justify-center mb-1 shadow-md transition-colors">
                  <Icon className="text-white" size={20} />
                </div>
                <span className="text-xs font-medium text-eco-green">{item.label}</span>
              </Button>
            );
          }

          return (
            <Button
              key={item.id}
              variant="ghost"
              size="sm"
              onClick={() => {
                if (item.id === "profile") {
                  handleLogout();
                } else {
                  navigate(item.path);
                }
              }}
              className={`flex flex-col items-center p-2 relative transition-colors ${
                item.isActive ? "text-eco-green" : "text-eco-gray hover:text-eco-orange"
              }`}
            >
              <div className="w-10 h-10 flex items-center justify-center mb-1 relative">
                <Icon size={20} />
                {item.badge && item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-eco-orange text-white text-xs rounded-full flex items-center justify-center shadow-sm">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-xs font-medium">{item.label}</span>
            </Button>
          );
        })}
      </div>
    </nav>
  );
}
