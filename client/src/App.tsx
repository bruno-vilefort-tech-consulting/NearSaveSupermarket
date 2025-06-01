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
import CustomerLogin from "@/pages/customer/login";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {/* Customer App Routes (Public) - Root level */}
      <Route path="/" component={CustomerHome} />
      <Route path="/cart" component={CustomerCart} />
      <Route path="/orders" component={CustomerOrders} />
      <Route path="/login" component={CustomerLogin} />
      
      {/* Admin App Routes - Require authentication */}
      {isLoading || !isAuthenticated ? (
        <>
          <Route path="/admin" component={Landing} />
          <Route path="/admin/dashboard" component={Landing} />
          <Route path="/admin/products" component={Landing} />
          <Route path="/admin/add-product" component={Landing} />
          <Route path="/admin/orders" component={Landing} />
        </>
      ) : (
        <>
          <Route path="/admin" component={Dashboard} />
          <Route path="/admin/dashboard" component={Dashboard} />
          <Route path="/admin/products" component={Products} />
          <Route path="/admin/add-product" component={AddProduct} />
          <Route path="/admin/orders" component={Orders} />
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
