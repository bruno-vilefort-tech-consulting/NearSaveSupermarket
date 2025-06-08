import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Router, Route, Switch } from 'wouter'
import Home from './pages/Home'
import Products from './pages/Products'
import Orders from './pages/Orders'
import Profile from './pages/Profile'
import Login from './pages/Login'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-background text-foreground">
          <Switch>
            <Route path="/login" component={Login} />
            <Route path="/home" component={Home} />
            <Route path="/products" component={Products} />
            <Route path="/orders" component={Orders} />
            <Route path="/profile" component={Profile} />
            <Route path="/" component={Home} />
          </Switch>
        </div>
      </Router>
    </QueryClientProvider>
  )
}

export default App