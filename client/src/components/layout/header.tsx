import { useAuth } from "@/hooks/useAuth";
import { useStaffAuth } from "@/hooks/useStaffAuth";
import { useQuery } from "@tanstack/react-query";
import { Store, Bell, LogOut } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { LanguageSelector } from "@/components/ui/language-selector";

export function Header() {
  const { user } = useAuth();
  const { staffUser, logout: staffLogout, isStaffAuthenticated } = useStaffAuth();
  
  const { data: stats } = useQuery({
    queryKey: isStaffAuthenticated ? ["/api/staff/stats"] : ["/api/stats"],
    refetchInterval: 5000, // Auto-refresh every 5 seconds
  });

  const getInitials = (firstName?: string, lastName?: string) => {
    const first = firstName?.charAt(0) || "";
    const last = lastName?.charAt(0) || "";
    return `${first}${last}` || "U";
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
            <Store className="text-white" size={20} />
          </div>
          <div>
            <h1 className="font-semibold text-gray-900">
              {staffUser?.companyName || "Supermercado Silva"}
            </h1>
            <p className="text-xs text-gray-500">Painel da Equipe</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {/* Notification Bell */}
          <div className="relative">
            <Bell className="text-gray-600" size={20} />
            {stats?.pendingOrders && stats.pendingOrders > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {stats.pendingOrders}
              </span>
            )}
          </div>
          
          {/* Language Selector */}
          <LanguageSelector />
          
          {/* User Avatar */}
          <Avatar className="w-8 h-8">
            <AvatarImage src={user?.profileImageUrl || ""} alt="User avatar" />
            <AvatarFallback className="bg-gray-300 text-gray-700 text-sm">
              {getInitials(user?.firstName, user?.lastName)}
            </AvatarFallback>
          </Avatar>
          
          {/* Logout Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.location.href = "/api/logout"}
            className="text-gray-600 hover:text-gray-900"
          >
            <LogOut size={16} />
          </Button>
        </div>
      </div>
    </header>
  );
}
