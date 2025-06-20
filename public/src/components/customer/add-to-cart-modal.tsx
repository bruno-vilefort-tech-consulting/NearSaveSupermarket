import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Minus, ShoppingCart, MapPin } from "lucide-react";
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

interface AddToCartModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number) => void;
}

export function AddToCartModal({ product, isOpen, onClose, onAddToCart }: AddToCartModalProps) {
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const { t } = useLanguage();

  if (!product) return null;

  const formatPrice = (price: string) => {
    return `R$ ${parseFloat(price).toFixed(2).replace('.', ',')}`;
  };

  const calculateDiscount = () => {
    const original = parseFloat(product.originalPrice);
    const discount = parseFloat(product.discountPrice);
    return Math.round(((original - discount) / original) * 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'short'
    });
  };

  const handleAddToCart = () => {
    onAddToCart(product, selectedQuantity);
    setSelectedQuantity(1);
    onClose();
  };

  const incrementQuantity = () => {
    if (selectedQuantity < product.quantity) {
      setSelectedQuantity(selectedQuantity + 1);
    }
  };

  const decrementQuantity = () => {
    if (selectedQuantity > 1) {
      setSelectedQuantity(selectedQuantity - 1);
    }
  };

  const getTotalPrice = () => {
    return (parseFloat(product.discountPrice) * selectedQuantity).toFixed(2);
  };

  const getTotalSavings = () => {
    const originalTotal = parseFloat(product.originalPrice) * selectedQuantity;
    const discountTotal = parseFloat(product.discountPrice) * selectedQuantity;
    return (originalTotal - discountTotal).toFixed(2);
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

  const getTotalEcoPoints = () => {
    return calculateEcoPoints(product.expirationDate, product.category) * selectedQuantity;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-white border-eco-green-light">
        <DialogHeader>
          <DialogTitle className="text-eco-gray-dark">{t('addToCartModal.title')}</DialogTitle>
          <DialogDescription className="text-eco-gray">
            {t('addToCartModal.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Supermarket Info */}
          {product.createdBy?.supermarketName && (
            <div className="border border-eco-blue rounded-lg p-3 bg-eco-blue-light">
              <div className="flex items-start space-x-2">
                <MapPin className="text-eco-blue mt-0.5" size={16} />
                <div>
                  <h4 className="font-semibold text-eco-blue-dark">{product.createdBy.supermarketName}</h4>
                  {product.createdBy.supermarketAddress && (
                    <p className="text-sm text-eco-blue">{product.createdBy.supermarketAddress}</p>
                  )}
                </div>
              </div>
            </div>
          )}
          {/* Product Info */}
          <div className="flex space-x-4">
            <div className="w-20 h-20 rounded-lg overflow-hidden bg-eco-gray-light flex-shrink-0 relative">
              {product.imageUrl ? (
                <>
                  <img 
                    src={product.imageUrl} 
                    alt={product.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const placeholder = e.currentTarget.nextElementSibling as HTMLElement;
                      if (placeholder) placeholder.style.display = 'flex';
                    }}
                  />
                  <div className="w-full h-full flex items-center justify-center bg-eco-green-light absolute top-0 left-0 hidden">
                    <ShoppingCart className="text-eco-green" size={24} />
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-eco-green-light">
                  <ShoppingCart className="text-eco-green" size={24} />
                </div>
              )}
            </div>

            <div className="flex-1">
              <h3 className="font-semibold text-eco-gray-dark">{product.name}</h3>
              {product.description && (
                <p className="text-sm text-eco-gray mt-1">{product.description}</p>
              )}
              
              <div className="flex items-center space-x-2 mt-2">
                <span className="text-lg font-bold text-eco-green">
                  {formatPrice(product.discountPrice)}
                </span>
                <span className="text-sm text-eco-gray line-through">
                  {formatPrice(product.originalPrice)}
                </span>
                <Badge className="bg-eco-orange text-white border-eco-orange">
                  {calculateDiscount()}% OFF
                </Badge>
              </div>

              <p className="text-sm text-eco-gray mt-1">
                {t('addToCartModal.expiresOn')} {formatDate(product.expirationDate)} • {product.quantity} {t('addToCartModal.available')}
              </p>
            </div>
          </div>

          {/* Quantity Selector */}
          <div className="border border-eco-green-light rounded-lg p-4 bg-eco-green-light/30">
            <div className="flex items-center justify-between mb-3">
              <span className="font-medium text-eco-gray-dark">{t('addToCartModal.quantity')}</span>
              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={decrementQuantity}
                  disabled={selectedQuantity <= 1}
                  className="w-8 h-8 p-0 border-eco-green hover:bg-eco-green hover:text-white disabled:opacity-50"
                >
                  <Minus size={14} />
                </Button>
                <span className="w-8 text-center font-semibold text-eco-gray-dark">{selectedQuantity}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={incrementQuantity}
                  disabled={selectedQuantity >= product.quantity}
                  className="w-8 h-8 p-0 border-eco-green hover:bg-eco-green hover:text-white disabled:opacity-50"
                >
                  <Plus size={14} />
                </Button>
              </div>
            </div>

            {/* Total Summary */}
            <div className="space-y-2 pt-3 border-t border-eco-green-light">
              <div className="flex justify-between text-sm">
                <span className="text-eco-gray-dark">{t('addToCartModal.subtotalPrefix')} ({selectedQuantity}x)</span>
                <span className="font-semibold text-eco-gray-dark">{formatPrice(getTotalPrice())}</span>
              </div>
              <div className="flex justify-between text-sm text-eco-green">
                <span>{t('addToCartModal.totalSavings')}</span>
                <span>-{formatPrice(getTotalSavings())}</span>
              </div>
              <div className="flex justify-between text-sm text-eco-green-dark">
                <span>{t('addToCartModal.ecoPointsEarned')}</span>
                <span className="font-semibold">+{getTotalEcoPoints()} pts</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <Button 
              variant="outline" 
              onClick={onClose} 
              className="flex-1 border-eco-gray-light hover:border-eco-gray text-eco-gray-dark hover:text-eco-gray-dark"
            >
              {t('addToCartModal.cancel')}
            </Button>
            <Button 
              onClick={handleAddToCart}
              disabled={product.quantity === 0}
              className="flex-1 bg-eco-green hover:bg-eco-green-dark text-white font-semibold py-2 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {product.quantity === 0 ? t('addToCartModal.outOfStock') : t('addToCartModal.addToCart')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}