import { Link } from "wouter";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <span className="text-green-600 text-2xl mr-2">🌱</span>
              <span className="text-xl font-bold text-gray-900">EcoMarket</span>
            </div>
            <button
              onClick={() => window.location.href = '/api/logout'}
              className="text-gray-700 hover:text-red-600 px-3 py-2 rounded-md text-sm font-medium"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Bem-vindo ao EcoMarket
          </h1>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <Link href="/products">
              <a className="block p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow">
                <div className="text-4xl mb-4">🛒</div>
                <h2 className="text-xl font-semibold mb-2">Explorar Produtos</h2>
                <p className="text-gray-600">
                  Descubra produtos sustentáveis com desconto
                </p>
              </a>
            </Link>
            <Link href="/customer/dashboard">
              <a className="block p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow">
                <div className="text-4xl mb-4">📊</div>
                <h2 className="text-xl font-semibold mb-2">Minha Conta</h2>
                <p className="text-gray-600">
                  Acompanhe seus pedidos e pontos eco
                </p>
              </a>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}