import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShoppingCart, Store, Clock, Shield, User, Phone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const [, navigate] = useLocation();
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: ""
  });
  const { toast } = useToast();

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
            <h1 className="text-3xl font-bold text-gray-900">EcoMart</h1>
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
                Área do Cliente
              </CardTitle>
              <p className="text-gray-600 mt-2">
                Faça login para encontrar produtos com desconto
              </p>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Customer Login Form */}
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
                  onClick={() => window.location.href = '/'}
                  variant="ghost"
                  className="w-full text-gray-600"
                >
                  ← Voltar ao início
                </Button>
              </div>
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