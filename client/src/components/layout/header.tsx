import { useAuth } from "@/hooks/useAuth";
import { useStaffAuth } from "@/hooks/useStaffAuth";
import { useQuery } from "@tanstack/react-query";
import { Store, Bell, LogOut } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { LanguageSelector } from "@/components/ui/language-selector";
import { useLanguage } from "@/hooks/useLanguage";

export function Header() {
  const { user } = useAuth();
  const { staffUser, logout: staffLogout, isStaffAuthenticated } = useStaffAuth();
  const { t } = useLanguage();
  
  const { data: stats } = useQuery({
    queryKey: isStaffAuthenticated ? ["/api/staff/stats"] : ["/api/stats"],
    refetchInterval: false, // Disabled for better performance
  });

  const getInitials = (firstName?: string, lastName?: string) => {
    const first = firstName?.charAt(0) || "";
    const last = lastName?.charAt(0) || "";
    return `${first}${last}` || "U";
  };

  return (
    <header className="bg-white shadow-sm border-b border-eco-blue-light sticky top-0 z-40">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-eco-blue rounded-lg flex items-center justify-center shadow-sm">
            <Store className="text-white" size={20} />
          </div>
          <div>
            <h1 className="font-semibold text-eco-blue-dark">
              {staffUser?.companyName || "Supermercado Silva"}
            </h1>
            <p className="text-xs text-eco-gray">Painel do Staff</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {/* Notification Bell */}
          <div className="relative">
            <Bell className="text-eco-gray hover:text-eco-blue transition-colors" size={20} />
            {stats?.pendingOrders && stats.pendingOrders > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-eco-orange text-white text-xs rounded-full flex items-center justify-center shadow-sm">
                {stats.pendingOrders}
              </span>
            )}
          </div>
          
          {/* User Avatar */}
          <Avatar className="w-8 h-8 ring-2 ring-eco-blue-light">
            <AvatarImage src={user?.profileImageUrl || ""} alt="User avatar" />
            <AvatarFallback className="bg-eco-blue-light text-eco-blue-dark text-sm font-medium">
              {getInitials(user?.firstName, user?.lastName)}
            </AvatarFallback>
          </Avatar>
          
          {/* Logout Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.location.href = "/api/logout"}
            className="text-eco-gray hover:text-eco-blue hover:bg-eco-blue-light transition-colors"
          >
            <LogOut size={16} />
          </Button>
        </div>
      </div>
    </header>
  );
}
