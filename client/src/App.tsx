import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Route, Switch } from "wouter";
// import { Toaster } from "@/components/ui/toaster";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import Products from "@/pages/products";
import StaffLogin from "@/pages/staff-login";
import StaffDashboard from "@/pages/staff-dashboard";
import CustomerLogin from "@/pages/customer-login";
import CustomerDashboard from "@/pages/customer-dashboard";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0,
      refetchOnMount: true,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <Switch>
      {!isAuthenticated ? (
        <>
          <Route path="/" component={Landing} />
          <Route path="/staff/login" component={StaffLogin} />
          <Route path="/customer/login" component={CustomerLogin} />
          <Route path="/products" component={Products} />
        </>
      ) : (
        <>
          <Route path="/" component={Home} />
          <Route path="/staff/dashboard" component={StaffDashboard} />
          <Route path="/customer/dashboard" component={CustomerDashboard} />
          <Route path="/products" component={Products} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gray-50">
        <Router />
        {/* <Toaster /> */}
      </div>
    </QueryClientProvider>
  );
}

export default App;