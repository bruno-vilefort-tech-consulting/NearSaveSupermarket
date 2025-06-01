import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShoppingCart, Store, Clock, Shield, User, Phone, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const [, navigate] = useLocation();
  const [userType, setUserType] = useState<"customer" | "staff" | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: ""
  });
  const { toast } = useToast();

  const handleStaffLogin = () => {
    window.location.href = "/api/login";
  };

  const handleCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.phone) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha nome e telefone",
        variant: "destructive"
      });
      return;
    }

    localStorage.setItem('customerInfo', JSON.stringify(formData));
    
    toast({
      title: "Login realizado!",
      description: `Bem-vindo, ${formData.name}!`,
    });

    navigate("/customer");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <ShoppingCart className="text-green-600 mr-2" size={32} />
            <h1 className="text-3xl font-bold text-gray-900">FreshSaver</h1>
          </div>
          <p className="text-lg text-gray-600">
            Produtos com desconto próximos ao vencimento
          </p>
        </div>

        {/* Main Content */}
        <div className="max-w-md mx-auto">
          <Card className="shadow-lg">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-gray-900">
                {!userType ? "Como você deseja acessar?" : 
                 userType === "staff" ? "Área do Supermercado" : "Área do Cliente"}
              </CardTitle>
              <p className="text-gray-600 mt-2">
                {!userType ? "Escolha seu perfil para continuar" :
                 userType === "staff" ? "Acesse o painel administrativo" : "Faça login para encontrar produtos com desconto"}
              </p>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {!userType ? (
                /* User Type Selection */
                <div className="space-y-4">
                  <Button
                    onClick={() => setUserType("customer")}
                    className="w-full h-20 bg-green-600 hover:bg-green-700 text-white flex flex-col items-center justify-center space-y-2"
                  >
                    <ShoppingCart size={24} />
                    <div className="text-center">
                      <div className="font-semibold">Sou Cliente</div>
                      <div className="text-sm opacity-90">Quero comprar produtos com desconto</div>
                    </div>
                  </Button>
                  
                  <Button
                    onClick={() => setUserType("staff")}
                    variant="outline"
                    className="w-full h-20 border-2 border-blue-600 text-blue-600 hover:bg-blue-50 flex flex-col items-center justify-center space-y-2"
                  >
                    <Settings size={24} />
                    <div className="text-center">
                      <div className="font-semibold">Sou do Supermercado</div>
                      <div className="text-sm opacity-75">Gerenciar produtos e pedidos</div>
                    </div>
                  </Button>
                </div>
              ) : userType === "staff" ? (
                /* Staff Login */
                <div className="space-y-4 text-center">
                  <div className="flex items-center justify-center space-x-2 text-blue-600 mb-4">
                    <Settings size={24} />
                    <span className="text-lg font-semibold">Área do Supermercado</span>
                  </div>
                  
                  <p className="text-gray-600 mb-6">
                    Acesse o painel administrativo para gerenciar produtos, pedidos e estatísticas.
                  </p>
                  
                  <Button
                    onClick={handleStaffLogin}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
                  >
                    Fazer Login com Replit
                  </Button>
                  
                  <Button
                    onClick={() => setUserType(null)}
                    variant="ghost"
                    className="w-full text-gray-600"
                  >
                    ← Voltar
                  </Button>
                </div>
              ) : (
                /* Customer Login Form */
                <div className="space-y-4">
                  <div className="flex items-center justify-center space-x-2 text-green-600 mb-4">
                    <ShoppingCart size={24} />
                    <span className="text-lg font-semibold">Área do Cliente</span>
                  </div>

                  {/* Benefits */}
                  <div className="space-y-3 mb-6">
                    <div className="flex items-start space-x-3">
                      <Store className="text-green-600 mt-1" size={18} />
                      <div>
                        <h3 className="font-semibold text-gray-900 text-sm">Supermercados Parceiros</h3>
                        <p className="text-xs text-gray-600">
                          Produtos de supermercados confiáveis da sua região
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <Clock className="text-blue-600 mt-1" size={18} />
                      <div>
                        <h3 className="font-semibold text-gray-900 text-sm">Economia Real</h3>
                        <p className="text-xs text-gray-600">
                          Até 50% de desconto em produtos próximos ao vencimento
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <Shield className="text-purple-600 mt-1" size={18} />
                      <div>
                        <h3 className="font-semibold text-gray-900 text-sm">Seguro e Confiável</h3>
                        <p className="text-xs text-gray-600">
                          Produtos verificados com qualidade garantida
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Login Form */}
                  <form onSubmit={handleCustomerSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="flex items-center space-x-2">
                        <User size={16} />
                        <span>Nome completo *</span>
                      </Label>
                      <Input
                        id="name"
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Digite seu nome completo"
                        className="w-full"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="flex items-center space-x-2">
                        <Phone size={16} />
                        <span>Telefone *</span>
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="(11) 99999-9999"
                        className="w-full"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-gray-700">
                        Email (opcional)
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
                    
                    <Button 
                      type="submit" 
                      className="w-full bg-green-600 hover:bg-green-700 text-white py-3"
                    >
                      Entrar como Cliente
                    </Button>
                  </form>
                  
                  <Button
                    onClick={() => setUserType(null)}
                    variant="ghost"
                    className="w-full text-gray-600"
                  >
                    ← Voltar
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center mt-8">
            <p className="text-xs text-gray-500">
              Plataforma de economia colaborativa para produtos próximos ao vencimento
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}