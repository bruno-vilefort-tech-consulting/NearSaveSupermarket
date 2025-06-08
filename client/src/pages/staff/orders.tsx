import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package, ShoppingCart, Clock, CheckCircle, X, Eye, Search, Calendar, DollarSign, User, MapPin, Phone, Mail, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
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
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: orders = [], isLoading, error } = useQuery<Order[]>({
    queryKey: ["/api/staff/orders"],
    retry: false,
    queryFn: async () => {
      const staffUser = localStorage.getItem('staffInfo');
      if (!staffUser) {
        throw new Error('Staff não autenticado');
      }
      
      const parsed = JSON.parse(staffUser);
      const response = await fetch('/api/staff/orders', {
        headers: {
          'X-Staff-Id': parsed.id.toString()
        }
      });
      
      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }
      
      return response.json();
    }
  });

  const formatCurrency = (value: string) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(parseFloat(value));
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'pending': { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800' },
      'confirmed': { label: 'Confirmado', color: 'bg-blue-100 text-blue-800' },
      'preparing': { label: 'Preparando', color: 'bg-orange-100 text-orange-800' },
      'ready': { label: 'Pronto', color: 'bg-green-100 text-green-800' },
      'delivered': { label: 'Entregue', color: 'bg-gray-100 text-gray-800' },
      'cancelled': { label: 'Cancelado', color: 'bg-red-100 text-red-800' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || 
                  { label: status, color: 'bg-gray-100 text-gray-800' };

    return (
      <Badge className={`${config.color} border-0`}>
        {config.label}
      </Badge>
    );
  };

  const getFulfillmentMethodBadge = (method: string) => {
    const methodConfig = {
      'pickup': { label: 'Retirada', color: 'bg-purple-100 text-purple-800' },
      'delivery': { label: 'Entrega', color: 'bg-green-100 text-green-800' },
    };

    const config = methodConfig[method as keyof typeof methodConfig] || 
                  { label: method, color: 'bg-gray-100 text-gray-800' };

    return (
      <Badge variant="outline" className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.id.toString().includes(searchTerm) ||
                         (order.customerEmail && order.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const totalOrdersCount = orders.length;
  const pendingOrdersCount = orders.filter(order => order.status === 'pending').length;
  const confirmedOrdersCount = orders.filter(order => order.status === 'confirmed').length;
  const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.totalAmount), 0);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <Card className="border-red-200">
            <CardContent className="p-6 text-center">
              <X className="h-12 w-12 mx-auto mb-4 text-red-500" />
              <h3 className="text-lg font-semibold text-red-700 mb-2">Erro ao carregar pedidos</h3>
              <p className="text-red-600 mb-4">
                Não foi possível carregar os pedidos. Verifique sua conexão.
              </p>
              <Button 
                onClick={() => window.location.reload()} 
                className="bg-red-600 hover:bg-red-700"
              >
                Tentar Novamente
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation('/supermercado/dashboard')}
              className="flex items-center space-x-2"
            >
              <ArrowLeft size={16} />
              <span>Voltar ao Dashboard</span>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Pedidos</h1>
              <p className="text-gray-600">Gerencie todos os pedidos dos seus produtos</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Pedidos</CardTitle>
              <Package className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalOrdersCount}</div>
              <p className="text-xs text-muted-foreground">Todos os pedidos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingOrdersCount}</div>
              <p className="text-xs text-muted-foreground">Aguardando confirmação</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Confirmados</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{confirmedOrdersCount}</div>
              <p className="text-xs text-muted-foreground">Em andamento</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Faturamento</CardTitle>
              <DollarSign className="h-4 w-4 text-eco-green" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalRevenue.toString())}</div>
              <p className="text-xs text-muted-foreground">Total vendido</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <ShoppingCart className="h-5 w-5" />
              <span>Lista de Pedidos</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Buscar por cliente, email ou número do pedido..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="confirmed">Confirmado</SelectItem>
                  <SelectItem value="preparing">Preparando</SelectItem>
                  <SelectItem value="ready">Pronto</SelectItem>
                  <SelectItem value="delivered">Entregue</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>

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
                {filteredOrders.map((order) => (
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