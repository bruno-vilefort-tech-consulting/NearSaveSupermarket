import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Rocket, ArrowLeft, Star, Target, TrendingUp, Calendar, MapPin, Users, DollarSign, CheckCircle } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";

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

interface MarketingSubscription {
  id: number;
  staffId: number;
  planId: string;
  planName: string;
  price: string;
  status: string;
  activatedAt: string;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

function StaffMarketing() {
  const [, setLocation] = useLocation();
  const [staffUser, setStaffUser] = useState<StaffUser | null>(null);

  // Check for existing marketing subscription
  const { data: subscriptionData, isLoading: subscriptionLoading } = useQuery({
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

  // Mock sponsorship plans - in a real app, this would come from the API
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

  const handlePlanSelection = (plan: SponsorshipPlan) => {
    setLocation(`/staff/marketing-confirmation?planId=${plan.id}&planName=${encodeURIComponent(plan.name)}&price=${plan.price}&duration=${encodeURIComponent(plan.duration)}`);
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
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <div className="flex items-center justify-between">
                  <div>
                    <strong>Plano Ativo:</strong> {subscriptionData.subscription.planName} - 
                    <span className="ml-1">R$ {subscriptionData.subscription.price}</span>
                    <div className="text-sm mt-1">
                      Expira em: {new Date(subscriptionData.subscription.expiresAt).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    Ativo
                  </Badge>
                </div>
              </AlertDescription>
            </Alert>
            
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="h-5 w-5 text-purple-600" />
                  <span>Recursos Ativados</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600 mb-2">✓</div>
                    <div className="text-sm text-gray-600">Visibilidade Premium</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600 mb-2">✓</div>
                    <div className="text-sm text-gray-600">Destaque em Pesquisas</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600 mb-2">✓</div>
                    <div className="text-sm text-gray-600">Relatórios Detalhados</div>
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
    </div>
  );
}

export default StaffMarketing;