import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/contexts/LanguageContext";
import NotFound from "@/pages/not-found";

// Customer App Pages Only
import CustomerLanding from "@/pages/customer/landing";
import CustomerHome from "@/pages/customer/home";
import SupermarketProducts from "@/pages/customer/supermarket-products";
import SupermarketMap from "@/pages/customer/supermarket-map";
import CartFinal from "@/pages/customer/cart-final";
import PaymentMethod from "@/pages/customer/payment-method";
import StripePayment from "@/pages/customer/stripe-payment";
import CustomerOrders from "@/pages/customer/orders";
import OrderReview from "@/pages/customer/order-review";
import CustomerPaymentFixed from "@/pages/customer/payment-fixed";
import PixPaymentFixed from "@/pages/customer/pix-payment-fixed";
import CardPayment from "@/pages/customer/card-payment";
import StripeCheckout from "@/pages/customer/stripe-checkout";
import PaymentSuccess from "@/pages/customer/payment-success";
import EcoRewards from "@/pages/customer/eco-rewards";
import EcoPoints from "@/pages/customer/eco-points";
import Login from "@/pages/customer/login";
import CustomerRegister from "@/pages/customer/register";
import ForgotPassword from "@/pages/customer/forgot-password";
import ResetPassword from "@/pages/customer/reset-password";
import Terms from "@/pages/terms";
import TermsAndConditions from "@/pages/terms-and-conditions";

// Staff App Pages
import StaffLanding from "@/pages/staff/landing";
import StaffLogin from "@/pages/staff/login";
import StaffRegister from "@/pages/staff/register";
import StaffDashboard from "@/pages/staff/dashboard";
import StaffProducts from "@/pages/staff/products";

// Admin App Pages
import AdminLogin from "@/pages/admin/login";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminSupermarkets from "@/pages/admin/supermarkets";
import AdminFinancialStatement from "@/pages/admin/financial-statement";

function Router() {
  return (
    <Switch>
      {/* Default route - Customer Landing */}
      <Route path="/" component={CustomerLanding} />
      
      {/* Customer Authentication Routes */}
      <Route path="/login" component={Login} />
      <Route path="/register" component={CustomerRegister} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />
      
      {/* Customer App Routes */}
      <Route path="/customer" component={CustomerHome} />
      <Route path="/home" component={CustomerHome} />
      <Route path="/supermarket/:id/products" component={SupermarketProducts} />
      <Route path="/supermarket-map" component={SupermarketMap} />
      <Route path="/customer/cart" component={CartFinal} />
      <Route path="/cart" component={CartFinal} />
      <Route path="/customer/payment-method" component={PaymentMethod} />
      <Route path="/customer/stripe-payment" component={StripePayment} />
      <Route path="/order-review" component={OrderReview} />
      <Route path="/payment" component={CustomerPaymentFixed} />
      <Route path="/pix-payment/:orderId" component={PixPaymentFixed} />
      <Route path="/card-payment" component={CardPayment} />
      <Route path="/stripe-checkout/:orderId" component={StripeCheckout} />
      <Route path="/payment-success" component={PaymentSuccess} />
      <Route path="/orders" component={CustomerOrders} />
      <Route path="/eco-rewards" component={EcoRewards} />
      <Route path="/eco-points" component={EcoPoints} />
      
      {/* Staff App Routes */}
      <Route path="/staff" component={StaffLanding} />
      <Route path="/staff/login" component={StaffLogin} />
      <Route path="/staff/register" component={StaffRegister} />
      <Route path="/staff/dashboard" component={StaffDashboard} />
      <Route path="/staff/products" component={StaffProducts} />
      
      {/* Admin App Routes */}
      <Route path="/admin" component={AdminLogin} />
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin/dashboard" component={AdminDashboard} />
      <Route path="/admin/supermarkets" component={AdminSupermarkets} />
      <Route path="/admin/financial-statement" component={AdminFinancialStatement} />
      
      {/* Friendly Routes */}
      <Route path="/cliente" component={CustomerLanding} />
      <Route path="/supermercado" component={StaffLanding} />
      <Route path="/supermercado/register" component={StaffRegister} />
      <Route path="/supermercado/login" component={StaffLogin} />
      <Route path="/supermercado/dashboard" component={StaffDashboard} />
      <Route path="/administrador" component={AdminLogin} />
      
      {/* Terms and Conditions - Public access */}
      <Route path="/terms" component={Terms} />
      <Route path="/terms-and-conditions" component={TermsAndConditions} />
      
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
