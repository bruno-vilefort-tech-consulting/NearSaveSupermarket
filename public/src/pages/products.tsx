import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { ProductCard } from "@/components/product/product-card";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { useStaffAuth } from "@/hooks/useStaffAuth";
import { useLanguage } from "@/hooks/useLanguage";

const categories = ["Todos", "Padaria", "Laticínios", "Carnes e Aves", "Hortifruti", "Frios", "Bebidas", "Doces", "Conservas", "Congelados", "Limpeza", "Higiene"];

export default function Products() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const { t } = useLanguage();
  const { isStaffAuthenticated } = useStaffAuth();
  
  const { data: products, isLoading } = useQuery({
    queryKey: isStaffAuthenticated ? ["/api/staff/products", selectedCategory === "Todos" ? undefined : selectedCategory] : ["/api/products", selectedCategory === "Todos" ? undefined : selectedCategory],
    // Removed automatic refresh to prevent interference
  });

  const filteredProducts = products?.filter((product: any) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-eco-blue-light">
      <Header />
      
      <main className="pb-20">
        <div className="p-4 space-y-4">
          {/* Search and Filter */}
          <Card className="shadow-sm border-eco-blue-light">
            <CardContent className="p-4">
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 text-eco-gray" size={20} />
                  <Input
                    placeholder="Buscar produtos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-3 border border-eco-blue-light rounded-xl focus:ring-2 focus:ring-eco-blue focus:border-eco-blue"
                  />
                </div>
                
                <div className="flex space-x-2 overflow-x-auto pb-2">
                  {categories.map((category) => (
                    <Button
                      key={category}
                      variant={selectedCategory === category ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedCategory(category)}
                      className={`px-4 py-2 text-sm font-medium whitespace-nowrap rounded-full ${
                        selectedCategory === category
                          ? "bg-eco-blue text-white hover:bg-eco-blue-dark"
                          : "bg-white text-eco-blue border-eco-blue hover:bg-eco-blue-light"
                      }`}
                    >
                      {category}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Products List */}
          <div className="space-y-3">
            {isLoading ? (
              <div className="text-center py-8">
                <p className="text-eco-gray">Carregando produtos...</p>
              </div>
            ) : filteredProducts && filteredProducts.length > 0 ? (
              filteredProducts.map((product: any) => (
                <ProductCard key={product.id} product={product} />
              ))
            ) : (
              <Card className="shadow-sm border-eco-blue-light">
                <CardContent className="p-8 text-center">
                  <p className="text-eco-gray">Nenhum produto encontrado</p>
                  <p className="text-sm text-eco-gray mt-1">
                    Tente ajustar sua busca ou critérios de filtro
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
      
      <BottomNavigation />
    </div>
  );
}
