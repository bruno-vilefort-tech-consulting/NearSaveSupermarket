import { useQuery } from "@tanstack/react-query";

export default function Products() {
  const { data: products, isLoading } = useQuery({
    queryKey: ["/api/products"],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <span className="text-green-600 text-2xl mr-2">🌱</span>
              <span className="text-xl font-bold text-gray-900">EcoMarket</span>
            </div>
            <a href="/" className="text-gray-700 hover:text-green-600 px-3 py-2 rounded-md text-sm font-medium">
              Voltar
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Produtos Sustentáveis</h1>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {(products || []).map((product: any) => (
            <div key={product.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-4">
              <div className="aspect-square bg-gray-100 rounded-lg mb-4 flex items-center justify-center">
                <span className="text-4xl">🥬</span>
              </div>
              <h3 className="font-semibold text-lg mb-2">{product.name}</h3>
              <p className="text-gray-600 text-sm mb-3">{product.category}</p>
              <div className="flex justify-between items-center mb-3">
                <div>
                  <span className="text-lg font-bold text-green-600">
                    R$ {product.discountPrice}
                  </span>
                  <span className="text-sm text-gray-500 line-through ml-2">
                    R$ {product.originalPrice}
                  </span>
                </div>
                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                  {product.ecoPoints} pts eco
                </span>
              </div>
              <p className="text-xs text-gray-500 mb-3">
                Vence em: {new Date(product.expirationDate).toLocaleDateString()}
              </p>
              <button className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors">
                Adicionar ao Carrinho
              </button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}