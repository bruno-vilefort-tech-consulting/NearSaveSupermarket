import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

const editProductSchema = z.object({
  name: z.string().min(1, "Nome do produto é obrigatório"),
  description: z.string().optional(),
  category: z.string().min(1, "Categoria é obrigatória"),
  originalPrice: z.string().min(1, "Preço original é obrigatório"),
  discountPrice: z.string().min(1, "Preço com desconto é obrigatório"),
  quantity: z.string().min(1, "Quantidade é obrigatória"),
  expirationDate: z.string().min(1, "Data de validade é obrigatória"),
});

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
  const [showEditDialog, setShowEditDialog] = useState(false);

  const form = useForm<z.infer<typeof editProductSchema>>({
    resolver: zodResolver(editProductSchema),
    defaultValues: {
      name: product.name,
      description: product.description || "",
      category: product.category,
      originalPrice: product.originalPrice,
      discountPrice: product.discountPrice,
      quantity: product.quantity.toString(),
      expirationDate: product.expirationDate.split('T')[0], // Format for date input
    },
  });

  const editProductMutation = useMutation({
    mutationFn: async (data: z.infer<typeof editProductSchema>) => {
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('description', data.description || '');
      formData.append('category', data.category);
      formData.append('originalPrice', data.originalPrice);
      formData.append('discountPrice', data.discountPrice);
      formData.append('quantity', data.quantity);
      formData.append('expirationDate', data.expirationDate);

      const response = await apiRequest("PUT", `/api/products/${product.id}`, formData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Produto atualizado com sucesso",
      });
      // Invalidar todas as variações de queries de produtos
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/staff/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/staff/stats"] });
      setShowEditDialog(false);
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
        description: "Falha ao atualizar produto. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/products/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Produto excluído com sucesso",
      });
      // Invalidar todas as variações de queries de produtos
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/staff/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/staff/stats"] });
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

  const handleEdit = (data: z.infer<typeof editProductSchema>) => {
    editProductMutation.mutate(data);
  };

  return (
    <>
      <Card className="shadow-sm overflow-hidden border-eco-green-light hover:shadow-md transition-shadow bg-white">
        <CardContent className="p-4">
          <div className="flex space-x-4">
            {/* Product Image */}
            <div className="w-20 h-20 rounded-xl overflow-hidden bg-eco-gray-light flex-shrink-0 ring-1 ring-eco-green-light relative">
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
                    <Package className="text-eco-green" size={24} />
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-eco-green-light">
                  <Package className="text-eco-green" size={24} />
                </div>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-eco-gray-dark truncate">{product.name}</h3>
                  {product.description && (
                    <p className="text-sm text-eco-gray mt-1 line-clamp-2">{product.description}</p>
                  )}
                  
                  <div className="flex items-center space-x-4 mt-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg font-bold text-eco-green">
                        R$ {parseFloat(product.discountPrice).toFixed(2).replace('.', ',')}
                      </span>
                      <span className="text-sm text-eco-gray line-through">
                        R$ {parseFloat(product.originalPrice).toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                    <Badge variant="secondary" className="bg-eco-orange-light text-eco-orange-dark font-medium">
                      {calculateDiscountPercentage()}% OFF
                    </Badge>
                  </div>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="p-2 text-eco-gray hover:text-eco-orange transition-colors">
                      <MoreVertical size={16} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
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

      {/* Edit Product Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle>Editar Produto</DialogTitle>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleEdit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Produto</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Ex: Pão de Forma" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição (opcional)</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Descreva o produto..." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Padaria">Padaria</SelectItem>
                        <SelectItem value="Laticínios">Laticínios</SelectItem>
                        <SelectItem value="Carnes e Aves">Carnes e Aves</SelectItem>
                        <SelectItem value="Hortifruti">Hortifruti</SelectItem>
                        <SelectItem value="Frios">Frios</SelectItem>
                        <SelectItem value="Bebidas">Bebidas</SelectItem>
                        <SelectItem value="Doces">Doces</SelectItem>
                        <SelectItem value="Conservas">Conservas</SelectItem>
                        <SelectItem value="Congelados">Congelados</SelectItem>
                        <SelectItem value="Limpeza">Limpeza</SelectItem>
                        <SelectItem value="Higiene">Higiene</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="originalPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preço Original (R$)</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" step="0.01" placeholder="0,00" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="discountPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preço com Desconto (R$)</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" step="0.01" placeholder="0,00" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantidade</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" placeholder="0" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="expirationDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Validade</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowEditDialog(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={editProductMutation.isPending}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {editProductMutation.isPending ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

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
