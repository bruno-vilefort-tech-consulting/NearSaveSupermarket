import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, ShoppingCart, Clock } from "lucide-react";
import { AddToCartModal } from "@/components/customer/add-to-cart-modal";
import { useToast } from "@/hooks/use-toast";

const categories = ["Todos", "Padaria", "Laticínios", "Carnes e Aves", "Hortifruti", "Frios"];

export default function CustomerHome() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const { toast } = useToast();

  const [customerInfo, setCustomerInfo] = useState(null);

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
    setCustomerInfo(null);
    toast({
      title: "Logout realizado",
      description: "Você foi desconectado com sucesso",
    });
  };

  const { data: products, isLoading } = useQuery({
    queryKey: ["/api/products", selectedCategory === "Todos" ? undefined : selectedCategory],
  });

  const filteredProducts = products?.filter((product: any) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatPrice = (price: string) => {
    return `R$ ${parseFloat(price).toFixed(2).replace('.', ',')}`;
  };

  const calculateDiscount = (original: string, discount: string) => {
    const originalPrice = parseFloat(original);
    const discountPrice = parseFloat(discount);
    return Math.round(((originalPrice - discountPrice) / originalPrice) * 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'short'
    });
  };

  const handleAddToCart = (product: any, quantity: number) => {
    const cartItems = JSON.parse(localStorage.getItem('cart') || '[]');
    const existingItem = cartItems.find((item: any) => item.id === product.id);
    
    if (existingItem) {
      existingItem.quantity += quantity;
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
              <h1 className="text-xl font-bold text-gray-900">FreshSaver</h1>
              <p className="text-sm text-gray-600">Produtos com desconto próximos ao vencimento</p>
            </div>
            <div className="flex items-center space-x-2">
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
                <Link href="/customer/login">
                  <Button variant="default" size="sm" className="bg-green-600 hover:bg-green-700">
                    Login
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
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
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className="whitespace-nowrap"
              >
                {category}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Products */}
      <main className="p-4">
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Carregando produtos...</p>
            </div>
          ) : filteredProducts && filteredProducts.length > 0 ? (
            filteredProducts.map((product: any) => (
              <Card key={product.id} className="shadow-sm">
                <CardContent className="p-4">
                  <div className="flex space-x-4">
                    <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                      {product.imageUrl ? (
                        <img 
                          src={product.imageUrl} 
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingCart className="text-gray-400" size={24} />
                        </div>
                      )}
                    </div>

                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{product.name}</h3>
                      <p className="text-sm text-blue-600 font-medium">{product.createdBy?.supermarketName || 'Supermercado'}</p>
                      {product.description && (
                        <p className="text-sm text-gray-600 mt-1">{product.description}</p>
                      )}
                      
                      <div className="flex items-center space-x-2 mt-2">
                        <span className="text-lg font-bold text-green-600">
                          {formatPrice(product.discountPrice)}
                        </span>
                        <span className="text-sm text-gray-500 line-through">
                          {formatPrice(product.originalPrice)}
                        </span>
                        <Badge className="bg-red-100 text-red-800">
                          {calculateDiscount(product.originalPrice, product.discountPrice)}% OFF
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center space-x-3 text-sm text-gray-600">
                          <span className="flex items-center">
                            <Clock size={14} className="mr-1" />
                            Vence: {formatDate(product.expirationDate)}
                          </span>
                          <span>Qtd: {product.quantity}</span>
                        </div>
                        
                        <Button 
                          size="sm" 
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => openAddToCartModal(product)}
                        >
                          Adicionar
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="shadow-sm">
              <CardContent className="p-8 text-center">
                <p className="text-gray-500">Nenhum produto encontrado</p>
                <p className="text-sm text-gray-400 mt-1">
                  Tente ajustar sua busca ou filtros
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {/* Add to Cart Modal */}
      <AddToCartModal
        product={selectedProduct}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddToCart={handleAddToCart}
      />
    </div>
  );
}