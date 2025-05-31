import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { OrderCard } from "@/components/order/order-card";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const statusFilters = [
  { value: "", label: "All Orders" },
  { value: "pending", label: "Pending" },
  { value: "prepared", label: "Prepared" },
  { value: "shipped", label: "Shipped" },
  { value: "picked_up", label: "Picked Up" },
];

export default function Orders() {
  const [selectedStatus, setSelectedStatus] = useState("");

  const { data: orders, isLoading } = useQuery({
    queryKey: ["/api/orders", selectedStatus || undefined],
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="pb-20">
        <div className="p-4 space-y-4">
          {/* Status Filter */}
          <Card className="shadow-sm">
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
                        ? "bg-primary-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
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
                <p className="text-gray-500">Loading orders...</p>
              </div>
            ) : orders && orders.length > 0 ? (
              orders.map((order: any) => (
                <OrderCard key={order.id} order={order} />
              ))
            ) : (
              <Card className="shadow-sm">
                <CardContent className="p-8 text-center">
                  <p className="text-gray-500">No orders found</p>
                  <p className="text-sm text-gray-400 mt-1">
                    {selectedStatus 
                      ? `No orders with status "${selectedStatus}"`
                      : "No orders have been placed yet"
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
