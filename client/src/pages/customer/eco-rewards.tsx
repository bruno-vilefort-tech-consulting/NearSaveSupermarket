import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Leaf, Trophy, Star, Calendar, Award } from "lucide-react";

interface EcoAction {
  id: number;
  actionType: string;
  pointsEarned: number;
  description: string;
  orderId?: number;
  createdAt: string;
}

export default function EcoRewards() {
  const [customerIdentifier, setCustomerIdentifier] = useState<string>("");

  useEffect(() => {
    const savedCustomer = localStorage.getItem('customerInfo');
    if (savedCustomer) {
      const customer = JSON.parse(savedCustomer);
      // Use email if available, otherwise use phone
      const identifier = customer.email || customer.phone || "";
      setCustomerIdentifier(identifier);
    }
  }, []);

  const { data: ecoActions = [], isLoading } = useQuery({
    queryKey: ["/api/public/eco-actions", customerIdentifier],
    queryFn: async () => {
      if (!customerIdentifier) return [];
      const response = await fetch(`/api/public/eco-actions/${customerIdentifier}`);
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      return response.json();
    },
    enabled: !!customerIdentifier,
  });

  // Get user total points
  const { data: userPoints = { ecoPoints: 0, totalEcoActions: 0 }, isLoading: userLoading } = useQuery({
    queryKey: ["/api/public/user-eco-points", customerIdentifier],
    queryFn: async () => {
      if (!customerIdentifier) return { ecoPoints: 0, totalEcoActions: 0 };
      const response = await fetch(`/api/public/user-eco-points/${customerIdentifier}`);
      if (!response.ok) {
        return { ecoPoints: 0, totalEcoActions: 0 };
      }
      return response.json();
    },
    enabled: !!customerIdentifier,
  });

  const totalPoints = userPoints.ecoPoints || 0;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'purchase_near_expiry':
        return <Leaf className="h-5 w-5 text-green-600" />;
      case 'large_order_discount':
        return <Trophy className="h-5 w-5 text-yellow-600" />;
      case 'first_time_customer':
        return <Star className="h-5 w-5 text-purple-600" />;
      default:
        return <Award className="h-5 w-5 text-blue-600" />;
    }
  };

  const getActionColor = (actionType: string) => {
    switch (actionType) {
      case 'purchase_near_expiry':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'large_order_discount':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'first_time_customer':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getRewardLevel = (points: number) => {
    if (points >= 500) return { level: "Eco Master", color: "text-purple-600", icon: "🌟" };
    if (points >= 200) return { level: "Eco Champion", color: "text-green-600", icon: "🏆" };
    if (points >= 100) return { level: "Eco Warrior", color: "text-blue-600", icon: "⚡" };
    if (points >= 50) return { level: "Eco Friend", color: "text-yellow-600", icon: "🌱" };
    return { level: "Eco Beginner", color: "text-gray-600", icon: "🌿" };
  };

  const rewardLevel = getRewardLevel(totalPoints);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-green-600 text-white p-4">
        <div className="flex items-center space-x-3 mb-4">
          <Link href="/customer">
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <h1 className="text-xl font-bold">Recompensas Eco</h1>
        </div>
        
        {/* Points Summary */}
        <Card className="bg-white/10 border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-2xl">{rewardLevel.icon}</span>
                  <span className={`font-semibold ${rewardLevel.color.replace('text-', 'text-white')}`}>
                    {rewardLevel.level}
                  </span>
                </div>
                <p className="text-white/80 text-sm">Seu nível atual</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">{totalPoints}</div>
                <p className="text-white/80 text-sm">Pontos Eco</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="p-4 space-y-4">
        {/* Eco Impact Info */}
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <Leaf className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Impacto Ambiental</h3>
                <p className="text-sm text-gray-600">
                  Você já salvou {ecoActions.filter((a: EcoAction) => a.actionType === 'purchase_near_expiry').length} produtos 
                  do desperdício! Continue comprando produtos próximos ao vencimento para ganhar mais pontos.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions History */}
        <div className="space-y-3">
          <h2 className="font-semibold text-gray-900 flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Histórico de Ações Sustentáveis</span>
          </h2>

          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Carregando recompensas...</p>
            </div>
          ) : ecoActions.length > 0 ? (
            ecoActions.map((action: EcoAction) => (
              <Card key={action.id} className="shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      {getActionIcon(action.actionType)}
                    </div>
                    <div className="flex-grow">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium text-gray-900">{action.description}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatDate(action.createdAt)}
                            {action.orderId && ` • Pedido #${action.orderId}`}
                          </p>
                        </div>
                        <Badge variant="secondary" className={`ml-2 ${getActionColor(action.actionType)}`}>
                          +{action.pointsEarned} pts
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="shadow-sm">
              <CardContent className="p-8 text-center">
                <Leaf className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhuma ação sustentável ainda</h3>
                <p className="text-gray-600 mb-4">
                  Comece a comprar produtos próximos ao vencimento para ganhar pontos eco!
                </p>
                <Link href="/customer">
                  <button className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium">
                    Fazer Primeira Compra Sustentável
                  </button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Rewards Guide */}
        <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
          <CardHeader>
            <CardTitle className="text-green-800 flex items-center space-x-2">
              <Trophy className="h-5 w-5" />
              <span>Como Ganhar Pontos</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center space-x-3">
              <Badge className="bg-green-100 text-green-800">+15 pts</Badge>
              <span className="text-sm">Produtos que expiram em 1 dia</span>
            </div>
            <div className="flex items-center space-x-3">
              <Badge className="bg-yellow-100 text-yellow-800">+10 pts</Badge>
              <span className="text-sm">Produtos que expiram em 3 dias</span>
            </div>
            <div className="flex items-center space-x-3">
              <Badge className="bg-blue-100 text-blue-800">+5 pts</Badge>
              <span className="text-sm">Produtos que expiram em 7 dias</span>
            </div>
            <div className="flex items-center space-x-3">
              <Badge className="bg-purple-100 text-purple-800">+20 pts</Badge>
              <span className="text-sm">Pedidos com 5+ itens (menos embalagens)</span>
            </div>
            <div className="flex items-center space-x-3">
              <Badge className="bg-pink-100 text-pink-800">+25 pts</Badge>
              <span className="text-sm">Bônus primeira compra sustentável</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}