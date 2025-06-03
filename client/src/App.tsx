import { Switch, Route } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import Landing from "@/pages/landing";
import NotFound from "@/pages/not-found";
import StaffLogin from "@/pages/staff-login";
import StaffRegister from "@/pages/staff-register";
import Dashboard from "@/pages/dashboard";
import Products from "@/pages/products";
import AddProduct from "@/pages/add-product";
import EditProduct from "@/pages/edit-product";
import Orders from "@/pages/orders";
import MonthlyOrders from "@/pages/monthly-orders";
import StaffSettings from "@/pages/staff-settings";
import StaffForgotPassword from "@/pages/staff-forgot-password";
import StaffResetPassword from "@/pages/staff-reset-password";
import CustomerHome from "@/pages/customer/home";
import CustomerLogin from "@/pages/customer/login";
import CustomerRegister from "@/pages/customer/register";
import SupermarketProducts from "@/pages/customer/supermarket-products";
import CustomerCart from "@/pages/customer/cart";
import PixPayment from "@/pages/customer/pix-payment";
import CustomerForgotPassword from "@/pages/customer/forgot-password";
import CustomerResetPassword from "@/pages/customer/reset-password";
import CustomerOrders from "@/pages/customer/orders";
import PrivacyPolicy from "@/pages/privacy-policy";
import Terms from "@/pages/terms";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: async ({ queryKey }) => {
        const response = await fetch(queryKey[0] as string);
        if (!response.ok) {
          throw new Error(`${response.status}: ${response.statusText}`);
        }
        return response.json();
      },
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-background">
        <Switch>
          {/* Landing page */}
          <Route path="/" component={Landing} />
          
          {/* Staff routes */}
          <Route path="/staff/login" component={StaffLogin} />
          <Route path="/staff/register" component={StaffRegister} />
          <Route path="/staff/dashboard" component={Dashboard} />
          <Route path="/staff/products" component={Products} />
          <Route path="/staff/add-product" component={AddProduct} />
          <Route path="/staff/edit-product/:id" component={EditProduct} />
          <Route path="/staff/orders" component={Orders} />
          <Route path="/staff/monthly-orders" component={MonthlyOrders} />
          <Route path="/staff/settings" component={StaffSettings} />
          <Route path="/staff/forgot-password" component={StaffForgotPassword} />
          <Route path="/staff/reset-password" component={StaffResetPassword} />
          
          {/* Customer routes */}
          <Route path="/customer/home" component={CustomerHome} />
          <Route path="/customer/login" component={CustomerLogin} />
          <Route path="/customer/register" component={CustomerRegister} />
          <Route path="/customer/supermarket/:id" component={SupermarketProducts} />
          <Route path="/customer/cart" component={CustomerCart} />
          <Route path="/customer/pix-payment" component={PixPayment} />
          <Route path="/customer/forgot-password" component={CustomerForgotPassword} />
          <Route path="/customer/reset-password" component={CustomerResetPassword} />
          <Route path="/customer/orders" component={CustomerOrders} />
          
          {/* Legal pages */}
          <Route path="/privacy" component={PrivacyPolicy} />
          <Route path="/terms" component={Terms} />
          
          {/* 404 fallback */}
          <Route component={NotFound} />
        </Switch>
        <Toaster />
      </div>
    </QueryClientProvider>
  );
}

export default App;