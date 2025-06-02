import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Header } from "@/components/layout/header";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Camera, Upload } from "lucide-react";
import { useLocation } from "wouter";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useLanguage } from "@/hooks/useLanguage";

const createProductSchema = (t: any) => z.object({
  name: z.string().min(1, t('validation.productNameRequired')),
  description: z.string().optional(),
  category: z.string().min(1, t('validation.categoryRequired')),
  originalPrice: z.string().min(1, t('validation.originalPriceRequired')),
  discountPrice: z.string().min(1, t('validation.discountPriceRequired')),
  quantity: z.string().min(1, t('validation.quantityRequired')),
  expirationDate: z.string().min(1, t('validation.expirationDateRequired')),
});

export default function AddProduct() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const { t } = useLanguage();

  const productSchema = createProductSchema(t);
  type ProductFormData = z.infer<typeof productSchema>;

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      category: "",
      originalPrice: "",
      discountPrice: "",
      quantity: "",
      expirationDate: "",
    },
  });

  const createProductMutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      const formData = new FormData();
      
      // Append product data
      Object.entries(data).forEach(([key, value]) => {
        formData.append(key, value as string);
      });
      
      // Append image if selected
      if (selectedImage) {
        formData.append("image", selectedImage);
      }

      await apiRequest("POST", "/api/staff/products", formData);
    },
    onSuccess: () => {
      toast({
        title: t('product.successTitle'),
        description: t('product.successMessage'),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/staff/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/staff/stats"] });
      navigate("/products");
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: t('auth.unauthorized'),
          description: t('auth.sessionExpired'),
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: t('product.errorTitle'),
        description: t('product.errorMessage'),
        variant: "destructive",
      });
    },
  });

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = (data: ProductFormData) => {
    createProductMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="pb-20">
        <div className="p-4">
          <Card className="shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">{t('product.addTitle')}</h2>
              <p className="text-sm text-gray-600 mt-1">{t('product.addSubtitle')}</p>
            </div>
            
            <CardContent className="p-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Photo Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Foto do Produto</label>
                    {imagePreview ? (
                      <div className="relative">
                        <img
                          src={imagePreview}
                          alt="Pré-visualização do produto"
                          className="w-full h-48 object-cover rounded-xl"
                        />
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            setSelectedImage(null);
                            setImagePreview(null);
                          }}
                          className="absolute top-2 right-2"
                        >
                          Remover
                        </Button>
                      </div>
                    ) : (
                      <div className="flex space-x-3">
                        <label className="flex-1 p-6 border-2 border-dashed border-gray-300 rounded-xl text-center hover:border-primary-500 transition-colors cursor-pointer">
                          <Camera className="text-gray-400 text-2xl mb-2 mx-auto" size={32} />
                          <p className="text-sm text-gray-600">Tirar Foto</p>
                          <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            onChange={handleImageSelect}
                            className="hidden"
                          />
                        </label>
                        <label className="flex-1 p-6 border-2 border-dashed border-gray-300 rounded-xl text-center hover:border-primary-500 transition-colors cursor-pointer">
                          <Upload className="text-gray-400 text-2xl mb-2 mx-auto" size={32} />
                          <p className="text-sm text-gray-600">Enviar Imagem</p>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageSelect}
                            className="hidden"
                          />
                        </label>
                      </div>
                    )}
                  </div>

                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome do Produto</FormLabel>
                        <FormControl>
                          <Input placeholder="ex.: Pão Francês Fresco" {...field} />
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
                              <SelectValue placeholder="Selecione a categoria" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Bakery">Padaria</SelectItem>
                            <SelectItem value="Dairy">Laticínios</SelectItem>
                            <SelectItem value="Meat & Poultry">Carnes e Aves</SelectItem>
                            <SelectItem value="Produce">Hortifruti</SelectItem>
                            <SelectItem value="Deli">Frios</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrição</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Breve descrição do produto" {...field} />
                        </FormControl>
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
                          <FormLabel>Preço Original</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute left-3 top-3 text-gray-500">R$</span>
                              <Input 
                                type="number" 
                                step="0.01" 
                                placeholder="0,00" 
                                className="pl-8"
                                {...field} 
                              />
                            </div>
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
                          <FormLabel>Preço com Desconto</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute left-3 top-3 text-gray-500">R$</span>
                              <Input 
                                type="number" 
                                step="0.01" 
                                placeholder="0,00" 
                                className="pl-8"
                                {...field} 
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="expirationDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data de Vencimento</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="quantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quantidade</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="0" min="1" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex space-x-3 pt-6">
                    <Button 
                      type="button" 
                      variant="outline"
                      className="flex-1"
                      onClick={() => navigate("/")}
                    >
                      Cancelar
                    </Button>
                    <Button 
                      type="submit" 
                      className="flex-1 bg-primary-600 hover:bg-primary-700"
                      disabled={createProductMutation.isPending}
                    >
                      {createProductMutation.isPending ? "Adicionando..." : "Adicionar Produto"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </main>
      
      <BottomNavigation />
    </div>
  );
}
