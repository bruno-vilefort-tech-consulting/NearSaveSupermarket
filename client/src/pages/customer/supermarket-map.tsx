import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { MapPin, Store, Package, Percent } from 'lucide-react';
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

// Component to update map center for mobile
function MapUpdater({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, zoom);
  }, [map, center, zoom]);
  
  return null;
}

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
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const defaultCenter: [number, number] = [-18.9188, -48.2766];
  const [selectedSupermarket, setSelectedSupermarket] = useState<SupermarketLocation | null>(null);
  const [locationStatus, setLocationStatus] = useState<'loading' | 'granted' | 'denied' | 'unavailable'>('loading');
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Auto-request location on mobile
  useEffect(() => {
    if (isMobile && navigator.geolocation) {
      const locationOptions = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
          setLocationStatus('granted');
        },
        (error) => {
          console.log('Geolocation error:', error.code, error.message);
          setLocationStatus('denied');
          // Fallback with lower accuracy for mobile
          if (error.code === 1) {
            setTimeout(() => {
              navigator.geolocation.getCurrentPosition(
                (position) => {
                  setUserLocation([position.coords.latitude, position.coords.longitude]);
                  setLocationStatus('granted');
                },
                () => setLocationStatus('denied'),
                { enableHighAccuracy: false, timeout: 15000, maximumAge: 0 }
              );
            }, 2000);
          }
        },
        locationOptions
      );
    } else {
      setLocationStatus('unavailable');
    }
  }, [isMobile]);

  const requestLocation = () => {
    setLocationStatus('loading');
    
    if (!navigator.geolocation) {
      setLocationStatus('unavailable');
      return;
    }

    const locationPromise = new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: false,
        timeout: 8000,
        maximumAge: 300000
      });
    });

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Timeout')), 5000);
    });

    Promise.race([locationPromise, timeoutPromise])
      .then((position) => {
        setUserLocation([position.coords.latitude, position.coords.longitude]);
        setLocationStatus('granted');
      })
      .catch((error) => {
        console.log('Geolocation error:', error.code || 'timeout', error.message || 'timeout');
        setLocationStatus('denied');
      });
  };

  const { data: supermarkets = [] } = useQuery({
    queryKey: ['/api/customer/supermarkets/map'],
  });

  const validSupermarkets = (supermarkets as SupermarketLocation[]).filter((s: SupermarketLocation) => 
    s.latitude && s.longitude && 
    !isNaN(parseFloat(s.latitude.toString())) && 
    !isNaN(parseFloat(s.longitude.toString()))
  );

  const createIcon = (hasPromotions: boolean, productCount: number) => {
    const baseColor = hasPromotions ? '#dc2626' : '#059669';
    const promotionDot = hasPromotions ? '<div style="position: absolute; top: -2px; right: -2px; width: 8px; height: 8px; background-color: #fbbf24; border-radius: 50%; border: 1px solid white;"></div>' : '';
    
    return L.divIcon({
      html: `
        <div style="position: relative; background-color: ${baseColor}; color: white; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 12px; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">
          ${productCount}
          ${promotionDot}
        </div>
      `,
      className: 'supermarket-marker',
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-7xl mx-auto">
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

        {/* Mobile-Optimized Location Info */}
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <MapPin className="h-5 w-5 text-blue-600 mr-3" />
              <div>
                <p className="text-sm font-bold text-blue-800 mb-1">
                  {locationStatus === 'granted' ? '✅ Sua localização ativa' : '🗺️ Mapa de Supermercados'}
                </p>
                <p className="text-sm text-blue-700">
                  {locationStatus === 'granted' 
                    ? 'Você está no mapa (ponto azul piscando)'
                    : `${validSupermarkets.length} supermercados na região`
                  }
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2 ml-4">
              {locationStatus !== 'granted' && (
                <Button 
                  onClick={requestLocation} 
                  size="sm" 
                  variant="outline"
                  disabled={locationStatus === 'loading'}
                >
                  {locationStatus === 'loading' ? 'Aguardando...' : 'Minha Localização'}
                </Button>
              )}
            </div>
          </div>
        </div>

        {locationStatus === 'denied' && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center">
              <div className="text-yellow-600 mr-3">⚠️</div>
              <div>
                <p className="text-sm font-semibold text-yellow-800 mb-1">
                  Localização não disponível
                </p>
                <p className="text-sm text-gray-600">
                  Permita acesso à localização para ver supermercados próximos
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
                  center={userLocation || defaultCenter}
                  zoom={userLocation ? 13 : 10}
                  className="h-full w-full"
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  
                  {/* Map Controller for Mobile */}
                  <MapUpdater center={userLocation || defaultCenter} zoom={userLocation ? 13 : 10} />
                  
                  {/* User location */}
                  {userLocation && (
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
                  )}

                  {/* Supermarket markers */}
                  {validSupermarkets.map((supermarket: SupermarketLocation) => (
                    <Marker
                      key={supermarket.id}
                      position={[parseFloat(supermarket.latitude.toString()), parseFloat(supermarket.longitude.toString())]}
                      icon={createIcon(supermarket.hasPromotions, supermarket.productCount)}
                      eventHandlers={{
                        click: () => setSelectedSupermarket(supermarket)
                      }}
                    >
                      <Popup>
                        <div className="text-center min-w-[200px]">
                          <h3 className="font-bold text-lg mb-2">{supermarket.name}</h3>
                          <p className="text-sm text-gray-600 mb-2">{supermarket.address}</p>
                          <div className="flex items-center justify-center gap-2 mb-3">
                            <Badge variant="secondary" className="flex items-center gap-1">
                              <Package className="h-3 w-3" />
                              {supermarket.productCount} produtos
                            </Badge>
                            {supermarket.hasPromotions && (
                              <Badge variant="destructive" className="flex items-center gap-1">
                                <Percent className="h-3 w-3" />
                                Promoções
                              </Badge>
                            )}
                          </div>
                          <Link href={`/customer/supermarket/${supermarket.id}`}>
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
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <Store className="h-5 w-5 text-green-600" />
                  Supermercados Próximos
                </h3>
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {validSupermarkets.map((supermarket: SupermarketLocation) => (
                    <div
                      key={supermarket.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedSupermarket?.id === supermarket.id
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedSupermarket(supermarket)}
                    >
                      <h4 className="font-semibold mb-1">{supermarket.name}</h4>
                      <p className="text-sm text-gray-600 mb-2">{supermarket.address}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Package className="h-3 w-3" />
                          {supermarket.productCount}
                        </Badge>
                        {supermarket.hasPromotions && (
                          <Badge variant="destructive" className="flex items-center gap-1">
                            <Percent className="h-3 w-3" />
                            Promoções
                          </Badge>
                        )}
                      </div>
                      <Link href={`/customer/supermarket/${supermarket.id}`}>
                        <Button size="sm" variant="outline" className="w-full mt-2">
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
                <h3 className="font-bold text-lg mb-4">Legenda</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-blue-500 rounded-full border-2 border-white"></div>
                    <span className="text-sm">Sua localização</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-green-600 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold">5</div>
                    <span className="text-sm">Supermercado (número = produtos)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="relative w-6 h-6 bg-red-600 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold">
                      3
                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full border border-white"></div>
                    </div>
                    <span className="text-sm">Com promoções (ponto dourado)</span>
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