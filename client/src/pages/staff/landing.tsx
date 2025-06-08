import { Button } from "@/components/ui/button";
import { Store, Package, TrendingUp, ArrowRight, CheckCircle, Leaf } from "lucide-react";
import { useLocation } from "wouter";

function StaffLanding() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-eco-green/5 to-eco-orange/5">
      {/* Hero Section - Mobile First */}
      <section className="px-4 py-8">
        <div className="max-w-sm mx-auto text-center space-y-6">
          {/* Logo/Icon */}
          <div className="w-16 h-16 bg-eco-green/10 rounded-2xl flex items-center justify-center mx-auto">
            <Store className="h-8 w-8 text-eco-green" />
          </div>

          {/* Title */}
          <div className="space-y-3">
            <h1 className="text-2xl font-bold text-gray-900 leading-tight">
              Transforme Desperdício em
              <span className="text-eco-green block">Receita Sustentável</span>
            </h1>
            <p className="text-gray-600 text-base">
              Venda produtos próximos ao vencimento com desconto e reduza desperdício
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-4">
            <Button 
              size="lg"
              className="w-full bg-eco-green hover:bg-eco-green/90 text-white py-4"
              onClick={() => setLocation("/staff/register")}
            >
              Cadastrar Supermercado
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              className="w-full border-eco-green text-eco-green hover:bg-eco-green hover:text-white py-4"
              onClick={() => setLocation("/staff/login")}
            >
              Já tenho conta
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="flex items-center justify-center gap-4 text-sm text-gray-600 pt-2">
            <div className="flex items-center gap-1">
              <CheckCircle className="h-4 w-4 text-eco-green" />
              <span>Gratuito</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="h-4 w-4 text-eco-green" />
              <span>Suporte incluído</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Compact */}
      <section className="bg-white py-12">
        <div className="max-w-sm mx-auto px-4">
          <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">
            Principais Benefícios
          </h2>

          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
              <div className="w-8 h-8 bg-eco-green/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Package className="h-4 w-4 text-eco-green" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900 text-sm">Gestão Simples</h3>
                <p className="text-gray-600 text-xs">Cadastre produtos com desconto rapidamente</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
              <div className="w-8 h-8 bg-eco-green/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <TrendingUp className="h-4 w-4 text-eco-green" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900 text-sm">Mais Vendas</h3>
                <p className="text-gray-600 text-xs">Converta desperdício em receita adicional</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
              <div className="w-8 h-8 bg-eco-green/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Leaf className="h-4 w-4 text-eco-green" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900 text-sm">Sustentabilidade</h3>
                <p className="text-gray-600 text-xs">Reduza desperdício e proteja o meio ambiente</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-eco-green py-12">
        <div className="max-w-sm mx-auto px-4 text-center">
          <h2 className="text-xl font-bold text-white mb-3">
            Comece Hoje
          </h2>
          <p className="text-green-100 mb-6 text-sm">
            Junte-se aos supermercados que já reduzem desperdício
          </p>
          <Button 
            size="lg"
            className="w-full bg-white text-eco-green hover:bg-gray-100 py-4 font-medium"
            onClick={() => setLocation("/staff/register")}
          >
            <Store className="mr-2 h-5 w-5" />
            Cadastrar Supermercado
          </Button>
        </div>
      </section>

      {/* Footer - Minimal */}
      <footer className="bg-gray-900 text-center py-6">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Store className="h-5 w-5 text-eco-green" />
          <span className="text-white font-medium">SaveUp</span>
          <span className="text-gray-400 text-sm">Supermercados</span>
        </div>
        <p className="text-gray-400 text-xs">
          Sustentabilidade que gera receita
        </p>
      </footer>
    </div>
  );
}

export default StaffLanding;