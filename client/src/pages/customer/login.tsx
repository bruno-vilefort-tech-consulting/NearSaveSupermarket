import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShoppingCart, Store, Clock, Shield, User, Phone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function CustomerLogin() {
  const [, navigate] = useLocation();
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: ""
  });
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.phone) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha nome e telefone",
        variant: "destructive"
      });
      return;
    }

    // Salvar dados do cliente no localStorage
    localStorage.setItem('customerInfo', JSON.stringify(formData));
    
    toast({
      title: "Login realizado!",
      description: `Bem-vindo, ${formData.name}!`,
    });

    // Redirecionar para o app do cliente
    navigate("/");
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
                Bem-vindo Cliente
              </CardTitle>
              <p className="text-gray-600 mt-2">
                Faça login para encontrar produtos com desconto
              </p>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Benefits */}
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Store className="text-green-600 mt-1" size={20} />
                  <div>
                    <h3 className="font-semibold text-gray-900">Supermercados Parceiros</h3>
                    <p className="text-sm text-gray-600">
                      Produtos de supermercados confiáveis da sua região
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <Clock className="text-blue-600 mt-1" size={20} />
                  <div>
                    <h3 className="font-semibold text-gray-900">Economia Real</h3>
                    <p className="text-sm text-gray-600">
                      Até 50% de desconto em produtos próximos ao vencimento
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <Shield className="text-purple-600 mt-1" size={20} />
                  <div>
                    <h3 className="font-semibold text-gray-900">Seguro e Confiável</h3>
                    <p className="text-sm text-gray-600">
                      Produtos verificados com qualidade garantida
                    </p>
                  </div>
                </div>
              </div>

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name" className="flex items-center space-x-2">
                    <User size={16} />
                    <span>Nome Completo *</span>
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Seu nome"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="phone" className="flex items-center space-x-2">
                    <Phone size={16} />
                    <span>Telefone *</span>
                  </Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="(11) 99999-9999"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="email">Email (opcional)</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="seu@email.com"
                  />
                </div>

                <Button 
                  type="submit"
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-3 text-lg"
                  size="lg"
                >
                  Entrar no App
                </Button>
                
                <p className="text-xs text-gray-500 text-center">
                  Ao entrar, você concorda com nossos termos de uso e política de privacidade
                </p>
              </form>

              {/* Info */}
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <p className="text-sm text-blue-800">
                  <strong>Novo por aqui?</strong> Não se preocupe! Ao fazer login, sua conta será criada automaticamente.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center mt-8">
            <Link href="/admin">
              <Button variant="ghost" className="text-gray-600">
                ← Área administrativa
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}