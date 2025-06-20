import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Minus, Plus, ShoppingCart, Clock, Leaf } from "lucide-react";

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

export function AddToCartModalPT({ product, isOpen, onClose, onAddToCart }: AddToCartModalProps) {
  const [quantity, setQuantity] = useState(1);

  if (!product) return null;

  const handleAddToCart = () => {
    console.log('🚀 AddToCart clicked - adding product to cart');
    onAddToCart(product, quantity);
    setQuantity(1);
    onClose();
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
          <DialogTitle className="text-gray-800">{product.name}</DialogTitle>
          <DialogDescription className="text-gray-600">
            {product.description || "Produto com desconto especial"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Product Image */}
          {product.imageUrl && (
            <div className="w-full h-32 bg-gray-100 rounded-lg overflow-hidden">
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Price Information */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-bold text-eco-green">
                R$ {parseFloat(product.discountPrice).toFixed(2).replace('.', ',')}
              </span>
              <span className="text-lg text-eco-gray line-through">
                R$ {parseFloat(product.originalPrice).toFixed(2).replace('.', ',')}
              </span>
            </div>
            <Badge className="bg-eco-orange text-white">
              {discountPercentage}% OFF
            </Badge>
          </div>

          {/* Expiration and Eco Info */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Clock size={16} />
              <span>
                {daysUntilExpiration > 0
                  ? `Expira em ${daysUntilExpiration} ${daysUntilExpiration === 1 ? 'dia' : 'dias'}`
                  : 'Expira hoje'
                }
              </span>
            </div>
            
            <div className="flex items-center space-x-2 text-sm text-eco-green">
              <Leaf size={16} />
              <span>Salve o meio ambiente!</span>
            </div>
          </div>

          {/* Supermarket Info */}
          {product.createdBy?.supermarketName && (
            <div className="text-sm text-gray-600">
              <strong>Supermercado:</strong> {product.createdBy.supermarketName}
            </div>
          )}

          {/* Quantity Selector */}
          <div className="flex items-center justify-between">
            <span className="font-medium">Quantidade:</span>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
              >
                <Minus size={16} />
              </Button>
              <span className="w-12 text-center font-semibold">{quantity}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQuantity(Math.min(product.quantity, quantity + 1))}
                disabled={quantity >= product.quantity}
              >
                <Plus size={16} />
              </Button>
            </div>
          </div>

          {/* Availability */}
          <div className="text-sm text-gray-600">
            <span>{product.quantity} unidades disponíveis</span>
          </div>

          {/* Total */}
          <div className="border-t pt-3">
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-800">Total:</span>
              <span className="text-xl font-bold text-green-600">
                R$ {(parseFloat(product.discountPrice) * quantity).toFixed(2).replace('.', ',')}
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
            Cancelar
          </Button>
          <Button
            onClick={handleAddToCart}
            className="w-full sm:w-auto bg-eco-green hover:bg-eco-green-dark text-white"
          >
            <ShoppingCart size={16} className="mr-2" />
            Adicionar ao Carrinho
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}