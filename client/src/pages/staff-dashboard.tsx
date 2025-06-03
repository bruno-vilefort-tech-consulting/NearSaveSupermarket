export default function StaffDashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <span className="text-green-600 text-2xl mr-2">🏪</span>
              <span className="text-xl font-bold text-gray-900">Painel do Supermercado</span>
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
          Dashboard do Supermercado
        </h1>
        
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">Produtos Ativos</h3>
            <p className="text-3xl font-bold text-green-600">24</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">Pedidos Pendentes</h3>
            <p className="text-3xl font-bold text-yellow-600">8</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">Receita Total</h3>
            <p className="text-3xl font-bold text-blue-600">R$ 2.847</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Ações Rápidas</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <button className="p-4 border-2 border-green-600 text-green-600 rounded-lg hover:bg-green-50 transition-colors">
              <div className="text-2xl mb-2">📦</div>
              <div className="font-semibold">Adicionar Produto</div>
            </button>
            <button className="p-4 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
              <div className="text-2xl mb-2">📊</div>
              <div className="font-semibold">Ver Relatórios</div>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}