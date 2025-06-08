import { ArrowLeft, Trash2, Plus, Minus } from "lucide-react";
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

export default function CartFinal() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando carrinho...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <a href="/customer" className="mr-4">
              <ArrowLeft className="h-6 w-6 text-gray-600" />
            </a>
            <div>
              <h1 className="text-lg font-bold text-gray-800">Carrinho de Compras</h1>
              <p className="text-sm text-gray-600">{getTotalItems()} {getTotalItems() === 1 ? 'item' : 'itens'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Cart Content */}
      <div className="max-w-md mx-auto p-4">
        {cartItems.length === 0 ? (
          /* Empty Cart */
          <div className="text-center pt-8">
            <div className="mb-4">
              <div className="w-16 h-16 bg-orange-100 rounded-full mx-auto flex items-center justify-center">
                <span className="text-2xl">🛒</span>
              </div>
            </div>
            <h2 className="text-xl font-semibold mb-2 text-gray-800">Seu carrinho está vazio</h2>
            <p className="text-gray-600 mb-6">Adicione produtos para começar suas compras sustentáveis</p>
            <a href="/customer">
              <button className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-xl transition-colors">
                Continuar Comprando
              </button>
            </a>
          </div>
        ) : (
          /* Cart Items */
          <div className="space-y-4">
            {cartItems.map((item) => (
              <div key={item.id} className="bg-white rounded-lg shadow-sm border p-4">
                <div className="flex items-start space-x-3">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl">📦</span>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800">{item.name}</h3>
                    {item.supermarketName && (
                      <p className="text-sm text-gray-500">{item.supermarketName}</p>
                    )}
                    
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-lg font-bold text-green-600">
                        R$ {parseFloat(item.discountPrice).toFixed(2).replace('.', ',')}
                      </span>
                      {item.originalPrice && (
                        <span className="text-sm text-gray-500 line-through">
                          R$ {parseFloat(item.originalPrice).toFixed(2).replace('.', ',')}
                        </span>
                      )}
                    </div>
                    
                    {item.expirationDate && (
                      <p className="text-xs text-gray-500 mt-1">
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
                
                <div className="flex items-center justify-between mt-3 pt-3 border-t">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="p-1 rounded-md border hover:bg-gray-50 transition-colors"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="px-3 py-1 bg-gray-100 rounded-md min-w-[40px] text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="p-1 rounded-md border hover:bg-gray-50 transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  
                  <div className="text-right">
                    <p className="font-semibold text-gray-800">
                      R$ {(parseFloat(item.discountPrice) * item.quantity).toFixed(2).replace('.', ',')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Total Summary */}
            <div className="bg-white rounded-lg shadow-sm border p-4 mt-6">
              <div className="flex justify-between items-center mb-4">
                <span className="text-lg font-semibold text-gray-800">Total:</span>
                <span className="text-xl font-bold text-green-600">
                  R$ {getTotalPrice().toFixed(2).replace('.', ',')}
                </span>
              </div>
              
              <div className="space-y-2">
                <a href="/order-review">
                  <button className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition-colors">
                    Finalizar Pedido
                  </button>
                </a>
                <a href="/customer">
                  <button className="w-full border border-green-600 text-green-600 hover:bg-green-50 font-semibold py-3 rounded-xl transition-colors">
                    Continuar Comprando
                  </button>
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}