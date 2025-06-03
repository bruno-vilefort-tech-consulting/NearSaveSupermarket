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
      color: "bg-purple-100 text-purple-800"
    },
    {
      category: "Laticínios",
      multiplier: "1.2x",
      description: "Produtos perecíveis com alto desperdício potencial",
      color: "bg-blue-100 text-blue-800"
    },
    {
      category: "Frios",
      multiplier: "1.2x",
      description: "Produtos refrigerados sensíveis",
      color: "bg-cyan-100 text-cyan-800"
    },
    {
      category: "Padaria",
      multiplier: "1.15x",
      description: "Produtos com vida útil curta",
      color: "bg-yellow-100 text-yellow-800"
    },
    {
      category: "Hortifruti",
      multiplier: "1.1x",
      description: "Produtos frescos com deterioração rápida",
      color: "bg-green-100 text-green-800"
    }
  ];

  const benefits = [
    {
      title: "Redução do Desperdício",
      description: "Ajude a combater o desperdício alimentar comprando produtos próximos ao vencimento",
      icon: <Recycle size={24} className="text-green-600" />
    },
    {
      title: "Economia Financeira",
      description: "Produtos com desconto significativo para seu orçamento",
      icon: <TrendingUp size={24} className="text-blue-600" />
    },
    {
      title: "Impacto Ambiental",
      description: "Contribua para um planeta mais sustentável com suas escolhas",
      icon: <Leaf size={24} className="text-green-600" />
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/customer")}
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft size={16} className="mr-2" />
                Voltar
              </Button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Pontos Eco</h1>
                <p className="text-sm text-gray-600">Seu programa de sustentabilidade</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Current Balance */}
        <Card className="mb-8 bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-green-100 p-4 rounded-full">
                <Leaf size={32} className="text-green-600" />
              </div>
            </div>
            <CardTitle className="text-2xl text-gray-900">
              Seus Pontos Eco
            </CardTitle>
            <div className="text-4xl font-bold text-green-600 mt-2">
              {customerInfo?.ecoPoints || 0} pontos
            </div>
            <p className="text-gray-600 mt-2">
              Total de ações sustentáveis: {customerInfo?.totalEcoActions || 0}
            </p>
          </CardHeader>
        </Card>

        {/* How it Works */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Award size={24} className="mr-2 text-green-600" />
              Como Funciona o Sistema de Pontos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-6">
              Ganhe pontos eco comprando produtos próximos ao vencimento e ajude a combater o desperdício alimentar. 
              Quanto mais próximo do vencimento, mais pontos você ganha!
            </p>
            
            <div className="space-y-4">
              {pointsRules.map((rule, index) => (
                <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-4">
                    {rule.icon}
                    <div>
                      <h4 className="font-medium text-gray-900">{rule.condition}</h4>
                      <p className="text-sm text-gray-600">{rule.description}</p>
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
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp size={24} className="mr-2 text-purple-600" />
              Multiplicadores por Categoria
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-6">
              Algumas categorias de produtos têm multiplicadores especiais para incentivar a compra de itens com maior impacto ambiental.
            </p>
            
            <div className="space-y-3">
              {categoryMultipliers.map((category, index) => (
                <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="bg-purple-100 p-2 rounded-full">
                      <Award size={16} className="text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{category.category}</h4>
                      <p className="text-sm text-gray-600">{category.description}</p>
                    </div>
                  </div>
                  <Badge className={category.color}>
                    {category.multiplier}
                  </Badge>
                </div>
              ))}
            </div>
            
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Exemplo:</strong> Um produto de "Carnes e Aves" que vence amanhã (80 pontos base) 
                recebe multiplicador de 1.3x = <strong>104 pontos eco!</strong>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Benefits */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Gift size={24} className="mr-2 text-blue-600" />
              Benefícios do Programa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {benefits.map((benefit, index) => (
                <div key={index} className="text-center">
                  <div className="flex justify-center mb-4">
                    <div className="bg-gray-100 p-3 rounded-full">
                      {benefit.icon}
                    </div>
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">{benefit.title}</h4>
                  <p className="text-sm text-gray-600">{benefit.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tips */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp size={24} className="mr-2 text-yellow-600" />
              Dicas para Maximizar seus Pontos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="bg-yellow-100 p-2 rounded-full mt-1">
                  <Calendar size={16} className="text-yellow-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Compre produtos próximos ao vencimento</h4>
                  <p className="text-sm text-gray-600">Procure pela badge vermelha "1d" ou "2d" para máximos pontos</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="bg-blue-100 p-2 rounded-full mt-1">
                  <Leaf size={16} className="text-blue-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Consuma conscientemente</h4>
                  <p className="text-sm text-gray-600">Compre apenas o que vai consumir para evitar desperdício em casa</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="bg-green-100 p-2 rounded-full mt-1">
                  <Award size={16} className="text-green-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Acompanhe seus pontos</h4>
                  <p className="text-sm text-gray-600">Volte sempre para ver como suas ações impactam o meio ambiente</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}