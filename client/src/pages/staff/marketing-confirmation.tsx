import { useState } from 'react';
import { useLocation, useRoute } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, XCircle, ArrowLeft, CreditCard, Calendar, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { useQueryClient } from '@tanstack/react-query';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

// Initialize Stripe
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

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

// Payment form component with Stripe
function PaymentForm({ selectedPlan, onPaymentSuccess, onPaymentError, isProcessing, setIsProcessing }: {
  selectedPlan: SponsorshipPlan;
  onPaymentSuccess: () => void;
  onPaymentError: (error: string) => void;
  isProcessing: boolean;
  setIsProcessing: (processing: boolean) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();

  const handlePayment = async () => {
    if (!stripe || !elements) {
      onPaymentError("Stripe não está carregado corretamente");
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      onPaymentError("Elemento do cartão não encontrado");
      return;
    }

    setIsProcessing(true);

    try {
      const staffInfo = localStorage.getItem('staffInfo');
      const staffData = staffInfo ? JSON.parse(staffInfo) : null;

      // Create payment intent for marketing subscription
      const response = await fetch('/api/staff/marketing/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Staff-Id': staffData?.id?.toString() || '',
        },
        body: JSON.stringify({
          planId: selectedPlan.id,
          planName: selectedPlan.name,
          price: selectedPlan.price
        })
      });

      const { clientSecret } = await response.json();

      if (!clientSecret) {
        throw new Error('Não foi possível criar a intenção de pagamento');
      }

      // Confirm payment with Stripe
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: staffData?.companyName || 'Supermercado',
            email: staffData?.email || '',
          },
        },
      });

      if (error) {
        onPaymentError(error.message || 'Erro no pagamento');
      } else if (paymentIntent?.status === 'succeeded') {
        // Payment successful, now activate the marketing campaign
        try {
          const activationResponse = await fetch('/api/staff/marketing/activate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Staff-Id': staffData?.id?.toString() || '',
            },
            body: JSON.stringify({
              planId: selectedPlan.id,
              planName: selectedPlan.name,
              price: selectedPlan.price,
              paymentIntentId: paymentIntent.id
            })
          });

          const activationResult = await activationResponse.json();

          if (activationResponse.ok && activationResult.success) {
            onPaymentSuccess();
          } else {
            throw new Error(activationResult.message || 'Erro ao ativar campanha');
          }
        } catch (activationError: any) {
          onPaymentError(`Pagamento realizado, mas houve erro na ativação: ${activationError.message}`);
        }
      } else {
        onPaymentError('Pagamento não foi processado corretamente');
      }
    } catch (error: any) {
      onPaymentError(error.message || 'Erro interno do servidor');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="p-4 border border-gray-200 rounded-lg">
        <h3 className="font-medium mb-3" style={{ color: 'hsl(var(--eco-gray-dark))' }}>
          Informações do Cartão
        </h3>
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                  color: '#aab7c4',
                },
              },
            },
          }}
        />
      </div>
      
      <Button 
        onClick={handlePayment}
        disabled={!stripe || isProcessing}
        className="w-full bg-eco-green hover:bg-eco-green-dark text-white"
      >
        {isProcessing ? (
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            Processando Pagamento...
          </div>
        ) : (
          <>
            <CreditCard className="h-4 w-4 mr-2" />
            Pagar R$ {selectedPlan.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </>
        )}
      </Button>
    </div>
  );
}

export default function MarketingConfirmation() {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute('/supermercado/marketing/confirmacao/:planId');
  const [isProcessing, setIsProcessing] = useState(false);
  const [agreementChecked, setAgreementChecked] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Plans data (matching marketing page exactly)
  const plans: SponsorshipPlan[] = [
    {
      id: 'basic',
      name: 'Plano Básico',
      description: 'Destaque seu supermercado para clientes locais',
      price: 99.90,
      duration: 'Mensal',
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
      duration: 'Mensal',
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
      duration: 'Mensal',
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

  if (!match || !params?.planId) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--eco-cream))' }}>
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4" style={{ color: 'hsl(var(--eco-gray-dark))' }}>
            Plano não encontrado
          </h2>
          <Button onClick={() => setLocation('/supermercado/marketing')}>
            Voltar para Marketing
          </Button>
        </div>
      </div>
    );
  }

  const selectedPlan = plans.find(plan => plan.id === params.planId);
  if (!selectedPlan) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--eco-cream))' }}>
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4" style={{ color: 'hsl(var(--eco-gray-dark))' }}>
            Plano inválido
          </h2>
          <Button onClick={() => setLocation('/supermercado/marketing')}>
            Voltar para Marketing
          </Button>
        </div>
      </div>
    );
  }

  const handleConfirmActivation = () => {
    if (!agreementChecked) {
      toast({
        title: "Confirmação Necessária",
        description: "Você deve concordar com os termos antes de prosseguir.",
        variant: "destructive",
      });
      return;
    }

    setShowPaymentForm(true);
  };

  const handlePaymentSuccess = () => {
    toast({
      title: "Pagamento Realizado com Sucesso!",
      description: `O plano ${selectedPlan.name} foi ativado. Sua campanha de marketing está ativa.`,
    });
    
    // Invalidate marketing subscription cache to ensure fresh data
    queryClient.invalidateQueries({ queryKey: ['/api/staff/marketing-subscription'] });
    
    // Small delay to ensure cache invalidation before redirect
    setTimeout(() => {
      setLocation('/supermercado/marketing');
    }, 1000);
  };

  const handlePaymentError = (error: string) => {
    toast({
      title: "Falha no Pagamento",
      description: error || "Não foi possível processar o pagamento. Tente novamente.",
      variant: "destructive",
    });
    setShowPaymentForm(false);
  };

  const handleCancel = () => {
    setLocation('/supermercado/marketing');
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'hsl(var(--eco-cream))' }}>
      <div className="container mx-auto p-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleCancel}
            className="hover:bg-[hsl(var(--eco-green-light))] text-[hsl(var(--eco-green))]"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'hsl(var(--eco-gray-dark))' }}>
              Confirmação de Ativação
            </h1>
            <p style={{ color: 'hsl(var(--eco-gray))' }}>
              Revise os detalhes do seu plano antes de confirmar
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Plan Details */}
          <Card className="border-[hsl(var(--eco-gray-light))] shadow-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2" style={{ color: 'hsl(var(--eco-gray-dark))' }}>
                  {selectedPlan.recommended && <Star className="h-5 w-5 fill-current" style={{ color: 'hsl(var(--eco-orange))' }} />}
                  {selectedPlan.name}
                </CardTitle>
                <Badge 
                  variant={selectedPlan.recommended ? "default" : "secondary"}
                  className={selectedPlan.recommended 
                    ? "bg-[hsl(var(--eco-orange))] text-white hover:bg-[hsl(var(--eco-orange-dark))]" 
                    : "bg-[hsl(var(--eco-sage-light))] text-[hsl(var(--eco-sage-dark))]"
                  }
                >
                  {selectedPlan.popularity}
                </Badge>
              </div>
              <CardDescription style={{ color: 'hsl(var(--eco-gray))' }}>
                {selectedPlan.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-lg">
                <span className="font-medium" style={{ color: 'hsl(var(--eco-gray-dark))' }}>
                  Valor:
                </span>
                <span className="font-bold" style={{ color: 'hsl(var(--eco-green))' }}>
                  R$ {selectedPlan.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="font-medium" style={{ color: 'hsl(var(--eco-gray-dark))' }}>
                  Duração:
                </span>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" style={{ color: 'hsl(var(--eco-gray))' }} />
                  <span style={{ color: 'hsl(var(--eco-gray-dark))' }}>
                    {selectedPlan.duration}
                  </span>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-3" style={{ color: 'hsl(var(--eco-gray-dark))' }}>
                  Recursos Inclusos:
                </h4>
                <ul className="space-y-2">
                  {selectedPlan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: 'hsl(var(--eco-green))' }} />
                      <span className="text-sm" style={{ color: 'hsl(var(--eco-gray))' }}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Payment Information */}
          <Card className="border-[hsl(var(--eco-gray-light))] shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2" style={{ color: 'hsl(var(--eco-gray-dark))' }}>
                <CreditCard className="h-5 w-5" />
                Informações de Pagamento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg" style={{ backgroundColor: 'hsl(var(--eco-blue-light))', borderLeft: '4px solid hsl(var(--eco-blue))' }}>
                <h4 className="font-semibold mb-2" style={{ color: 'hsl(var(--eco-blue-dark))' }}>
                  Forma de Pagamento
                </h4>
                <p className="text-sm" style={{ color: 'hsl(var(--eco-blue-dark))' }}>
                  Pagamento seguro via cartão de crédito
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span style={{ color: 'hsl(var(--eco-gray))' }}>
                    Subtotal:
                  </span>
                  <span style={{ color: 'hsl(var(--eco-gray-dark))' }}>
                    R$ {selectedPlan.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-semibold">
                  <span style={{ color: 'hsl(var(--eco-gray-dark))' }}>
                    Total:
                  </span>
                  <span style={{ color: 'hsl(var(--eco-green))' }}>
                    R$ {selectedPlan.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div className="mt-6 p-3 rounded-lg" style={{ backgroundColor: 'hsl(var(--eco-sage-light))' }}>
                <p className="text-xs" style={{ color: 'hsl(var(--eco-sage-dark))' }}>
                  O pagamento será processado de forma segura via Stripe. 
                  Você receberá um comprovante por email após a confirmação.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Agreement Terms */}
        <Card className="mt-8 border-[hsl(var(--eco-gray-light))] shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2" style={{ color: 'hsl(var(--eco-gray-dark))' }}>
              <CheckCircle className="h-5 w-5" />
              Termos de Ativação do Plano
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 rounded-lg" style={{ backgroundColor: 'hsl(var(--eco-blue-light))', borderLeft: '4px solid hsl(var(--eco-blue))' }}>
                <h4 className="font-semibold mb-2" style={{ color: 'hsl(var(--eco-blue-dark))' }}>
                  Condições de Pagamento
                </h4>
                <ul className="text-sm space-y-1" style={{ color: 'hsl(var(--eco-blue-dark))' }}>
                  <li>• O valor do plano será automaticamente deduzido do seu saldo em contas a receber</li>
                  <li>• A cobrança será processada imediatamente após a confirmação</li>
                  <li>• Em caso de saldo insuficiente, será gerada uma fatura para pagamento</li>
                </ul>
              </div>
              
              <div className="p-4 rounded-lg" style={{ backgroundColor: 'hsl(var(--eco-orange-light))', borderLeft: '4px solid hsl(var(--eco-orange))' }}>
                <h4 className="font-semibold mb-2" style={{ color: 'hsl(var(--eco-orange-dark))' }}>
                  Termos de Uso
                </h4>
                <ul className="text-sm space-y-1" style={{ color: 'hsl(var(--eco-orange-dark))' }}>
                  <li>• O plano terá vigência conforme a duração especificada</li>
                  <li>• Os benefícios serão aplicados em até 24 horas após a ativação</li>
                  <li>• Cancelamentos devem ser solicitados com 30 dias de antecedência</li>
                  <li>• O uso deve estar em conformidade com as políticas da plataforma</li>
                </ul>
              </div>

              {!showPaymentForm ? (
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
                    style={{ color: 'hsl(var(--eco-gray-dark))' }}
                  >
                    Eu li e concordo com os termos de ativação do plano. Autorizo o pagamento via cartão de crédito no valor de 
                    <strong style={{ color: 'hsl(var(--eco-green))' }}>
                      {' '}R$ {selectedPlan.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}{' '}
                    </strong> 
                    para ativação da campanha de marketing.
                  </label>
                </div>
              ) : (
                <div className="pt-4">
                  <h4 className="font-semibold mb-4" style={{ color: 'hsl(var(--eco-gray-dark))' }}>
                    Finalize o Pagamento
                  </h4>
                  <Elements stripe={stripePromise}>
                    <PaymentForm
                      selectedPlan={selectedPlan}
                      onPaymentSuccess={handlePaymentSuccess}
                      onPaymentError={handlePaymentError}
                      isProcessing={isProcessing}
                      setIsProcessing={setIsProcessing}
                    />
                  </Elements>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        {!showPaymentForm && (
          <div className="flex gap-4 mt-8 justify-center">
            <Button 
              variant="outline" 
              size="lg"
              onClick={handleCancel}
              disabled={isProcessing}
              className="min-w-32 border-[hsl(var(--eco-gray-light))] text-[hsl(var(--eco-gray-dark))] hover:bg-[hsl(var(--eco-gray-light))]"
            >
              Cancelar
            </Button>
            <Button 
              size="lg"
              onClick={handleConfirmActivation}
              disabled={isProcessing || !agreementChecked}
              className={`min-w-32 ${
                agreementChecked 
                  ? 'bg-[hsl(var(--eco-green))] hover:bg-[hsl(var(--eco-green-dark))] text-white' 
                  : 'bg-[hsl(var(--eco-gray-light))] text-[hsl(var(--eco-gray))] cursor-not-allowed'
              }`}
            >
              {isProcessing ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processando...
                </div>
              ) : (
                <>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Ir para Pagamento
                </>
              )}
            </Button>
          </div>
        )}
        
        {showPaymentForm && (
          <div className="flex gap-4 mt-8 justify-center">
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => setShowPaymentForm(false)}
              disabled={isProcessing}
              className="min-w-32 border-[hsl(var(--eco-gray-light))] text-[hsl(var(--eco-gray-dark))] hover:bg-[hsl(var(--eco-gray-light))]"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}