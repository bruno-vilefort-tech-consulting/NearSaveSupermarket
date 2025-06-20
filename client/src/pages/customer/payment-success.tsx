import { useEffect } from 'react';
import { CheckCircle, Home, Package } from 'lucide-react';

export default function PaymentSuccess() {
  useEffect(() => {
    // Limpar carrinho após pagamento bem-sucedido
    localStorage.removeItem('cartItems');
  }, []);

  return (
    <div className="min-h-screen bg-eco-sage-light">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-md mx-auto">
          <div className="flex items-center p-4">
            <div>
              <h1 className="text-lg font-bold text-eco-gray-dark">Pagamento Realizado</h1>
              <p className="text-sm text-eco-gray">Seu pedido foi confirmado</p>
            </div>
          </div>
        </div>
      </div>

      {/* Success Content */}
      <div className="max-w-md mx-auto p-4">
        <div className="bg-white rounded-lg shadow-sm border border-eco-gray-light p-6 text-center mb-6">
          <CheckCircle className="h-16 w-16 text-eco-green mx-auto mb-4" />
          <h2 className="text-xl font-bold text-eco-gray-dark mb-2">Pagamento Confirmado!</h2>
          <p className="text-eco-gray mb-4">
            Seu pagamento foi processado com sucesso. O supermercado receberá sua compra e entrará em contato em breve.
          </p>
          
          <div className="bg-eco-sage-light rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-eco-gray-dark mb-2">Próximos Passos:</h3>
            <ul className="text-sm text-eco-gray space-y-1 text-left">
              <li>• O supermercado confirmará os itens disponíveis</li>
              <li>• Você receberá uma notificação quando estiver pronto</li>
              <li>• Retire no local ou aguarde a entrega conforme combinado</li>
            </ul>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <a 
            href="/home" 
            className="w-full bg-eco-green hover:bg-eco-green-dark text-white font-semibold py-4 px-4 rounded-xl transition-colors flex items-center justify-center"
          >
            <Home className="h-5 w-5 mr-2" />
            Voltar ao Início
          </a>
          
          <a 
            href="/orders" 
            className="w-full bg-white hover:bg-eco-sage-light text-eco-gray-dark font-semibold py-4 px-4 rounded-xl transition-colors border border-eco-gray-light flex items-center justify-center"
          >
            <Package className="h-5 w-5 mr-2" />
            Ver Meus Pedidos
          </a>
        </div>

        {/* Eco Points Info */}
        <div className="bg-eco-sage-light rounded-lg p-4 mt-6">
          <h3 className="font-semibold text-eco-gray-dark mb-2 text-center">🌱 Parabéns!</h3>
          <p className="text-sm text-eco-gray text-center">
            Você contribuiu para reduzir o desperdício de alimentos e ajudou o meio ambiente!
          </p>
        </div>
      </div>
    </div>
  );
}