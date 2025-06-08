import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Minus, Plus, ShoppingCart, Clock, Leaf } from "lucide-react";
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
  const [quantity, setQuantity] = useState(1);
  const { t } = useLanguage();

  if (!product) return null;

  const handleAddToCart = () => {
    console.log('🚀 AddToCart clicked - redirecting to Portuguese cart');
    console.log('🔍 Current location before redirect:', window.location.href);
    onAddToCart(product, quantity);
    setQuantity(1);
    onClose();
    
    // Force redirect to Portuguese cart page
    setTimeout(() => {
      console.log('🎯 Forcing redirect to /customer/cart');
      window.location.href = '/customer/cart?v=' + Date.now();
    }, 100);
  };

  const getDaysUntilExpiration = (expirationDate: string) => {
    const expDate = new Date(expirationDate);
    const today = new Date();
    const diffTime = expDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysUntilExpiration = getDaysUntilExpiration(product.expirationDate);
  const discountPercentage = Math.round(((parseFloat(product.originalPrice) - parseFloat(product.discountPrice)) / parseFloat(product.originalPrice)) * 100);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-eco-gray-dark">{product.name}</DialogTitle>
          <DialogDescription className="text-eco-gray">
            {product.description || "Produto com desconto especial"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Imagem do produto */}
          {product.imageUrl && (
            <div className="w-full h-48 bg-eco-gray-light rounded-lg overflow-hidden">
              <img 
                src={product.imageUrl} 
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Informações de preço */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-eco-gray line-through">
                {t('common.currency')} {parseFloat(product.originalPrice).toFixed(2)}
              </span>
              <Badge className="bg-eco-orange text-white">
                -{discountPercentage}%
              </Badge>
            </div>
            <div className="text-2xl font-bold text-eco-green">
              {t('common.currency')} {parseFloat(product.discountPrice).toFixed(2)}
            </div>
          </div>

          {/* Informações de validade */}
          <div className="flex items-center space-x-2 p-3 bg-eco-orange-light rounded-lg">
            <Clock size={16} className="text-eco-orange" />
            <span className="text-sm text-eco-orange-dark">
              {daysUntilExpiration > 0 
                ? `${t('products.expiresIn')} ${daysUntilExpiration} ${daysUntilExpiration === 1 ? t('common.day') : t('common.days')}`
                : t('products.expiresToday')
              }
            </span>
          </div>

          {/* Informações eco */}
          <div className="flex items-center space-x-2 p-3 bg-eco-green-light rounded-lg">
            <Leaf size={16} className="text-eco-green" />
            <span className="text-sm text-eco-green-dark">
              {t('products.saveEnvironment')}
            </span>
          </div>

          {/* Seletor de quantidade */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-eco-gray-dark">
              {t('products.quantity')}
            </label>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
                className="h-8 w-8"
              >
                <Minus size={14} />
              </Button>
              <span className="text-lg font-semibold w-12 text-center">{quantity}</span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantity(Math.min(product.quantity, quantity + 1))}
                disabled={quantity >= product.quantity}
                className="h-8 w-8"
              >
                <Plus size={14} />
              </Button>
            </div>
            <p className="text-xs text-eco-gray">
              {t('products.available')}: {product.quantity} {t('products.units')}
            </p>
          </div>

          {/* Total */}
          <div className="border-t pt-3">
            <div className="flex justify-between items-center">
              <span className="font-medium text-eco-gray-dark">{t('products.total')}:</span>
              <span className="text-xl font-bold text-eco-green">
                {t('common.currency')} {(parseFloat(product.discountPrice) * quantity).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full sm:w-auto"
          >
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleAddToCart}
            className="w-full sm:w-auto bg-eco-green hover:bg-eco-green-dark text-white"
          >
            <ShoppingCart size={16} className="mr-2" />
            {t('products.addToCart')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}