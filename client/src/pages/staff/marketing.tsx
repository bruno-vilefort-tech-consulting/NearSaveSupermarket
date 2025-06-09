import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Rocket, ArrowLeft, Star, Target, TrendingUp, Calendar, MapPin, Users, DollarSign, CheckCircle, X, AlertTriangle } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

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

interface SponsorshipPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: string;
  features: string[];
  recommended?: boolean;
  popularity: string;
}

interface SubscriptionResponse {
  hasActiveSubscription: boolean;
  subscription?: {
    id: number;
    planName: string;
    price: string;
    expiresAt: string;
  };
}

function StaffMarketing() {
  const [, setLocation] = useLocation();
  const [staffUser, setStaffUser] = useState<StaffUser | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check for existing marketing subscription
  const { data: subscriptionData, isLoading: subscriptionLoading } = useQuery<SubscriptionResponse>({
    queryKey: ['/api/staff/marketing-subscription'],
    enabled: !!staffUser?.id,
  });

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

  const sponsorshipPlans: SponsorshipPlan[] = [
    {
      id: 'basic',
      name: 'Plano Básico',
      description: 'Ideal para supermercados iniciantes',
      price: 99.90,
      duration: 'Mensal',
      popularity: 'Popular',
      features: [
        'Destaque em pesquisas locais',
        'Badge de parceiro',
        'Relatórios básicos',
        'Suporte por email'
      ]
    },
    {
      id: 'premium',
      name: 'Plano Premium',
      description: 'Para supermercados em crescimento',
      price: 199.90,
      duration: 'Mensal',
      popularity: 'Mais Escolhido',
      recommended: true,
      features: [
        'Prioridade máxima em pesquisas',
        'Banner personalizado',
        'Relatórios avançados',
        'Suporte prioritário',
        'Campanhas promocionais'
      ]
    },
    {
      id: 'enterprise',
      name: 'Plano Enterprise',
      description: 'Para grandes redes de supermercados',
      price: 399.90,
      duration: 'Mensal',
      popularity: 'Profissional',
      features: [
        'Posicionamento premium',
        'Múltiplos banners',
        'Relatórios personalizados',
        'Gerente de conta dedicado',
        'Campanhas ilimitadas',
        'Integração avançada'
      ]
    }
  ];

  // Cancel campaign mutation
  const cancelCampaignMutation = useMutation({
    mutationFn: () => fetch('/api/staff/marketing-subscription/cancel', {
      method: 'DELETE',
      headers: {
        'x-staff-id': staffUser?.id?.toString() || ''
      }
    }).then(res => res.json()),
    onSuccess: () => {
      toast({
        title: "Campanha cancelada",
        description: "Sua campanha de marketing foi cancelada com sucesso.",
        variant: "default",
      });
      // Invalidate subscription data to refetch
      queryClient.invalidateQueries({ queryKey: ['/api/staff/marketing-subscription'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao cancelar",
        description: error?.message || "Erro interno do servidor",
        variant: "destructive",
      });
    }
  });

  const handleCancelCampaign = () => {
    setShowCancelDialog(true);
  };

  const confirmCancelCampaign = () => {
    cancelCampaignMutation.mutate();
    setShowCancelDialog(false);
  };

  const handlePlanSelection = (plan: SponsorshipPlan) => {
    setLocation(`/supermercado/marketing/confirmacao/${plan.id}?planName=${encodeURIComponent(plan.name)}&price=${plan.price}&duration=${encodeURIComponent(plan.duration)}`);
  };

  if (!staffUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation('/staff/dashboard')}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Voltar</span>
              </Button>
              <div className="border-l border-gray-300 pl-4">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
                  <Rocket className="h-7 w-7 text-purple-600" />
                  <span>Ações de Marketing</span>
                </h1>
                <p className="text-sm text-gray-600">{staffUser.companyName}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg p-8 text-white">
            <div className="max-w-3xl">
              <h2 className="text-3xl font-bold mb-4">
                Impulsione seu supermercado no SaveUp
              </h2>
              <p className="text-lg mb-6 opacity-90">
                Aumente sua visibilidade, atraia mais clientes e acelere suas vendas com nossos planos de patrocínio.
                Seja visto por milhares de clientes em sua região.
              </p>
              <div className="flex items-center space-x-6 text-sm">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4" />
                  <span>50.000+ usuários ativos</span>
                </div>
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4" />
                  <span>Aumento médio de 40% nas vendas</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4" />
                  <span>Cobertura em toda a região</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Conditional Content Based on Subscription Status */}
        {subscriptionLoading ? (
          <div className="mb-8">
            <Card>
              <CardContent className="p-8">
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                  <span className="ml-3 text-gray-600">Verificando status da assinatura...</span>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : subscriptionData?.hasActiveSubscription ? (
          // Active Subscription View
          <div className="mb-8">
            {/* Current Plan Details */}
            <div className="mt-8">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Seu Plano Atual
                </h3>
                <p className="text-gray-600 max-w-2xl mx-auto">
                  Aproveite todos os recursos incluídos no seu plano ativo para maximizar a visibilidade do seu supermercado.
                </p>
              </div>

              {/* Active Plan Card */}
              <div className="max-w-md mx-auto">
                <Card className="relative ring-2 ring-green-500 bg-green-50">
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-green-600 text-white px-4 py-1">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Ativo
                    </Badge>
                  </div>
                  
                  <CardHeader className="text-center pb-4">
                    <CardTitle className="text-xl">{subscriptionData.subscription?.planName}</CardTitle>
                    <CardDescription className="text-sm">
                      {subscriptionData.subscription?.planName === 'Plano Básico' && 'Ideal para supermercados iniciantes'}
                      {subscriptionData.subscription?.planName === 'Plano Premium' && 'Para supermercados em crescimento'}
                      {subscriptionData.subscription?.planName === 'Plano Enterprise' && 'Para grandes redes de supermercados'}
                    </CardDescription>
                    <div className="mt-4">
                      <div className="flex items-center justify-center">
                        <span className="text-3xl font-bold text-gray-900">
                          R$ {subscriptionData.subscription?.price}
                        </span>
                      </div>
                      <div className="flex items-center justify-center mt-1">
                        <Calendar className="h-4 w-4 text-gray-500 mr-1" />
                        <span className="text-sm text-gray-500">Mensal</span>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <div className="mb-6">
                      <h4 className="font-semibold mb-3 text-center">Recursos Incluídos:</h4>
                      <ul className="space-y-3">
                        {subscriptionData.subscription?.planName === 'Plano Básico' && (
                          <>
                            <li className="flex items-center text-sm">
                              <div className="flex-shrink-0 w-4 h-4 bg-green-100 rounded-full flex items-center justify-center mr-3">
                                <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
                              </div>
                              <span>Destaque em pesquisas locais</span>
                            </li>
                            <li className="flex items-center text-sm">
                              <div className="flex-shrink-0 w-4 h-4 bg-green-100 rounded-full flex items-center justify-center mr-3">
                                <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
                              </div>
                              <span>Badge de parceiro</span>
                            </li>
                            <li className="flex items-center text-sm">
                              <div className="flex-shrink-0 w-4 h-4 bg-green-100 rounded-full flex items-center justify-center mr-3">
                                <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
                              </div>
                              <span>Relatórios básicos</span>
                            </li>
                            <li className="flex items-center text-sm">
                              <div className="flex-shrink-0 w-4 h-4 bg-green-100 rounded-full flex items-center justify-center mr-3">
                                <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
                              </div>
                              <span>Suporte por email</span>
                            </li>
                          </>
                        )}
                        {subscriptionData.subscription?.planName === 'Plano Premium' && (
                          <>
                            <li className="flex items-center text-sm">
                              <div className="flex-shrink-0 w-4 h-4 bg-green-100 rounded-full flex items-center justify-center mr-3">
                                <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
                              </div>
                              <span>Prioridade máxima em pesquisas</span>
                            </li>
                            <li className="flex items-center text-sm">
                              <div className="flex-shrink-0 w-4 h-4 bg-green-100 rounded-full flex items-center justify-center mr-3">
                                <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
                              </div>
                              <span>Banner personalizado</span>
                            </li>
                            <li className="flex items-center text-sm">
                              <div className="flex-shrink-0 w-4 h-4 bg-green-100 rounded-full flex items-center justify-center mr-3">
                                <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
                              </div>
                              <span>Relatórios avançados</span>
                            </li>
                            <li className="flex items-center text-sm">
                              <div className="flex-shrink-0 w-4 h-4 bg-green-100 rounded-full flex items-center justify-center mr-3">
                                <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
                              </div>
                              <span>Suporte prioritário</span>
                            </li>
                            <li className="flex items-center text-sm">
                              <div className="flex-shrink-0 w-4 h-4 bg-green-100 rounded-full flex items-center justify-center mr-3">
                                <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
                              </div>
                              <span>Campanhas promocionais</span>
                            </li>
                          </>
                        )}
                        {subscriptionData.subscription?.planName === 'Plano Enterprise' && (
                          <>
                            <li className="flex items-center text-sm">
                              <div className="flex-shrink-0 w-4 h-4 bg-green-100 rounded-full flex items-center justify-center mr-3">
                                <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
                              </div>
                              <span>Posicionamento premium</span>
                            </li>
                            <li className="flex items-center text-sm">
                              <div className="flex-shrink-0 w-4 h-4 bg-green-100 rounded-full flex items-center justify-center mr-3">
                                <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
                              </div>
                              <span>Múltiplos banners</span>
                            </li>
                            <li className="flex items-center text-sm">
                              <div className="flex-shrink-0 w-4 h-4 bg-green-100 rounded-full flex items-center justify-center mr-3">
                                <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
                              </div>
                              <span>Relatórios personalizados</span>
                            </li>
                            <li className="flex items-center text-sm">
                              <div className="flex-shrink-0 w-4 h-4 bg-green-100 rounded-full flex items-center justify-center mr-3">
                                <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
                              </div>
                              <span>Gerente de conta dedicado</span>
                            </li>
                            <li className="flex items-center text-sm">
                              <div className="flex-shrink-0 w-4 h-4 bg-green-100 rounded-full flex items-center justify-center mr-3">
                                <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
                              </div>
                              <span>Campanhas ilimitadas</span>
                            </li>
                            <li className="flex items-center text-sm">
                              <div className="flex-shrink-0 w-4 h-4 bg-green-100 rounded-full flex items-center justify-center mr-3">
                                <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
                              </div>
                              <span>Integração avançada</span>
                            </li>
                          </>
                        )}
                      </ul>
                    </div>
                    
                    <div className="text-center space-y-3">
                      <Badge variant="secondary" className="bg-green-100 text-green-800 px-4 py-2">
                        Plano Renova em {subscriptionData.subscription?.expiresAt ? new Date(subscriptionData.subscription.expiresAt).toLocaleDateString('pt-BR') : 'N/A'}
                      </Badge>
                      
                      <div className="pt-2">
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={handleCancelCampaign}
                          className="bg-red-600 hover:bg-red-700 text-white"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Cancelar Campanha
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Marketing Statistics */}
            <Card className="mt-8">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="h-5 w-5 text-purple-600" />
                  <span>Estatísticas de Marketing</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600 mb-2">1</div>
                    <div className="text-sm text-gray-600">Campanha Ativa</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600 mb-2">2.5k</div>
                    <div className="text-sm text-gray-600">Visualizações este mês</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600 mb-2">127</div>
                    <div className="text-sm text-gray-600">Novos clientes gerados</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          // No Active Subscription - Show Plans
          <div className="mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="h-5 w-5 text-purple-600" />
                  <span>Status Atual do Marketing</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900 mb-2">0</div>
                    <div className="text-sm text-gray-600">Campanhas Ativas</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900 mb-2">-</div>
                    <div className="text-sm text-gray-600">Visualizações este mês</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900 mb-2">-</div>
                    <div className="text-sm text-gray-600">Conversões geradas</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sponsorship Plans */}
            <div className="mt-8">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Escolha o plano ideal para seu supermercado
                </h3>
                <p className="text-gray-600 max-w-2xl mx-auto">
                  Nossos planos de patrocínio foram desenvolvidos para atender supermercados de todos os tamanhos.
                  Escolha o que melhor se adapta às suas necessidades.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {sponsorshipPlans.map((plan) => (
                  <Card key={plan.id} className={`relative ${plan.recommended ? 'ring-2 ring-purple-500' : ''}`}>
                    {plan.recommended && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <Badge className="bg-purple-600 text-white px-4 py-1">
                          <Star className="h-3 w-3 mr-1" />
                          {plan.popularity}
                        </Badge>
                      </div>
                    )}
                    {!plan.recommended && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <Badge variant="secondary" className="px-4 py-1">
                          {plan.popularity}
                        </Badge>
                      </div>
                    )}
                    
                    <CardHeader className="text-center pb-4">
                      <CardTitle className="text-xl">{plan.name}</CardTitle>
                      <CardDescription className="text-sm">{plan.description}</CardDescription>
                      <div className="mt-4">
                        <div className="flex items-center justify-center">
                          <span className="text-3xl font-bold text-gray-900">
                            R$ {plan.price.toFixed(2).replace('.', ',')}
                          </span>
                        </div>
                        <div className="flex items-center justify-center mt-1">
                          <Calendar className="h-4 w-4 text-gray-500 mr-1" />
                          <span className="text-sm text-gray-500">{plan.duration}</span>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pt-0">
                      <ul className="space-y-3 mb-6">
                        {plan.features.map((feature, index) => (
                          <li key={index} className="flex items-center text-sm">
                            <div className="flex-shrink-0 w-4 h-4 bg-green-100 rounded-full flex items-center justify-center mr-3">
                              <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
                            </div>
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                      
                      <Button 
                        onClick={() => handlePlanSelection(plan)}
                        className={`w-full ${plan.recommended ? 'bg-purple-600 hover:bg-purple-700' : ''}`}
                        variant={plan.recommended ? 'default' : 'outline'}
                      >
                        Escolher {plan.name}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Benefits Section */}
        <div className="mb-8">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Por que escolher o patrocínio SaveUp?</CardTitle>
              <CardDescription>
                Veja os benefícios que nossos parceiros obtêm com o patrocínio
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="bg-blue-100 p-3 rounded-full w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-blue-600" />
                  </div>
                  <h4 className="font-semibold mb-2">Mais Vendas</h4>
                  <p className="text-sm text-gray-600">Aumento médio de 40% nas vendas dos parceiros</p>
                </div>
                
                <div className="text-center">
                  <div className="bg-green-100 p-3 rounded-full w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                    <Users className="h-6 w-6 text-green-600" />
                  </div>
                  <h4 className="font-semibold mb-2">Novos Clientes</h4>
                  <p className="text-sm text-gray-600">Alcance milhares de novos clientes em sua região</p>
                </div>
                
                <div className="text-center">
                  <div className="bg-purple-100 p-3 rounded-full w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                    <Star className="h-6 w-6 text-purple-600" />
                  </div>
                  <h4 className="font-semibold mb-2">Maior Visibilidade</h4>
                  <p className="text-sm text-gray-600">Destaque garantido na plataforma</p>
                </div>
                
                <div className="text-center">
                  <div className="bg-orange-100 p-3 rounded-full w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-orange-600" />
                  </div>
                  <h4 className="font-semibold mb-2">ROI Garantido</h4>
                  <p className="text-sm text-gray-600">Retorno sobre investimento comprovado</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Modal de Cancelamento de Campanha */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="sm:max-w-[425px]" style={{ backgroundColor: 'hsl(var(--eco-cream))' }}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2" style={{ color: 'hsl(var(--eco-red))' }}>
              <AlertTriangle className="h-5 w-5" />
              Cancelar Campanha de Marketing
            </DialogTitle>
            <DialogDescription style={{ color: 'hsl(var(--eco-gray))' }}>
              Tem certeza que deseja cancelar sua campanha de marketing ativa?
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="bg-white p-4 rounded-lg border border-eco-gray-light space-y-3">
              {subscriptionData?.subscription && (
                <>
                  <div className="flex justify-between">
                    <span className="font-medium">Plano Atual:</span>
                    <span style={{ color: 'hsl(var(--eco-green))' }}>
                      {subscriptionData.subscription.planName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Valor Mensal:</span>
                    <span className="font-semibold">
                      R$ {parseFloat(subscriptionData.subscription.price).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Expira em:</span>
                    <span>
                      {new Date(subscriptionData.subscription.expiresAt).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </>
              )}
            </div>
            
            <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-center gap-2 text-orange-800 font-medium mb-2">
                <AlertTriangle className="h-4 w-4" />
                Importante
              </div>
              <p className="text-sm text-orange-700">
                • O cancelamento será efetivo imediatamente<br/>
                • Seu supermercado perderá a visibilidade premium<br/>
                • Esta ação não pode ser desfeita
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowCancelDialog(false)}
              className="flex-1 border-eco-green text-eco-green hover:bg-eco-green-light"
            >
              Manter Campanha
            </Button>
            <Button 
              onClick={confirmCancelCampaign}
              disabled={cancelCampaignMutation.isPending}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            >
              {cancelCampaignMutation.isPending ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Cancelando...
                </div>
              ) : (
                "Sim, Cancelar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default StaffMarketing;