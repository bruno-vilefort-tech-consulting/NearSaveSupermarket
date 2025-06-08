import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Package, Plus, Edit, Trash2, ArrowLeft, Search, Eye, Calendar, DollarSign, Milk, Beef, Fish, Apple, Carrot, Wheat, Coffee, Droplets, Wine, Snowflake, Sparkles, Upload, X, Image } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Product {
  id: number;
  name: string;
  description: string | null;
  category: string;
  originalPrice: string;
  discountPrice: string;
  quantity: number;
  expirationDate: string;
  imageUrl: string | null;
  isActive: number;
  createdAt: Date | null;
  updatedAt: Date | null;
}

interface StaffUser {
  id: number;
  email: string;
  companyName: string;
  phone: string;
  address: string;
  isActive: number;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  cnpj: string;
}

function StaffProducts() {
  const [, setLocation] = useLocation();
  const [staffUser, setStaffUser] = useState<StaffUser | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [productData, setProductData] = useState({
    name: "",
    description: "",
    category: "",
    originalPrice: "",
    discountPrice: "",
    quantity: "",
    expirationDate: "",
    imageUrl: ""
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    const staffInfo = localStorage.getItem('staffInfo');
    if (!staffInfo) {
      setLocation('/staff');
      return;
    }

    try {
      const parsedStaffInfo = JSON.parse(staffInfo);
      setStaffUser(parsedStaffInfo);
    } catch (error) {
      localStorage.removeItem('staffInfo');
      setLocation('/staff');
    }
  }, [setLocation]);

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ["/api/staff/products"],
    retry: false,
  });

  // Image handling functions
  const handleFileSelect = (file: File) => {
    if (file.type.startsWith('image/')) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      toast({
        title: "Arquivo inválido",
        description: "Por favor, selecione apenas arquivos de imagem (PNG, JPG, etc.)",
        variant: "destructive",
      });
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const removeImage = () => {
    setSelectedFile(null);
    setImagePreview(null);
    setProductData({...productData, imageUrl: ""});
  };

  const createProductMutation = useMutation({
    mutationFn: async (data: any) => {
      const formData = new FormData();
      Object.keys(data).forEach(key => {
        if (key !== 'image' && data[key] !== undefined) {
          formData.append(key, data[key]);
        }
      });
      
      if (selectedFile) {
        formData.append('image', selectedFile);
      }
      
      return apiRequest("POST", "/api/staff/products", formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff/products"] });
      setIsCreating(false);
      setProductData({
        name: "",
        description: "",
        category: "",
        originalPrice: "",
        discountPrice: "",
        quantity: "",
        expirationDate: "",
        imageUrl: ""
      });
      setSelectedFile(null);
      setImagePreview(null);
      toast({
        title: "Produto criado com sucesso!",
        description: "O produto foi adicionado ao seu catálogo.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar produto",
        description: error.message || "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: async (data: any) => {
      const formData = new FormData();
      Object.keys(data).forEach(key => {
        if (key !== 'image' && data[key] !== undefined) {
          formData.append(key, data[key]);
        }
      });
      
      if (selectedFile) {
        formData.append('image', selectedFile);
      }
      
      return apiRequest("PUT", `/api/staff/products/${selectedProduct?.id}`, formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff/products"] });
      setIsEditing(false);
      setSelectedProduct(null);
      toast({
        title: "Produto atualizado com sucesso!",
        description: "As alterações foram salvas.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar produto",
        description: error.message || "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/staff/products/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff/products"] });
      toast({
        title: "Produto removido com sucesso!",
        description: "O produto foi removido do seu catálogo.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao remover produto",
        description: error.message || "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
    },
  });

  const handleCreateProduct = () => {
    const data = {
      ...productData,
      originalPrice: parseFloat(productData.originalPrice),
      discountPrice: parseFloat(productData.discountPrice),
      quantity: parseInt(productData.quantity),
      isActive: 1
    };
    createProductMutation.mutate(data);
  };

  const handleUpdateProduct = () => {
    if (!selectedProduct) return;
    
    const data = {
      ...productData,
      originalPrice: parseFloat(productData.originalPrice),
      discountPrice: parseFloat(productData.discountPrice),
      quantity: parseInt(productData.quantity),
      isActive: selectedProduct.isActive
    };
    updateProductMutation.mutate(data);
  };

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setProductData({
      name: product.name,
      description: product.description || "",
      category: product.category,
      originalPrice: product.originalPrice,
      discountPrice: product.discountPrice,
      quantity: product.quantity.toString(),
      expirationDate: product.expirationDate,
      imageUrl: product.imageUrl || ""
    });
    // Reset image upload states when editing
    setSelectedFile(null);
    setImagePreview(null);
    setIsEditing(true);
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const predefinedCategories = [
    "Laticínios", "Carnes", "Frango", "Peixes", "Frutas", "Verduras", "Legumes", 
    "Pães", "Bolos", "Bebidas", "Refrigerantes", "Sucos", "Águas", "Cervejas", 
    "Vinhos", "Congelados", "Massas", "Molhos", "Conservas", "Grãos", "Cereais", 
    "Snacks", "Doces", "Chocolates", "Higiene", "Limpeza", "Temperos", "Óleos", "Outros"
  ];
  
  const usedCategories = Array.from(new Set(products.map(p => p.category)));
  const categories = predefinedCategories.filter(cat => usedCategories.includes(cat));

  const formatCurrency = (value: string) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(parseFloat(value));
  };

  const formatDate = (date: string) => {
    return format(new Date(date), 'dd/MM/yyyy', { locale: ptBR });
  };

  const getCategoryIcon = (category: string) => {
    const iconMap: { [key: string]: any } = {
      "Laticínios": Milk,
      "Carnes": Beef,
      "Frango": Beef,
      "Peixes": Fish,
      "Frutas": Apple,
      "Verduras": Carrot,
      "Legumes": Carrot,
      "Pães": Wheat,
      "Bolos": Wheat,
      "Bebidas": Droplets,
      "Refrigerantes": Droplets,
      "Sucos": Droplets,
      "Águas": Droplets,
      "Cervejas": Wine,
      "Vinhos": Wine,
      "Congelados": Snowflake,
      "Massas": Wheat,
      "Molhos": Droplets,
      "Conservas": Package,
      "Grãos": Wheat,
      "Cereais": Wheat,
      "Snacks": Package,
      "Doces": Sparkles,
      "Chocolates": Sparkles,
      "Higiene": Sparkles,
      "Limpeza": Sparkles,
      "Temperos": Package,
      "Óleos": Droplets,
      "Outros": Package
    };
    return iconMap[category] || Package;
  };

  const getStatusBadge = (product: Product) => {
    const isExpired = new Date(product.expirationDate) < new Date();
    const isLowStock = product.quantity < 5;
    
    if (isExpired) {
      return <Badge variant="destructive">Vencido</Badge>;
    }
    if (isLowStock) {
      return <Badge variant="secondary">Estoque Baixo</Badge>;
    }
    if (product.isActive) {
      return <Badge variant="default">Ativo</Badge>;
    }
    return <Badge variant="outline">Inativo</Badge>;
  };

  if (!staffUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (staffUser.approvalStatus !== 'approved') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardHeader>
            <CardTitle className="text-center">Acesso Restrito</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <Package className="h-16 w-16 mx-auto text-gray-400" />
            <p className="text-gray-600">
              Sua conta precisa estar aprovada para gerenciar produtos.
            </p>
            <Button onClick={() => setLocation('/staff/dashboard')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                onClick={() => setLocation('/staff/dashboard')}
                className="p-2"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="bg-eco-green/10 p-2 rounded-full">
                <Package className="h-6 w-6 text-eco-green" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Gerenciar Produtos
                </h1>
                <p className="text-sm text-gray-600">{staffUser.companyName}</p>
              </div>
            </div>
            <Button 
              onClick={() => setIsCreating(true)}
              className="bg-eco-green hover:bg-eco-green/90"
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Produto
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Buscar produtos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="w-full sm:w-48">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as categorias</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Products Table */}
        <Card>
          <CardHeader>
            <CardTitle>Meus Produtos ({filteredProducts.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Nenhum produto encontrado
                </h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm || selectedCategory !== "all" 
                    ? "Tente ajustar os filtros de busca" 
                    : "Comece adicionando seu primeiro produto"
                  }
                </p>
                <Button 
                  onClick={() => setIsCreating(true)}
                  className="bg-eco-green hover:bg-eco-green/90"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Produto
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produto</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Preços</TableHead>
                      <TableHead>Estoque</TableHead>
                      <TableHead>Validade</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            {product.imageUrl ? (
                              <img 
                                src={product.imageUrl} 
                                alt={product.name}
                                className="h-10 w-10 rounded-lg object-cover"
                              />
                            ) : (
                              <div className="h-10 w-10 bg-gray-200 rounded-lg flex items-center justify-center">
                                <Package className="h-5 w-5 text-gray-400" />
                              </div>
                            )}
                            <div>
                              <div className="font-medium">{product.name}</div>
                              {product.description && (
                                <div className="text-sm text-gray-500 max-w-xs truncate">
                                  {product.description}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {(() => {
                              const IconComponent = getCategoryIcon(product.category);
                              return <IconComponent className="h-4 w-4 text-gray-500" />;
                            })()}
                            <Badge variant="outline">{product.category}</Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-sm text-gray-500 line-through">
                              {formatCurrency(product.originalPrice)}
                            </div>
                            <div className="font-medium text-green-600">
                              {formatCurrency(product.discountPrice)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            {product.quantity} unidades
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span className="text-sm">
                              {formatDate(product.expirationDate)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(product)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedProduct(product)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditProduct(product)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteProductMutation.mutate(product.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create/Edit Product Dialog */}
        <Dialog open={isCreating || isEditing} onOpenChange={(open) => {
          if (!open) {
            setIsCreating(false);
            setIsEditing(false);
            setSelectedProduct(null);
            setProductData({
              name: "",
              description: "",
              category: "",
              originalPrice: "",
              discountPrice: "",
              quantity: "",
              expirationDate: "",
              imageUrl: ""
            });
          }
        }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {isCreating ? "Novo Produto" : "Editar Produto"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nome do Produto</Label>
                <Input
                  id="name"
                  value={productData.name}
                  onChange={(e) => setProductData({...productData, name: e.target.value})}
                  placeholder="Nome do produto"
                />
              </div>
              
              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={productData.description}
                  onChange={(e) => setProductData({...productData, description: e.target.value})}
                  placeholder="Descrição do produto"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="category">Categoria</Label>
                <Select
                  value={productData.category}
                  onValueChange={(value) => setProductData({...productData, category: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Laticínios">Laticínios</SelectItem>
                    <SelectItem value="Carnes">Carnes</SelectItem>
                    <SelectItem value="Frango">Frango</SelectItem>
                    <SelectItem value="Peixes">Peixes</SelectItem>
                    <SelectItem value="Frutas">Frutas</SelectItem>
                    <SelectItem value="Verduras">Verduras</SelectItem>
                    <SelectItem value="Legumes">Legumes</SelectItem>
                    <SelectItem value="Pães">Pães</SelectItem>
                    <SelectItem value="Bolos">Bolos</SelectItem>
                    <SelectItem value="Bebidas">Bebidas</SelectItem>
                    <SelectItem value="Refrigerantes">Refrigerantes</SelectItem>
                    <SelectItem value="Sucos">Sucos</SelectItem>
                    <SelectItem value="Águas">Águas</SelectItem>
                    <SelectItem value="Cervejas">Cervejas</SelectItem>
                    <SelectItem value="Vinhos">Vinhos</SelectItem>
                    <SelectItem value="Congelados">Congelados</SelectItem>
                    <SelectItem value="Massas">Massas</SelectItem>
                    <SelectItem value="Molhos">Molhos</SelectItem>
                    <SelectItem value="Conservas">Conservas</SelectItem>
                    <SelectItem value="Grãos">Grãos</SelectItem>
                    <SelectItem value="Cereais">Cereais</SelectItem>
                    <SelectItem value="Snacks">Snacks</SelectItem>
                    <SelectItem value="Doces">Doces</SelectItem>
                    <SelectItem value="Chocolates">Chocolates</SelectItem>
                    <SelectItem value="Higiene">Higiene</SelectItem>
                    <SelectItem value="Limpeza">Limpeza</SelectItem>
                    <SelectItem value="Temperos">Temperos</SelectItem>
                    <SelectItem value="Óleos">Óleos</SelectItem>
                    <SelectItem value="Outros">Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="originalPrice">Preço Original (R$)</Label>
                  <Input
                    id="originalPrice"
                    type="number"
                    step="0.01"
                    value={productData.originalPrice}
                    onChange={(e) => setProductData({...productData, originalPrice: e.target.value})}
                    placeholder="0,00"
                  />
                </div>
                <div>
                  <Label htmlFor="discountPrice">Preço com Desconto (R$)</Label>
                  <Input
                    id="discountPrice"
                    type="number"
                    step="0.01"
                    value={productData.discountPrice}
                    onChange={(e) => setProductData({...productData, discountPrice: e.target.value})}
                    placeholder="0,00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="quantity">Quantidade</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={productData.quantity}
                    onChange={(e) => setProductData({...productData, quantity: e.target.value})}
                    placeholder="Unidades disponíveis"
                  />
                </div>
                <div>
                  <Label htmlFor="expirationDate">Data de Validade</Label>
                  <Input
                    id="expirationDate"
                    type="date"
                    value={productData.expirationDate}
                    onChange={(e) => setProductData({...productData, expirationDate: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <Label>Imagem do Produto (opcional)</Label>
                <div 
                  className={`
                    relative border-2 border-dashed rounded-lg p-6 transition-all duration-200 cursor-pointer
                    ${isDragOver 
                      ? 'border-eco-green bg-eco-green/5' 
                      : 'border-gray-300 hover:border-eco-green hover:bg-gray-50'
                    }
                  `}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById('image-upload')?.click()}
                >
                  <input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileSelect(file);
                    }}
                  />
                  
                  {imagePreview ? (
                    <div className="relative">
                      <img 
                        src={imagePreview} 
                        alt="Preview" 
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeImage();
                        }}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                      >
                        <X size={16} />
                      </button>
                      <div className="mt-2 text-center">
                        <p className="text-sm text-gray-600">{selectedFile?.name}</p>
                        <p className="text-xs text-gray-500">Clique para alterar</p>
                      </div>
                    </div>
                  ) : productData.imageUrl ? (
                    <div className="relative">
                      <img 
                        src={productData.imageUrl} 
                        alt="Imagem atual" 
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeImage();
                        }}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                      >
                        <X size={16} />
                      </button>
                      <div className="mt-2 text-center">
                        <p className="text-xs text-gray-500">Imagem atual - Clique para alterar</p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="flex flex-col items-center space-y-2">
                        <div className={`
                          p-3 rounded-full transition-colors
                          ${isDragOver ? 'bg-eco-green text-white' : 'bg-gray-100 text-gray-400'}
                        `}>
                          {isDragOver ? <Upload size={24} /> : <Image size={24} />}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">
                            {isDragOver ? 'Solte a imagem aqui' : 'Clique ou arraste uma imagem'}
                          </p>
                          <p className="text-xs text-gray-500">
                            PNG, JPG, JPEG até 10MB
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Alternative URL input */}
                <div className="mt-3">
                  <Label className="text-sm text-gray-600">Ou cole uma URL da imagem:</Label>
                  <Input
                    value={productData.imageUrl}
                    onChange={(e) => {
                      setProductData({...productData, imageUrl: e.target.value});
                      if (e.target.value) {
                        setSelectedFile(null);
                        setImagePreview(null);
                      }
                    }}
                    placeholder="https://exemplo.com/imagem.jpg"
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsCreating(false);
                    setIsEditing(false);
                    setSelectedProduct(null);
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={isCreating ? handleCreateProduct : handleUpdateProduct}
                  disabled={createProductMutation.isPending || updateProductMutation.isPending}
                  className="bg-eco-green hover:bg-eco-green/90"
                >
                  {createProductMutation.isPending || updateProductMutation.isPending ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Product Details Dialog */}
        <Dialog open={!!selectedProduct && !isEditing} onOpenChange={(open) => {
          if (!open) setSelectedProduct(null);
        }}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Detalhes do Produto</DialogTitle>
            </DialogHeader>
            {selectedProduct && (
              <div className="space-y-4">
                {selectedProduct.imageUrl && (
                  <div className="flex justify-center">
                    <img 
                      src={selectedProduct.imageUrl} 
                      alt={selectedProduct.name}
                      className="h-32 w-32 rounded-lg object-cover"
                    />
                  </div>
                )}
                
                <div>
                  <h3 className="font-semibold text-lg">{selectedProduct.name}</h3>
                  <Badge variant="outline" className="mt-1">{selectedProduct.category}</Badge>
                </div>

                {selectedProduct.description && (
                  <div>
                    <Label>Descrição</Label>
                    <p className="text-sm text-gray-600">{selectedProduct.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Preço Original</Label>
                    <p className="font-medium text-gray-500 line-through">
                      {formatCurrency(selectedProduct.originalPrice)}
                    </p>
                  </div>
                  <div>
                    <Label>Preço com Desconto</Label>
                    <p className="font-medium text-green-600">
                      {formatCurrency(selectedProduct.discountPrice)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Estoque</Label>
                    <p className="font-medium">{selectedProduct.quantity} unidades</p>
                  </div>
                  <div>
                    <Label>Validade</Label>
                    <p className="font-medium">{formatDate(selectedProduct.expirationDate)}</p>
                  </div>
                </div>

                <div>
                  <Label>Status</Label>
                  <div className="mt-1">
                    {getStatusBadge(selectedProduct)}
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedProduct(null)}
                  >
                    Fechar
                  </Button>
                  <Button
                    onClick={() => handleEditProduct(selectedProduct)}
                    className="bg-eco-green hover:bg-eco-green/90"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}

export default StaffProducts;