import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function StaffLogin() {
  const [, navigate] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const { toast } = useToast();

  const loginMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiRequest("POST", "/api/staff/login", {
        email: data.email,
        password: data.password
      });
      return response.json();
    },
    onSuccess: (data) => {
      localStorage.setItem('staffInfo', JSON.stringify(data));
      toast({
        title: "Login realizado com sucesso!",
        description: `Bem-vindo, ${data.companyName}!`,
      });
      window.location.href = "/dashboard";
    },
    onError: (error: any) => {
      toast({
        title: "Erro no login",
        description: error.message || "Email ou senha incorretos",
        variant: "destructive"
      });
    }
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha email e senha",
        variant: "destructive"
      });
      return;
    }

    loginMutation.mutate(formData);
  };

  const handleForgotPassword = () => {
    navigate("/staff/forgot-password");
  };

  const handleReplitLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Settings className="text-blue-600 mr-2" size={32} />
            <h1 className="text-3xl font-bold text-gray-900">EcoMart Staff</h1>
          </div>
          <p className="text-lg text-gray-600">
            Painel administrativo para gerenciamento
          </p>
        </div>

        {/* Main Content */}
        <div className="max-w-md mx-auto">
          <Card className="shadow-lg">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-gray-900">
                Login do Staff
              </CardTitle>
              <p className="text-gray-600 mt-2">
                Acesse o painel administrativo
              </p>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Login Form */}
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center space-x-2">
                    <Mail size={16} />
                    <span>Email *</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="seu@email.com"
                    className="w-full"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password" className="flex items-center space-x-2">
                    <Lock size={16} />
                    <span>Senha *</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="Digite sua senha"
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
                
                <Button 
                  type="submit" 
                  disabled={loginMutation.isPending}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
                >
                  {loginMutation.isPending ? "Entrando..." : "Entrar"}
                </Button>
              </form>

              {/* Forgot Password */}
              <div className="text-center">
                <button
                  onClick={handleForgotPassword}
                  className="text-blue-600 hover:text-blue-800 text-sm underline"
                >
                  Esqueci minha senha
                </button>
              </div>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-500">ou</span>
                </div>
              </div>

              {/* Replit Login */}
              <Button
                onClick={handleReplitLogin}
                variant="outline"
                className="w-full border-2 border-blue-600 text-blue-600 hover:bg-blue-50"
              >
                Login com Replit (Temporário)
              </Button>

              {/* Register Link */}
              <div className="text-center">
                <p className="text-gray-600 text-sm">
                  Não tem conta?{" "}
                  <button
                    onClick={() => navigate("/staff-register")}
                    className="text-blue-600 hover:text-blue-800 font-semibold underline"
                  >
                    Novo Cadastro
                  </button>
                </p>
              </div>

              {/* Back Button */}
              <Button
                onClick={() => window.location.href = '/'}
                variant="ghost"
                className="w-full text-gray-600"
              >
                ← Voltar ao início
              </Button>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center mt-8">
            <p className="text-xs text-gray-500">
              Sistema de gerenciamento para supermercados parceiros
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}