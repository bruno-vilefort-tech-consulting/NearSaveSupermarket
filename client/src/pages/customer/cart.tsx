import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { ArrowLeft, Plus, Minus, Trash2, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useLanguage } from '@/contexts/LanguageContext';

interface CartItem {
  id: number;
  name: string;
  originalPrice: string;
  discountPrice: string;
  quantity: number;
  imageUrl?: string;
  expirationDate: string;
  supermarketId?: string;
  supermarketName?: string;
  createdBy?: {
    supermarketName?: string;
    supermarketAddress?: string;
  };
}

export default function CustomerCartPT() {
  const { language, t } = useLanguage();
  const [, setLocation] = useLocation();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [deliveryType, setDeliveryType] = useState("pickup");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [customerInfo, setCustomerInfo] = useState<any>(null);



  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      setCartItems(JSON.parse(savedCart));
    }

    const savedCustomer = localStorage.getItem('customerInfo');
    if (savedCustomer) {
      setCustomerInfo(JSON.parse(savedCustomer));
    }
  }, []);

  const updateQuantity = (itemId: number, change: number) => {
    setCartItems(prevItems => {
      const updatedItems = prevItems.map(item => {
        if (item.id === itemId) {
          const newQuantity = Math.max(0, item.quantity + change);
          return { ...item, quantity: newQuantity };
        }
        return item;
      }).filter(item => item.quantity > 0);
      
      localStorage.setItem('cart', JSON.stringify(updatedItems));
      return updatedItems;
    });
  };

  const removeItem = (itemId: number) => {
    setCartItems(prevItems => {
      const updatedItems = prevItems.filter(item => item.id !== itemId);
      localStorage.setItem('cart', JSON.stringify(updatedItems));
      return updatedItems;
    });
  };

  const getTotalValue = () => {
    return cartItems.reduce((total, item) => {
      return total + (parseFloat(item.discountPrice.replace('R$ ', '').replace(',', '.')) * item.quantity);
    }, 0);
  };

  const handleCheckout = () => {
    if (!customerInfo) {
      alert('Por favor, faça login para continuar com a compra.');
      setLocation('/customer/login');
      return;
    }
    
    const orderData = {
      items: cartItems,
      deliveryType,
      deliveryAddress,
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
              <small className="text-xs text-green-600 font-bold">PORTUGUÊS v7 - FORÇAR CACHE</small>
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

            <h2 className="text-xl font-semibold mb-2 text-eco-gray-dark">SEU CARRINHO ESTÁ VAZIO</h2>
            <p className="text-eco-gray mb-6">Adicione produtos para começar suas compras sustentáveis</p>
            <div className="text-xs text-gray-400 mb-2">Versão: {Date.now()}</div>
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

  const groupedItems = cartItems.reduce((acc, item) => {
    const supermarketKey = item.createdBy?.supermarketName || item.supermarketName || 'Mercado Desconhecido';
    if (!acc[supermarketKey]) {
      acc[supermarketKey] = {
        supermarketName: supermarketKey,
        supermarketAddress: item.createdBy?.supermarketAddress || '',
        items: []
      };
    }
    acc[supermarketKey].items.push(item);
    return acc;
  }, {} as Record<string, { supermarketName: string; supermarketAddress: string; items: CartItem[] }>);

  return (
    <div className="min-h-screen bg-eco-gray-light">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/customer">
              <ArrowLeft className="h-6 w-6 text-eco-gray" />
            </Link>
            <h1 className="ml-4 text-lg font-bold text-eco-gray-dark">CARRINHO DE COMPRAS</h1>
          </div>
          <div className="text-right">
            <p className="text-sm text-eco-gray">Total</p>
            <p className="text-lg font-bold text-eco-green">R$ {getTotalValue().toFixed(2).replace('.', ',')}</p>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto pb-24">
        {Object.values(groupedItems).map((supermarket, index) => (
          <div key={index} className="bg-white mb-4 mx-4 rounded-lg shadow-sm">
            <div className="p-4 border-b border-eco-gray-light">
              <div className="flex items-center">
                <MapPin className="h-5 w-5 text-eco-green mr-2" />
                <div>
                  <h3 className="font-semibold text-eco-gray-dark">{supermarket.supermarketName}</h3>
                  {supermarket.supermarketAddress && (
                    <p className="text-sm text-eco-gray">{supermarket.supermarketAddress}</p>
                  )}
                </div>
              </div>
            </div>

            {supermarket.items.map((item: CartItem) => (
              <div key={item.id} className="p-4 border-b border-eco-gray-light last:border-b-0">
                <div className="flex items-center space-x-3">
                  <div className="w-16 h-16 bg-eco-gray-light rounded-lg flex items-center justify-center overflow-hidden">
                    {item.imageUrl ? (
                      <img 
                        src={item.imageUrl} 
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl">📦</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-eco-gray-dark">{item.name}</h4>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-sm text-eco-gray line-through">{item.originalPrice}</span>
                      <span className="text-lg font-bold text-eco-green">{item.discountPrice}</span>
                    </div>
                    <p className="text-xs text-eco-orange mt-1">
                      Vence: {new Date(item.expirationDate).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        className="w-8 h-8 rounded-full bg-eco-gray-light flex items-center justify-center"
                      >
                        <Minus className="h-4 w-4 text-eco-gray" />
                      </button>
                      <span className="text-lg font-semibold min-w-[2rem] text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        className="w-8 h-8 rounded-full bg-eco-green flex items-center justify-center"
                      >
                        <Plus className="h-4 w-4 text-white" />
                      </button>
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-red-500 p-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}

        <div className="bg-white mx-4 rounded-lg shadow-sm p-4 mb-4">
          <h3 className="font-semibold text-eco-gray-dark mb-3">TIPO DE ENTREGA</h3>
          <RadioGroup value={deliveryType} onValueChange={setDeliveryType}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="pickup" id="pickup" />
              <Label htmlFor="pickup">RETIRADA NO LOCAL</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="delivery" id="delivery" />
              <Label htmlFor="delivery">ENTREGA A DOMICÍLIO</Label>
            </div>
          </RadioGroup>

          {deliveryType === "delivery" && (
            <div className="mt-4">
              <Label htmlFor="address">ENDEREÇO DE ENTREGA</Label>
              <Textarea
                id="address"
                placeholder="Digite o endereço completo..."
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                className="mt-2"
                rows={3}
              />
            </div>
          )}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-eco-gray-light p-4">
        <div className="max-w-md mx-auto">
          <div className="flex justify-between items-center mb-4">
            <span className="text-lg font-semibold text-eco-gray-dark">TOTAL:</span>
            <span className="text-2xl font-bold text-eco-green">R$ {getTotalValue().toFixed(2).replace('.', ',')}</span>
          </div>
          <Button 
            onClick={handleCheckout}
            className="w-full bg-eco-green hover:bg-eco-green-dark text-white font-semibold py-3 rounded-xl transition-colors"
          >
            FINALIZAR COMPRA
          </Button>
        </div>
      </div>
    </div>
  );
}