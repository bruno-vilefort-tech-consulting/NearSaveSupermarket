import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, ShoppingCart, ArrowLeft, Package, MapPin, Clock, Leaf } from "lucide-react";
import { AddToCartModal } from "@/components/customer/add-to-cart-modal";
import { useToast } from "@/hooks/use-toast";
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
  const { toast } = useToast();
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

  const filteredProducts = products?.filter((product: Product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "Todos" || product.category === selectedCategory;
    const hasStock = product.quantity > 0; // Ocultar produtos sem estoque
    return matchesSearch && matchesCategory && hasStock;
  }) || [];

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
    const existingItem = cartItems.find((item: any) => item.id === product.id);

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cartItems.push({ ...product, quantity });
    }

    localStorage.setItem('cart', JSON.stringify(cartItems));
    const totalItems = cartItems.reduce((total: number, item: any) => total + item.quantity, 0);
    setCartCount(totalItems);

    const ecoPoints = calculateEcoPoints(product.expirationDate, product.category) * quantity;
    
    toast({
      title: t('customer.productAdded'),
      description: `${product.name} foi adicionado ao carrinho. Você ganhará ${ecoPoints} pontos eco!`,
    });
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">{t('products.loading')}</p>
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
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/customer")}
                className="text-gray-600 hover:text-gray-900 flex-shrink-0"
              >
                <ArrowLeft size={16} className="mr-1" />
                {t('common.back')}
              </Button>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg font-semibold text-gray-900 truncate">{supermarketName}</h1>
                <p className="text-xs text-gray-500">{t('customer.productsOnSale')}</p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/customer/cart")}
              className="relative flex-shrink-0 ml-3"
            >
              <ShoppingCart size={16} className="mr-1" />
              <span className="hidden sm:inline">{t('customer.cart')}</span>
              {cartCount > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
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
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder={t('products.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
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
                className={selectedCategory === category ? "bg-green-600 hover:bg-green-700" : ""}
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
              <Package size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {t('products.noProductsFound')}
              </h3>
              <p className="text-gray-600">
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
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => handleProductClick(product)}
                >
                  <CardHeader className="pb-3">
                    {product.imageUrl && (
                      <div className="w-full h-32 bg-gray-100 rounded-lg mb-3 overflow-hidden">
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <Badge variant="secondary" className="text-xs">
                          {product.category}
                        </Badge>
                        <div className="flex gap-1">
                          <Badge 
                            variant={daysUntilExpiry <= 2 ? "destructive" : daysUntilExpiry <= 5 ? "default" : "secondary"}
                            className="text-xs"
                          >
                            <Clock size={12} className="mr-1" />
                            {daysUntilExpiry}d
                          </Badge>
                          <Badge className="bg-green-100 text-green-800 text-xs">
                            <Leaf size={12} className="mr-1" />
                            +{ecoPoints} pts
                          </Badge>
                        </div>
                      </div>
                      <CardTitle className="text-lg font-semibold text-gray-900 line-clamp-2">
                        {product.name}
                      </CardTitle>
                      {product.description && (
                        <p className="text-sm text-gray-600 line-clamp-2">
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
                            <span className="text-lg font-bold text-green-600">
                              {formatPrice(product.discountPrice)}
                            </span>
                            <Badge variant="destructive" className="text-xs">
                              -{discountPercentage}%
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-500 line-through">
                            {formatPrice(product.originalPrice)}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">{t('products.stock')}</p>
                          <p className="font-semibold">{product.quantity}</p>
                        </div>
                      </div>

                      <Button
                        className="w-full bg-green-600 hover:bg-green-700"
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
      <AddToCartModal
        product={selectedProduct}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddToCart={addToCart}
      />
    </div>
  );
}