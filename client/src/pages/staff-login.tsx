import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, Mail, Lock, Eye, EyeOff, AlertCircle } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLanguage } from "@/hooks/useLanguage";

export default function StaffLogin() {
  const [, navigate] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const { t } = useLanguage();

  const loginMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiRequest("POST", "/api/staff/login", {
        email: data.email,
        password: data.password
      });
      return response.json();
    },
    onSuccess: (data) => {
      setErrorMessage("");
      localStorage.setItem('staffInfo', JSON.stringify(data));
      window.location.href = "/dashboard";
    },
    onError: (error: any) => {
      setErrorMessage("Falha no login: Email ou senha incorretos");
    }
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      setErrorMessage("Email e senha são obrigatórios");
      return;
    }

    setErrorMessage("");
    loginMutation.mutate(formData);
  };

  const handleForgotPassword = () => {
    navigate("/staff/forgot-password");
  };

  const handleReplitLogin = () => {
    window.location.href = "/api/login";
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
            Sistema de gerenciamento para supermercados
          </p>
        </div>

        {/* Main Content */}
        <div className="max-w-md mx-auto">
          <Card className="shadow-lg border-eco-blue-light">
            <CardHeader className="text-center bg-white rounded-t-lg">
              <CardTitle className="text-2xl text-eco-blue-dark">
                Acesso do Staff
              </CardTitle>
              <p className="text-eco-gray mt-2">
                Entre com suas credenciais
              </p>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Error Message */}
              {errorMessage && (
                <div className="flex items-center gap-2 p-3 bg-eco-orange-light border border-eco-orange rounded-md text-eco-orange-dark">
                  <AlertCircle size={16} />
                  <span className="text-sm font-medium">{errorMessage}</span>
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center space-x-2 text-eco-blue-dark">
                    <Mail size={16} className="text-eco-blue" />
                    <span>Email *</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Digite seu email"
                    className="w-full border-eco-blue-light focus:border-eco-blue focus:ring-eco-blue"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password" className="flex items-center space-x-2 text-eco-blue-dark">
                    <Lock size={16} className="text-eco-blue" />
                    <span>Senha *</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="Digite sua senha"
                      className="w-full pr-10 border-eco-blue-light focus:border-eco-blue focus:ring-eco-blue"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-eco-blue hover:text-eco-blue-dark"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  disabled={loginMutation.isPending}
                  className="w-full bg-eco-blue hover:bg-eco-blue-dark text-white py-3"
                >
                  {loginMutation.isPending ? 'Entrando...' : 'Entrar'}
                </Button>
              </form>

              {/* Forgot Password */}
              <div className="text-center">
                <button
                  onClick={handleForgotPassword}
                  className="text-eco-blue hover:text-eco-blue-dark text-sm underline"
                >
                  Esqueci minha senha
                </button>
              </div>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-eco-blue-light" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-eco-gray">OU</span>
                </div>
              </div>

              {/* Replit Login */}
              <Button
                onClick={handleReplitLogin}
                variant="outline"
                className="w-full border-2 border-eco-blue text-eco-blue hover:bg-eco-blue-light"
              >
                Entrar com Replit
              </Button>

              {/* Register Link */}
              <div className="text-center">
                <p className="text-eco-gray text-sm">
                  Não tem conta?{" "}
                  <button
                    onClick={() => navigate("/staff-register")}
                    className="text-eco-blue hover:text-eco-blue-dark font-semibold underline"
                  >
                    Cadastre-se
                  </button>
                </p>
              </div>

              {/* Back Button */}
              <Button
                onClick={() => navigate('/')}
                variant="ghost"
                className="w-full text-eco-gray hover:bg-eco-blue-light"
              >
                Voltar ao Início
              </Button>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center mt-8">
            <p className="text-xs text-eco-gray">
              Sistema de gerenciamento para supermercados parceiros
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}