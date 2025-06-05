import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { OrderCard } from "@/components/order/order-card";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/useLanguage";
import { useNotificationSound } from "@/hooks/useNotificationSound";
import { Volume2, VolumeX } from "lucide-react";

const statusFilters = [
  { value: "", label: "Todos os Pedidos" },
  { value: "pending", label: "Pendente" },
  { value: "prepared", label: "Preparado" },
  { value: "shipped", label: "Enviado" },
  { value: "picked_up", label: "Retirado" },
];

export default function Orders() {
  const [selectedStatus, setSelectedStatus] = useState("");
  const { t } = useLanguage();
  const { isEnabled, isReady, enableSound, playNotification } = useNotificationSound();
  const previousOrderCountRef = useRef<number>(0);

  const { data: orders, isLoading } = useQuery({
    queryKey: ["/api/staff/orders", selectedStatus],
    refetchInterval: 5000, // Auto-refresh every 5 seconds
    queryFn: async () => {
      const url = selectedStatus 
        ? `/api/staff/orders?status=${selectedStatus}`
        : "/api/staff/orders";
      
      // Get staff info from localStorage to add to headers
      const staffUser = JSON.parse(localStorage.getItem('staffInfo') || '{}');
      console.log('Staff user from localStorage:', staffUser);
      console.log('Adding staff ID to headers:', staffUser.id);
      
      const response = await fetch(url, {
        headers: {
          'x-staff-id': staffUser.id?.toString() || '1'
        }
      });
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      return response.json();
    },
  });

  // Check for new orders and play notification sound
  useEffect(() => {
    if (!orders || !isEnabled) return;

    const currentOrderCount = orders.length;
    const pendingOrders = orders.filter((order: any) => order.status === 'pending').length;

    // If we have more pending orders than before, play notification
    if (previousOrderCountRef.current > 0 && pendingOrders > 0) {
      const previousPendingCount = localStorage.getItem('previousPendingCount');
      const prevPending = previousPendingCount ? parseInt(previousPendingCount) : 0;
      
      if (pendingOrders > prevPending) {
        console.log('🔔 New order detected! Playing notification sound...');
        playNotification();
      }
    }

    previousOrderCountRef.current = currentOrderCount;
    localStorage.setItem('previousPendingCount', pendingOrders.toString());
  }, [orders, isEnabled, playNotification]);

  const handleToggleSound = async () => {
    if (!isEnabled) {
      const success = await enableSound();
      if (success) {
        console.log('✅ Notification sound enabled');
        // Play a test sound to confirm it's working
        setTimeout(() => playNotification(), 100);
      }
    } else {
      // If sound is already enabled, play test sound
      console.log('🔊 Testing notification sound...');
      playNotification();
    }
  };

  return (
    <div className="min-h-screen bg-eco-blue-light">
      <Header />
      
      <main className="pb-20">
        <div className="p-4 space-y-4">
          {/* Notification Sound Control */}
          <Card className="shadow-sm border-eco-blue-light">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-eco-blue-light rounded-full flex items-center justify-center">
                    {isEnabled ? (
                      <Volume2 className="h-5 w-5 text-eco-blue" />
                    ) : (
                      <VolumeX className="h-5 w-5 text-eco-gray" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium text-eco-blue-dark">
                      {isEnabled ? "Som ativo" : "Som desativado"}
                    </h3>
                    <p className="text-sm text-eco-gray">
                      {isEnabled 
                        ? "Você será notificado quando novos pedidos chegarem"
                        : "Clique para ativar notificações sonoras"
                      }
                    </p>
                  </div>
                </div>
                <Button
                  onClick={handleToggleSound}
                  disabled={!isReady}
                  variant={isEnabled ? "outline" : "default"}
                  size="sm"
                  className={isEnabled ? "text-eco-blue border-eco-blue hover:bg-eco-blue-light" : "bg-eco-blue hover:bg-eco-blue-dark text-white"}
                >
                  {!isReady ? "Carregando..." : isEnabled ? "Testar Som" : "Ativar Som"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Status Filter */}
          <Card className="shadow-sm border-eco-blue-light">
            <CardContent className="p-4">
              <div className="flex space-x-2 overflow-x-auto pb-2">
                {statusFilters.map((filter) => (
                  <Button
                    key={filter.value}
                    variant={selectedStatus === filter.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedStatus(filter.value)}
                    className={`px-4 py-2 text-sm font-medium whitespace-nowrap rounded-full ${
                      selectedStatus === filter.value
                        ? "bg-eco-blue text-white hover:bg-eco-blue-dark"
                        : "bg-white text-eco-blue border-eco-blue hover:bg-eco-blue-light"
                    }`}
                  >
                    {filter.label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Orders List */}
          <div className="space-y-3">
            {isLoading ? (
              <div className="text-center py-8">
                <p className="text-eco-gray">Carregando pedidos...</p>
              </div>
            ) : orders && orders.length > 0 ? (
              orders.map((order: any) => (
                <OrderCard key={order.id} order={order} canEditStatus={true} />
              ))
            ) : (
              <Card className="shadow-sm border-eco-blue-light">
                <CardContent className="p-8 text-center">
                  <p className="text-eco-gray">Nenhum pedido encontrado</p>
                  <p className="text-sm text-eco-gray mt-1">
                    {selectedStatus 
                      ? `Nenhum pedido com status "${selectedStatus}"`
                      : "Nenhum pedido foi feito ainda"
                    }
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
      
      <BottomNavigation />
    </div>
  );
}
