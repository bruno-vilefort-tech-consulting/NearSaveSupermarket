import { useState } from 'react'

function CustomerLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Login attempt:', { email, password })
    // Aqui você pode adicionar a lógica de autenticação
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full border">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-green-600 mb-2">SaveUp</h1>
          <p className="text-gray-600">Login do Cliente</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="seu@email.com"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Senha
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors font-medium"
          >
            Entrar
          </button>
        </form>

        <div className="mt-6 text-center">
          <a 
            href="#" 
            className="text-sm text-green-600 hover:text-green-800 transition-colors"
          >
            Esqueci minha senha
          </a>
        </div>

        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">
            Não tem conta?{' '}
            <a 
              href="#" 
              className="text-green-600 hover:text-green-800 transition-colors font-medium"
            >
              Cadastre-se
            </a>
          </p>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-medium text-green-800 mb-2">SaveUp Customer</h3>
            <p className="text-sm text-gray-600">
              Encontre produtos próximos ao vencimento com descontos especiais e ajude a reduzir o desperdício alimentar.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CustomerLogin