import React, { useState, useEffect } from 'react';
import { ArrowLeft, CreditCard, QrCode, CheckCircle } from 'lucide-react';

interface CartItem {
  id: number;
  name: string;
  quantity: number;
  discountPrice: string;
  originalPrice: string;
  imageUrl?: string;
  expirationDate: string;
  supermarketName?: string;
}

export default function PaymentMethod() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'card'>('pix');

  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      const parsedCart = JSON.parse(savedCart);
      setCartItems(parsedCart);
    }
  }, []);

  const getTotalAmount = () => {
    return cartItems.reduce((total, item) => {
      return total + (parseFloat(item.discountPrice) * item.quantity);
    }, 0);
  };

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const handleContinuePayment = () => {
    console.log('Continuando para pagamento:', paymentMethod);
    
    if (paymentMethod === 'pix') {
      // Navegar para tela de PIX
      window.location.href = '/pix-payment';
    } else if (paymentMethod === 'card') {
      // Navegar para tela de Stripe
      window.location.href = '/customer/stripe-payment';
    }
  };

  return (
    <div className="min-h-screen bg-eco-sage-light">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-md mx-auto">
          <div className="flex items-center p-4">
            <a href="/customer/cart" className="mr-4">
              <ArrowLeft className="h-6 w-6 text-eco-gray-dark hover:text-eco-blue transition-colors" />
            </a>
            <div>
              <h1 className="text-lg font-bold text-eco-gray-dark">Método de Pagamento</h1>
              <p className="text-sm text-eco-gray">Escolha como deseja pagar</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-md mx-auto p-4">
        <div className="space-y-6">
          {/* Payment Method Selection */}
          <div className="bg-white rounded-lg shadow-sm border border-eco-gray-light p-4">
            <h2 className="text-lg font-semibold text-eco-gray-dark mb-4">Escolha o Método de Pagamento</h2>
            
            <div className="space-y-3">
              {/* PIX Option */}
              <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                       paymentMethod === 'pix' 
                         ? 'border-eco-green bg-eco-sage-light' 
                         : 'border-eco-gray-light hover:bg-eco-sage-light'
                     }`}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="pix"
                  checked={paymentMethod === 'pix'}
                  onChange={(e) => setPaymentMethod(e.target.value as 'pix' | 'card')}
                  className="sr-only"
                />
                <div className="flex items-center space-x-3 flex-1">
                  <QrCode className="h-6 w-6 text-eco-green" />
                  <div>
                    <h3 className="font-semibold text-eco-gray-dark">PIX</h3>
                    <p className="text-sm text-eco-gray">Pagamento instantâneo</p>
                  </div>
                </div>
                {paymentMethod === 'pix' && (
                  <CheckCircle className="h-5 w-5 text-eco-green" />
                )}
              </label>

              {/* Card Option */}
              <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                       paymentMethod === 'card' 
                         ? 'border-eco-green bg-eco-sage-light' 
                         : 'border-eco-gray-light hover:bg-eco-sage-light'
                     }`}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="card"
                  checked={paymentMethod === 'card'}
                  onChange={(e) => setPaymentMethod(e.target.value as 'pix' | 'card')}
                  className="sr-only"
                />
                <div className="flex items-center space-x-3 flex-1">
                  <CreditCard className="h-6 w-6 text-eco-green" />
                  <div>
                    <h3 className="font-semibold text-eco-gray-dark">Cartão de Crédito</h3>
                    <p className="text-sm text-eco-gray">Débito ou crédito</p>
                  </div>
                </div>
                {paymentMethod === 'card' && (
                  <CheckCircle className="h-5 w-5 text-eco-green" />
                )}
              </label>
            </div>
          </div>

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

          {/* Continue Button */}
          <button
            onClick={handleContinuePayment}
            className="w-full bg-eco-green hover:bg-eco-green-dark text-white font-semibold py-4 px-4 rounded-xl transition-colors"
          >
            Continuar para Pagamento
          </button>
        </div>
      </div>
    </div>
  );
}