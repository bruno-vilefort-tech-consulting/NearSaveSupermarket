import { ArrowLeft, Trash2, Plus, Minus, MapPin, Clock, User, Phone, Mail } from "lucide-react";
import { useState, useEffect } from "react";

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

interface CustomerInfo {
  fullName: string;
  email: string;
  phone: string;
}

export default function CartFinal() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    fullName: 'Antonio Alves',
    email: 'antonio.alves@gmail.com',
    phone: '(34) 99999-9999'
  });
  const [deliveryMethod, setDeliveryMethod] = useState<'pickup' | 'delivery'>('pickup');
  const [deliveryAddress, setDeliveryAddress] = useState('');

  useEffect(() => {
    console.log('🛒 CARRINHO FINAL - Carregando itens do localStorage');
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        const items = JSON.parse(savedCart);
        console.log('🛒 Itens encontrados no carrinho:', items);
        setCartItems(items);
      } catch (error) {
        console.error('🛒 Erro ao carregar carrinho:', error);
        setCartItems([]);
      }
    }
    setLoading(false);
  }, []);

  const removeItem = (productId: number) => {
    const updatedItems = cartItems.filter(item => item.id !== productId);
    setCartItems(updatedItems);
    localStorage.setItem('cart', JSON.stringify(updatedItems));
  };

  const updateQuantity = (productId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(productId);
      return;
    }
    
    const updatedItems = cartItems.map(item => 
      item.id === productId ? { ...item, quantity: newQuantity } : item
    );
    setCartItems(updatedItems);
    localStorage.setItem('cart', JSON.stringify(updatedItems));
  };

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => {
      return total + (parseFloat(item.discountPrice) * item.quantity);
    }, 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-eco-cream flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-eco-green border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-eco-gray-dark">Carregando carrinho...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-eco-cream">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-eco-gray-light">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <a href="/customer" className="mr-4">
              <ArrowLeft className="h-6 w-6 text-eco-gray-dark hover:text-eco-blue transition-colors" />
            </a>
            <div>
              <h1 className="text-lg font-bold text-eco-gray-dark">Carrinho</h1>
              <p className="text-sm text-eco-gray">{getTotalItems()} {getTotalItems() === 1 ? 'item' : 'itens'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-md mx-auto p-4">
        {cartItems.length === 0 ? (
          /* Empty Cart */
          <div className="text-center pt-8">
            <div className="mb-4">
              <div className="w-16 h-16 bg-eco-orange-light rounded-full mx-auto flex items-center justify-center">
                <span className="text-2xl">🛒</span>
              </div>
            </div>
            <h2 className="text-xl font-semibold mb-2 text-eco-gray-dark">Seu carrinho está vazio</h2>
            <p className="text-eco-gray mb-6">Adicione produtos para começar suas compras sustentáveis</p>
            <a href="/customer">
              <button className="w-full bg-eco-green hover:bg-eco-green-dark text-white font-semibold py-2 px-4 rounded-xl transition-colors">
                Continuar Comprando
              </button>
            </a>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Supermarket Information */}
            <div className="bg-eco-sage-light rounded-lg border border-eco-green/20 p-4">
              <div className="flex items-center">
                <MapPin className="h-5 w-5 text-eco-green mr-2" />
                <div>
                  <h2 className="text-lg font-semibold text-eco-gray-dark">{cartItems[0]?.supermarketName}</h2>
                  <p className="text-sm text-eco-gray">{cartItems[0]?.createdBy?.supermarketAddress}</p>
                </div>
              </div>
            </div>

            {/* Customer Information */}
            <div className="bg-white rounded-lg shadow-sm border border-eco-gray-light p-4">
              <div className="flex items-center space-x-2 mb-4">
                <User className="h-5 w-5 text-eco-green" />
                <h2 className="text-lg font-semibold text-eco-gray-dark">Dados do Cliente</h2>
              </div>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <User className="h-4 w-4 text-eco-gray" />
                  <span className="text-eco-gray-dark">{customerInfo.fullName}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Mail className="h-4 w-4 text-eco-gray" />
                  <span className="text-eco-gray-dark">{customerInfo.email}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="h-4 w-4 text-eco-gray" />
                  <span className="text-eco-gray-dark">{customerInfo.phone}</span>
                </div>
              </div>
            </div>

            {/* Delivery Method */}
            <div className="bg-white rounded-lg shadow-sm border border-eco-gray-light p-4">
              <div className="flex items-center space-x-2 mb-4">
                <MapPin className="h-5 w-5 text-eco-green" />
                <h2 className="text-lg font-semibold text-eco-gray-dark">Forma de Retirada</h2>
              </div>
              <div className="space-y-3">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="deliveryMethod"
                    value="pickup"
                    checked={deliveryMethod === 'pickup'}
                    onChange={(e) => setDeliveryMethod(e.target.value as 'pickup')}
                    className="text-eco-green focus:ring-eco-green"
                  />
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-eco-gray" />
                    <span className="text-eco-gray-dark">Retirar na loja</span>
                  </div>
                </label>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="deliveryMethod"
                    value="delivery"
                    checked={deliveryMethod === 'delivery'}
                    onChange={(e) => setDeliveryMethod(e.target.value as 'delivery')}
                    className="text-eco-green focus:ring-eco-green"
                  />
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-eco-gray" />
                    <span className="text-eco-gray-dark">Entrega em domicílio</span>
                  </div>
                </label>
              </div>
              {deliveryMethod === 'delivery' && (
                <div className="mt-4">
                  <label htmlFor="deliveryAddress" className="block text-sm font-medium text-eco-gray-dark mb-2">
                    Endereço de entrega
                  </label>
                  <textarea
                    id="deliveryAddress"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="Digite seu endereço completo..."
                    className="w-full p-3 border border-eco-gray-light rounded-lg focus:ring-2 focus:ring-eco-green focus:border-eco-green resize-none"
                    rows={3}
                    required
                  />
                </div>
              )}
            </div>

            {/* Order Items */}
            <div className="bg-white rounded-lg shadow-sm border border-eco-gray-light p-4">
              <div className="flex items-center space-x-2 mb-4">
                <svg className="h-5 w-5 text-eco-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6M7 13l-1.5-6m0 0h-.9M16 16h1m2 0a2 2 0 11-4 0 2 2 0 014 0zM9 16a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <h2 className="text-lg font-semibold text-eco-gray-dark">Itens do Pedido</h2>
              </div>
              <div className="space-y-4">
                {cartItems.map((item) => (
                  <div key={item.id} className="border border-eco-gray-light rounded-lg p-3">
                    <div className="flex items-start space-x-3">
                      <div className="w-16 h-16 bg-eco-sage-light rounded-lg flex items-center justify-center overflow-hidden">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-2xl">📦</span>
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <h3 className="font-semibold text-eco-gray-dark">{item.name}</h3>
                        {item.supermarketName && (
                          <p className="text-sm text-eco-gray">{item.supermarketName}</p>
                        )}
                        
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-lg font-bold text-eco-green">
                            R$ {parseFloat(item.discountPrice).toFixed(2).replace('.', ',')}
                          </span>
                          {item.originalPrice && (
                            <span className="text-sm text-eco-gray line-through">
                              R$ {parseFloat(item.originalPrice).toFixed(2).replace('.', ',')}
                            </span>
                          )}
                        </div>
                        
                        {item.expirationDate && (
                          <p className="text-xs text-eco-gray mt-1">
                            Válido até: {new Date(item.expirationDate).toLocaleDateString('pt-BR')}
                          </p>
                        )}
                      </div>
                      
                      <button
                        onClick={() => removeItem(item.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-eco-gray-light">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="p-1 rounded-md border border-eco-gray-light hover:bg-eco-sage-light transition-colors text-eco-gray-dark"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="px-3 py-1 bg-eco-sage-light rounded-md min-w-[40px] text-center text-eco-gray-dark font-medium">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="p-1 rounded-md border border-eco-gray-light hover:bg-eco-sage-light transition-colors text-eco-gray-dark"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                      
                      <div className="text-right">
                        <p className="font-semibold text-eco-gray-dark">
                          R$ {(parseFloat(item.discountPrice) * item.quantity).toFixed(2).replace('.', ',')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Order Summary */}
            <div className="bg-white rounded-lg shadow-sm border border-eco-gray-light p-4">
              <h2 className="text-lg font-semibold text-eco-gray-dark mb-4">Resumo do Pedido</h2>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-eco-gray-dark">
                  <span>Subtotal ({getTotalItems()} {getTotalItems() === 1 ? 'item' : 'itens'})</span>
                  <span>R$ {getTotalPrice().toFixed(2).replace('.', ',')}</span>
                </div>
                <div className="flex justify-between text-eco-gray-dark">
                  <span>Taxa de entrega</span>
                  <span className="text-eco-green">Grátis</span>
                </div>
                <div className="border-t border-eco-gray-light pt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-eco-gray-dark">Total</span>
                    <span className="text-xl font-bold text-eco-green">
                      R$ {getTotalPrice().toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                </div>
              </div>
              
              <a href="/order-review">
                <button className="w-full bg-eco-green hover:bg-eco-green-dark text-white font-semibold py-3 rounded-xl transition-colors">
                  Finalizar Pedido
                </button>
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}