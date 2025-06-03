import { Link } from "wouter";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <span className="text-green-600 text-2xl mr-2">🌱</span>
              <span className="text-xl font-bold text-gray-900">EcoMarket</span>
            </div>
            <div className="space-x-4">
              <Link href="/customer/login">
                <a className="text-gray-700 hover:text-green-600 px-3 py-2 rounded-md text-sm font-medium">
                  Cliente
                </a>
              </Link>
              <Link href="/staff/login">
                <a className="bg-green-600 text-white hover:bg-green-700 px-4 py-2 rounded-md text-sm font-medium">
                  Supermercado
                </a>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-8">
            Supermercados
            <span className="text-green-600"> Sustentáveis</span>
            <br />
            no Brasil
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Conectamos consumidores conscientes com supermercados locais para reduzir 
            o desperdício de alimentos e promover compras sustentáveis.
          </p>
          <div className="space-x-4">
            <Link href="/customer/login">
              <a className="bg-green-600 text-white hover:bg-green-700 px-8 py-3 rounded-lg text-lg font-medium inline-block">
                Começar a Comprar
              </a>
            </Link>
            <Link href="/staff/login">
              <a className="border-2 border-green-600 text-green-600 hover:bg-green-50 px-8 py-3 rounded-lg text-lg font-medium inline-block">
                Cadastrar Loja
              </a>
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="mt-20 grid md:grid-cols-3 gap-8">
          <div className="text-center p-6 bg-white rounded-lg shadow-sm">
            <div className="text-4xl mb-4">🌱</div>
            <h3 className="text-xl font-semibold mb-2">Sustentabilidade</h3>
            <p className="text-gray-600">
              Ganhe pontos ecológicos comprando produtos próximos ao vencimento
            </p>
          </div>
          <div className="text-center p-6 bg-white rounded-lg shadow-sm">
            <div className="text-4xl mb-4">🛒</div>
            <h3 className="text-xl font-semibold mb-2">Compras Inteligentes</h3>
            <p className="text-gray-600">
              Encontre supermercados próximos e faça pedidos com entrega
            </p>
          </div>
          <div className="text-center p-6 bg-white rounded-lg shadow-sm">
            <div className="text-4xl mb-4">💳</div>
            <h3 className="text-xl font-semibold mb-2">Pagamento PIX</h3>
            <p className="text-gray-600">
              Pagamentos seguros e instantâneos via PIX
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}