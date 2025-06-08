import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Calendar, DollarSign, Clock, TrendingUp, FileText, Search, Filter, Eye, CheckCircle, XCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocation } from "wouter";

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

interface PendingPayment {
  id: number;
  customerName: string;
  totalAmount: string;
  completedAt: string;
  dueDate: string;
  netAmount: string;
  status: string;
  orderItems: {
    id: number;
    quantity: number;
    product: {
      name: string;
    };
  }[];
}

interface FinancialSummary {
  totalPending: number;
  totalReceived: number;
  ordersCount: number;
  avgOrderValue: number;
}

interface PaymentHistory {
  id: number;
  orderId: number;
  customerName: string;
  amount: string;
  paymentDate: string;
  paymentMethod: string;
  status: 'paid' | 'pending' | 'cancelled';
  type: 'sale' | 'refund';
}

function ValorAReceber() {
  const [staffUser, setStaffUser] = useState<StaffUser | null>(null);
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedPayment, setSelectedPayment] = useState<PendingPayment | null>(null);

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

  const { data: pendingPayments = [], isLoading } = useQuery({
    queryKey: ["/api/staff/pending-payments", staffUser?.id],
    enabled: !!staffUser?.id,
    queryFn: async () => {
      const response = await fetch('/api/staff/pending-payments', {
        headers: {
          'x-staff-id': staffUser!.id.toString()
        }
      });
      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }
      return response.json();
    },
  });

  // Query for financial summary
  const { data: financialSummary } = useQuery({
    queryKey: ["/api/staff/financial-summary", staffUser?.id],
    enabled: !!staffUser?.id,
    queryFn: async () => {
      const response = await fetch('/api/staff/financial-summary', {
        headers: {
          'x-staff-id': staffUser!.id.toString()
        }
      });
      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }
      return response.json();
    },
  });

  // Query for payment history
  const { data: paymentHistory = [] } = useQuery({
    queryKey: ["/api/staff/payment-history", staffUser?.id],
    enabled: !!staffUser?.id,
    queryFn: async () => {
      const response = await fetch('/api/staff/payment-history', {
        headers: {
          'x-staff-id': staffUser!.id.toString()
        }
      });
      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }
      return response.json();
    },
  });

  const totalPending = pendingPayments.reduce((sum: number, payment: PendingPayment) => 
    sum + parseFloat(payment.netAmount), 0
  );

  // Filter payments based on search and status
  const filteredPayments = pendingPayments.filter((payment: PendingPayment) => {
    const matchesSearch = payment.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.id.toString().includes(searchTerm);
    const matchesStatus = statusFilter === "all" || payment.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  const formatCurrency = (value: number | string) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return `R$ ${numValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  };

  const getDaysUntilDue = (dueDateString: string) => {
    const today = new Date();
    const dueDate = new Date(dueDateString);
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'pending': { variant: 'secondary' as const, label: 'Pendente', color: 'bg-yellow-100 text-yellow-800' },
      'paid': { variant: 'default' as const, label: 'Pago', color: 'bg-green-100 text-green-800' },
      'overdue': { variant: 'destructive' as const, label: 'Atrasado', color: 'bg-red-100 text-red-800' },
      'cancelled': { variant: 'outline' as const, label: 'Cancelado', color: 'bg-gray-100 text-gray-800' },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge variant={config.variant} className={config.color}>{config.label}</Badge>;
  };

  const getPaymentMethodBadge = (method: string) => {
    const methodConfig = {
      'pix': { label: 'PIX', color: 'bg-blue-100 text-blue-800' },
      'credit_card': { label: 'Cartão de Crédito', color: 'bg-purple-100 text-purple-800' },
      'bank_transfer': { label: 'Transferência', color: 'bg-green-100 text-green-800' },
    };
    
    const config = methodConfig[method as keyof typeof methodConfig] || { label: method, color: 'bg-gray-100 text-gray-800' };
    return <Badge variant="outline" className={config.color}>{config.label}</Badge>;
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
                <DollarSign className="h-6 w-6 text-eco-green" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Gestão Financeira
                </h1>
                <p className="text-sm text-gray-600">{staffUser.companyName}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Financial Management Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Valor a Receber Card */}
          <Card 
            className="transition-shadow hover:shadow-md cursor-pointer"
            onClick={() => setLocation('/supermercado/gestao-financeira/valor-a-receber')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Valor a Receber</CardTitle>
              <Clock className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                R$ {totalPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground">
                {pendingPayments.length} pedidos pendentes
              </p>
            </CardContent>
          </Card>

          {/* Valores Recebidos Card */}
          <Card className="transition-shadow hover:shadow-md cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Valores Recebidos</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                R$ 0,00
              </div>
              <p className="text-xs text-muted-foreground">
                Total já recebido
              </p>
            </CardContent>
          </Card>

          {/* Relatórios Card */}
          <Card className="transition-shadow hover:shadow-md cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Relatórios</CardTitle>
              <Calendar className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {pendingPayments.filter((p: PendingPayment) => getDaysUntilDue(p.dueDate) >= 0).length}
              </div>
              <p className="text-xs text-muted-foreground">
                Análises disponíveis
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default ValorAReceber;