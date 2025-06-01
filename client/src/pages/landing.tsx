import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Leaf, 
  ShoppingCart, 
  Users, 
  TrendingDown, 
  Star, 
  Award, 
  Heart, 
  Sparkles,
  Gift,
  Shield,
  Clock,
  Zap,
  Store
} from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/staff-login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header com animação */}
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full blur-xl opacity-20 animate-pulse"></div>
            <div className="relative flex items-center justify-center space-x-3 mb-6">
              <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-6 rounded-3xl shadow-xl">
                <Store className="h-16 w-16 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-green-700 to-emerald-800 bg-clip-text text-transparent">
                  EcoMart
                </h1>
                <div className="flex items-center justify-center space-x-1 mt-1">
                  <Sparkles className="h-4 w-4 text-yellow-500" />
                  <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                    Sustentável
                  </Badge>
                </div>
              </div>
            </div>
          </div>
          <p className="text-lg text-gray-700 font-medium">
            O futuro dos supermercados é verde
          </p>
        </div>

        {/* Features Grid Melhorada */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="text-center hover:scale-105 transition-transform duration-200 border-green-200">
            <CardContent className="p-5">
              <div className="bg-blue-100 p-5 rounded-xl w-fit mx-auto mb-3">
                <ShoppingCart className="h-10 w-10 text-blue-600" />
              </div>
              <h3 className="font-bold text-sm text-gray-800">Gestão Inteligente</h3>
              <p className="text-xs text-gray-600 mt-1">Controle total do estoque</p>
            </CardContent>
          </Card>
          
          <Card className="text-center hover:scale-105 transition-transform duration-200 border-purple-200">
            <CardContent className="p-5">
              <div className="bg-purple-100 p-5 rounded-xl w-fit mx-auto mb-3">
                <Users className="h-10 w-10 text-purple-600" />
              </div>
              <h3 className="font-bold text-sm text-gray-800">Experiência Premium</h3>
              <p className="text-xs text-gray-600 mt-1">Atendimento excepcional</p>
            </CardContent>
          </Card>
          
          <Card className="text-center hover:scale-105 transition-transform duration-200 border-orange-200">
            <CardContent className="p-5">
              <div className="bg-orange-100 p-5 rounded-xl w-fit mx-auto mb-3">
                <TrendingDown className="h-10 w-10 text-orange-600" />
              </div>
              <h3 className="font-bold text-sm text-gray-800">Preços Especiais</h3>
              <p className="text-xs text-gray-600 mt-1">Descontos inteligentes</p>
            </CardContent>
          </Card>
          
          <Card className="text-center hover:scale-105 transition-transform duration-200 border-green-200">
            <CardContent className="p-5">
              <div className="bg-green-100 p-5 rounded-xl w-fit mx-auto mb-3">
                <Award className="h-10 w-10 text-green-600" />
              </div>
              <h3 className="font-bold text-sm text-gray-800">Recompensas Eco</h3>
              <p className="text-xs text-gray-600 mt-1">Pontos por sustentabilidade</p>
            </CardContent>
          </Card>
        </div>

        {/* Login Card Melhorado */}
        <Card className="border-2 border-green-200 shadow-xl">
          <CardHeader className="text-center bg-gradient-to-r from-green-50 to-emerald-50 rounded-t-lg">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Shield className="h-5 w-5 text-green-600" />
              <CardTitle className="text-green-800">Escolha seu acesso</CardTitle>
            </div>
            <CardDescription className="text-gray-600">
              Selecione o tipo de conta para continuar
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-6">
            {/* Botão Staff */}
            <Button 
              onClick={handleLogin}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
              size="lg"
            >
              <div className="flex items-center justify-center space-x-3">
                <Users className="h-6 w-6" />
                <div className="text-left">
                  <div className="font-bold">Staff do Supermercado</div>
                  <div className="text-xs opacity-90">Login para gerenciar produtos e pedidos</div>
                </div>
              </div>
            </Button>

            {/* Botão Cliente */}
            <Button 
              onClick={() => window.location.href = '/customer/login'}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
              size="lg"
            >
              <div className="flex items-center justify-center space-x-3">
                <ShoppingCart className="h-6 w-6" />
                <div className="text-left">
                  <div className="font-bold">Cliente</div>
                  <div className="text-xs opacity-90">Login para comprar produtos com desconto</div>
                </div>
              </div>
            </Button>
            
            <div className="flex items-center justify-center space-x-4 text-sm mt-4">
              <div className="flex items-center space-x-1 text-green-600">
                <Clock className="h-4 w-4" />
                <span>Rápido</span>
              </div>
              <div className="flex items-center space-x-1 text-blue-600">
                <Shield className="h-4 w-4" />
                <span>Seguro</span>
              </div>
              <div className="flex items-center space-x-1 text-purple-600">
                <Gift className="h-4 w-4" />
                <span>Gratuito</span>
              </div>
            </div>
            
            <div className="text-center text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center justify-center space-x-1 mb-1">
                <Star className="h-4 w-4 text-yellow-500" />
                <span className="font-medium">Novo usuário?</span>
              </div>
              <p>Staff: conta criada automaticamente | Cliente: acesso direto</p>
            </div>
          </CardContent>
        </Card>

        {/* Badges de benefícios */}
        <div className="flex flex-wrap justify-center gap-2">
          <Badge variant="outline" className="bg-green-50 border-green-300 text-green-700">
            <Heart className="h-3 w-3 mr-1" />
            Zero Desperdício
          </Badge>
          <Badge variant="outline" className="bg-blue-50 border-blue-300 text-blue-700">
            <Star className="h-3 w-3 mr-1" />
            Premiado
          </Badge>
          <Badge variant="outline" className="bg-purple-50 border-purple-300 text-purple-700">
            <Gift className="h-3 w-3 mr-1" />
            Recompensas
          </Badge>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 space-y-2">
          <p className="font-medium">© 2024 EcoMart - Supermercado do Futuro</p>
          <div className="flex items-center justify-center space-x-4 text-xs">
            <span className="flex items-center space-x-1">
              <Leaf className="h-3 w-3 text-green-500" />
              <span>100% Sustentável</span>
            </span>
            <span className="flex items-center space-x-1">
              <Shield className="h-3 w-3 text-blue-500" />
              <span>Dados Protegidos</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
