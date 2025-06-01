import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import Products from "@/pages/products";
import AddProduct from "@/pages/add-product";
import Orders from "@/pages/orders";

// Customer App Pages
import CustomerHome from "@/pages/customer/home";
import CustomerCart from "@/pages/customer/cart";
import CustomerOrders from "@/pages/customer/orders";
import CustomerPayment from "@/pages/customer/payment";
import EcoRewards from "@/pages/customer/eco-rewards";
import Login from "@/pages/customer/login";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {/* Default route - Landing page */}
      <Route path="/" component={Landing} />
      
      {/* Customer App Routes */}
      <Route path="/customer" component={CustomerHome} />
      <Route path="/customer/cart" component={CustomerCart} />
      <Route path="/customer/payment" component={CustomerPayment} />
      <Route path="/customer/orders" component={CustomerOrders} />
      <Route path="/customer/eco-rewards" component={EcoRewards} />
      
      {/* Staff App Routes - Require authentication */}
      {isLoading || !isAuthenticated ? (
        <>
          <Route path="/dashboard" component={Landing} />
          <Route path="/products" component={Landing} />
          <Route path="/add-product" component={Landing} />
          <Route path="/orders" component={Landing} />
        </>
      ) : (
        <>
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/products" component={Products} />
          <Route path="/add-product" component={AddProduct} />
          <Route path="/orders" component={Orders} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
