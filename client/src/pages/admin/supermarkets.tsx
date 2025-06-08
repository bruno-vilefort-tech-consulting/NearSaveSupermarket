import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Store, ArrowLeft, Plus, Edit, MapPin, CreditCard, Building, CheckCircle, XCircle, Receipt, Eye, DollarSign, Calendar } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface FinancialItem {
  orderId: number;
  customerName: string;
  customerEmail: string | null;
  supermarketId: number;
  supermarketName: string;
  orderTotal: string;
  commercialRate: string;
  rateAmount: string;
  amountToReceive: string;
  orderDate: Date | null;
  paymentTerms: number;
  paymentDate: Date;
  status: string;
  items: Array<{
    productName: string;
    quantity: number;
    unitPrice: string;
    totalPrice: string;
  }>;
}

interface Supermarket {
  id: number;
  companyName: string;
  email: string;
  cnpj: string;
  phone: string;
  address: string;
  latitude: string | null;
  longitude: string | null;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  commercialRate?: number;
  paymentTerms?: number;
  isActive: boolean;
  createdAt: Date;
}

function AdminSupermarkets() {
  const [, setLocation] = useLocation();
  const [selectedSupermarket, setSelectedSupermarket] = useState<Supermarket | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form states
  const [generalData, setGeneralData] = useState({
    companyName: "",
    cnpj: "",
    email: "",
    phone: "",
    address: ""
  });

  const [commercialData, setCommercialData] = useState({
    commercialRate: 0,
    paymentTerms: 30
  });

  const [locationData, setLocationData] = useState({
    latitude: "",
    longitude: ""
  });

  const [approvalData, setApprovalData] = useState({
    approvalStatus: "pending" as 'pending' | 'approved' | 'rejected'
  });

  useEffect(() => {
    // Check if admin is logged in
    const adminInfo = localStorage.getItem('adminInfo');
    if (!adminInfo) {
      setLocation('/admin');
      return;
    }
  }, [setLocation]);

  const { data: supermarkets = [], isLoading, refetch } = useQuery<Supermarket[]>({
    queryKey: ["/api/admin/supermarkets"],
    retry: false,
  });

  // Reset form when creating new or selecting different supermarket
  useEffect(() => {
    if (selectedSupermarket) {
      setGeneralData({
        companyName: selectedSupermarket.companyName,
        cnpj: selectedSupermarket.cnpj,
        email: selectedSupermarket.email,
        phone: selectedSupermarket.phone,
        address: selectedSupermarket.address
      });
      setCommercialData({
        commercialRate: selectedSupermarket.commercialRate || 0,
        paymentTerms: selectedSupermarket.paymentTerms || 30
      });
      setLocationData({
        latitude: selectedSupermarket.latitude || "",
        longitude: selectedSupermarket.longitude || ""
      });
      setApprovalData({
        approvalStatus: selectedSupermarket.approvalStatus
      });
    } else {
      // Reset form for new supermarket
      setGeneralData({
        companyName: "",
        cnpj: "",
        email: "",
        phone: "",
        address: ""
      });
      setCommercialData({
        commercialRate: 5, // Default 5%
        paymentTerms: 30
      });
      setLocationData({
        latitude: "",
        longitude: ""
      });
      setApprovalData({
        approvalStatus: "pending"
      });
    }
  }, [selectedSupermarket]);

  const updateSupermarketMutation = useMutation({
    mutationFn: async (data: any) => {
      if (selectedSupermarket) {
        return apiRequest("PUT", `/api/admin/supermarkets/${selectedSupermarket.id}`, data);
      } else {
        return apiRequest("POST", "/api/admin/supermarkets", data);
      }
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: selectedSupermarket ? "Supermercado atualizado com sucesso" : "Supermercado criado com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/supermarkets"] });
      setSelectedSupermarket(null);
      setIsCreating(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar supermercado",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    const data = {
      ...generalData,
      ...commercialData,
      ...locationData,
      ...approvalData
    };
    updateSupermarketMutation.mutate(data);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Aprovado</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Rejeitado</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800">Pendente</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // Show form when creating or editing
  if (isCreating || selectedSupermarket) {
    return (
      <div className="min-h-screen bg-white flex">
        {/* Sidebar */}
        <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="bg-indigo-100 p-2 rounded-lg">
                <Store className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">SaveUp</h1>
                <p className="text-xs text-gray-500">Administração</p>
              </div>
            </div>
          </div>
          <nav className="flex-1 p-4">
            <Button
              variant="ghost"
              className="w-full justify-start mb-2"
              onClick={() => setLocation('/admin/dashboard')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao Dashboard
            </Button>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          <div className="h-16 border-b border-gray-200 flex items-center justify-between px-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {selectedSupermarket ? 'Editar Supermercado' : 'Novo Supermercado'}
            </h2>
            <div className="space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedSupermarket(null);
                  setIsCreating(false);
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                disabled={updateSupermarketMutation.isPending}
                className="bg-eco-green hover:bg-eco-green/90"
              >
                {updateSupermarketMutation.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </div>

          <div className="flex-1 flex">
            {/* Sidebar vertical navigation */}
            <div className="w-64 bg-gray-50 border-r border-gray-200">
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-4">Gerenciar Supermercado</h3>
                <nav className="space-y-2">
                  <button
                    onClick={() => setActiveTab('general')}
                    className={`w-full text-left px-3 py-3 rounded-lg text-sm font-medium transition-all ${
                      activeTab === 'general'
                        ? 'bg-blue-500 text-white shadow-md'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-white hover:shadow-sm'
                    }`}
                  >
                    <Building className="h-4 w-4 inline mr-3" />
                    Dados Gerais
                  </button>
                  <button
                    onClick={() => setActiveTab('commercial')}
                    className={`w-full text-left px-3 py-3 rounded-lg text-sm font-medium transition-all ${
                      activeTab === 'commercial'
                        ? 'bg-blue-500 text-white shadow-md'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-white hover:shadow-sm'
                    }`}
                  >
                    <CreditCard className="h-4 w-4 inline mr-3" />
                    Comercial
                  </button>
                  <button
                    onClick={() => setActiveTab('location')}
                    className={`w-full text-left px-3 py-3 rounded-lg text-sm font-medium transition-all ${
                      activeTab === 'location'
                        ? 'bg-blue-500 text-white shadow-md'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-white hover:shadow-sm'
                    }`}
                  >
                    <MapPin className="h-4 w-4 inline mr-3" />
                    Localização
                  </button>
                  <button
                    onClick={() => setActiveTab('approval')}
                    className={`w-full text-left px-3 py-3 rounded-lg text-sm font-medium transition-all ${
                      activeTab === 'approval'
                        ? 'bg-blue-500 text-white shadow-md'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-white hover:shadow-sm'
                    }`}
                  >
                    <CheckCircle className="h-4 w-4 inline mr-3" />
                    Aprovação
                  </button>
                  <button
                    onClick={() => setActiveTab('financial')}
                    className={`w-full text-left px-3 py-3 rounded-lg text-sm font-medium transition-all ${
                      activeTab === 'financial'
                        ? 'bg-blue-500 text-white shadow-md'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-white hover:shadow-sm'
                    }`}
                  >
                    <Receipt className="h-4 w-4 inline mr-3" />
                    Extrato Financeiro
                  </button>
                  
                  {/* Voltar button at the bottom */}
                  <div className="pt-6 mt-6 border-t border-gray-300">
                    <Button
                      variant="outline"
                      className="w-full bg-white hover:bg-gray-100 border-gray-300"
                      onClick={() => setSelectedSupermarket(null)}
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Voltar à Lista
                    </Button>
                  </div>
                </nav>
              </div>
            </div>

            {/* Content area */}
            <div className="flex-1 p-6">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="hidden">
                  <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="general">Dados Gerais</TabsTrigger>
                    <TabsTrigger value="commercial">Comercial</TabsTrigger>
                    <TabsTrigger value="location">Localização</TabsTrigger>
                    <TabsTrigger value="approval">Aprovação</TabsTrigger>
                    <TabsTrigger value="financial">Extrato Financeiro</TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="general" className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Informações Gerais</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="companyName">Nome da Empresa</Label>
                          <Input
                            id="companyName"
                            value={generalData.companyName}
                            onChange={(e) => setGeneralData({ ...generalData, companyName: e.target.value })}
                            placeholder="Nome do supermercado"
                          />
                        </div>
                        <div>
                          <Label htmlFor="cnpj">CNPJ</Label>
                          <Input
                            id="cnpj"
                            value={generalData.cnpj}
                            onChange={(e) => setGeneralData({ ...generalData, cnpj: e.target.value })}
                            placeholder="00.000.000/0000-00"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            value={generalData.email}
                            onChange={(e) => setGeneralData({ ...generalData, email: e.target.value })}
                            placeholder="contato@supermercado.com"
                          />
                        </div>
                        <div>
                          <Label htmlFor="phone">Telefone</Label>
                          <Input
                            id="phone"
                            value={generalData.phone}
                            onChange={(e) => setGeneralData({ ...generalData, phone: e.target.value })}
                            placeholder="(11) 99999-9999"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="address">Endereço Completo</Label>
                        <Input
                          id="address"
                          value={generalData.address}
                          onChange={(e) => setGeneralData({ ...generalData, address: e.target.value })}
                          placeholder="Rua, número, bairro, cidade, estado, CEP"
                        />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="commercial" className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Relacionamento Comercial</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="commercialRate">Taxa por Pedido (%)</Label>
                          <Input
                            id="commercialRate"
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            value={commercialData.commercialRate}
                            onChange={(e) => setCommercialData({ ...commercialData, commercialRate: parseFloat(e.target.value) || 0 })}
                            placeholder="5.0"
                          />
                          <p className="text-xs text-gray-500 mt-1">Porcentagem cobrada sobre cada pedido</p>
                        </div>
                        <div>
                          <Label htmlFor="paymentTerms">Prazo de Pagamento (dias)</Label>
                          <Input
                            id="paymentTerms"
                            type="number"
                            min="1"
                            max="365"
                            value={commercialData.paymentTerms}
                            onChange={(e) => setCommercialData({ ...commercialData, paymentTerms: parseInt(e.target.value) || 30 })}
                            placeholder="30"
                          />
                          <p className="text-xs text-gray-500 mt-1">Dias para pagamento após a data do pedido</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="location" className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Geolocalização</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="latitude">Latitude</Label>
                          <Input
                            id="latitude"
                            value={locationData.latitude}
                            onChange={(e) => setLocationData({ ...locationData, latitude: e.target.value })}
                            placeholder="-23.5505"
                          />
                        </div>
                        <div>
                          <Label htmlFor="longitude">Longitude</Label>
                          <Input
                            id="longitude"
                            value={locationData.longitude}
                            onChange={(e) => setLocationData({ ...locationData, longitude: e.target.value })}
                            placeholder="-46.6333"
                          />
                        </div>
                      </div>
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-800">
                          <strong>Dica:</strong> Use ferramentas como Google Maps para obter as coordenadas exatas do supermercado.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="approval" className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Status de Aprovação</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="approvalStatus">Status do Cadastro</Label>
                        <Select
                          value={approvalData.approvalStatus}
                          onValueChange={(value: 'pending' | 'approved' | 'rejected') => 
                            setApprovalData({ ...approvalData, approvalStatus: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pendente de Aprovação</SelectItem>
                            <SelectItem value="approved">Aprovado</SelectItem>
                            <SelectItem value="rejected">Rejeitado</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-2">Informações sobre o Status:</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          <li><strong>Pendente:</strong> Aguardando análise do cadastro</li>
                          <li><strong>Aprovado:</strong> Supermercado pode usar todas as funcionalidades</li>
                          <li><strong>Rejeitado:</strong> Cadastro foi recusado, acesso restrito</li>
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="financial" className="mt-6">
                  <FinancialStatementTab supermarketId={selectedSupermarket?.id || 0} />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show list view
  return (
    <div className="min-h-screen bg-white flex">
      {/* Sidebar */}
      <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-100 p-2 rounded-lg">
              <Store className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">SaveUp</h1>
              <p className="text-xs text-gray-500">Administração</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-4">
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => setLocation('/admin/dashboard')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao Dashboard
          </Button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <div className="h-16 border-b border-gray-200 flex items-center justify-between px-6">
          <h2 className="text-xl font-semibold text-gray-900">Gestão de Supermercados</h2>
          <Button
            onClick={() => setIsCreating(true)}
            className="bg-eco-green hover:bg-eco-green/90"
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Supermercado
          </Button>
        </div>

        <div className="flex-1 p-6">
          <div className="max-w-6xl mx-auto">
            {supermarkets && supermarkets.length > 0 ? (
              <div className="grid gap-4">
                {supermarkets.map((supermarket: Supermarket) => (
                  <Card key={supermarket.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-4 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {supermarket.companyName}
                            </h3>
                            {getStatusBadge(supermarket.approvalStatus)}
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                            <div>
                              <p><strong>CNPJ:</strong> {supermarket.cnpj}</p>
                              <p><strong>Email:</strong> {supermarket.email}</p>
                            </div>
                            <div>
                              <p><strong>Telefone:</strong> {supermarket.phone}</p>
                              <p><strong>Endereço:</strong> {supermarket.address}</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedSupermarket(supermarket)}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <Store className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Nenhum supermercado cadastrado
                </h3>
                <p className="text-gray-600 mb-6">
                  Comece criando o primeiro supermercado do sistema.
                </p>
                <Button
                  onClick={() => setIsCreating(true)}
                  className="bg-eco-green hover:bg-eco-green/90"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeiro Supermercado
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Component for Financial Statement Tab
function FinancialStatementTab({ supermarketId }: { supermarketId: number }) {
  const [selectedOrder, setSelectedOrder] = useState<FinancialItem | null>(null);

  const { data: financialData = [], isLoading } = useQuery<FinancialItem[]>({
    queryKey: ["/api/admin/financial-statement", supermarketId],
    retry: false,
  });

  // Filter data for this specific supermarket
  const supermarketData = financialData.filter(item => item.supermarketId === supermarketId);

  const formatCurrency = (value: string) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(parseFloat(value));
  };

  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return format(dateObj, 'dd/MM/yyyy', { locale: ptBR });
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'completed': { variant: 'default' as const, label: 'Concluído' },
      'payment_confirmed': { variant: 'default' as const, label: 'Pagamento Confirmado' },
      'prepared': { variant: 'secondary' as const, label: 'Preparado' },
      'shipped': { variant: 'secondary' as const, label: 'Enviado' },
      'picked_up': { variant: 'default' as const, label: 'Retirado' }
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || { variant: 'outline' as const, label: status };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const totalRevenue = supermarketData.reduce((sum, item) => sum + parseFloat(item.orderTotal), 0);
  const totalCommission = supermarketData.reduce((sum, item) => sum + parseFloat(item.rateAmount), 0);
  const totalToReceive = supermarketData.reduce((sum, item) => sum + parseFloat(item.amountToReceive), 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalRevenue.toString())}</div>
            <p className="text-xs text-muted-foreground">Total de vendas processadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Comissão SaveUp</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{formatCurrency(totalCommission.toString())}</div>
            <p className="text-xs text-muted-foreground">Taxa comercial descontada</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor a Receber</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(totalToReceive.toString())}</div>
            <p className="text-xs text-muted-foreground">Valor líquido do supermercado</p>
          </CardContent>
        </Card>
      </div>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Pedidos Financeiros</CardTitle>
        </CardHeader>
        <CardContent>
          {supermarketData.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Receipt className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Nenhum pedido encontrado para este supermercado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pedido</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Data Pedido</TableHead>
                    <TableHead>Data Pagamento</TableHead>
                    <TableHead>Valor Total</TableHead>
                    <TableHead>Taxa (%)</TableHead>
                    <TableHead>Comissão</TableHead>
                    <TableHead>A Receber</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {supermarketData.map((item) => (
                    <TableRow key={item.orderId}>
                      <TableCell className="font-medium">#{item.orderId}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{item.customerName}</div>
                          {item.customerEmail && (
                            <div className="text-sm text-gray-500">{item.customerEmail}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{item.orderDate ? formatDate(item.orderDate) : '-'}</TableCell>
                      <TableCell>{formatDate(item.paymentDate)}</TableCell>
                      <TableCell className="font-medium text-green-600">
                        {formatCurrency(item.orderTotal)}
                      </TableCell>
                      <TableCell>{item.commercialRate}%</TableCell>
                      <TableCell className="font-medium text-purple-600">
                        {formatCurrency(item.rateAmount)}
                      </TableCell>
                      <TableCell className="font-medium text-blue-600">
                        {formatCurrency(item.amountToReceive)}
                      </TableCell>
                      <TableCell>{getStatusBadge(item.status)}</TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedOrder(item)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Ver
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Detalhes do Pedido #{selectedOrder.orderId}</h2>
                <Button
                  variant="outline"
                  onClick={() => setSelectedOrder(null)}
                >
                  Fechar
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Informações do Cliente</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div><strong>Nome:</strong> {selectedOrder.customerName}</div>
                    <div><strong>Email:</strong> {selectedOrder.customerEmail || 'Não informado'}</div>
                    <div><strong>Status:</strong> {getStatusBadge(selectedOrder.status)}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Informações Financeiras</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div><strong>Taxa Comercial:</strong> {selectedOrder.commercialRate}%</div>
                    <div><strong>Prazo Pagamento:</strong> {selectedOrder.paymentTerms} dias</div>
                    <div><strong>Data Pagamento:</strong> {formatDate(selectedOrder.paymentDate)}</div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Resumo Financeiro</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {formatCurrency(selectedOrder.orderTotal)}
                      </div>
                      <div className="text-sm text-gray-600">Valor Total do Pedido</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">
                        {formatCurrency(selectedOrder.rateAmount)}
                      </div>
                      <div className="text-sm text-gray-600">Comissão SaveUp</div>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {formatCurrency(selectedOrder.amountToReceive)}
                      </div>
                      <div className="text-sm text-gray-600">Valor a Receber</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="text-lg">Itens do Pedido</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produto</TableHead>
                        <TableHead>Quantidade</TableHead>
                        <TableHead>Valor Unitário</TableHead>
                        <TableHead>Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedOrder.items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{item.productName}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>{formatCurrency(item.unitPrice)}</TableCell>
                          <TableCell className="font-medium">{formatCurrency(item.totalPrice)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminSupermarkets;