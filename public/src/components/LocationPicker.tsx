import { useState, useEffect } from 'react';
import { MapPin, Loader2, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface LocationPickerProps {
  onLocationChange: (lat: number, lng: number) => void;
  initialLat?: number;
  initialLng?: number;
  address?: string;
}

export function LocationPicker({ onLocationChange, initialLat, initialLng, address }: LocationPickerProps) {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(
    initialLat && initialLng ? { lat: initialLat, lng: initialLng } : null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualLat, setManualLat] = useState(initialLat?.toString() || '');
  const [manualLng, setManualLng] = useState(initialLng?.toString() || '');

  useEffect(() => {
    if (location && location.lat !== 0 && location.lng !== 0) {
      onLocationChange(location.lat, location.lng);
    }
  }, [location?.lat, location?.lng]);

  const getCurrentLocation = async () => {
    setIsLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError('Geolocalização não é suportada neste navegador');
      setIsLoading(false);
      return;
    }

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 60000
          }
        );
      });

      const newLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };

      setLocation(newLocation);
      setManualLat(newLocation.lat.toString());
      setManualLng(newLocation.lng.toString());
    } catch (error: any) {
      let errorMessage = 'Erro ao obter localização';
      
      if (error.code === 1) {
        errorMessage = 'Permissão de localização negada. Por favor, permita o acesso à localização nas configurações do navegador.';
      } else if (error.code === 2) {
        errorMessage = 'Localização indisponível. Verifique sua conexão e tente novamente.';
      } else if (error.code === 3) {
        errorMessage = 'Tempo limite excedido ao tentar obter localização.';
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const geocodeAddress = async () => {
    if (!address || address.trim().length < 10) {
      setError('Endereço muito curto para geocodificação');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Using Nominatim (OpenStreetMap) for geocoding - free service
      const encodedAddress = encodeURIComponent(`${address}, Brasil`);
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1&countrycodes=br`
      );
      
      if (!response.ok) {
        throw new Error('Erro na requisição de geocodificação');
      }

      const data = await response.json();
      
      if (data.length === 0) {
        setError('Endereço não encontrado. Tente inserir as coordenadas manualmente.');
        return;
      }

      const result = data[0];
      const newLocation = {
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon)
      };

      setLocation(newLocation);
      setManualLat(newLocation.lat.toString());
      setManualLng(newLocation.lng.toString());
    } catch (error) {
      setError('Erro ao buscar coordenadas do endereço. Tente inserir as coordenadas manualmente.');
    } finally {
      setIsLoading(false);
    }
  };

  const updateManualLocation = () => {
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);

    if (isNaN(lat) || isNaN(lng)) {
      setError('Coordenadas inválidas');
      return;
    }

    if (lat < -90 || lat > 90) {
      setError('Latitude deve estar entre -90 e 90');
      return;
    }

    if (lng < -180 || lng > 180) {
      setError('Longitude deve estar entre -180 e 180');
      return;
    }

    setLocation({ lat, lng });
    setError(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Localização do Supermercado
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {location && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Check className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">Localização definida</span>
            </div>
            <div className="text-sm text-green-700">
              <div>Latitude: {location.lat.toFixed(6)}</div>
              <div>Longitude: {location.lng.toFixed(6)}</div>
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span className="text-sm text-red-800">{error}</span>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <div>
            <Label className="text-sm font-medium">Opção 1: Usar localização atual</Label>
            <Button 
              onClick={getCurrentLocation} 
              disabled={isLoading}
              className="w-full mt-2"
              variant="outline"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Obtendo localização...
                </>
              ) : (
                <>
                  <MapPin className="h-4 w-4 mr-2" />
                  Usar Minha Localização Atual
                </>
              )}
            </Button>
          </div>

          <div className="border-t pt-3">
            <Label className="text-sm font-medium">Opção 2: Geocodificar endereço</Label>
            {address && (
              <div className="mt-2">
                <div className="text-sm text-gray-600 mb-2">Endereço: {address}</div>
                <Button 
                  onClick={geocodeAddress} 
                  disabled={isLoading || !address}
                  className="w-full"
                  variant="outline"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Buscando coordenadas...
                    </>
                  ) : (
                    <>
                      <MapPin className="h-4 w-4 mr-2" />
                      Buscar Coordenadas do Endereço
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>

          <div className="border-t pt-3">
            <Label className="text-sm font-medium">Opção 3: Inserir coordenadas manualmente</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div>
                <Label htmlFor="lat" className="text-xs">Latitude</Label>
                <Input
                  id="lat"
                  type="number"
                  step="any"
                  placeholder="-23.550520"
                  value={manualLat}
                  onChange={(e) => setManualLat(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="lng" className="text-xs">Longitude</Label>
                <Input
                  id="lng"
                  type="number"
                  step="any"
                  placeholder="-46.633308"
                  value={manualLng}
                  onChange={(e) => setManualLng(e.target.value)}
                />
              </div>
            </div>
            <Button 
              onClick={updateManualLocation} 
              disabled={!manualLat || !manualLng}
              className="w-full mt-2"
              variant="outline"
            >
              Definir Coordenadas
            </Button>
          </div>
        </div>

        <div className="text-xs text-gray-500 space-y-1">
          <div>💡 <strong>Dicas:</strong></div>
          <div>• Use sua localização atual se estiver no supermercado</div>
          <div>• A geocodificação funciona melhor com endereços completos</div>
          <div>• Coordenadas manuais oferecem precisão máxima</div>
          <div>• Exemplos Brasil: Lat -23.550520, Lng -46.633308 (São Paulo)</div>
        </div>
      </CardContent>
    </Card>
  );
}