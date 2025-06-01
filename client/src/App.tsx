import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { useStaffAuth } from "@/hooks/useStaffAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import Products from "@/pages/products";
import AddProduct from "@/pages/add-product";
import Orders from "@/pages/orders";
import MonthlyOrders from "@/pages/monthly-orders";

// Customer App Pages
import CustomerHome from "@/pages/customer/home";
import SupermarketProducts from "@/pages/customer/supermarket-products";
import CustomerCart from "@/pages/customer/cart";
import CustomerOrders from "@/pages/customer/orders";
import CustomerPayment from "@/pages/customer/payment";
import EcoRewards from "@/pages/customer/eco-rewards";
import EcoPoints from "@/pages/customer/eco-points";
import Login from "@/pages/customer/login";
import CustomerRegister from "@/pages/customer/register";
import ForgotPassword from "@/pages/customer/forgot-password";
import StaffLogin from "@/pages/staff-login";
import StaffRegister from "@/pages/staff-register";
import Terms from "@/pages/terms";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();
  const { isStaffAuthenticated, isLoading: isStaffLoading } = useStaffAuth();

  return (
    <Switch>
      {/* Default route - Landing page */}
      <Route path="/" component={Landing} />
      
      {/* Staff Login Routes */}
      <Route path="/staff-login" component={StaffLogin} />
      <Route path="/staff-register" component={StaffRegister} />
      
      {/* Customer App Routes */}
      <Route path="/customer/login" component={Login} />
      <Route path="/customer/register" component={CustomerRegister} />
      <Route path="/customer/forgot-password" component={ForgotPassword} />
      <Route path="/customer" component={CustomerHome} />
      <Route path="/customer/supermarket/:id" component={SupermarketProducts} />
      <Route path="/customer/cart" component={CustomerCart} />
      <Route path="/customer/payment" component={CustomerPayment} />
      <Route path="/customer/orders" component={CustomerOrders} />
      <Route path="/customer/eco-rewards" component={EcoRewards} />
      <Route path="/customer/eco-points" component={EcoPoints} />
      
      {/* Terms and Conditions - Public access */}
      <Route path="/terms" component={Terms} />
      
      {/* Staff App Routes - Allow access if either authenticated */}
      {isStaffLoading ? (
        <>
          <Route path="/dashboard" component={() => <div>Carregando...</div>} />
          <Route path="/products" component={() => <div>Carregando...</div>} />
          <Route path="/add-product" component={() => <div>Carregando...</div>} />
          <Route path="/orders" component={() => <div>Carregando...</div>} />
        </>
      ) : (isStaffAuthenticated || isAuthenticated) ? (
        <>
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/products" component={Products} />
          <Route path="/add-product" component={AddProduct} />
          <Route path="/orders" component={Orders} />
          <Route path="/monthly-orders" component={MonthlyOrders} />
        </>
      ) : (
        <>
          <Route path="/dashboard" component={Landing} />
          <Route path="/products" component={Landing} />
          <Route path="/add-product" component={Landing} />
          <Route path="/orders" component={Landing} />
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
