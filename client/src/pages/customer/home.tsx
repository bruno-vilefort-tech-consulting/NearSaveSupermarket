import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, ShoppingCart, Store, MapPin, Package, ArrowRight, Leaf, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Supermarket {
  id: number;
  name: string;
  address: string;
  productCount: number;
}

export default function CustomerHome() {
  const [, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [cartCount, setCartCount] = useState(0);
  const { toast } = useToast();
  const [customerInfo, setCustomerInfo] = useState<any>(null);

  // Carregar contador do carrinho e informações do cliente ao inicializar
  useEffect(() => {
    const cartItems = JSON.parse(localStorage.getItem('cart') || '[]');
    const totalItems = cartItems.reduce((total: number, item: any) => total + item.quantity, 0);
    setCartCount(totalItems);

    const savedCustomer = localStorage.getItem('customerInfo');
    if (savedCustomer) {
      setCustomerInfo(JSON.parse(savedCustomer));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('customerInfo');
    localStorage.removeItem('cart');
    setCustomerInfo(null);
    toast({
      title: "Logout realizado",
      description: "Você foi desconectado com sucesso",
    });
    navigate("/");
  };

  const { data: supermarkets, isLoading } = useQuery({
    queryKey: ["/api/customer/supermarkets"],
  });

  const filteredSupermarkets = supermarkets?.filter((supermarket: Supermarket) =>
    supermarket.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleSupermarketClick = (supermarketId: number, supermarketName: string) => {
    navigate(`/customer/supermarket/${supermarketId}?name=${encodeURIComponent(supermarketName)}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando supermercados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                <Leaf className="text-white" size={20} />
              </div>
              <h1 className="text-xl font-bold text-gray-900">EcoMart</h1>
            </div>

            <div className="flex items-center space-x-4">
              <div className="hidden md:block">
                <p className="text-sm text-gray-600">
                  Olá, <span className="font-medium">{customerInfo?.fullName}</span>
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/customer/eco-points")}
                className="mr-2 bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
              >
                <Leaf size={16} className="mr-1" />
                {customerInfo?.ecoPoints || 0} pts
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/customer/orders")}
                className="mr-2"
              >
                <Package size={16} className="mr-1" />
                Pedidos
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/customer/cart")}
                className="relative"
              >
                <ShoppingCart size={16} className="mr-2" />
                Carrinho
                {cartCount > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                    {cartCount}
                  </Badge>
                )}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-gray-600 hover:text-gray-900"
              >
                <LogOut size={16} className="mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Eco Points Highlight */}
        <Card className="mb-8 bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="bg-green-100 p-3 rounded-full">
                  <Leaf size={24} className="text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Programa Pontos Eco
                  </h3>
                  <p className="text-sm text-gray-600">
                    Você tem <span className="font-bold text-green-600">{customerInfo?.ecoPoints || 0} pontos</span> por suas compras sustentáveis
                  </p>
                </div>
              </div>
              <Button
                onClick={() => navigate("/customer/eco-points")}
                className="bg-green-600 hover:bg-green-700"
              >
                Saiba mais
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Supermercados com ofertas
          </h2>
          <p className="text-gray-600">
            Encontre os melhores produtos com desconto perto de você
          </p>
        </div>

        {/* Search */}
        <div className="mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar supermercados..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Supermarkets Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSupermarkets.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Store size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum supermercado encontrado
              </h3>
              <p className="text-gray-600">
                {searchTerm ? "Tente outro termo de busca" : "Não há supermercados com ofertas no momento"}
              </p>
            </div>
          ) : (
            filteredSupermarkets.map((supermarket: Supermarket) => (
              <Card
                key={supermarket.id}
                className="hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-green-600"
                onClick={() => handleSupermarketClick(supermarket.id, supermarket.name)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                        <Store className="text-green-600" size={24} />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-semibold text-gray-900">
                          {supermarket.name}
                        </CardTitle>
                        <div className="flex items-center text-sm text-gray-600 mt-1">
                          <MapPin size={14} className="mr-1" />
                          {supermarket.address}
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="text-gray-400" size={20} />
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Package className="text-green-600" size={16} />
                      <span className="text-sm font-medium text-gray-700">
                        {supermarket.productCount} produtos em oferta
                      </span>
                    </div>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      Disponível
                    </Badge>
                  </div>

                  <div className="mt-4">
                    <Button
                      className="w-full bg-green-600 hover:bg-green-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSupermarketClick(supermarket.id, supermarket.name);
                      }}
                    >
                      Ver produtos
                      <ArrowRight size={16} className="ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Eco Points Info */}
        <div className="mt-12 bg-green-50 rounded-lg p-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
              <Leaf className="text-white" size={20} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Pontos Eco: {customerInfo?.ecoPoints || 0}
              </h3>
              <p className="text-sm text-gray-600">
                Ganhe pontos comprando produtos próximos ao vencimento e ajude o meio ambiente!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}