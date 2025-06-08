import { useQuery } from '@tanstack/react-query'

function Dashboard() {
  const { data: stats } = useQuery({
    queryKey: ['/api/staff/stats'],
    queryFn: async () => {
      const response = await fetch('/api/staff/stats')
      if (!response.ok) throw new Error('Failed to fetch stats')
      return response.json()
    }
  })

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Dashboard - Staff</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-card p-6 rounded-lg border">
          <h3 className="text-lg font-medium text-muted-foreground">Produtos Ativos</h3>
          <p className="text-3xl font-bold text-eco-green">{stats?.activeProducts || 0}</p>
        </div>
        
        <div className="bg-card p-6 rounded-lg border">
          <h3 className="text-lg font-medium text-muted-foreground">Pedidos Pendentes</h3>
          <p className="text-3xl font-bold text-eco-orange">{stats?.pendingOrders || 0}</p>
        </div>
        
        <div className="bg-card p-6 rounded-lg border">
          <h3 className="text-lg font-medium text-muted-foreground">Receita Total</h3>
          <p className="text-3xl font-bold text-eco-blue">R$ {stats?.totalRevenue || '0,00'}</p>
        </div>
      </div>

      <div className="bg-card p-6 rounded-lg border">
        <h2 className="text-xl font-semibold mb-4">Bem-vindo ao SaveUp Staff</h2>
        <p className="text-muted-foreground">
          Gerencie seus produtos, pedidos e configurações através do painel lateral.
        </p>
      </div>
    </div>
  )
}

export default Dashboard