export default function CustomerDashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <span className="text-green-600 text-2xl mr-2">🌱</span>
              <span className="text-xl font-bold text-gray-900">Minha Conta</span>
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
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Painel do Cliente
        </h1>
        
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">Pontos Ecológicos</h3>
            <p className="text-3xl font-bold text-green-600">347 pts</p>
            <p className="text-sm text-gray-600">Acumulados este mês</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">Pedidos</h3>
            <p className="text-3xl font-bold text-blue-600">12</p>
            <p className="text-sm text-gray-600">Total realizados</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Ações Rápidas</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <a href="/products" className="block p-4 border-2 border-green-600 text-green-600 rounded-lg hover:bg-green-50 transition-colors text-center">
              <div className="text-2xl mb-2">🛒</div>
              <div className="font-semibold">Explorar Produtos</div>
            </a>
            <button className="p-4 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
              <div className="text-2xl mb-2">📦</div>
              <div className="font-semibold">Meus Pedidos</div>
            </button>
            <button className="p-4 border-2 border-yellow-600 text-yellow-600 rounded-lg hover:bg-yellow-50 transition-colors">
              <div className="text-2xl mb-2">🏪</div>
              <div className="font-semibold">Supermercados</div>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}