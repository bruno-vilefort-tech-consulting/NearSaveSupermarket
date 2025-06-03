import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Settings, MapPin, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { LocationPicker } from "@/components/LocationPicker";

export default function StaffSettings() {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const { toast } = useToast();

  // Get current staff user info from localStorage
  const [staffUser, setStaffUser] = useState<any>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  useEffect(() => {
    const staffInfo = localStorage.getItem('staffInfo');
    if (staffInfo) {
      const parsedStaff = JSON.parse(staffInfo);
      setStaffUser(parsedStaff);
      
      // Initialize location from staff user data if available
      if (parsedStaff.latitude && parsedStaff.longitude) {
        setLocation({
          lat: parseFloat(parsedStaff.latitude),
          lng: parseFloat(parsedStaff.longitude)
        });
      }
    }
    setIsLoadingUser(false);
  }, []);

  const updateLocationMutation = useMutation({
    mutationFn: async (locationData: { lat: number; lng: number }) => {
      const response = await apiRequest("PUT", "/api/staff/location", {
        staffId: staffUser.id,
        latitude: locationData.lat,
        longitude: locationData.lng
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Localização atualizada",
        description: "A localização do seu supermercado foi atualizada com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar localização",
        description: error.message || "Não foi possível atualizar a localização",
        variant: "destructive"
      });
    },
  });

  const handleLocationChange = (lat: number, lng: number) => {
    setLocation({ lat, lng });
  };

  const handleSaveLocation = () => {
    if (location) {
      updateLocationMutation.mutate(location);
    } else {
      toast({
        title: "Localização não definida",
        description: "Por favor, defina uma localização antes de salvar",
        variant: "destructive"
      });
    }
  };

  if (isLoadingUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Settings className="text-blue-600 mr-2" size={32} />
            <h1 className="text-3xl font-bold text-gray-900">Configurações</h1>
          </div>
          <p className="text-lg text-gray-600">
            {staffUser?.companyName || "Seu Supermercado"}
          </p>
        </div>

        {/* Main Content */}
        <div className="max-w-2xl mx-auto">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MapPin size={20} />
                <span>Localização do Supermercado</span>
              </CardTitle>
              <p className="text-gray-600">
                Defina ou atualize a localização do seu supermercado para aparecer corretamente no mapa dos clientes
              </p>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Current Location Info */}
              {location && (
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <h3 className="font-semibold text-green-800 mb-2">Localização Atual</h3>
                  <p className="text-green-700 text-sm">
                    Latitude: {location.lat.toFixed(6)}<br />
                    Longitude: {location.lng.toFixed(6)}
                  </p>
                </div>
              )}

              {/* Location Picker */}
              <div className="space-y-2">
                <Label className="text-base font-medium">
                  Definir Nova Localização
                </Label>
                <LocationPicker
                  onLocationChange={handleLocationChange}
                  initialLat={location?.lat}
                  initialLng={location?.lng}
                  address={staffUser?.address}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col space-y-3 pt-4">
                <Button
                  onClick={handleSaveLocation}
                  disabled={!location || updateLocationMutation.isPending}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {updateLocationMutation.isPending ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save size={16} className="mr-2" />
                      Salvar Localização
                    </>
                  )}
                </Button>

                <Button
                  onClick={() => window.history.back()}
                  variant="outline"
                  className="w-full"
                >
                  Voltar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}