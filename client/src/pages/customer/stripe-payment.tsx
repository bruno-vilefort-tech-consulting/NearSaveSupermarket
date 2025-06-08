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
      return;
    }

    setIsLoading(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin + '/payment-success',
      },
    });

    if (error) {
      toast({
        title: "Erro no Pagamento",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Pagamento Realizado",
        description: "Seu pagamento foi processado com sucesso!",
      });
    }

    setIsLoading(false);
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
    // Carrega itens do carrinho
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      const parsedCart = JSON.parse(savedCart);
      setCartItems(parsedCart);
      
      // Calcula o total e cria o payment intent
      const total = parsedCart.reduce((sum: number, item: CartItem) => {
        return sum + (parseFloat(item.discountPrice) * item.quantity);
      }, 0);

      createPaymentIntent(total);
    }
  }, []);

  const createPaymentIntent = async (amount: number) => {
    try {
      // Primeiro, precisamos criar um pedido temporário para obter um ID
      const orderData = {
        customerName: 'Cliente Stripe',
        customerEmail: 'stripe@temp.com',
        customerPhone: '(11) 99999-9999',
        deliveryAddress: null,
        fulfillmentMethod: 'pickup',
        totalAmount: amount.toString(),
        notes: 'Pedido via Stripe'
      };

      const items = cartItems.map(item => ({
        productId: item.id,
        quantity: item.quantity,
        priceAtTime: item.discountPrice
      }));

      // Criar pedido temporário
      const orderResponse = await apiRequest("POST", "/api/orders", {
        ...orderData,
        items
      });
      const orderResult = await orderResponse.json();
      
      // Agora criar o payment intent
      const response = await apiRequest("POST", "/api/payments/stripe/create-payment-intent", { 
        amount: amount,
        orderId: orderResult.id,
        customerEmail: orderData.customerEmail
      });
      const data = await response.json();
      setClientSecret(data.clientSecret);
    } catch (error) {
      console.error('Erro ao criar payment intent:', error);
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

  if (isCreatingPayment || !clientSecret) {
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