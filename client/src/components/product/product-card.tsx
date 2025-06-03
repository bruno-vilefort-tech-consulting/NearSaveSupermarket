import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from "@/components/ui/alert-dialog";
import { Calendar, Package, MoreVertical, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";

interface ProductCardProps {
  product: {
    id: number;
    name: string;
    description?: string;
    category: string;
    originalPrice: string;
    discountPrice: string;
    quantity: number;
    expirationDate: string;
    imageUrl?: string;
  };
}

export function ProductCard({ product }: ProductCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const deleteProductMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/products/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Produto excluído com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      setShowDeleteDialog(false);
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Não autorizado",
          description: "Você foi desconectado. Fazendo login novamente...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Erro",
        description: "Falha ao excluir produto. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const calculateDiscountPercentage = () => {
    const original = parseFloat(product.originalPrice);
    const discount = parseFloat(product.discountPrice);
    if (original > 0) {
      return Math.round(((original - discount) / original) * 100);
    }
    return 0;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      month: 'short',
      day: 'numeric'
    });
  };

  const handleDelete = () => {
    deleteProductMutation.mutate(product.id);
  };

  return (
    <>
      <Card className="shadow-sm overflow-hidden">
        <CardContent className="p-4">
          <div className="flex space-x-4">
            {/* Product Image */}
            <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
              {product.imageUrl ? (
                <img 
                  src={product.imageUrl} 
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="text-gray-400" size={24} />
                </div>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 truncate">{product.name}</h3>
                  {product.description && (
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{product.description}</p>
                  )}
                  
                  <div className="flex items-center space-x-4 mt-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg font-bold text-primary-600">
                        R$ {parseFloat(product.discountPrice).toFixed(2).replace('.', ',')}
                      </span>
                      <span className="text-sm text-gray-500 line-through">
                        R$ {parseFloat(product.originalPrice).toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      {calculateDiscountPercentage()}% OFF
                    </Badge>
                  </div>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="p-2 text-gray-400 hover:text-gray-600">
                      <MoreVertical size={16} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Edit size={16} className="mr-2" />
                      Editar Produto
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => setShowDeleteDialog(true)}
                      className="text-red-600"
                    >
                      <Trash2 size={16} className="mr-2" />
                      Excluir Produto
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span className="flex items-center">
                    <Calendar className="text-gray-400 mr-1" size={14} />
                    Vence: {formatDate(product.expirationDate)}
                  </span>
                  <span className="flex items-center">
                    <Package className="text-gray-400 mr-1" size={14} />
                    Qtd: {product.quantity}
                  </span>
                </div>
                
                <Badge variant="outline">{product.category}</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Produto</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir "{product.name}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteProductMutation.isPending}
            >
              {deleteProductMutation.isPending ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
