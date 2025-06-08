import { useState } from 'react'

function CustomerLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Login attempt:', { email, password })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="bg-card p-8 rounded-lg border max-w-md w-full shadow-lg">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-eco-green mb-2">SaveUp</h1>
          <p className="text-muted-foreground">Login do Cliente</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-eco-green focus:border-transparent"
              placeholder="seu@email.com"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-2">
              Senha
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-eco-green focus:border-transparent"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-eco-green text-white py-2 px-4 rounded-md hover:bg-eco-green/90 transition-colors font-medium"
          >
            Entrar
          </button>
        </form>

        <div className="mt-6 text-center">
          <a 
            href="#" 
            className="text-sm text-eco-green hover:text-eco-green/80 transition-colors"
          >
            Esqueci minha senha
          </a>
        </div>

        <div className="mt-4 text-center">
          <p className="text-sm text-muted-foreground">
            Não tem conta?{' '}
            <a 
              href="#" 
              className="text-eco-green hover:text-eco-green/80 transition-colors font-medium"
            >
              Cadastre-se
            </a>
          </p>
        </div>

        <div className="mt-8 pt-6 border-t border-border">
          <div className="bg-eco-green/10 p-4 rounded-lg">
            <h3 className="font-medium text-eco-green mb-2">SaveUp Customer</h3>
            <p className="text-sm text-muted-foreground">
              Encontre produtos próximos ao vencimento com descontos especiais e ajude a reduzir o desperdício alimentar.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CustomerLogin