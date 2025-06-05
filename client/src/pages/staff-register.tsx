import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, Mail, Phone, MapPin, Store, Lock, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLanguage } from "@/hooks/useLanguage";
import { LocationPicker } from "@/components/LocationPicker";

export default function StaffRegister() {
  const [, navigate] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    address: "",
    companyName: "",
    latitude: "",
    longitude: ""
  });
  const { toast } = useToast();
  const { t } = useLanguage();

  const registerMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiRequest("POST", "/api/staff/register", {
        email: data.email,
        password: data.password,
        phone: data.phone,
        address: data.address,
        companyName: data.companyName,
        latitude: data.latitude ? parseFloat(data.latitude) : null,
        longitude: data.longitude ? parseFloat(data.longitude) : null
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: t('staff.registrationSuccess'),
        description: `${t('staff.welcomeRegistration').replace('{company}', data.companyName)}`,
      });
      navigate("/staff-login");
    },
    onError: (error: any) => {
      toast({
        title: t('staff.registrationError'),
        description: error.message || t('staff.registrationErrorDesc'),
        variant: "destructive"
      });
    }
  });

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validações
    if (!formData.email || !formData.password || !formData.phone || !formData.address || !formData.companyName) {
      toast({
        title: t('staff.requiredFields'),
        description: t('staff.fillAllFields'),
        variant: "destructive"
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: t('staff.passwordMismatch'),
        description: t('staff.checkPasswords'),
        variant: "destructive"
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: t('staff.passwordTooShort'),
        description: t('staff.passwordMinDesc'),
        variant: "destructive"
      });
      return;
    }

    registerMutation.mutate(formData);
  };

  return (
    <div className="min-h-screen bg-eco-blue-light">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-eco-blue rounded-full flex items-center justify-center mr-4">
              <Settings className="text-white" size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-eco-gray-dark">EcoMart Staff</h1>
              <div className="flex justify-center mt-1">
                <span className="text-eco-orange text-[10px] font-bold">By Up Brasil</span>
              </div>
            </div>
          </div>
          <p className="text-lg text-eco-gray">
            Registro de supermercado parceiro
          </p>
        </div>

        {/* Main Content */}
        <div className="max-w-md mx-auto">
          <Card className="shadow-lg border-eco-blue-light">
            <CardHeader className="text-center bg-eco-blue-light rounded-t-lg">
              <CardTitle className="text-2xl text-eco-blue-dark">
                Novo Registro
              </CardTitle>
              <p className="text-eco-gray mt-2">
                Cadastre seu supermercado na plataforma
              </p>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Registration Form */}
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName" className="flex items-center space-x-2">
                    <Store size={16} />
                    <span>{t('staff.companyName')} *</span>
                  </Label>
                  <Input
                    id="companyName"
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                    placeholder={t('staff.companyPlaceholder')}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center space-x-2">
                    <Mail size={16} />
                    <span>{t('auth.email')} *</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder={t('auth.emailPlaceholder')}
                    className="w-full"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center space-x-2">
                    <Phone size={16} />
                    <span>{t('staff.phone')} *</span>
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder={t('staff.phonePlaceholder')}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address" className="flex items-center space-x-2">
                    <MapPin size={16} />
                    <span>{t('staff.address')} *</span>
                  </Label>
                  <Input
                    id="address"
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    placeholder={t('staff.addressPlaceholder')}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center space-x-2">
                    <MapPin size={16} />
                    <span>Localização do Supermercado</span>
                  </Label>
                  <p className="text-sm text-gray-600">
                    Defina a localização exata do seu supermercado para aparecer no mapa dos clientes
                  </p>
                  <LocationPicker
                    onLocationChange={(lat, lng) => {
                      setFormData(prev => ({
                        ...prev,
                        latitude: lat.toString(),
                        longitude: lng.toString()
                      }));
                    }}
                    initialLat={formData.latitude ? parseFloat(formData.latitude) : undefined}
                    initialLng={formData.longitude ? parseFloat(formData.longitude) : undefined}
                    address={formData.address}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password" className="flex items-center space-x-2">
                    <Lock size={16} />
                    <span>{t('auth.password')} *</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      placeholder={t('staff.passwordMin')}
                      className="w-full pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="flex items-center space-x-2">
                    <Lock size={16} />
                    <span>{t('staff.confirmPassword')} *</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      placeholder={t('staff.confirmPasswordPlaceholder')}
                      className="w-full pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  disabled={registerMutation.isPending}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
                >
                  {registerMutation.isPending ? t('staff.registering') : t('staff.registerButton')}
                </Button>
              </form>

              {/* Login Link */}
              <div className="text-center">
                <p className="text-eco-gray text-sm">
                  Já tem uma conta?{" "}
                  <button
                    onClick={() => navigate("/staff-login")}
                    className="text-eco-blue hover:text-eco-blue-dark font-semibold underline"
                  >
                    Fazer Login
                  </button>
                </p>
              </div>

              {/* Back Button */}
              <Button
                onClick={() => window.location.href = '/'}
                variant="ghost"
                className="w-full text-eco-gray hover:bg-eco-blue-light"
              >
                ← Voltar ao Início
              </Button>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center mt-8">
            <p className="text-xs text-gray-500">
              {t('staff.agreementText')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}