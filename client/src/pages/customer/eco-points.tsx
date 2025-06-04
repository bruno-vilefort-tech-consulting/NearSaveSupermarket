import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Leaf, 
  Calendar, 
  Award, 
  TrendingUp,
  Clock,
  Gift,
  Recycle
} from "lucide-react";

export default function EcoPoints() {
  const [, navigate] = useLocation();
  const [customerInfo, setCustomerInfo] = useState<any>(null);

  useEffect(() => {
    const savedCustomer = localStorage.getItem('customerInfo');
    if (savedCustomer) {
      setCustomerInfo(JSON.parse(savedCustomer));
    }
  }, []);

  const pointsRules = [
    {
      condition: "Vence hoje",
      points: 100,
      description: "Produto vence no mesmo dia - máximo impacto na redução de desperdício",
      color: "bg-red-100 text-red-800",
      icon: <Clock size={16} className="text-red-600" />
    },
    {
      condition: "Vence amanhã",
      points: 80,
      description: "Produto vence em 1 dia - alta prioridade",
      color: "bg-red-100 text-red-800",
      icon: <Clock size={16} className="text-red-600" />
    },
    {
      condition: "Vence em 2-3 dias",
      points: 60,
      description: "Produto próximo ao vencimento - contribuição significativa",
      color: "bg-orange-100 text-orange-800",
      icon: <Clock size={16} className="text-orange-600" />
    },
    {
      condition: "Vence em 4-7 dias",
      points: 40,
      description: "Produto com vencimento em 1 semana - boa contribuição",
      color: "bg-yellow-100 text-yellow-800",
      icon: <Clock size={16} className="text-yellow-600" />
    },
    {
      condition: "Vence em 8-14 dias",
      points: 25,
      description: "Produto com vencimento em 2 semanas - contribuição básica",
      color: "bg-blue-100 text-blue-800",
      icon: <Clock size={16} className="text-blue-600" />
    },
    {
      condition: "Vence em 15-30 dias",
      points: 15,
      description: "Produto com vencimento até 1 mês - contribuição mínima",
      color: "bg-green-100 text-green-800",
      icon: <Clock size={16} className="text-green-600" />
    },
    {
      condition: "Mais de 30 dias",
      points: 10,
      description: "Produto com vencimento distante - pontuação padrão",
      color: "bg-gray-100 text-gray-800",
      icon: <Clock size={16} className="text-gray-600" />
    }
  ];

  const categoryMultipliers = [
    {
      category: "Carnes e Aves",
      multiplier: "1.3x",
      description: "Alto impacto ambiental e nutricional",
      color: "bg-eco-orange/10 text-eco-orange border border-eco-orange/20"
    },
    {
      category: "Laticínios",
      multiplier: "1.2x",
      description: "Produtos perecíveis com alto desperdício potencial",
      color: "bg-eco-blue/10 text-eco-blue border border-eco-blue/20"
    },
    {
      category: "Frios",
      multiplier: "1.2x",
      description: "Produtos refrigerados sensíveis",
      color: "bg-eco-sage/10 text-eco-sage-dark border border-eco-sage/20"
    },
    {
      category: "Padaria",
      multiplier: "1.15x",
      description: "Produtos com vida útil curta",
      color: "bg-eco-cream text-eco-gray-dark border border-eco-sage/30"
    },
    {
      category: "Hortifruti",
      multiplier: "1.1x",
      description: "Produtos frescos com deterioração rápida",
      color: "bg-eco-green/10 text-eco-green border border-eco-green/20"
    }
  ];

  const benefits = [
    {
      title: "Redução do Desperdício",
      description: "Ajude a combater o desperdício alimentar comprando produtos próximos ao vencimento",
      icon: <Recycle size={24} className="text-eco-green" />
    },
    {
      title: "Economia Financeira",
      description: "Produtos com desconto significativo para seu orçamento",
      icon: <TrendingUp size={24} className="text-eco-blue" />
    },
    {
      title: "Impacto Ambiental",
      description: "Contribua para um planeta mais sustentável com suas escolhas",
      icon: <Leaf size={24} className="text-eco-green" />
    }
  ];

  return (
    <div className="min-h-screen bg-eco-cream">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-eco-sage/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/customer")}
                className="text-eco-gray hover:text-eco-gray-dark"
              >
                <ArrowLeft size={16} className="mr-2" />
                Voltar
              </Button>
              <div>
                <h1 className="text-xl font-bold text-eco-gray-dark">Pontos Eco</h1>
                <p className="text-sm text-eco-gray">Seu programa de sustentabilidade</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Current Balance */}
        <Card className="mb-8 gradient-eco-green border-eco-green">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-eco-green p-4 rounded-full">
                <Leaf size={32} className="text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl text-eco-gray-dark">
              Seus Pontos Eco
            </CardTitle>
            <div className="text-4xl font-bold text-eco-green-dark mt-2">
              {customerInfo?.ecoPoints || 0} pontos
            </div>
            <p className="text-eco-gray mt-2">
              Total de ações sustentáveis: {customerInfo?.totalEcoActions || 0}
            </p>
          </CardHeader>
        </Card>

        {/* How it Works */}
        <Card className="mb-8 border-eco-sage/20">
          <CardHeader>
            <CardTitle className="flex items-center text-eco-gray-dark">
              <Award size={24} className="mr-2 text-eco-green" />
              Como Funciona o Sistema de Pontos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-eco-gray mb-6">
              Ganhe pontos eco comprando produtos próximos ao vencimento e ajude a combater o desperdício alimentar. 
              Quanto mais próximo do vencimento, mais pontos você ganha!
            </p>
            
            <div className="space-y-4">
              {pointsRules.map((rule, index) => (
                <div key={index} className="flex items-center justify-between p-4 border border-eco-sage/20 rounded-lg bg-white/50">
                  <div className="flex items-center space-x-4">
                    {rule.icon}
                    <div>
                      <h4 className="font-medium text-eco-gray-dark">{rule.condition}</h4>
                      <p className="text-sm text-eco-gray">{rule.description}</p>
                    </div>
                  </div>
                  <Badge className={rule.color}>
                    +{rule.points} pontos
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Category Multipliers */}
        <Card className="mb-8 border-eco-sage/20">
          <CardHeader>
            <CardTitle className="flex items-center text-eco-gray-dark">
              <TrendingUp size={24} className="mr-2 text-eco-blue" />
              Multiplicadores por Categoria
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-eco-gray mb-6">
              Algumas categorias de produtos têm multiplicadores especiais para incentivar a compra de itens com maior impacto ambiental.
            </p>
            
            <div className="space-y-3">
              {categoryMultipliers.map((category, index) => (
                <div key={index} className="flex items-center justify-between p-3 border border-eco-sage/20 rounded-lg bg-white/50">
                  <div className="flex items-center space-x-3">
                    <div className="bg-eco-blue/10 p-2 rounded-full">
                      <Award size={16} className="text-eco-blue" />
                    </div>
                    <div>
                      <h4 className="font-medium text-eco-gray-dark">{category.category}</h4>
                      <p className="text-sm text-eco-gray">{category.description}</p>
                    </div>
                  </div>
                  <Badge className={category.color}>
                    {category.multiplier}
                  </Badge>
                </div>
              ))}
            </div>
            
            <div className="mt-4 p-3 bg-eco-blue/10 rounded-lg border border-eco-blue/20">
              <p className="text-sm text-eco-blue-dark">
                <strong>Exemplo:</strong> Um produto de "Carnes e Aves" que vence amanhã (80 pontos base) 
                recebe multiplicador de 1.3x = <strong>104 pontos eco!</strong>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Benefits */}
        <Card className="mb-8 border-eco-sage/20">
          <CardHeader>
            <CardTitle className="flex items-center text-eco-gray-dark">
              <Gift size={24} className="mr-2 text-eco-orange" />
              Benefícios do Programa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {benefits.map((benefit, index) => (
                <div key={index} className="text-center">
                  <div className="flex justify-center mb-4">
                    <div className="bg-eco-cream p-3 rounded-full border border-eco-sage/20">
                      {benefit.icon}
                    </div>
                  </div>
                  <h4 className="font-semibold text-eco-gray-dark mb-2">{benefit.title}</h4>
                  <p className="text-sm text-eco-gray">{benefit.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tips */}
        <Card className="border-eco-sage/20">
          <CardHeader>
            <CardTitle className="flex items-center text-eco-gray-dark">
              <TrendingUp size={24} className="mr-2 text-eco-orange" />
              Dicas para Maximizar seus Pontos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="bg-eco-orange/10 p-2 rounded-full mt-1 border border-eco-orange/20">
                  <Calendar size={16} className="text-eco-orange" />
                </div>
                <div>
                  <h4 className="font-medium text-eco-gray-dark">Compre produtos próximos ao vencimento</h4>
                  <p className="text-sm text-eco-gray">Procure pela badge vermelha "1d" ou "2d" para máximos pontos</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="bg-eco-green/10 p-2 rounded-full mt-1 border border-eco-green/20">
                  <Leaf size={16} className="text-eco-green" />
                </div>
                <div>
                  <h4 className="font-medium text-eco-gray-dark">Consuma conscientemente</h4>
                  <p className="text-sm text-eco-gray">Compre apenas o que vai consumir para evitar desperdício em casa</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="bg-eco-blue/10 p-2 rounded-full mt-1 border border-eco-blue/20">
                  <Award size={16} className="text-eco-blue" />
                </div>
                <div>
                  <h4 className="font-medium text-eco-gray-dark">Acompanhe seus pontos</h4>
                  <p className="text-sm text-eco-gray">Volte sempre para ver como suas ações impactam o meio ambiente</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}