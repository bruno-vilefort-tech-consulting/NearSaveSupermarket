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
  latitude: string | number;
  longitude: string | number;
  productCount: number;
  hasPromotions: boolean;
}

export default function SupermarketMap() {
  // const { t } = useLanguage();
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [selectedSupermarket, setSelectedSupermarket] = useState<SupermarketLocation | null>(null);
  const [locationStatus, setLocationStatus] = useState<'loading' | 'granted' | 'denied' | 'unavailable'>('loading');
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile device and initialize
  useEffect(() => {
    // Detect if it's a mobile device
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    setIsMobile(isMobileDevice);
    
    // Start with São Paulo center as default
    setUserLocation([-23.5505, -46.6333]);
    
    // On mobile, don't auto-request location (browsers block it)
    // User must explicitly click the button
    if (!isMobileDevice && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
          setLocationStatus('granted');
        },
        (error) => {
          console.log('Location access denied or unavailable');
          setLocationStatus('denied');
        },
        {
          enableHighAccuracy: false,
          timeout: 15000,
          maximumAge: 300000
        }
      );
    } else if (!navigator.geolocation) {
      setLocationStatus('unavailable');
    } else {
      // Mobile device - wait for user interaction
      setLocationStatus('denied');
    }
  }, []);

  const requestLocation = () => {
    setLocationStatus('loading');
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
          setLocationStatus('granted');
        },
        (error) => {
          console.log('Geolocation error:', error.code, error.message);
          setLocationStatus('denied');
        },
        {
          enableHighAccuracy: false, // Better for mobile battery and faster
          timeout: 15000, // Longer timeout for mobile networks
          maximumAge: 300000 // Accept cached position up to 5 minutes
        }
      );
    } else {
      setLocationStatus('unavailable');
    }
  };

  // Fetch real supermarket data with locations
  const { data: supermarkets = [], isLoading: isLoadingSupermarkets } = useQuery({
    queryKey: ['/api/customer/supermarkets/map'],
  });

  // Filter supermarkets that have valid coordinates
  const validSupermarkets = (supermarkets as SupermarketLocation[]).filter((s: SupermarketLocation) => 
    s.latitude && s.longitude && 
    !isNaN(parseFloat(s.latitude.toString())) && !isNaN(parseFloat(s.longitude.toString()))
  );

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

  if (!userLocation || isLoadingSupermarkets) {
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

        {/* Location Info */}
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <MapPin className="h-5 w-5 text-blue-600 mr-3" />
              <div>
                <p className="text-sm font-bold text-blue-800 mb-1">
                  {locationStatus === 'granted' ? '✅ Localização ativada' : '📍 Mapa de Supermercados'}
                </p>
                <p className="text-sm text-blue-700">
                  {locationStatus === 'granted' 
                    ? 'Sua localização está sendo exibida no mapa (ponto azul piscando)'
                    : 'Veja todos os supermercados disponíveis na região de São Paulo'
                  }
                </p>
                {locationStatus === 'denied' && isMobile && (
                  <div className="mt-2 p-3 bg-amber-50 rounded border-l-4 border-amber-400">
                    <p className="text-xs font-semibold text-amber-800 mb-2">
                      📱 Como ativar localização no Android:
                    </p>
                    <ol className="text-xs text-amber-700 space-y-1 list-decimal list-inside">
                      <li>Clique no botão "🔓 Permitir Localização" abaixo</li>
                      <li>Na popup que aparecer, escolha "Permitir"</li>
                      <li>Se não aparecer popup, toque no ícone 🔒 na barra de endereço</li>
                      <li>Toque em "Localização" e selecione "Permitir"</li>
                    </ol>
                  </div>
                )}
                {locationStatus === 'denied' && !isMobile && (
                  <p className="text-xs text-amber-600 mt-2">
                    💡 Clique em "Permitir" quando o navegador solicitar sua localização
                  </p>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-2 ml-4">
              {locationStatus !== 'granted' && (
                <Button 
                  onClick={requestLocation} 
                  size="sm" 
                  variant={isMobile ? "default" : "outline"}
                  disabled={locationStatus === 'loading'}
                  className={isMobile ? "bg-blue-600 hover:bg-blue-700 text-white font-semibold" : ""}
                >
                  {locationStatus === 'loading' ? 'Aguardando...' : isMobile ? '🔓 Permitir Localização' : 'Tentar Localização'}
                </Button>
              )}
              {validSupermarkets.length > 0 && (
                <Button 
                  onClick={() => {
                    // Calculate center of all supermarkets
                    const avgLat = validSupermarkets.reduce((sum, s) => sum + parseFloat(s.latitude.toString()), 0) / validSupermarkets.length;
                    const avgLng = validSupermarkets.reduce((sum, s) => sum + parseFloat(s.longitude.toString()), 0) / validSupermarkets.length;
                    setUserLocation([avgLat, avgLng]);
                  }}
                  size="sm" 
                  variant="default"
                  className="bg-green-600 hover:bg-green-700"
                >
                  Ver Todos
                </Button>
              )}
            </div>
          </div>
        </div>

        {locationStatus === 'unavailable' && (
          <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="flex items-center">
              <MapPin className="h-5 w-5 text-gray-600 mr-2" />
              <div>
                <p className="text-sm font-medium text-gray-800">
                  Geolocalização não disponível
                </p>
                <p className="text-sm text-gray-600">
                  Seu navegador não suporta geolocalização. Exibindo localização padrão.
                </p>
              </div>
            </div>
          </div>
        )}

        {locationStatus === 'granted' && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-500 rounded-full mr-3 animate-pulse"></div>
              <p className="text-sm text-green-800">
                ✅ Sua localização atual está sendo exibida no mapa (ponto azul)
              </p>
            </div>
          </div>
        )}

        {locationStatus === 'loading' && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center">
              <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full mr-3"></div>
              <p className="text-sm text-blue-800">
                Solicitando permissão para acessar sua localização...
              </p>
            </div>
          </div>
        )}

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
                  {validSupermarkets.map((supermarket) => (
                    <Marker
                      key={supermarket.id}
                      position={[parseFloat(supermarket.latitude.toString()), parseFloat(supermarket.longitude.toString())]}
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
                  {validSupermarkets.map((supermarket) => (
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