import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { OrderCard } from "@/components/order/order-card";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/useLanguage";
import { useNotificationSound } from "@/hooks/useNotificationSound";


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
  const { playNotification } = useNotificationSound();
  const previousOrderCountRef = useRef<number>(0);

  const { data: orders, isLoading } = useQuery({
    queryKey: ["/api/staff/orders", selectedStatus],
    refetchInterval: false, // Disabled for better performance
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
    if (!orders) return;

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
  }, [orders, playNotification]);

  return (
    <div className="min-h-screen bg-eco-blue-light">
      <Header />
      
      <main className="pb-20">
        <div className="p-4 space-y-4">


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
