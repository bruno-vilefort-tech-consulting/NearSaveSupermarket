import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Rocket, ArrowLeft, Star, Target, TrendingUp, Calendar, MapPin, Users, DollarSign } from "lucide-react";
import { useLocation } from "wouter";
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

function StaffMarketing() {
  const [, setLocation] = useLocation();
  const [staffUser, setStaffUser] = useState<StaffUser | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
      description: 'Destaque seu supermercado para clientes locais',
      price: 99.90,
      duration: '30 dias',
      features: [
        'Aparição em destaque na página inicial',
        'Badge "Parceiro Verificado"',
        'Prioridade nas buscas locais',
        'Relatório de visualizações mensal'
      ],
      popularity: 'Mais escolhido'
    },
    {
      id: 'premium',
      name: 'Plano Premium',
      description: 'Máxima visibilidade e ferramentas avançadas',
      price: 199.90,
      duration: '30 dias',
      features: [
        'Tudo do Plano Básico',
        'Banner promocional na home',
        'Destaque em 3 categorias de produtos',
        'Push notifications para clientes próximos',
        'Relatórios detalhados de engajamento',
        'Suporte prioritário'
      ],
      recommended: true,
      popularity: 'Recomendado'
    },
    {
      id: 'enterprise',
      name: 'Plano Empresarial',
      description: 'Solução completa para redes de supermercados',
      price: 399.90,
      duration: '30 dias',
      features: [
        'Tudo do Plano Premium',
        'Campanhas personalizadas',
        'Analytics avançado com IA',
        'Integração com sistemas próprios',
        'Gerente de conta dedicado',
        'Campanhas de email marketing',
        'Segmentação avançada de clientes'
      ],
      popularity: 'Para empresas'
    }
  ];

  const activateSponsorshipMutation = useMutation({
    mutationFn: async (planId: string) => {
      const response = await fetch('/api/staff/marketing/sponsorship', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Staff-Id': staffUser!.id.toString(),
        },
        body: JSON.stringify({ planId }),
      });
      
      if (!response.ok) {
        throw new Error('Erro ao ativar patrocínio');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Patrocínio ativado!",
        description: "Seu supermercado será destacado no aplicativo dos clientes.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/staff/marketing"] });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível ativar o patrocínio. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  if (!staffUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
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
              <div className="bg-purple-100 p-2 rounded-full">
                <Rocket className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Ações de Marketing
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

        {/* Current Status */}
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
        </div>

        {/* Sponsorship Plans */}
        <div className="mb-8">
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
                      <span className="text-sm text-gray-500">por {plan.duration}</span>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center mr-3 mt-0.5">
                          <div className="w-2 h-2 rounded-full bg-green-600"></div>
                        </div>
                        <span className="text-sm text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Button 
                    className={`w-full ${plan.recommended ? 'bg-purple-600 hover:bg-purple-700' : ''}`}
                    onClick={() => activateSponsorshipMutation.mutate(plan.id)}
                    disabled={activateSponsorshipMutation.isPending}
                  >
                    {activateSponsorshipMutation.isPending ? 'Ativando...' : 'Ativar Patrocínio'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Benefits Section */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Por que patrocinar no SaveUp?</CardTitle>
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