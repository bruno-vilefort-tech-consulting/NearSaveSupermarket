import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Header } from "@/components/layout/header";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertProductSchema, type ProductWithCreator } from "@shared/schema";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, Save, Upload } from "lucide-react";
import { isUnauthorizedError } from "@/lib/authUtils";

// Schema para edição de produtos
const editProductSchema = insertProductSchema.extend({
  originalPrice: z.string().min(1, "Preço original é obrigatório"),
  discountPrice: z.string().min(1, "Preço com desconto é obrigatório"),
  quantity: z.number().min(1, "Quantidade deve ser maior que 0")
});

type EditProductForm = z.infer<typeof editProductSchema>;

const categories = [
  "Padaria",
  "Laticínios", 
  "Carnes e Aves",
  "Hortifruti",
  "Frios",
  "Bebidas",
  "Limpeza",
  "Higiene",
  "Outros"
];

export default function EditProduct() {
  const [, params] = useRoute("/edit-product/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [imagePreview, setImagePreview] = useState<string>("");

  const productId = params?.id ? parseInt(params.id) : null;

  // Buscar dados do produto
  const { data: product, isLoading } = useQuery<ProductWithCreator>({
    queryKey: ["/api/products", productId],
    enabled: !!productId,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset
  } = useForm<EditProductForm>({
    resolver: zodResolver(editProductSchema),
    defaultValues: {
      name: "",
      description: "",
      category: "",
      originalPrice: "",
      discountPrice: "",
      quantity: 1,
      expirationDate: "",
      imageUrl: ""
    }
  });

  // Preencher formulário quando produto carregar
  useEffect(() => {
    if (product && product.name) {
      reset({
        name: product.name,
        description: product.description || "",
        category: product.category,
        originalPrice: product.originalPrice,
        discountPrice: product.discountPrice,
        quantity: product.quantity,
        expirationDate: product.expirationDate.split('T')[0], // Formato YYYY-MM-DD
        imageUrl: product.imageUrl || ""
      });
      setImagePreview(product.imageUrl || "");
    }
  }, [product, reset]);

  const updateProductMutation = useMutation({
    mutationFn: async (data: EditProductForm) => {
      if (!productId) throw new Error("ID do produto não encontrado");
      
      const payload = {
        ...data,
        originalPrice: data.originalPrice.toString(),
        discountPrice: data.discountPrice.toString(),
        expirationDate: new Date(data.expirationDate).toISOString(),
      };
      
      await apiRequest("PUT", `/api/products/${productId}`, payload);
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Produto atualizado com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/staff/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      setLocation("/products");
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Não autorizado",
          description: "Você foi desconectado. Fazendo login novamente...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/staff-login";
        }, 500);
        return;
      }
      
      console.error("Erro ao atualizar produto:", error);
      toast({
        title: "Erro",
        description: "Falha ao atualizar produto. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: EditProductForm) => {
    updateProductMutation.mutate(data);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setImagePreview(result);
        setValue("imageUrl", result);
      };
      reader.readAsDataURL(file);
    }
  };

  if (!productId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-red-600">ID do produto inválido</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Carregando produto...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-red-600">Produto não encontrado</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="pb-20">
        <div className="p-4">
          {/* Header com botão voltar */}
          <div className="flex items-center space-x-4 mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/products")}
              className="p-2"
            >
              <ArrowLeft size={20} />
            </Button>
            <h1 className="text-xl font-semibold text-gray-900">Editar Produto</h1>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informações do Produto</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Nome do Produto */}
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Produto *</Label>
                  <Input
                    id="name"
                    {...register("name")}
                    placeholder="Ex: Pão Francês"
                    className={errors.name ? "border-red-500" : ""}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-600">{errors.name.message}</p>
                  )}
                </div>

                {/* Descrição */}
                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    {...register("description")}
                    placeholder="Descrição do produto..."
                    rows={3}
                  />
                </div>

                {/* Categoria */}
                <div className="space-y-2">
                  <Label htmlFor="category">Categoria *</Label>
                  <Select
                    value={watch("category")}
                    onValueChange={(value) => setValue("category", value)}
                  >
                    <SelectTrigger className={errors.category ? "border-red-500" : ""}>
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.category && (
                    <p className="text-sm text-red-600">{errors.category.message}</p>
                  )}
                </div>

                {/* Preços */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="originalPrice">Preço Original (R$) *</Label>
                    <Input
                      id="originalPrice"
                      {...register("originalPrice")}
                      placeholder="0,00"
                      type="number"
                      step="0.01"
                      min="0"
                      className={errors.originalPrice ? "border-red-500" : ""}
                    />
                    {errors.originalPrice && (
                      <p className="text-sm text-red-600">{errors.originalPrice.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="discountPrice">Preço com Desconto (R$) *</Label>
                    <Input
                      id="discountPrice"
                      {...register("discountPrice")}
                      placeholder="0,00"
                      type="number"
                      step="0.01"
                      min="0"
                      className={errors.discountPrice ? "border-red-500" : ""}
                    />
                    {errors.discountPrice && (
                      <p className="text-sm text-red-600">{errors.discountPrice.message}</p>
                    )}
                  </div>
                </div>

                {/* Quantidade e Data de Vencimento */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantidade *</Label>
                    <Input
                      id="quantity"
                      {...register("quantity", { valueAsNumber: true })}
                      type="number"
                      min="1"
                      className={errors.quantity ? "border-red-500" : ""}
                    />
                    {errors.quantity && (
                      <p className="text-sm text-red-600">{errors.quantity.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="expirationDate">Data de Vencimento *</Label>
                    <Input
                      id="expirationDate"
                      {...register("expirationDate")}
                      type="date"
                      className={errors.expirationDate ? "border-red-500" : ""}
                    />
                    {errors.expirationDate && (
                      <p className="text-sm text-red-600">{errors.expirationDate.message}</p>
                    )}
                  </div>
                </div>

                {/* Upload de Imagem */}
                <div className="space-y-2">
                  <Label htmlFor="image">Imagem do Produto</Label>
                  <div className="space-y-4">
                    {imagePreview && (
                      <div className="w-32 h-32 border rounded-lg overflow-hidden">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex items-center space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById('image-upload')?.click()}
                        className="flex items-center space-x-2"
                      >
                        <Upload size={16} />
                        <span>Escolher Imagem</span>
                      </Button>
                      <input
                        id="image-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Botões de Ação */}
            <div className="flex space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setLocation("/products")}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={updateProductMutation.isPending}
                className="flex-1 flex items-center justify-center space-x-2"
              >
                {updateProductMutation.isPending ? (
                  <span>Salvando...</span>
                ) : (
                  <>
                    <Save size={16} />
                    <span>Salvar Alterações</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </main>
      
      <BottomNavigation />
    </div>
  );
}