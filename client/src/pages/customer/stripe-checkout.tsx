import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { useLocation, useRoute } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CreditCard, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Load Stripe
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

interface CheckoutFormProps {
  orderId: string;
  amount: number;
  customerEmail: string;
  orderData?: any;
}

const CheckoutForm = ({ orderId, amount, customerEmail, orderData }: CheckoutFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      console.log('🔄 Iniciando confirmação do pagamento...');
      
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/customer/payment-success?orderId=${orderId}`,
        },
        redirect: 'if_required'
      });

      console.log('💳 Resultado do pagamento:', { error, paymentIntent });

      if (error) {
        console.error('Stripe payment error:', error);
        toast({
          title: "Erro no Pagamento",
          description: error.message || "Erro ao processar pagamento",
          variant: "destructive",
        });
      } else if (paymentIntent?.status === 'succeeded') {
        console.log('✅ Pagamento aprovado!');
        
        // Confirmar pagamento no backend e salvar referência externa
        try {
          const confirmResponse = await fetch('/api/payments/stripe/confirm', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              orderId: orderId,
              paymentIntentId: paymentIntent.id,
              amount: parseFloat(orderData?.totalAmount || '0')
            })
          });

          if (confirmResponse.ok) {
            console.log('✅ Pagamento confirmado no backend');
            toast({
              title: "Pagamento Aprovado!",
              description: "Redirecionando para confirmação...",
            });
            setLocation(`/customer/payment-success?orderId=${orderId}`);
          } else {
            throw new Error('Erro ao confirmar pagamento no servidor');
          }
        } catch (confirmError) {
          console.error('Erro ao confirmar pagamento:', confirmError);
          toast({
            title: "Aviso",
            description: "Pagamento aprovado, mas houve erro na confirmação. Entre em contato se necessário.",
            variant: "destructive",
          });
          setLocation(`/customer/payment-success?orderId=${orderId}`);
        }
      } else {
        console.log('⏳ Pagamento em processamento...', paymentIntent?.status);
        toast({
          title: "Pagamento em Processamento",
          description: "Aguardando confirmação...",
        });
      }
    } catch (error: any) {
      console.error('Payment submission error:', error);
      toast({
        title: "Erro no Pagamento",
        description: error?.message || "Erro inesperado ao processar pagamento",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation(`/customer/checkout?orderId=${orderId}`)}
              className="p-2"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Pagamento por Cartão</h1>
              <p className="text-sm text-gray-600">Pedido #{orderId}</p>
            </div>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-6">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <CreditCard className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle>Finalizar Pagamento</CardTitle>
              <CardDescription>
                {orderData?.originalAmount && parseFloat(orderData.originalAmount) !== amount ? (
                  <div className="space-y-1">
                    <div className="text-sm text-gray-500">
                      Valor original: <span className="line-through">{formatCurrency(parseFloat(orderData.originalAmount))}</span>
                    </div>
                    <div>
                      Total ajustado: <span className="font-semibold text-lg text-eco-green">{formatCurrency(amount)}</span>
                    </div>
                    <div className="text-xs text-gray-400">
                      *Valor mínimo exigido para pagamentos com cartão
                    </div>
                  </div>
                ) : (
                  <div>
                    Total: <span className="font-semibold text-lg text-eco-green">{formatCurrency(amount)}</span>
                  </div>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <PaymentElement 
                    options={{
                      layout: "tabs"
                    }}
                  />
                </div>
                
                <div className="space-y-3">
                  <Button 
                    type="submit" 
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    disabled={!stripe || !elements || isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processando...
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4 mr-2" />
                        Pagar {formatCurrency(amount)}
                      </>
                    )}
                  </Button>
                  
                  <Button 
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => setLocation(`/customer/checkout?orderId=${orderId}`)}
                    disabled={isProcessing}
                  >
                    Voltar
                  </Button>
                </div>
              </form>

              <div className="mt-6 pt-4 border-t">
                <div className="flex items-center justify-center text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    🔒 Pagamento seguro processado pelo Stripe
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default function StripeCheckout() {
  const [match, params] = useRoute('/customer/stripe-checkout/:orderId');
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [clientSecret, setClientSecret] = useState("");
  const [orderData, setOrderData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!match || !params?.orderId) {
      setLocation('/customer');
      return;
    }

    const initializePayment = async () => {
      try {
        // Get order details first
        const orderResponse = await fetch(`/api/public/order/${params.orderId}`);
        if (!orderResponse.ok) {
          throw new Error('Ordem não encontrada');
        }
        const order = await orderResponse.json();
        console.log('Order data received:', order);
        setOrderData(order);

        // Create payment intent
        const response = await fetch("/api/payments/stripe/create-payment-intent", {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: parseFloat(order.totalAmount),
            orderId: order.id,
            customerEmail: order.customerEmail || ""
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Erro ao criar intenção de pagamento');
        }

        const data = await response.json();
        setClientSecret(data.clientSecret);
        
        // Update order data with adjusted amount if different
        if (data.adjustedAmount && parseFloat(data.adjustedAmount) !== parseFloat(order.totalAmount)) {
          setOrderData({
            ...order,
            totalAmount: data.adjustedAmount,
            originalAmount: order.totalAmount
          });
        }
      } catch (error: any) {
        console.error('Error initializing payment:', error);
        toast({
          title: "Erro",
          description: error.message || "Erro ao inicializar pagamento",
          variant: "destructive",
        });
        setLocation('/customer');
      } finally {
        setLoading(false);
      }
    };

    initializePayment();
  }, [match, params?.orderId, setLocation, toast]);

  if (!match) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Preparando pagamento...</p>
        </div>
      </div>
    );
  }

  if (!clientSecret || !orderData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Erro ao carregar dados do pagamento</p>
          <Button 
            onClick={() => setLocation('/customer')}
            className="mt-4"
          >
            Voltar ao Início
          </Button>
        </div>
      </div>
    );
  }

  const options = {
    clientSecret,
    appearance: {
      theme: 'stripe' as const,
    },
  };

  return (
    <Elements stripe={stripePromise} options={options}>
      <CheckoutForm 
        orderId={params.orderId}
        amount={parseFloat(orderData.totalAmount)}
        customerEmail={orderData.customerEmail || ""}
        orderData={orderData}
      />
    </Elements>
  );
}