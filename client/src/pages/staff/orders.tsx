import { useQuery } from "@tanstack/react-query";
import { ShoppingCart, Filter, ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OrderCard } from "@/components/order/order-card";
import { useLocation } from "wouter";

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

interface StaffUser {
  id: number;
  email: string;
  companyName: string;
  phone: string;
  address: string;
  isActive: number;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  cnpj: string;
}

function StaffOrders() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [methodFilter, setMethodFilter] = useState<string>("all");
  const [staffUser, setStaffUser] = useState<StaffUser | null>(null);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const staffInfo = localStorage.getItem('staffInfo');
    if (!staffInfo) {
      setLocation('/staff');
      return;
    }

    try {
      const parsedStaffInfo = JSON.parse(staffInfo);
      setStaffUser(parsedStaffInfo);
    } catch (error) {
      localStorage.removeItem('staffInfo');
      setLocation('/staff');
    }
  }, [setLocation]);

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

  if (isLoading || !staffUser) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                onClick={() => setLocation('/supermercado/dashboard')}
                className="p-2"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="bg-eco-green/10 p-2 rounded-full">
                <ShoppingCart className="h-6 w-6 text-eco-green" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Gerenciar Pedidos
                </h1>
                <p className="text-sm text-gray-600">{staffUser.companyName}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

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
              <ShoppingCart className="h-5 w-5" />
              <span>Pedidos ({filteredOrders.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredOrders.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-gray-300" />
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