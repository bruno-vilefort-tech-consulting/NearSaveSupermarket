import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Zap, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface SponsorshipCardProps {
  isSponsored?: boolean;
  companyName?: string;
}

export function SponsorshipCard({ isSponsored = false, companyName = "Seu Supermercado" }: SponsorshipCardProps) {
  const [localSponsored, setLocalSponsored] = useState(isSponsored);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Sync local state with prop changes
  useEffect(() => {
    setLocalSponsored(isSponsored);
  }, [isSponsored]);

  const sponsorshipMutation = useMutation({
    mutationFn: async (newStatus: boolean) => {
      const response = await apiRequest("PATCH", "/api/staff/sponsorship/update", {
        isSponsored: newStatus
      });
      return response.json();
    },
    onSuccess: (data) => {
      setLocalSponsored(data.isSponsored);
      toast({
        title: "Patrocínio Atualizado",
        description: data.message,
      });
      // Invalidate relevant queries to update the UI
      queryClient.invalidateQueries({ queryKey: ["/api/staff/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/staff/sponsorship/status"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao Atualizar Patrocínio",
        description: error.message || "Ocorreu um erro inesperado",
        variant: "destructive",
      });
    },
  });

  const handleToggleSponsorship = () => {
    const newStatus = !localSponsored;
    sponsorshipMutation.mutate(newStatus);
  };

  return (
    <Card className="shadow-sm border-eco-blue-light hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shadow-sm ${
              localSponsored ? 'bg-eco-orange' : 'bg-eco-blue-light'
            }`}>
              {localSponsored ? (
                <Star className="text-white" size={20} />
              ) : (
                <Zap className="text-eco-blue" size={20} />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-eco-blue-dark">Status de Patrocínio</h3>
              <p className="text-xs text-eco-gray">{companyName}</p>
            </div>
          </div>
          <Badge 
            variant={localSponsored ? "default" : "secondary"}
            className={localSponsored ? "bg-eco-orange text-white" : "bg-eco-gray-light text-eco-gray"}
          >
            {localSponsored ? "PATROCINADO" : "PADRÃO"}
          </Badge>
        </div>

        <div className="space-y-3">
          {localSponsored ? (
            <div className="p-3 bg-eco-orange/10 rounded-lg border border-eco-orange/20">
              <div className="flex items-start space-x-2">
                <Star className="text-eco-orange mt-0.5" size={16} />
                <div>
                  <p className="text-sm font-medium text-eco-orange">Supermercado Patrocinado</p>
                  <p className="text-xs text-eco-gray mt-1">
                    Seu supermercado aparece primeiro na lista para clientes, 
                    aumentando a visibilidade e potencial de vendas.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-eco-blue-light rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertCircle className="text-eco-blue mt-0.5" size={16} />
                <div>
                  <p className="text-sm font-medium text-eco-blue-dark">Visibilidade Padrão</p>
                  <p className="text-xs text-eco-gray mt-1">
                    Ative o patrocínio para aparecer primeiro na lista de supermercados 
                    e aumentar suas vendas.
                  </p>
                </div>
              </div>
            </div>
          )}

          <Button
            onClick={handleToggleSponsorship}
            disabled={sponsorshipMutation.isPending}
            className={`w-full ${
              localSponsored 
                ? 'bg-eco-gray hover:bg-eco-gray-dark text-white' 
                : 'bg-eco-orange hover:bg-eco-orange-dark text-white'
            }`}
          >
            {sponsorshipMutation.isPending ? (
              "Processando..."
            ) : localSponsored ? (
              "Desativar Patrocínio"
            ) : (
              "Ativar Patrocínio"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}