import { ArrowLeft } from "lucide-react";

export default function CartFinal() {
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
              <p className="text-sm text-gray-600">0 itens</p>
            </div>
          </div>
        </div>
      </div>

      {/* Empty Cart Content */}
      <div className="max-w-md mx-auto p-4 pt-8">
        <div className="text-center">
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
      </div>
    </div>
  );
}