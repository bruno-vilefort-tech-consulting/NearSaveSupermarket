import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, MapPin, Package } from "lucide-react";

// Simulação de pedidos anteriores
const mockOrders = [
  {
    id: 1,
    items: [
      { name: "Pão Francês", quantity: 2, price: "5.00" }
    ],
    total: "10.00",
    status: "Pronto para Retirada",
    deliveryType: "pickup",
    createdAt: "2025-06-01T10:30:00Z",
    estimatedTime: "15:00"
  }
];

export default function CustomerOrders() {
  const formatPrice = (price: string) => {
    return `R$ ${parseFloat(price).toFixed(2).replace('.', ',')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pendente':
        return 'bg-yellow-100 text-yellow-800';
      case 'preparando':
        return 'bg-blue-100 text-blue-800';
      case 'pronto para retirada':
        return 'bg-green-100 text-green-800';
      case 'entregue':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm p-4">
        <div className="flex items-center space-x-3">
          <Link href="/customer">
            <Button variant="ghost" size="sm">
              <ArrowLeft size={20} />
            </Button>
          </Link>
          <h1 className="text-xl font-bold text-gray-900">Meus Pedidos</h1>
        </div>
      </div>

      <div className="p-4">
        {mockOrders.length > 0 ? (
          <div className="space-y-4">
            {mockOrders.map((order) => (
              <Card key={order.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-gray-900">Pedido #{order.id}</h3>
                      <p className="text-sm text-gray-600">{formatDate(order.createdAt)}</p>
                    </div>
                    <Badge className={getStatusColor(order.status)}>
                      {order.status}
                    </Badge>
                  </div>

                  <div className="space-y-2 mb-4">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>{item.quantity}x {item.name}</span>
                        <span>{formatPrice(item.price)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      {order.deliveryType === "pickup" ? (
                        <span className="flex items-center">
                          <MapPin size={14} className="mr-1" />
                          Retirada no Local
                        </span>
                      ) : (
                        <span className="flex items-center">
                          <Package size={14} className="mr-1" />
                          Delivery
                        </span>
                      )}
                      {order.estimatedTime && (
                        <span className="flex items-center">
                          <Clock size={14} className="mr-1" />
                          {order.estimatedTime}
                        </span>
                      )}
                    </div>
                    <span className="font-semibold text-gray-900">
                      Total: {formatPrice(order.total)}
                    </span>
                  </div>

                  {order.status === "Pronto para Retirada" && (
                    <div className="mt-4 p-3 bg-green-50 rounded-lg">
                      <p className="text-sm text-green-800">
                        Seu pedido está pronto! Você pode retirar no supermercado até {order.estimatedTime}.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-gray-500 mb-4">Você ainda não fez nenhum pedido</p>
              <Link href="/customer">
                <Button>Começar a Comprar</Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}