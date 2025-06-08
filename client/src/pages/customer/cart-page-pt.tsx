import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Plus, Minus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "wouter";

interface CartItem {
  id: number;
  name: string;
  quantity: number;
  priceAtTime: string;
  originalPrice: string;
  imageUrl?: string;
  expirationDate: string;
  supermarketName?: string;
  createdBy?: {
    supermarketName?: string;
    supermarketAddress?: string;
  };
}

function ForcePortugueseCart() {
  // Force Portuguese rendering with no translation dependencies
  return (
    <div className="min-h-screen bg-eco-gray-light">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/customer">
              <ArrowLeft className="h-6 w-6 text-eco-gray" />
            </Link>
            <div className="ml-4">
              <h1 className="text-lg font-bold text-eco-gray-dark">CARRINHO DE COMPRAS - FORÇA PORTUGUÊS</h1>
              <p className="text-sm text-eco-gray">0 itens</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 pt-8">
        <div className="text-center">
          <div className="mb-4">
            <div className="w-16 h-16 bg-eco-orange-light rounded-full mx-auto flex items-center justify-center">
              <span className="text-2xl">🛒</span>
            </div>
          </div>

          <h2 className="text-xl font-semibold mb-2 text-eco-gray-dark">SEU CARRINHO ESTÁ VAZIO - FORÇADO PORTUGUÊS</h2>
          <p className="text-eco-gray mb-6">Adicione produtos para começar suas compras sustentáveis</p>
          <Link href="/customer">
            <Button className="w-full bg-eco-green hover:bg-eco-green-dark text-white font-semibold py-2 rounded-xl transition-colors">
              CONTINUAR COMPRANDO
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function CartPagePt() {
  // Force Portuguese rendering - no dependencies
  console.log('🛒 FORÇANDO CARRINHO EM PORTUGUÊS - v2025');
  return <ForcePortugueseCart />;

  const updateQuantity = (id: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(id);
      return;
    }

    const updatedItems = cartItems.map(item =>
      item.id === id ? { ...item, quantity: newQuantity } : item
    );
    setCartItems(updatedItems);
    localStorage.setItem('cart', JSON.stringify(updatedItems));
  };

  const removeItem = (id: number) => {
    const updatedItems = cartItems.filter(item => item.id !== id);
    setCartItems(updatedItems);
    localStorage.setItem('cart', JSON.stringify(updatedItems));
  };

  const getTotalValue = () => {
    return cartItems.reduce((total, item) => {
      return total + (parseFloat(item.priceAtTime) * item.quantity);
    }, 0);
  };

  const proceedToReview = () => {
    if (!customerInfo) {
      alert('Faça login para continuar com a compra');
      setLocation('/customer/login');
      return;
    }

    const orderData = {
      items: cartItems.map(item => ({
        productId: item.id,
        quantity: item.quantity,
        priceAtTime: item.priceAtTime
      })),
      deliveryType,
      deliveryAddress: deliveryType === 'delivery' ? deliveryAddress : null,
      customerInfo,
      totalAmount: getTotalValue().toFixed(2)
    };
    
    localStorage.setItem('pendingOrder', JSON.stringify(orderData));
    setLocation('/customer/order-review');
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-eco-gray-light">
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-md mx-auto px-4 py-4 flex items-center">
            <Link href="/customer">
              <ArrowLeft className="h-6 w-6 text-eco-gray" />
            </Link>
            <div className="ml-4">
              <h1 className="text-lg font-bold text-eco-gray-dark">CARRINHO DE COMPRAS</h1>
            </div>
          </div>
        </div>

        <div className="max-w-md mx-auto p-4 pt-8">
          <div className="text-center">
            <div className="mb-4">
              <div className="w-16 h-16 bg-eco-orange-light rounded-full mx-auto flex items-center justify-center">
                <span className="text-2xl">🛒</span>
              </div>
            </div>

            <h2 className="text-xl font-semibold mb-2 text-eco-gray-dark">SEU CARRINHO ESTÁ VAZIO - PORTUGUÊS v2025</h2>
            <p className="text-eco-gray mb-6">Adicione produtos para começar suas compras sustentáveis agora</p>
            <Link href="/customer">
              <Button className="w-full bg-eco-green hover:bg-eco-green-dark text-white font-semibold py-2 rounded-xl transition-colors">
                CONTINUAR COMPRANDO
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-eco-gray-light">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/customer">
              <ArrowLeft className="h-6 w-6 text-eco-gray" />
            </Link>
            <div className="ml-4">
              <h1 className="text-lg font-bold text-eco-gray-dark">CARRINHO DE COMPRAS</h1>
              <p className="text-sm text-eco-gray">{cartItems.length} {cartItems.length === 1 ? 'item' : 'itens'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4">
        <div className="space-y-4 mb-6">
          {cartItems.map((item) => (
            <div key={item.id} className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="w-16 h-16 bg-eco-gray-light rounded-lg flex items-center justify-center">
                  {item.imageUrl ? (
                    <img 
                      src={item.imageUrl} 
                      alt={item.name}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <span className="text-2xl">📦</span>
                  )}
                </div>
                
                <div className="flex-1">
                  <h3 className="font-medium text-eco-gray-dark mb-1">{item.name}</h3>
                  <p className="text-sm text-eco-gray mb-2">
                    {item.supermarketName || item.createdBy?.supermarketName}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-8 h-8 p-0"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-8 text-center font-medium">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-8 h-8 p-0"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="text-right">
                      <p className="font-bold text-eco-green">
                        R$ {(parseFloat(item.priceAtTime) * item.quantity).toFixed(2)}
                      </p>
                      {item.originalPrice !== item.priceAtTime && (
                        <p className="text-sm text-eco-gray line-through">
                          R$ {(parseFloat(item.originalPrice) * item.quantity).toFixed(2)}
                        </p>
                      )}
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(item.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm mb-6">
          <h3 className="font-medium text-eco-gray-dark mb-3">MÉTODO DE ENTREGA</h3>
          <RadioGroup value={deliveryType} onValueChange={setDeliveryType}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="pickup" id="pickup" />
              <Label htmlFor="pickup">Retirar no local</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="delivery" id="delivery" />
              <Label htmlFor="delivery">Entrega em domicílio</Label>
            </div>
          </RadioGroup>

          {deliveryType === 'delivery' && (
            <div className="mt-3">
              <Label htmlFor="address" className="text-sm font-medium">
                Endereço de entrega
              </Label>
              <Textarea
                id="address"
                placeholder="Digite seu endereço completo..."
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                className="mt-1"
              />
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-eco-gray">Subtotal</span>
            <span className="font-medium">R$ {getTotalValue().toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center text-lg font-bold">
            <span>Total</span>
            <span className="text-eco-green">R$ {getTotalValue().toFixed(2)}</span>
          </div>
        </div>

        <Button
          onClick={proceedToReview}
          className="w-full bg-eco-green hover:bg-eco-green-dark text-white font-semibold py-3 rounded-xl"
          disabled={deliveryType === 'delivery' && !deliveryAddress.trim()}
        >
          REVISAR PEDIDO
        </Button>
      </div>
    </div>
  );
}