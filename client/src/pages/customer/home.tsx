import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, ShoppingCart, Clock, ClipboardList, Leaf } from "lucide-react";
import { AddToCartModal } from "@/components/customer/add-to-cart-modal";
import { useToast } from "@/hooks/use-toast";

const categories = ["Todos", "Padaria", "Laticínios", "Carnes e Aves", "Hortifruti", "Frios"];

export default function CustomerHome() {
  const [, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
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

  const { data: products, isLoading } = useQuery({
    queryKey: ["/api/public/products", selectedCategory === "Todos" ? undefined : selectedCategory],
  });

  const filteredProducts = products?.filter((product: any) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatPrice = (price: string) => {
    return `R$ ${parseFloat(price).toFixed(2).replace('.', ',')}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  const getDaysUntilExpiration = (expirationDate: string) => {
    const expDate = new Date(expirationDate);
    const today = new Date();
    const diffTime = expDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const addToCart = (product: any, quantity: number) => {
    const cartItems = JSON.parse(localStorage.getItem('cart') || '[]');
    const existingItemIndex = cartItems.findIndex((item: any) => item.id === product.id);
    
    if (existingItemIndex !== -1) {
      cartItems[existingItemIndex].quantity += quantity;
    } else {
      cartItems.push({ ...product, quantity });
    }
    
    localStorage.setItem('cart', JSON.stringify(cartItems));
    setCartCount(cartItems.reduce((total: number, item: any) => total + item.quantity, 0));
    
    toast({
      title: "Produto adicionado!",
      description: `${quantity}x ${product.name} adicionado ao carrinho`,
    });
  };

  const openAddToCartModal = (product: any) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Supermercado Silva</h1>
              <p className="text-sm text-gray-600">Produtos com desconto próximos ao vencimento</p>
            </div>
            <div className="flex items-center space-x-2">
              <Link href="/customer/orders">
                <Button variant="outline" size="sm">
                  <ClipboardList size={18} />
                </Button>
              </Link>

              <Link href="/customer/eco-rewards">
                <Button variant="outline" size="sm" className="text-green-600 hover:text-green-700">
                  <Leaf size={18} />
                </Button>
              </Link>
              
              <Link href="/customer/cart">
                <Button variant="outline" size="sm" className="relative">
                  <ShoppingCart size={18} />
                  {cartCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </Button>
              </Link>
              {customerInfo ? (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleLogout}
                  className="text-red-600 hover:text-red-700"
                >
                  Sair
                </Button>
              ) : (
                <Link href="/">
                  <Button variant="default" size="sm" className="bg-green-600 hover:bg-green-700">
                    Login
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <Input
              placeholder="Buscar produtos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Categories */}
          <div className="flex space-x-2 overflow-x-auto pb-2">
            {categories.map((category) => (
              <Badge
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                className={`cursor-pointer whitespace-nowrap ${
                  selectedCategory === category 
                    ? "bg-green-600 text-white hover:bg-green-700" 
                    : "hover:bg-gray-100"
                }`}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {customerInfo && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800">
              Bem-vindo, <span className="font-semibold">{customerInfo.name}</span>!
            </p>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredProducts && filteredProducts.length > 0 ? (
          <div className="space-y-4">
            {filteredProducts.map((product: any) => {
              const daysUntilExpiration = getDaysUntilExpiration(product.expirationDate);
              const discount = Math.round(((parseFloat(product.originalPrice) - parseFloat(product.discountPrice)) / parseFloat(product.originalPrice)) * 100);
              
              // Calculate eco points for this product
              const getEcoPoints = (days: number) => {
                if (days <= 1) return 15;
                if (days <= 3) return 10;
                if (days <= 7) return 5;
                return 0;
              };
              const ecoPoints = getEcoPoints(daysUntilExpiration);
              
              return (
                <Card key={product.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">{product.name}</h3>
                        {product.description && (
                          <p className="text-sm text-gray-600 mb-2">{product.description}</p>
                        )}
                        
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-lg font-bold text-green-600">
                            {formatPrice(product.discountPrice)}
                          </span>
                          <span className="text-sm text-gray-500 line-through">
                            {formatPrice(product.originalPrice)}
                          </span>
                          <Badge variant="secondary" className="bg-red-100 text-red-700">
                            -{discount}%
                          </Badge>
                          {ecoPoints > 0 && (
                            <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
                              <Leaf size={12} className="mr-1" />
                              +{ecoPoints} pts
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                          <div className="flex items-center space-x-1">
                            <Clock size={14} />
                            <span>Vence em {daysUntilExpiration} dia{daysUntilExpiration !== 1 ? 's' : ''}</span>
                          </div>
                          <span>Categoria: {product.category}</span>
                        </div>

                        {product.createdBy && (
                          <div className="text-xs text-gray-500">
                            <p><strong>Supermercado:</strong> {product.createdBy.supermarketName || 'Supermercado Local'}</p>
                            {product.createdBy.supermarketAddress && (
                              <p><strong>Endereço:</strong> {product.createdBy.supermarketAddress}</p>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {product.imageUrl && (
                        <div className="ml-4">
                          <img 
                            src={product.imageUrl} 
                            alt={product.name}
                            className="w-16 h-16 object-cover rounded"
                          />
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">
                        Disponível: {product.quantity} unidades
                      </span>
                      <Button 
                        size="sm"
                        onClick={() => openAddToCartModal(product)}
                        className="bg-green-600 hover:bg-green-700 text-white"
                        disabled={product.quantity === 0}
                      >
                        <ShoppingCart size={14} className="mr-1" />
                        Adicionar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-gray-500">Nenhum produto encontrado</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Add to Cart Modal */}
      <AddToCartModal
        product={selectedProduct}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddToCart={addToCart}
      />
    </div>
  );
}