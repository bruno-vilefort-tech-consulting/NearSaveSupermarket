import { useQuery } from "@tanstack/react-query";
import { Package, Filter } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OrderCard } from "@/components/order/order-card";

interface OrderItem {
  id: number;
  quantity: number;
  priceAtTime: string;
  confirmationStatus: string | null;
  product: {
    id: number;
    name: string;
    description: string | null;
    category: string;
    imageUrl: string | null;
  };
}

interface Order {
  id: number;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  deliveryAddress: string | null;
  status: string;
  fulfillmentMethod: string;
  totalAmount: string;
  notes: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  orderItems: OrderItem[];
}

function StaffOrders() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [methodFilter, setMethodFilter] = useState<string>("all");

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["/api/staff/orders"],
    queryFn: async () => {
      const staffId = localStorage.getItem("staffId");
      const response = await fetch("/api/staff/orders", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "X-Staff-Id": staffId || "",
        },
      });
      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }
      return response.json();
    },
  });

  const filteredOrders = orders.filter((order: Order) => {
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    const matchesMethod = methodFilter === "all" || order.fulfillmentMethod === methodFilter;
    return matchesStatus && matchesMethod;
  });

  const getStatusCount = (status: string) => {
    if (status === "all") return orders.length;
    return orders.filter((order: Order) => order.status === status).length;
  };

  const getMethodCount = (method: string) => {
    if (method === "all") return orders.length;
    return orders.filter((order: Order) => order.fulfillmentMethod === method).length;
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Gerenciar Pedidos</h1>
          <p className="text-gray-600 mt-2">Acompanhe e gerencie todos os pedidos recebidos</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{getStatusCount("pending")}</div>
                <div className="text-sm text-gray-500">Pendentes</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{getStatusCount("confirmed")}</div>
                <div className="text-sm text-gray-500">Confirmados</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{getStatusCount("completed")}</div>
                <div className="text-sm text-gray-500">Concluídos</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{getStatusCount("cancelled")}</div>
                <div className="text-sm text-gray-500">Cancelados</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Filter className="h-5 w-5" />
              <span>Filtros</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrar por status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos ({getStatusCount("all")})</SelectItem>
                    <SelectItem value="pending">Pendente ({getStatusCount("pending")})</SelectItem>
                    <SelectItem value="confirmed">Confirmado ({getStatusCount("confirmed")})</SelectItem>
                    <SelectItem value="preparing">Preparando ({getStatusCount("preparing")})</SelectItem>
                    <SelectItem value="ready">Pronto ({getStatusCount("ready")})</SelectItem>
                    <SelectItem value="completed">Concluído ({getStatusCount("completed")})</SelectItem>
                    <SelectItem value="cancelled">Cancelado ({getStatusCount("cancelled")})</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Método de Entrega
                </label>
                <Select value={methodFilter} onValueChange={setMethodFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrar por método" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos ({getMethodCount("all")})</SelectItem>
                    <SelectItem value="pickup">Retirada ({getMethodCount("pickup")})</SelectItem>
                    <SelectItem value="delivery">Entrega ({getMethodCount("delivery")})</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Orders List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Package className="h-5 w-5" />
              <span>Pedidos ({filteredOrders.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredOrders.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum pedido encontrado</h3>
                <p className="text-gray-500">
                  {orders.length === 0 
                    ? "Você ainda não recebeu nenhum pedido."
                    : "Nenhum pedido corresponde aos filtros aplicados."
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredOrders.map((order: Order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    canEditStatus={true}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default StaffOrders;