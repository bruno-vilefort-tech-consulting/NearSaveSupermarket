import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Store, ArrowLeft, Plus, Edit, MapPin, CreditCard, Building, CheckCircle, XCircle } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

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

          <div className="flex-1 p-6">
            <div className="max-w-4xl mx-auto">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="general" className="flex items-center space-x-2">
                    <Building className="h-4 w-4" />
                    <span>Dados Gerais</span>
                  </TabsTrigger>
                  <TabsTrigger value="commercial" className="flex items-center space-x-2">
                    <CreditCard className="h-4 w-4" />
                    <span>Comercial</span>
                  </TabsTrigger>
                  <TabsTrigger value="location" className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4" />
                    <span>Localização</span>
                  </TabsTrigger>
                  <TabsTrigger value="approval" className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4" />
                    <span>Aprovação</span>
                  </TabsTrigger>
                </TabsList>

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

export default AdminSupermarkets;