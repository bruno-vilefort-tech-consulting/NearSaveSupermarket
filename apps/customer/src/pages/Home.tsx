import { useQuery } from '@tanstack/react-query'

function Home() {
  const { data: supermarkets } = useQuery({
    queryKey: ['/api/supermarkets'],
    queryFn: async () => {
      const response = await fetch('/api/supermarkets')
      if (!response.ok) throw new Error('Failed to fetch supermarkets')
      return response.json()
    }
  })

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">SaveUp - Mercados Sustentáveis</h1>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Mercados Próximos</h2>
        {supermarkets?.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {supermarkets.map((market: any) => (
              <div key={market.id} className="bg-card p-6 rounded-lg border">
                <h3 className="font-semibold text-lg">{market.name}</h3>
                <p className="text-muted-foreground">{market.address}</p>
                <p className="text-sm text-eco-green mt-2">{market.productCount} produtos disponíveis</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-card p-6 rounded-lg border">
            <p className="text-muted-foreground">Carregando mercados...</p>
          </div>
        )}
      </div>

      <div className="bg-eco-green/10 p-6 rounded-lg border border-eco-green/20">
        <h2 className="text-xl font-semibold mb-4 text-eco-green">Como Funciona o SaveUp</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-eco-green rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-white font-bold">1</span>
            </div>
            <h3 className="font-medium mb-2">Encontre Produtos</h3>
            <p className="text-sm text-muted-foreground">Descubra produtos próximos ao vencimento com descontos especiais</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-eco-blue rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-white font-bold">2</span>
            </div>
            <h3 className="font-medium mb-2">Faça seu Pedido</h3>
            <p className="text-sm text-muted-foreground">Reserve os produtos e escolha retirada ou entrega</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-eco-orange rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-white font-bold">3</span>
            </div>
            <h3 className="font-medium mb-2">Ganhe Eco Points</h3>
            <p className="text-sm text-muted-foreground">Receba pontos por ajudar a reduzir o desperdício alimentar</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home