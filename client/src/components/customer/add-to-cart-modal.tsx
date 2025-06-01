import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Minus, ShoppingCart, MapPin } from "lucide-react";

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar ao Carrinho</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Supermarket Info */}
          {product.createdBy?.supermarketName && (
            <div className="border border-blue-200 rounded-lg p-3 bg-blue-50">
              <div className="flex items-start space-x-2">
                <MapPin className="text-blue-600 mt-0.5" size={16} />
                <div>
                  <h4 className="font-semibold text-blue-900">{product.createdBy.supermarketName}</h4>
                  {product.createdBy.supermarketAddress && (
                    <p className="text-sm text-blue-700">{product.createdBy.supermarketAddress}</p>
                  )}
                </div>
              </div>
            </div>
          )}
          {/* Product Info */}
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
                  {calculateDiscount()}% OFF
                </Badge>
              </div>

              <p className="text-sm text-gray-600 mt-1">
                Vence em {formatDate(product.expirationDate)} • {product.quantity} disponíveis
              </p>
            </div>
          </div>

          {/* Quantity Selector */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="font-medium text-gray-900">Quantidade</span>
              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={decrementQuantity}
                  disabled={selectedQuantity <= 1}
                  className="w-8 h-8 p-0"
                >
                  <Minus size={14} />
                </Button>
                <span className="w-8 text-center font-semibold">{selectedQuantity}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={incrementQuantity}
                  disabled={selectedQuantity >= product.quantity}
                  className="w-8 h-8 p-0"
                >
                  <Plus size={14} />
                </Button>
              </div>
            </div>

            {/* Total Summary */}
            <div className="space-y-2 pt-3 border-t border-gray-100">
              <div className="flex justify-between text-sm">
                <span>Subtotal ({selectedQuantity}x)</span>
                <span className="font-semibold">{formatPrice(getTotalPrice())}</span>
              </div>
              <div className="flex justify-between text-sm text-green-600">
                <span>Economia total</span>
                <span>-{formatPrice(getTotalSavings())}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button 
              onClick={handleAddToCart}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              Adicionar ao Carrinho
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}