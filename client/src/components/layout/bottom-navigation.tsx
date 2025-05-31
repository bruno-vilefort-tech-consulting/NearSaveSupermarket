import { Button } from "@/components/ui/button";
import { Home, Package, Plus, ShoppingCart, User, Bell } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";

export function BottomNavigation() {
  const [location, navigate] = useLocation();
  
  const { data: stats } = useQuery({
    queryKey: ["/api/stats"],
  });

  const navItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: Home,
      path: "/",
      isActive: location === "/",
    },
    {
      id: "products",
      label: "Products",
      icon: Package,
      path: "/products",
      isActive: location === "/products",
    },
    {
      id: "add",
      label: "Add",
      icon: Plus,
      path: "/add-product",
      isActive: location === "/add-product",
      isSpecial: true,
    },
    {
      id: "orders",
      label: "Orders",
      icon: ShoppingCart,
      path: "/orders",
      isActive: location === "/orders",
      badge: stats?.pendingOrders || 0,
    },
    {
      id: "profile",
      label: "Profile",
      icon: User,
      path: "/profile",
      isActive: location === "/profile",
    },
  ];

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2">
      <div className="flex justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          
          if (item.isSpecial) {
            return (
              <Button
                key={item.id}
                variant="ghost"
                size="sm"
                onClick={() => navigate(item.path)}
                className="flex flex-col items-center space-y-1 p-2 text-gray-400 hover:text-gray-600"
              >
                <div className="w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center -mt-1">
                  <Icon className="text-white" size={24} />
                </div>
                <span className="text-xs font-medium text-primary-600">{item.label}</span>
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
              className={`flex flex-col items-center space-y-1 p-2 relative ${
                item.isActive ? "text-primary-600" : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <Icon size={24} />
              <span className="text-xs font-medium">{item.label}</span>
              {item.badge && item.badge > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {item.badge}
                </span>
              )}
            </Button>
          );
        })}
      </div>
    </nav>
  );
}
