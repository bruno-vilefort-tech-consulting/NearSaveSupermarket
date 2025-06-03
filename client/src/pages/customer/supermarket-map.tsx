import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { MapPin, Store, Package, Percent } from 'lucide-react';
// import { useLanguage } from '@/contexts/LanguageContext';
import { Link } from 'wouter';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix default markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface SupermarketLocation {
  id: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  productCount: number;
  hasPromotions: boolean;
}

export default function SupermarketMap() {
  // const { t } = useLanguage();
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [selectedSupermarket, setSelectedSupermarket] = useState<SupermarketLocation | null>(null);

  // Get user's location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
        },
        (error) => {
          console.log('Location access denied or unavailable');
          // Default to São Paulo center
          setUserLocation([-23.5505, -46.6333]);
        }
      );
    } else {
      // Default location
      setUserLocation([-23.5505, -46.6333]);
    }
  }, []);

  // Mock data for demonstration - you mentioned this should use real data
  const mockSupermarkets: SupermarketLocation[] = [
    {
      id: 1,
      name: 'Supermercado Central',
      address: 'Av. João Naves de Ávila, 1435 - Uberlândia, MG',
      latitude: -18.9180,
      longitude: -48.2760,
      productCount: 15,
      hasPromotions: true
    },
    {
      id: 2,
      name: 'EcoMart Vila Madalena',
      address: 'Rua Harmonia, 123 - Vila Madalena, São Paulo - SP',
      latitude: -23.5505,
      longitude: -46.6833,
      productCount: 8,
      hasPromotions: false
    },
    {
      id: 3,
      name: 'Green Market Ipanema',
      address: 'Rua Visconde de Pirajá, 456 - Ipanema, Rio de Janeiro - RJ',
      latitude: -22.9868,
      longitude: -43.2037,
      productCount: 12,
      hasPromotions: true
    }
  ];

  // Create custom icons
  const createIcon = (hasPromotions: boolean) => {
    const color = hasPromotions ? '#ef4444' : '#10b981'; // red for promotions, green for regular
    return L.divIcon({
      html: `<div style="background-color: ${color}; width: 25px; height: 25px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
      className: 'custom-marker',
      iconSize: [25, 25],
      iconAnchor: [12, 12]
    });
  };

  if (!userLocation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando mapa...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <div className="container mx-auto p-4">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <MapPin className="h-8 w-8 text-green-600" />
            <h1 className="text-3xl font-bold text-gray-800">
              Supermercados Próximos
            </h1>
          </div>
          <p className="text-gray-600">
            Encontre supermercados com promoções perto de você
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map */}
          <div className="lg:col-span-2">
            <Card className="h-[600px] overflow-hidden">
              <CardContent className="p-0 h-full">
                <MapContainer
                  center={userLocation}
                  zoom={10}
                  className="h-full w-full"
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  
                  {/* User location */}
                  <Marker 
                    position={userLocation}
                    icon={L.divIcon({
                      html: '<div style="background-color: #3b82f6; width: 15px; height: 15px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
                      className: 'user-marker',
                      iconSize: [15, 15],
                      iconAnchor: [7, 7]
                    })}
                  >
                    <Popup>
                      <div className="text-center">
                        <strong>Sua Localização</strong>
                      </div>
                    </Popup>
                  </Marker>

                  {/* Supermarket markers */}
                  {mockSupermarkets.map((supermarket) => (
                    <Marker
                      key={supermarket.id}
                      position={[supermarket.latitude, supermarket.longitude]}
                      icon={createIcon(supermarket.hasPromotions)}
                      eventHandlers={{
                        click: () => setSelectedSupermarket(supermarket)
                      }}
                    >
                      <Popup>
                        <div className="min-w-[200px]">
                          <h3 className="font-semibold text-lg mb-2">
                            {supermarket.name}
                          </h3>
                          <p className="text-sm text-gray-600 mb-2">
                            {supermarket.address}
                          </p>
                          <div className="flex items-center gap-2 mb-2">
                            <Package className="h-4 w-4 text-gray-500" />
                            <span className="text-sm">{supermarket.productCount} produtos</span>
                          </div>
                          {supermarket.hasPromotions && (
                            <Badge variant="destructive" className="mb-2">
                              <Percent className="h-3 w-3 mr-1" />
                              Promoções ativas
                            </Badge>
                          )}
                          <Link href={`/customer/supermarket/${supermarket.id}/products?name=${encodeURIComponent(supermarket.name)}`}>
                            <Button size="sm" className="w-full">
                              Ver Produtos
                            </Button>
                          </Link>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Store className="h-5 w-5 text-green-600" />
                  Supermercados Encontrados
                </h2>
                <div className="space-y-3">
                  {mockSupermarkets.map((supermarket) => (
                    <div
                      key={supermarket.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedSupermarket?.id === supermarket.id
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedSupermarket(supermarket)}
                    >
                      <h3 className="font-medium text-gray-800">
                        {supermarket.name}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        {supermarket.address}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">{supermarket.productCount}</span>
                        </div>
                        {supermarket.hasPromotions && (
                          <Badge variant="destructive">
                            <Percent className="h-3 w-3 mr-1" />
                            Promoções
                          </Badge>
                        )}
                      </div>
                      <Link href={`/customer/supermarket/${supermarket.id}/products?name=${encodeURIComponent(supermarket.name)}`}>
                        <Button size="sm" className="w-full mt-2">
                          Ver Produtos
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Legend */}
            <Card>
              <CardContent className="p-4">
                <h3 className="font-medium mb-3">Legenda</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow"></div>
                    <span className="text-sm">Sua localização</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow"></div>
                    <span className="text-sm">Supermercado com promoções</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow"></div>
                    <span className="text-sm">Supermercado regular</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}