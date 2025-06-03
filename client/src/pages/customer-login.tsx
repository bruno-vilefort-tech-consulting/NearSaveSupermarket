export default function CustomerLogin() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow p-8">
        <h2 className="text-2xl font-bold text-center mb-6">Login Cliente</h2>
        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email ou CPF
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="seu@email.com ou 000.000.000-00"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Senha
            </label>
            <input
              type="password"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 transition-colors"
          >
            Entrar
          </button>
        </form>
        <div className="text-center text-sm text-gray-600 mt-4 space-y-2">
          <p>
            <a href="#" className="text-green-600 hover:underline">
              Esqueceu a senha?
            </a>
          </p>
          <p>
            Não tem conta? 
            <a href="#" className="text-green-600 hover:underline ml-1">
              Cadastre-se
            </a>
          </p>
          <p>
            <a href="/" className="text-gray-500 hover:underline">
              Voltar ao início
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}