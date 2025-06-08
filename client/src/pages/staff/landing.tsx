import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Store, Package, TrendingUp, Users, ArrowRight, CheckCircle, BarChart3, Leaf } from "lucide-react";
import { useLocation } from "wouter";
import shoppingBagImage from "@assets/20250608_0832_Fundo Transparente_remix_01jx7mygx5e83sfwrt5bjztmnn_1749382406471.png";

function StaffLanding() {
  const [, setLocation] = useLocation();

  const features = [
    {
      icon: Package,
      title: "Gestão de Produtos",
      description: "Cadastre produtos próximos ao vencimento com desconto para reduzir desperdício"
    },
    {
      icon: TrendingUp,
      title: "Aumento de Vendas",
      description: "Converta produtos que seriam descartados em receita adicional"
    },
    {
      icon: Users,
      title: "Alcance Novos Clientes",
      description: "Conecte-se com consumidores conscientes que buscam produtos com desconto"
    },
    {
      icon: Leaf,
      title: "Sustentabilidade",
      description: "Contribua para a redução do desperdício alimentar e proteja o meio ambiente"
    },
    {
      icon: BarChart3,
      title: "Relatórios Detalhados",
      description: "Monitore vendas, estoque e impacto ambiental em tempo real"
    },
    {
      icon: CheckCircle,
      title: "Fácil de Usar",
      description: "Interface intuitiva para cadastro rápido de produtos e gestão de pedidos"
    }
  ];

  const benefits = [
    "Transforme produtos próximos ao vencimento em receita",
    "Reduza custos operacionais com menos desperdício",
    "Melhore a imagem sustentável do seu negócio",
    "Acesse relatórios completos de performance",
    "Sistema de pagamento integrado PIX e cartão",
    "Suporte técnico especializado"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-eco-green/5 to-eco-orange/5">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-8 md:py-16">
        <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
          <div className="flex-1 text-center lg:text-left space-y-6">
            <div className="space-y-4">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
                Transforme Desperdício em
                <span className="text-eco-green block">Receita Sustentável</span>
              </h1>
              <p className="text-lg md:text-xl text-gray-600 max-w-2xl">
                Conecte seu supermercado a consumidores conscientes. Venda produtos próximos ao vencimento 
                com desconto e contribua para um futuro mais sustentável.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button 
                size="lg"
                className="bg-eco-green hover:bg-eco-green/90 text-white px-8 py-4 text-lg"
                onClick={() => setLocation("/staff/register")}
              >
                Cadastrar Supermercado
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="border-eco-green text-eco-green hover:bg-eco-green hover:text-white px-8 py-4 text-lg"
                onClick={() => setLocation("/staff/login")}
              >
                Já tenho conta
              </Button>
            </div>

            <div className="flex items-center justify-center lg:justify-start gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-eco-green" />
                <span>Cadastro gratuito</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-eco-green" />
                <span>Suporte incluído</span>
              </div>
            </div>
          </div>

          <div className="flex-1 flex justify-center">
            <div className="relative">
              <img 
                src={shoppingBagImage} 
                alt="Sacolas de compras sustentáveis" 
                className="w-48 md:w-64 lg:w-80 h-auto object-contain drop-shadow-2xl"
              />
              <div className="absolute -top-4 -right-4 bg-eco-orange text-white px-3 py-1 rounded-full text-sm font-medium">
                Sustentável
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Por que escolher o SaveUp?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              A plataforma completa para supermercados reduzirem desperdício e aumentarem vendas
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow border-0 shadow-md">
                <CardHeader>
                  <div className="w-12 h-12 bg-eco-green/10 rounded-lg flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-eco-green" />
                  </div>
                  <CardTitle className="text-xl font-semibold text-gray-900">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600 text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-gradient-to-r from-eco-green to-eco-green/80 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-white mb-4">
                Benefícios para seu Supermercado
              </h2>
              <p className="text-xl text-green-100">
                Junte-se a centenas de supermercados que já transformaram desperdício em lucro
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-4 bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                  <CheckCircle className="h-6 w-6 text-green-200 flex-shrink-0" />
                  <span className="text-white font-medium">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-gray-900">
                Pronto para Começar?
              </h2>
              <p className="text-xl text-gray-600">
                Cadastre seu supermercado hoje e comece a transformar desperdício em receita sustentável
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg"
                  className="bg-eco-green hover:bg-eco-green/90 text-white px-8 py-4 text-lg"
                  onClick={() => setLocation("/staff/register")}
                >
                  <Store className="mr-2 h-5 w-5" />
                  Cadastrar Agora
                </Button>
                <Button 
                  variant="outline" 
                  size="lg"
                  className="border-gray-300 text-gray-700 hover:bg-gray-100 px-8 py-4 text-lg"
                  onClick={() => setLocation("/staff/login")}
                >
                  Fazer Login
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Store className="h-6 w-6 text-eco-green" />
              <span className="text-xl font-bold">SaveUp</span>
              <span className="text-gray-400">Supermercados</span>
            </div>
            <p className="text-gray-400">
              Conectando supermercados e consumidores por um futuro mais sustentável
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default StaffLanding;