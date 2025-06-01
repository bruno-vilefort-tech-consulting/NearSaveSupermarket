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
      condition: "Vence hoje ou amanhã",
      points: 80,
      description: "Produtos com vencimento muito próximo",
      color: "bg-red-100 text-red-800",
      icon: <Clock size={16} className="text-red-600" />
    },
    {
      condition: "Vence em até 3 dias",
      points: 60,
      description: "Produtos próximos ao vencimento",
      color: "bg-orange-100 text-orange-800",
      icon: <Clock size={16} className="text-orange-600" />
    },
    {
      condition: "Vence em até 7 dias",
      points: 40,
      description: "Produtos com vencimento em 1 semana",
      color: "bg-yellow-100 text-yellow-800",
      icon: <Clock size={16} className="text-yellow-600" />
    },
    {
      condition: "Vence em até 14 dias",
      points: 20,
      description: "Produtos com vencimento em 2 semanas",
      color: "bg-blue-100 text-blue-800",
      icon: <Clock size={16} className="text-blue-600" />
    },
    {
      condition: "Mais de 14 dias",
      points: 10,
      description: "Produtos com vencimento distante",
      color: "bg-green-100 text-green-800",
      icon: <Clock size={16} className="text-green-600" />
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