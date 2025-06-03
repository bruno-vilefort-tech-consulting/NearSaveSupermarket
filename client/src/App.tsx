import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { useAuth } from "@/hooks/useAuth";
import { useStaffAuth } from "@/hooks/useStaffAuth";

// Import pages
import Landing from "@/pages/landing";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Products from "@/pages/products";
import AddProduct from "@/pages/add-product";
import EditProduct from "@/pages/edit-product";
import Orders from "@/pages/orders";
import MonthlyOrders from "@/pages/monthly-orders";
import StaffSettings from "@/pages/staff-settings";
import StaffLogin from "@/pages/staff-login";
import StaffRegister from "@/pages/staff-register";
import StaffForgotPassword from "@/pages/staff-forgot-password";
import StaffResetPassword from "@/pages/staff-reset-password";
import Terms from "@/pages/terms";
import PrivacyPolicy from "@/pages/privacy-policy";

// Customer pages
import CustomerHome from "@/pages/customer/home";
import CustomerLogin from "@/pages/customer/login";
import CustomerRegister from "@/pages/customer/register";
import CustomerForgotPassword from "@/pages/customer/forgot-password";
import CustomerResetPassword from "@/pages/customer/reset-password";
import SupermarketProducts from "@/pages/customer/supermarket-products";
import Cart from "@/pages/customer/cart";
import PixPayment from "@/pages/customer/pix-payment";
// import OrderTracking from "@/pages/customer/order-tracking";
// import Profile from "@/pages/customer/profile";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: false,
    },
  },
});

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
      <Route path="/customer" component={CustomerHome} />
      <Route path="/customer/login" component={CustomerLogin} />
      <Route path="/customer/register" component={CustomerRegister} />
      <Route path="/customer/forgot-password" component={CustomerForgotPassword} />
      <Route path="/customer/reset-password" component={CustomerResetPassword} />
      <Route path="/customer/supermarket/:supermarketId" component={SupermarketProducts} />
      <Route path="/customer/cart" component={Cart} />
      <Route path="/customer/payment" component={PixPayment} />

      
      {/* Staff Dashboard Routes (Protected) */}
      {isStaffAuthenticated && (
        <>
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/products" component={Products} />
          <Route path="/add-product" component={AddProduct} />
          <Route path="/edit-product/:id" component={EditProduct} />
          <Route path="/orders" component={Orders} />
          <Route path="/monthly-orders" component={MonthlyOrders} />
          <Route path="/staff-settings" component={StaffSettings} />
        </>
      )}
      
      {/* Legal pages */}
      <Route path="/terms" component={Terms} />
      <Route path="/privacy-policy" component={PrivacyPolicy} />
      
      {/* 404 page */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;