import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Leaf, ShoppingCart, Star, Users } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Leaf className="h-8 w-8 text-green-600 mr-2" />
              <span className="text-2xl font-bold text-gray-900">EcoMarket</span>
            </div>
            <div className="flex space-x-4">
              <Button variant="outline">Entrar como Staff</Button>
              <Button variant="outline">Entrar como Cliente</Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Supermercados <span className="text-green-600">Sustentáveis</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Revolucionando a experiência de compras no Brasil com foco em sustentabilidade,
            redução de desperdício e pontos ecológicos.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-green-600 hover:bg-green-700">
              <ShoppingCart className="mr-2 h-5 w-5" />
              Começar a Comprar
            </Button>
            <Button size="lg" variant="outline">
              Cadastrar Supermercado
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Por que escolher o EcoMarket?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center">
              <CardHeader>
                <Leaf className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <CardTitle>Sustentabilidade</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Ganhe pontos ecológicos comprando produtos próximos ao vencimento
                  e ajude a reduzir o desperdício de alimentos.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <ShoppingCart className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <CardTitle>Compras Inteligentes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Encontre supermercados próximos, compare preços e faça pedidos
                  com entrega ou retirada no local.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Star className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
                <CardTitle>Experiência Premium</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Interface móvel otimizada, pagamentos PIX seguros e
                  notificações push em tempo real.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-green-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-green-600 mb-2">500+</div>
              <div className="text-gray-600">Produtos Disponíveis</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-green-600 mb-2">50+</div>
              <div className="text-gray-600">Supermercados Parceiros</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-green-600 mb-2">1000+</div>
              <div className="text-gray-600">Clientes Ativos</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-green-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Pronto para uma experiência sustentável?
          </h2>
          <p className="text-green-100 mb-8 max-w-2xl mx-auto">
            Junte-se a milhares de brasileiros que já fazem a diferença
            através de compras conscientes e sustentáveis.
          </p>
          <Button size="lg" variant="secondary">
            <Users className="mr-2 h-5 w-5" />
            Cadastre-se Agora
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <Leaf className="h-6 w-6 text-green-400 mr-2" />
              <span className="text-xl font-bold">EcoMarket</span>
            </div>
            <div className="text-gray-400 text-sm">
              © 2025 EcoMarket. Todos os direitos reservados.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}