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
import CartPagePt from "@/pages/customer/cart-page-pt";
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
      <Route path="/cart" component={CartPagePt} />
      <Route path="/customer/cart" component={CartPagePt} />
      <Route path="/order-review" component={OrderReview} />
      <Route path="/payment" component={CustomerPaymentFixed} />
      <Route path="/pix-payment/:orderId" component={PixPaymentFixed} />
      <Route path="/card-payment" component={CardPayment} />
      <Route path="/stripe-checkout/:orderId" component={StripeCheckout} />
      <Route path="/payment-success" component={PaymentSuccess} />
      <Route path="/orders" component={CustomerOrders} />
      <Route path="/eco-rewards" component={EcoRewards} />
      <Route path="/eco-points" component={EcoPoints} />
      
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
