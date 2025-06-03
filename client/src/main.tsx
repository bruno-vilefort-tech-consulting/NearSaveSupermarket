import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <span className="text-green-600 text-2xl mr-2">🌱</span>
              <span className="text-2xl font-bold text-gray-900">EcoMarket</span>
            </div>
            <div className="flex space-x-4">
              <button className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
                Entrar como Staff
              </button>
              <button className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
                Entrar como Cliente
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Supermercados <span className="text-green-600">Sustentáveis</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Revolucionando a experiência de compras no Brasil com foco em sustentabilidade,
            redução de desperdício e pontos ecológicos.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700">
              🛒 Começar a Comprar
            </button>
            <button className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-50">
              Cadastrar Supermercado
            </button>
          </div>
        </div>
      </main>

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Por que escolher o EcoMarket?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center bg-white border border-gray-200 rounded-lg p-6">
              <div className="text-green-600 text-4xl mb-4">🌱</div>
              <h3 className="text-xl font-bold mb-4">Sustentabilidade</h3>
              <p className="text-gray-600">
                Ganhe pontos ecológicos comprando produtos próximos ao vencimento
                e ajude a reduzir o desperdício de alimentos.
              </p>
            </div>

            <div className="text-center bg-white border border-gray-200 rounded-lg p-6">
              <div className="text-blue-600 text-4xl mb-4">🛒</div>
              <h3 className="text-xl font-bold mb-4">Compras Inteligentes</h3>
              <p className="text-gray-600">
                Encontre supermercados próximos, compare preços e faça pedidos
                com entrega ou retirada no local.
              </p>
            </div>

            <div className="text-center bg-white border border-gray-200 rounded-lg p-6">
              <div className="text-yellow-600 text-4xl mb-4">⭐</div>
              <h3 className="text-xl font-bold mb-4">Experiência Premium</h3>
              <p className="text-gray-600">
                Interface móvel otimizada, pagamentos PIX seguros e
                notificações push em tempo real.
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <span className="text-green-400 text-xl mr-2">🌱</span>
              <span className="text-xl font-bold">EcoMarket</span>
            </div>
            <div className="text-gray-400 text-sm">
              © 2025 EcoMarket. Todos os direitos reservados.
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)