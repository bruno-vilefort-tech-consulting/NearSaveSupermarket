import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, ShoppingCart, ArrowLeft, Package, MapPin, Clock, Leaf, AlertTriangle } from "lucide-react";
import { AddToCartModalPT } from "@/components/add-to-cart-modal-pt";
import { useLanguage } from "@/hooks/useLanguage";

interface Product {
  id: number;
  name: string;
  description?: string;
  originalPrice: string;
  discountPrice: string;
  quantity: number;
  expirationDate: string;
  imageUrl?: string;
  category: string;
  createdBy?: {
    supermarketName?: string;
    supermarketAddress?: string;
  };
}

const getCategoryName = (category: string, t: any) => {
  const categoryMap: Record<string, string> = {
    "Todos": t('products.all'),
    "Padaria": t('category.bakery'),
    "Laticínios": t('category.dairy'),
    "Carnes e Aves": t('category.meat'),
    "Hortifruti": t('category.produce'),
    "Frios": t('category.deli')
  };
  return categoryMap[category] || category;
};

const categories = ["Todos", "Padaria", "Laticínios", "Carnes e Aves", "Hortifruti", "Frios"];

export default function SupermarketProducts() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [showSupermarketConflict, setShowSupermarketConflict] = useState(false);
  const [pendingCartItem, setPendingCartItem] = useState<{ product: Product; quantity: number } | null>(null);
  const { t } = useLanguage();

  // Get supermarket name from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const supermarketName = urlParams.get('name') || 'Supermercado';

  // Carregar contador do carrinho ao inicializar
  useEffect(() => {
    const cartItems = JSON.parse(localStorage.getItem('cart') || '[]');
    const totalItems = cartItems.reduce((total: number, item: any) => total + item.quantity, 0);
    setCartCount(totalItems);
  }, []);

  const { data: products, isLoading } = useQuery({
    queryKey: [`/api/customer/supermarket/${id}/products`],
  });

  const filteredProducts = (products || []).filter((product: Product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "Todos" || product.category === selectedCategory;
    const hasStock = product.quantity > 0; // Ocultar produtos sem estoque
    return matchesSearch && matchesCategory && hasStock;
  });

  const formatPrice = (price: string) => {
    return `R$ ${parseFloat(price).toFixed(2).replace('.', ',')}`;
  };

  const calculateEcoPoints = (expirationDate: string, category: string) => {
    const now = new Date();
    const expiry = new Date(expirationDate);
    const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    let basePoints = 10;
    
    if (daysUntilExpiry <= 0) {
      basePoints = 100; // Vence hoje
    } else if (daysUntilExpiry === 1) {
      basePoints = 80; // Vence amanhã
    } else if (daysUntilExpiry <= 3) {
      basePoints = 60; // 2-3 dias
    } else if (daysUntilExpiry <= 7) {
      basePoints = 40; // 4-7 dias
    } else if (daysUntilExpiry <= 14) {
      basePoints = 25; // 8-14 dias
    } else if (daysUntilExpiry <= 30) {
      basePoints = 15; // 15-30 dias
    }
    
    // Multiplicadores por categoria
    const categoryMultipliers: Record<string, number> = {
      "Laticínios": 1.2,
      "Carnes e Aves": 1.3,
      "Hortifruti": 1.1,
      "Padaria": 1.15,
      "Frios": 1.2
    };
    
    const multiplier = categoryMultipliers[category] || 1.0;
    return Math.round(basePoints * multiplier);
  };

  const addToCart = (product: Product, quantity: number) => {
    const cartItems = JSON.parse(localStorage.getItem('cart') || '[]');
    const cartSupermarketId = localStorage.getItem('cartSupermarketId');
    const currentSupermarketId = id;

    // Verificar se o carrinho já tem itens de outro supermercado
    if (cartItems.length > 0 && cartSupermarketId && cartSupermarketId !== currentSupermarketId) {
      // Armazenar o item pendente e mostrar diálogo de confirmação
      setPendingCartItem({ product, quantity });
      setShowSupermarketConflict(true);
      return;
    }

    // Adicionar item ao carrinho normalmente
    const existingItem = cartItems.find((item: any) => item.id === product.id);

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      // Adicionar informações do supermercado ao produto
      const productWithSupermarket = {
        ...product,
        supermarketId: currentSupermarketId,
        supermarketName: supermarketName
      };
      cartItems.push({ ...productWithSupermarket, quantity });
    }

    localStorage.setItem('cart', JSON.stringify(cartItems));
    localStorage.setItem('cartSupermarketId', currentSupermarketId || '');
    
    const totalItems = cartItems.reduce((total: number, item: any) => total + item.quantity, 0);
    setCartCount(totalItems);
  };

  const handleClearCartAndAdd = () => {
    if (!pendingCartItem) return;

    // Limpar carrinho atual
    localStorage.removeItem('cart');
    localStorage.removeItem('cartSupermarketId');

    // Adicionar novo item
    const productWithSupermarket = {
      ...pendingCartItem.product,
      supermarketId: id,
      supermarketName: supermarketName
    };

    const newCartItems = [{ ...productWithSupermarket, quantity: pendingCartItem.quantity }];
    
    localStorage.setItem('cart', JSON.stringify(newCartItems));
    localStorage.setItem('cartSupermarketId', id || '');
    
    setCartCount(pendingCartItem.quantity);
    
    // Limpar estados
    setPendingCartItem(null);
    setShowSupermarketConflict(false);
  };

  const handleKeepCurrentCart = () => {
    setPendingCartItem(null);
    setShowSupermarketConflict(false);
  };

  const handleProductClick = (product: Product) => {
    const daysUntilExpiry = Math.ceil((new Date(product.expirationDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

    const productForModal = {
      ...product,
      createdBy: {
        supermarketName: supermarketName,
        supermarketAddress: product.createdBy?.supermarketAddress || "Endereço não informado"
      }
    };

    setSelectedProduct(productForModal);
    setIsModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-eco-gray-light flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-eco-green border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-eco-gray">{t('products.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-eco-gray-light">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-eco-green-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/customer")}
                className="text-eco-green hover:text-eco-green-dark hover:bg-eco-green-light flex-shrink-0"
              >
                <ArrowLeft size={16} className="mr-1" />
                {t('common.back')}
              </Button>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg font-bold text-eco-gray-dark truncate">{supermarketName}</h1>
                <p className="text-xs text-eco-gray">{t('customer.productsOnSale')}</p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                console.log('🛒 Navegando para carrinho...');
                window.location.href = '/customer/cart';
              }}
              className="relative flex-shrink-0 ml-3 border-eco-orange text-eco-orange hover:bg-eco-orange hover:text-white"
            >
              <ShoppingCart size={16} className="mr-1" />
              <span className="hidden sm:inline">{t('customer.cart')}</span>
              {cartCount > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-eco-orange text-white">
                  {cartCount}
                </Badge>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-eco-gray" />
            <Input
              placeholder={t('products.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-eco-gray-light focus:border-eco-green focus:ring-eco-green"
            />
          </div>

          {/* Category Filter */}
          <div className="flex gap-2 overflow-x-auto">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className={selectedCategory === category ? "bg-eco-green hover:bg-eco-green-dark text-white" : "border-eco-green text-eco-green hover:bg-eco-green-light"}
              >
                {getCategoryName(category, t)}
              </Button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Package size={48} className="mx-auto text-eco-gray mb-4" />
              <h3 className="text-lg font-medium text-eco-gray-dark mb-2">
                {t('products.noProductsFound')}
              </h3>
              <p className="text-eco-gray">
                {searchTerm || selectedCategory !== "Todos" 
                  ? t('products.adjustFilters')
                  : t('products.noProductsAvailable')}
              </p>
            </div>
          ) : (
            filteredProducts.map((product: Product) => {
              const daysUntilExpiry = Math.ceil((new Date(product.expirationDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
              const discountPercentage = Math.round(((parseFloat(product.originalPrice) - parseFloat(product.discountPrice)) / parseFloat(product.originalPrice)) * 100);
              const ecoPoints = calculateEcoPoints(product.expirationDate, product.category);

              return (
                <Card
                  key={product.id}
                  className="hover:shadow-lg transition-shadow cursor-pointer bg-white border-eco-green-light"
                  onClick={() => handleProductClick(product)}
                >
                  <CardHeader className="pb-3">
                    <div className="w-full h-32 bg-eco-gray-light rounded-lg mb-3 overflow-hidden">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // Hide broken image and show placeholder
                            e.currentTarget.style.display = 'none';
                            const placeholder = e.currentTarget.nextElementSibling as HTMLElement;
                            if (placeholder) placeholder.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div 
                        className={`w-full h-full flex items-center justify-center bg-eco-green-light ${product.imageUrl ? 'hidden' : 'flex'}`}
                        style={{ display: product.imageUrl ? 'none' : 'flex' }}
                      >
                        <Package className="text-eco-green" size={32} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <Badge variant="secondary" className="text-xs bg-eco-blue-light text-eco-blue-dark border-eco-blue">
                          {product.category}
                        </Badge>
                        <div className="flex gap-1">
                          <Badge 
                            variant={daysUntilExpiry <= 2 ? "destructive" : daysUntilExpiry <= 5 ? "default" : "secondary"}
                            className={`text-xs ${
                              daysUntilExpiry <= 2 ? "bg-red-500 text-white" : 
                              daysUntilExpiry <= 5 ? "bg-eco-orange text-white" : 
                              "bg-eco-gray-light text-eco-gray-dark"
                            }`}
                          >
                            <Clock size={12} className="mr-1" />
                            {daysUntilExpiry}d
                          </Badge>
                          <Badge className="bg-eco-green-light text-eco-green-dark border-eco-green text-xs">
                            <Leaf size={12} className="mr-1" />
                            +{ecoPoints} pts
                          </Badge>
                        </div>
                      </div>
                      <CardTitle className="text-lg font-semibold text-eco-gray-dark line-clamp-2">
                        {product.name}
                      </CardTitle>
                      {product.description && (
                        <p className="text-sm text-eco-gray line-clamp-2">
                          {product.description}
                        </p>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-lg font-bold text-eco-green">
                              {formatPrice(product.discountPrice)}
                            </span>
                            <Badge variant="destructive" className="text-xs bg-eco-orange text-white border-eco-orange">
                              -{discountPercentage}%
                            </Badge>
                          </div>
                          <div className="text-sm text-eco-gray line-through">
                            {formatPrice(product.originalPrice)}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-eco-gray">{t('products.stock')}</p>
                          <p className="font-semibold text-eco-gray-dark">{product.quantity}</p>
                        </div>
                      </div>

                      <Button
                        className="w-full bg-eco-green hover:bg-eco-green-dark text-white font-semibold py-2 rounded-xl transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleProductClick(product);
                        }}
                      >
                        <ShoppingCart size={16} className="mr-2" />
                        {t('customer.addToCart')}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>

      {/* Add to Cart Modal */}
      <AddToCartModalPT
        product={selectedProduct}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddToCart={addToCart}
      />

      {/* Supermarket Conflict Dialog */}
      <Dialog open={showSupermarketConflict} onOpenChange={setShowSupermarketConflict}>
        <DialogContent className="max-w-xs w-80 rounded-2xl shadow-2xl border-0 p-4">
          <DialogHeader className="text-center pb-1">
            <div className="mx-auto w-12 h-12 bg-eco-orange-light rounded-full flex items-center justify-center mb-3">
              <AlertTriangle className="h-6 w-6 text-eco-orange" />
            </div>
            <DialogTitle className="text-base font-semibold text-eco-gray-dark mb-1">
              Carrinho de outro supermercado
            </DialogTitle>
            <DialogDescription className="text-xs text-eco-gray leading-relaxed px-2">
              Você só pode comprar de um supermercado por vez.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 pt-1">
            <div className="bg-eco-orange-light p-3 rounded-lg border border-eco-orange">
              <p className="text-xs text-eco-orange-dark text-center">
                Para adicionar de <span className="font-semibold text-eco-gray-dark">{supermarketName}</span>, limpe o carrinho atual.
              </p>
            </div>
            
            <div className="flex flex-col space-y-2">
              <Button 
                onClick={handleClearCartAndAdd}
                className="w-full bg-eco-orange hover:bg-eco-orange-dark text-white py-2 rounded-lg text-sm font-medium shadow-lg transition-colors"
              >
                Limpar e adicionar
              </Button>
              <Button 
                variant="outline" 
                onClick={handleKeepCurrentCart}
                className="w-full py-2 rounded-lg border-2 border-eco-gray-light hover:border-eco-gray text-eco-gray-dark text-sm font-medium"
              >
                Manter carrinho
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}