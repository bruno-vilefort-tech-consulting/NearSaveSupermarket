import { useState } from 'react';
import { useLocation, useRoute } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, XCircle, ArrowLeft, CreditCard, Calendar, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';

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

export default function MarketingConfirmation() {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute('/supermercado/marketing/confirmacao/:planId');
  const [isProcessing, setIsProcessing] = useState(false);
  const [agreementChecked, setAgreementChecked] = useState(false);
  const { toast } = useToast();

  // Plans data (same as marketing page)
  const plans: SponsorshipPlan[] = [
    {
      id: 'basico',
      name: 'Básico',
      description: 'Ideal para supermercados iniciantes que querem aumentar sua visibilidade',
      price: 99.90,
      duration: '30 dias',
      features: [
        'Destaque na busca por 30 dias',
        'Badge "Patrocinado" nos produtos',
        'Prioridade nos resultados de pesquisa',
        'Relatório básico de engajamento'
      ],
      popularity: 'Mais popular'
    },
    {
      id: 'premium',
      name: 'Premium',
      description: 'Para supermercados que buscam máxima exposição e crescimento acelerado',
      price: 249.90,
      duration: '30 dias',
      features: [
        'Todos os benefícios do plano Básico',
        'Destaque premium no topo da tela inicial',
        'Banner promocional personalizado',
        'Notificações push para clientes próximos',
        'Relatório detalhado de performance',
        'Suporte prioritário'
      ],
      recommended: true,
      popularity: 'Recomendado'
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      description: 'Solução completa para redes de supermercados e grandes estabelecimentos',
      price: 499.90,
      duration: '30 dias',
      features: [
        'Todos os benefícios do plano Premium',
        'Campanha personalizada de marketing',
        'Gerenciamento dedicado de conta',
        'Analytics avançados e insights de mercado',
        'Integração com sistemas externos',
        'Promoções exclusivas destacadas',
        'Suporte 24/7'
      ],
      popularity: 'Profissional'
    }
  ];

  const selectedPlan = plans.find(plan => plan.id === params?.planId);

  if (!match || !selectedPlan) {
    return (
      <div className="container mx-auto p-6 max-w-2xl">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <XCircle className="h-16 w-16 text-red-500 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Plano não encontrado</h2>
            <p className="text-gray-600 mb-6">O plano selecionado não existe ou não está disponível.</p>
            <Button onClick={() => setLocation('/supermercado/marketing')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para Marketing
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleConfirmActivation = async () => {
    if (!agreementChecked) {
      toast({
        title: "Confirmação Necessária",
        description: "Você deve concordar com os termos antes de prosseguir.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      const staffInfo = localStorage.getItem('staffInfo');
      const staffData = staffInfo ? JSON.parse(staffInfo) : null;
      
      const response = await fetch('/api/staff/marketing/activate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Staff-Id': staffData?.id?.toString() || '',
        },
        body: JSON.stringify({
          planId: selectedPlan.id
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast({
          title: "Plano Ativado com Sucesso!",
          description: `O plano ${selectedPlan.name} foi ativado. O valor será deduzido do seu contas a receber.`,
        });
        
        // Redirect to marketing page or dashboard
        setLocation('/supermercado/marketing');
      } else {
        throw new Error(result.message || 'Erro ao ativar plano');
      }
    } catch (error: any) {
      console.error('Error activating plan:', error);
      toast({
        title: "Erro na Ativação",
        description: error.message || "Não foi possível ativar o plano. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = () => {
    setLocation('/supermercado/marketing');
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleCancel}
          className="text-gray-600 hover:text-gray-800"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Confirmação de Ativação</h1>
          <p className="text-gray-600">Revise os detalhes do seu plano antes de confirmar</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Plan Details */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                {selectedPlan.recommended && <Star className="h-5 w-5 text-yellow-500 fill-current" />}
                Plano {selectedPlan.name}
              </CardTitle>
              <Badge variant={selectedPlan.recommended ? "default" : "secondary"}>
                {selectedPlan.popularity}
              </Badge>
            </div>
            <CardDescription>{selectedPlan.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between text-lg">
              <span className="font-medium">Valor:</span>
              <span className="font-bold text-green-600">R$ {selectedPlan.price.toFixed(2)}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="font-medium">Duração:</span>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span>{selectedPlan.duration}</span>
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="font-medium mb-3">Benefícios inclusos:</h4>
              <ul className="space-y-2">
                {selectedPlan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Agreement and Payment */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Termos de Pagamento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Como funciona o pagamento:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• O valor será deduzido automaticamente do seu saldo a receber</li>
                <li>• A cobrança será processada imediatamente após confirmação</li>
                <li>• O plano será ativado instantaneamente</li>
                <li>• Você pode acompanhar o saldo em "Gestão Financeira"</li>
              </ul>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-medium text-yellow-900 mb-2">Importante:</h4>
              <ul className="text-sm text-yellow-800 space-y-1">
                <li>• Certifique-se de ter saldo suficiente em contas a receber</li>
                <li>• O plano não pode ser cancelado após ativação</li>
                <li>• A renovação é manual ao final do período</li>
                <li>• Suporte disponível durante todo o período</li>
              </ul>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span>Valor do plano:</span>
                <span>R$ {selectedPlan.price.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Taxa de processamento:</span>
                <span>R$ 0,00</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between font-medium">
                <span>Total a ser deduzido:</span>
                <span className="text-lg text-green-600">R$ {selectedPlan.price.toFixed(2)}</span>
              </div>
            </div>

            <div className="bg-gray-50 border rounded-lg p-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  required 
                  className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">
                  Concordo com os termos de uso e confirmo que tenho saldo suficiente 
                  em contas a receber para cobrir o valor de <strong>R$ {selectedPlan.price.toFixed(2)}</strong>. 
                  Entendo que esta cobrança será processada imediatamente.
                </span>
              </label>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Agreement Terms */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Termos de Ativação do Plano
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
              <h4 className="font-semibold text-blue-900 mb-2">Condições de Pagamento</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• O valor do plano será automaticamente deduzido do seu saldo em contas a receber</li>
                <li>• A cobrança será processada imediatamente após a confirmação</li>
                <li>• Em caso de saldo insuficiente, será gerada uma fatura para pagamento</li>
              </ul>
            </div>
            
            <div className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-500">
              <h4 className="font-semibold text-yellow-900 mb-2">Termos de Uso</h4>
              <ul className="text-sm text-yellow-800 space-y-1">
                <li>• O plano terá vigência conforme a duração especificada</li>
                <li>• Os benefícios serão aplicados em até 24 horas após a ativação</li>
                <li>• Cancelamentos devem ser solicitados com 30 dias de antecedência</li>
                <li>• O uso deve estar em conformidade com as políticas da plataforma</li>
              </ul>
            </div>

            <div className="flex items-start space-x-3 pt-4">
              <Checkbox 
                id="agreement" 
                checked={agreementChecked}
                onCheckedChange={(checked) => setAgreementChecked(!!checked)}
                className="mt-1"
              />
              <label 
                htmlFor="agreement" 
                className="text-sm leading-relaxed cursor-pointer"
              >
                Eu li e concordo com os termos de ativação do plano. Autorizo a dedução do valor 
                <strong> R$ {selectedPlan.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong> 
                do meu saldo em contas a receber ou a geração de fatura caso o saldo seja insuficiente.
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-4 mt-8 justify-center">
        <Button 
          variant="outline" 
          size="lg"
          onClick={handleCancel}
          disabled={isProcessing}
          className="min-w-32"
        >
          Cancelar
        </Button>
        <Button 
          size="lg"
          onClick={handleConfirmActivation}
          disabled={isProcessing || !agreementChecked}
          className={`min-w-32 ${
            agreementChecked 
              ? 'bg-green-600 hover:bg-green-700' 
              : 'bg-gray-400 cursor-not-allowed'
          }`}
        >
          {isProcessing ? (
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Processando...
            </div>
          ) : (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Confirmar Ativação
            </>
          )}
        </Button>
      </div>
    </div>
  );
}