import { useQuery } from "@tanstack/react-query";
import { ShoppingCart, Filter, ArrowLeft, Bell, BellRing, Volume2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
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
  const [hasNewOrders, setHasNewOrders] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [lastOrderCount, setLastOrderCount] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

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
      if (!staffUser?.id) return [];
      const response = await fetch("/api/staff/orders", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "X-Staff-Id": staffUser.id.toString(),
        },
      });
      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }
      return response.json();
    },
    enabled: !!staffUser?.id,
    refetchInterval: 5000, // Atualiza a cada 5 segundos
  });

  // Função para tocar o som de notificação
  const playNotificationSound = () => {
    if (soundEnabled) {
      try {
        // Tentar usar o som Web Audio API personalizado primeiro
        createNotificationSound();
      } catch (error) {
        // Fallback para o áudio HTML5
        if (audioRef.current) {
          audioRef.current.currentTime = 0;
          audioRef.current.play().catch(console.error);
        }
      }
      
      // Repetir o som 3 vezes para garantir que seja bem ouvido
      setTimeout(() => {
        try {
          createNotificationSound();
        } catch (error) {
          if (audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(console.error);
          }
        }
      }, 600);
      
      setTimeout(() => {
        try {
          createNotificationSound();
        } catch (error) {
          if (audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(console.error);
          }
        }
      }, 1200);
    }
  };

  // Detectar novos pedidos
  useEffect(() => {
    if (orders.length > 0) {
      const pendingOrders = orders.filter((order: Order) => order.status === 'pending');
      
      if (lastOrderCount > 0 && pendingOrders.length > lastOrderCount) {
        setHasNewOrders(true);
        playNotificationSound();
        
        // Remove o alerta depois de 10 segundos
        setTimeout(() => setHasNewOrders(false), 10000);
      }
      
      setLastOrderCount(pendingOrders.length);
    }
  }, [orders, lastOrderCount, soundEnabled]);

  // Função para criar som de notificação personalizado - VOLUME ALTO
  const createNotificationSound = () => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Frequências mais agudas e altas para chamar atenção
    oscillator.frequency.setValueAtTime(1200, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(1500, audioContext.currentTime + 0.15);
    oscillator.frequency.setValueAtTime(1200, audioContext.currentTime + 0.3);
    oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.45);
    
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.8, audioContext.currentTime + 0.01); // Volume muito alto
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.6);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.6);
  };

  // Inicializar o áudio
  useEffect(() => {
    // Criar um áudio mais simples como fallback
    audioRef.current = new Audio();
    // Som de sino simples
    audioRef.current.src = "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAAAAAA4AQAAAQA4AQAAAABkYXRhVgYAAP//AAABAP//AAAAAAAAAAD//wAAAgD+/wEAAAAA//8BAAEA//8AAP//AAABAP//AAAAAAAAAAAAAAAA//8AAP//AAABAP//AQD//wAAAQD//wAA//8AAP//AAAAAAEA//8AAAAA//8AAP//AAABAP//AAD//wAAAQD//wAAAAABAP//AAAAAAEA//8AAAAAAAD//wAAAQD//wAA//8AAAEA//8AAAAA//8AAAAA//8AAAAA//8BAP//AAABAP//AAD//wAAAQD//wAAAAABAP//AAAAAAEA//8BAP//AAD//wAAAQD//wAAAAAA//8AAAAA//8AAAAA//8BAP//AAABAP//AAD//wAAAQD//wAAAAABAP//AAAAAAEA//8BAP//AAD//wAAAQD//wAAAAAA//8AAAAA//8AAAAA//8BAP//AAABAP//AAD//wAAAQD//wAAAAABAP//AAAAAAEA//8BAP//AAD//wAAAQD//wAAAAAA//8AAAAA//8AAAAA//8BAP//AAABAP//AAD//wAAAQD//wAAAAABAP//AAAAAAEA//8BAP//AAD//wAAAQD//wAAAAAA//8AAAAA//8AAAAA//8BAP//AAABAP//AAD//wAAAQD//wAAAAABAP//AAAAAAEA//8BAP//AAD//wAAAQD//wAAAAAA//8AAAAA//8AAAAA//8BAP//AAABAP//AAD//wAAAQD//wAAAAABAP//AAAAAAEA//8BAP//AAD//wAAAQD//wAAAAAA//8AAAAA";
    audioRef.current.volume = 1.0; // Volume máximo
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const filteredOrders = orders.filter((order: Order) => {
    let matchesStatus = false;
    if (statusFilter === "all") {
      matchesStatus = true;
    } else if (statusFilter === "cancelled") {
      // Inclui todos os tipos de cancelamento
      matchesStatus = order.status === "cancelled" || 
                    order.status === "cancelled-customer" || 
                    order.status === "cancelled-staff";
    } else {
      matchesStatus = order.status === statusFilter;
    }
    
    const matchesMethod = methodFilter === "all" || order.fulfillmentMethod === methodFilter;
    return matchesStatus && matchesMethod;
  });

  const getStatusCount = (status: string) => {
    if (status === "all") return orders.length;
    if (status === "cancelled") {
      // Conta todos os tipos de cancelamento: cliente e staff
      return orders.filter((order: Order) => 
        order.status === "cancelled" || 
        order.status === "cancelled-customer" || 
        order.status === "cancelled-staff"
      ).length;
    }
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
            
            {/* Notification Bell */}
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`p-3 relative ${hasNewOrders ? 'animate-bounce' : ''}`}
                title={soundEnabled ? "Desativar notificações sonoras" : "Ativar notificações sonoras"}
              >
                {hasNewOrders ? (
                  <BellRing className={`h-6 w-6 ${hasNewOrders ? 'text-red-500' : 'text-gray-600'}`} />
                ) : (
                  <Bell className={`h-6 w-6 ${soundEnabled ? 'text-eco-green' : 'text-gray-400'}`} />
                )}
                {hasNewOrders && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                )}
              </Button>
              
              <Button
                variant="ghost"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="p-2"
                title="Configurações de som"
              >
                <Volume2 className={`h-5 w-5 ${soundEnabled ? 'text-eco-green' : 'text-gray-400'}`} />
              </Button>
              
              <Button
                variant="outline"
                onClick={playNotificationSound}
                className="px-3 py-2 text-xs"
                title="Testar som de notificação"
              >
                Testar Som
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* New Order Alert Banner */}
      {hasNewOrders && (
        <div className="bg-red-500 text-white py-3 px-4 animate-pulse">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <BellRing className="h-6 w-6 animate-bounce" />
              <div>
                <div className="font-bold">🚨 NOVO PEDIDO RECEBIDO!</div>
                <div className="text-sm">Verifique os pedidos pendentes abaixo</div>
              </div>
            </div>
            <Button
              variant="ghost"
              onClick={() => setHasNewOrders(false)}
              className="text-white hover:bg-red-600 p-2"
            >
              ✕
            </Button>
          </div>
        </div>
      )}

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