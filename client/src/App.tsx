function App() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto p-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-green-600 mb-4">
            🌱 EcoMarket
          </h1>
          <p className="text-xl text-gray-700 mb-8">
            Aplicativo revolucionário para experiências sustentáveis em supermercados do Brasil
          </p>
          <div className="space-y-4">
            <button className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700">
              Entrar como Cliente
            </button>
            <br />
            <button className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700">
              Entrar como Staff
            </button>
          </div>
          <div className="mt-12 grid md:grid-cols-3 gap-6">
            <div className="bg-green-50 p-6 rounded-lg">
              <h3 className="font-bold text-green-800 mb-2">Sustentabilidade</h3>
              <p className="text-green-700">Reduza desperdício e ganhe pontos ecológicos</p>
            </div>
            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="font-bold text-blue-800 mb-2">Compras Inteligentes</h3>
              <p className="text-blue-700">Encontre produtos próximos ao vencimento com desconto</p>
            </div>
            <div className="bg-purple-50 p-6 rounded-lg">
              <h3 className="font-bold text-purple-800 mb-2">Pagamento PIX</h3>
              <p className="text-purple-700">Pagamentos seguros e instantâneos</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;