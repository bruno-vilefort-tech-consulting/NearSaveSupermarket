import React, { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Carrega Stripe com a chave pública
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

interface CartItem {
  id: number;
  name: string;
  quantity: number;
  discountPrice: string;
  originalPrice: string;
}

const CheckoutForm = ({ totalAmount }: { totalAmount: number }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      console.log('Stripe não inicializado');
      return;
    }

    setIsLoading(true);

    try {
      // Primeiro, verificar se o payment method está válido
      const { error: submitError } = await elements.submit();
      if (submitError) {
        console.error('Erro na validação:', submitError);
        toast({
          title: "Erro na Validação",
          description: submitError.message || "Verifique os dados do cartão",
          variant: "destructive",
        });
        return;
      }

      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin + '/payment-success',
        },
        redirect: 'if_required'
      });

      if (error) {
        console.error('Erro no pagamento Stripe:', error);
        
        // Verifica se é erro de estado inesperado (pagamento já processado)
        if (error.code === 'payment_intent_unexpected_state' && error.payment_intent?.status === 'succeeded') {
          console.log('Pagamento já foi processado com sucesso, redirecionando...');
          window.location.href = '/payment-success';
          return;
        }
        
        toast({
          title: "Erro no Pagamento",
          description: error.message || "Ocorreu um erro durante o pagamento",
          variant: "destructive",
        });
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        console.log('Pagamento Stripe bem-sucedido');
        
        // Criar o pedido após pagamento bem-sucedido
        try {
          console.log('🎯 Criando pedido após pagamento bem-sucedido');
          const cartItems = JSON.parse(localStorage.getItem('cart') || '[]');
          const customerInfo = JSON.parse(localStorage.getItem('customerInfo') || '{}');
          
          const orderData = {
            customerName: customerInfo.fullName || '',
            customerEmail: customerInfo.email || '',
            customerPhone: customerInfo.phone || '',
            fulfillmentMethod: 'pickup',
            items: cartItems.map((item: any) => ({
              productId: item.id,
              quantity: item.quantity,
              priceAtTime: item.discountPrice
            })),
            paymentIntentId: paymentIntent.id,
            totalAmount: totalAmount.toString()
          };

          const createOrderResponse = await fetch('/api/customer/orders', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(orderData)
          });

          if (createOrderResponse.ok) {
            const newOrder = await createOrderResponse.json();
            console.log('✅ Pedido criado com sucesso:', newOrder.id);
            
            // Confirmar o pagamento no backend
            const confirmResponse = await fetch('/api/payments/stripe/confirm', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                orderId: newOrder.id,
                paymentIntentId: paymentIntent.id,
                amount: totalAmount
              })
            });

            if (confirmResponse.ok) {
              console.log('✅ Pagamento confirmado no backend');
              // Limpar dados temporários
              localStorage.removeItem('cart');
              localStorage.removeItem('currentOrderId');
              localStorage.setItem('lastOrderId', newOrder.id.toString());
            } else {
              console.error('⚠️ Erro ao confirmar pagamento no backend');
            }
          } else {
            console.error('❌ Erro ao criar pedido');
          }
        } catch (error) {
          console.error('❌ Erro ao processar pedido:', error);
        }
        
        window.location.href = '/payment-success';
      }
    } catch (err) {
      console.error('Erro inesperado no pagamento:', err);
      toast({
        title: "Erro no Pagamento",
        description: "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-eco-gray-light p-4">
        <h2 className="text-lg font-semibold text-eco-gray-dark mb-4">Dados do Cartão</h2>
        <PaymentElement />
      </div>
      
      <button
        type="submit"
        disabled={!stripe || isLoading}
        className="w-full bg-eco-green hover:bg-eco-green-dark text-white font-semibold py-4 px-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Processando...' : `Pagar R$ ${totalAmount.toFixed(2).replace('.', ',')}`}
      </button>
    </form>
  );
};

export default function StripePayment() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [clientSecret, setClientSecret] = useState("");
  const [isCreatingPayment, setIsCreatingPayment] = useState(true);

  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Erro não tratado no Stripe:', event.reason);
      event.preventDefault();
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    // Carrega itens do carrinho
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        setCartItems(parsedCart);
        
        // Calcular total e criar PaymentIntent apenas UMA vez
        const total = parsedCart.reduce((sum: number, item: CartItem) => {
          return sum + (parseFloat(item.discountPrice) * item.quantity);
        }, 0);

        // Criar chave única baseada no conteúdo do carrinho
        const cartKey = btoa(JSON.stringify(parsedCart.map(item => `${item.id}-${item.quantity}`)));
        const currentPaymentKey = sessionStorage.getItem('current-payment-key');
        
        // Só criar PaymentIntent se não existe um para este carrinho específico
        if (currentPaymentKey !== cartKey) {
          sessionStorage.setItem('current-payment-key', cartKey);
          sessionStorage.setItem('stripe-creating', 'true');
          createPaymentIntent(total);
        } else {
          console.log('PaymentIntent já existe para este carrinho');
          setIsCreatingPayment(false);
        }
      } catch (error) {
        console.error('Erro ao processar carrinho:', error);
        setIsCreatingPayment(false);
      }
    } else {
      setIsCreatingPayment(false);
    }

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  const createPaymentIntent = async (amount: number) => {
    try {
      console.log('Criando payment intent para valor:', amount);
      
      const customerInfo = JSON.parse(localStorage.getItem('customerInfo') || '{}');
      
      // Usar endpoint simplificado para evitar duplicações no Stripe
      const response = await fetch("/api/payments/stripe/create-payment-intent", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amount,
          orderId: Math.floor(Math.random() * 999999) + 1, // Usar número aleatório como orderId temporário
          customerEmail: customerInfo.email || ""
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao criar payment intent');
      }
      
      const data = await response.json();
      console.log('Payment intent criado:', data.clientSecret ? 'Sucesso' : 'Falha');
      
      if (data.clientSecret) {
        setClientSecret(data.clientSecret);
        console.log('✅ PaymentIntent criado com sucesso');
        // Limpa o flag de criação após sucesso
        sessionStorage.removeItem('stripe-creating');
      } else {
        throw new Error('Client secret não retornado');
      }
    } catch (error) {
      console.error('Erro ao criar payment intent:', error);
      console.error('Detalhes do erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      setClientSecret(""); // Reset em caso de erro
      // Limpa o flag de criação mesmo em caso de erro para permitir nova tentativa
      sessionStorage.removeItem('stripe-creating');
    } finally {
      setIsCreatingPayment(false);
    }
  };

  const getTotalAmount = () => {
    return cartItems.reduce((total, item) => {
      return total + (parseFloat(item.discountPrice) * item.quantity);
    }, 0);
  };

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  if (isCreatingPayment) {
    return (
      <div className="min-h-screen bg-eco-sage-light">
        {/* Header */}
        <div className="bg-white shadow-sm">
          <div className="max-w-md mx-auto">
            <div className="flex items-center p-4">
              <a href="/customer/payment-method" className="mr-4">
                <ArrowLeft className="h-6 w-6 text-eco-gray-dark hover:text-eco-blue transition-colors" />
              </a>
              <div>
                <h1 className="text-lg font-bold text-eco-gray-dark">Pagamento com Cartão</h1>
                <p className="text-sm text-eco-gray">Carregando...</p>
              </div>
            </div>
          </div>
        </div>

        {/* Loading Content */}
        <div className="max-w-md mx-auto p-4">
          <div className="h-screen flex items-center justify-center">
            <div className="animate-spin w-8 h-8 border-4 border-eco-green border-t-transparent rounded-full" aria-label="Loading"/>
          </div>
        </div>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="min-h-screen bg-eco-sage-light">
        {/* Header */}
        <div className="bg-white shadow-sm">
          <div className="max-w-md mx-auto">
            <div className="flex items-center p-4">
              <a href="/customer/payment-method" className="mr-4">
                <ArrowLeft className="h-6 w-6 text-eco-gray-dark hover:text-eco-blue transition-colors" />
              </a>
              <div>
                <h1 className="text-lg font-bold text-eco-gray-dark">Pagamento com Cartão</h1>
                <p className="text-sm text-eco-gray">Carregando...</p>
              </div>
            </div>
          </div>
        </div>

        {/* Loading Content */}
        <div className="max-w-md mx-auto p-4">
          <div className="h-screen flex items-center justify-center">
            <div className="animate-spin w-8 h-8 border-4 border-eco-green border-t-transparent rounded-full" aria-label="Loading"/>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-eco-sage-light">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-md mx-auto">
          <div className="flex items-center p-4">
            <a href="/customer/payment-method" className="mr-4">
              <ArrowLeft className="h-6 w-6 text-eco-gray-dark hover:text-eco-blue transition-colors" />
            </a>
            <div>
              <h1 className="text-lg font-bold text-eco-gray-dark">Pagamento com Cartão</h1>
              <p className="text-sm text-eco-gray">Digite os dados do seu cartão</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-md mx-auto p-4">
        <div className="space-y-6">
          {/* Order Summary */}
          <div className="bg-white rounded-lg shadow-sm border border-eco-gray-light p-4">
            <h2 className="text-lg font-semibold text-eco-gray-dark mb-4">Resumo do Pedido</h2>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-eco-gray">Itens ({getTotalItems()})</span>
                <span className="text-eco-gray-dark">
                  R$ {getTotalAmount().toFixed(2).replace('.', ',')}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-eco-gray">Taxa de entrega</span>
                <span className="text-eco-green">Grátis</span>
              </div>
              
              <div className="border-t border-eco-gray-light pt-3">
                <div className="flex justify-between">
                  <span className="text-lg font-semibold text-eco-gray-dark">Total</span>
                  <span className="text-lg font-bold text-eco-green">
                    R$ {getTotalAmount().toFixed(2).replace('.', ',')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Stripe Payment Form */}
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <CheckoutForm totalAmount={getTotalAmount()} />
          </Elements>
        </div>
      </div>
    </div>
  );
}