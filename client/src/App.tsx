import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { useStaffAuth } from "@/hooks/useStaffAuth";
import { LanguageProvider } from "@/contexts/LanguageContext";
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
import SupermarketMap from "@/pages/customer/supermarket-map";
import CustomerCart from "@/pages/customer/cart";
import CustomerOrders from "@/pages/customer/orders";
import CustomerPaymentFixed from "@/pages/customer/payment-fixed";
import PixPaymentFixed from "@/pages/customer/pix-payment-fixed";
import CardPayment from "@/pages/customer/card-payment";
import EcoRewards from "@/pages/customer/eco-rewards";
import EcoPoints from "@/pages/customer/eco-points";
import Login from "@/pages/customer/login";
import CustomerRegister from "@/pages/customer/register";
import ForgotPassword from "@/pages/customer/forgot-password";
import ResetPassword from "@/pages/customer/reset-password";
import StaffLogin from "@/pages/staff-login";
import StaffRegister from "@/pages/staff-register";
import StaffForgotPassword from "@/pages/staff-forgot-password";
import StaffResetPassword from "@/pages/staff-reset-password";
import StaffSettings from "@/pages/staff-settings";
import Terms from "@/pages/terms";
import PrivacyPolicy from "@/pages/privacy-policy";

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
      <Route path="/staff/forgot-password" component={StaffForgotPassword} />
      <Route path="/staff/reset-password" component={StaffResetPassword} />
      
      {/* Customer App Routes */}
      <Route path="/customer/login" component={Login} />
      <Route path="/customer/register" component={CustomerRegister} />
      <Route path="/customer/forgot-password" component={ForgotPassword} />
      <Route path="/customer/reset-password" component={ResetPassword} />
      <Route path="/customer/home" component={CustomerHome} />
      <Route path="/customer" component={CustomerHome} />
      <Route path="/customer/supermarket/:id/products" component={SupermarketProducts} />
      <Route path="/customer/supermarket-map" component={SupermarketMap} />
      <Route path="/customer/cart" component={CustomerCart} />
      <Route path="/customer/payment" component={CustomerPaymentFixed} />
      <Route path="/customer/pix-payment/:tempOrderId" component={PixPaymentFixed} />
      <Route path="/customer/card-payment" component={CardPayment} />
      <Route path="/customer/orders" component={CustomerOrders} />
      <Route path="/customer/eco-rewards" component={EcoRewards} />
      <Route path="/customer/eco-points" component={EcoPoints} />
      
      {/* Legal Pages - Public access */}
      <Route path="/terms" component={Terms} />
      <Route path="/privacy-policy" component={PrivacyPolicy} />
      
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
          <Route path="/settings" component={StaffSettings} />
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
      <LanguageProvider>
        <TooltipProvider>
          <Router />
        </TooltipProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
