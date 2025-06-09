import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Package, Percent, Navigation, MapPin } from 'lucide-react';
import { useLocation } from 'wouter';
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
  const [location, setLocation] = useLocation();
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

      const locationPromise = new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, locationOptions);
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
    }
  }, [isMobile]);

  const { data: supermarkets = [] } = useQuery({
    queryKey: ['/api/customer/supermarkets/map'],
  });

  const validSupermarkets = (supermarkets as SupermarketLocation[]).filter((s: SupermarketLocation) => 
    s.latitude && s.longitude && 
    !isNaN(parseFloat(s.latitude.toString())) && 
    !isNaN(parseFloat(s.longitude.toString()))
  );

  const createIcon = (hasPromotions: boolean, productCount: number) => {
    // EcoMart color palette - Orange for supermarket markers
    const baseColor = '#FF7F00'; // eco-orange
    const promotionDot = hasPromotions ? '<div style="position: absolute; top: -2px; right: -2px; width: 8px; height: 8px; background-color: #2E7D57; border-radius: 50%; border: 1px solid white;"></div>' : '';
    
    return L.divIcon({
      html: `
        <div style="position: relative; display: flex; align-items: center; justify-content: center;">
          <div style="
            width: 30px;
            height: 30px;
            background-color: ${baseColor};
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            color: white;
            font-weight: bold;
          ">
            ${productCount}
          </div>
          ${promotionDot}
        </div>
      `,
      className: 'custom-div-icon',
      iconSize: [30, 30],
      iconAnchor: [15, 15],
    });
  };

  const requestLocation = () => {
    if (navigator.geolocation) {
      setLocationStatus('loading');
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
          setLocationStatus('granted');
        },
        (error) => {
          setLocationStatus('denied');
        }
      );
    } else {
      setLocationStatus('unavailable');
    }
  };

  const mapCenter = userLocation || defaultCenter;
  const mapZoom = userLocation ? 13 : 10;

  return (
    <div className="min-h-screen bg-eco-gray-light">
      {/* Header with back button */}
      <div className="bg-white shadow-sm border-b border-eco-green-light sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 py-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation('/home')}
            className="flex items-center gap-2 text-eco-gray hover:text-eco-gray-dark hover:bg-eco-gray-light"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          
          <div className="flex-1"></div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={requestLocation}
            disabled={locationStatus === 'loading'}
            className="flex items-center gap-1 border-eco-orange text-eco-orange hover:bg-eco-orange hover:text-white"
          >
            <Navigation className="h-4 w-4" />
            {locationStatus === 'loading' ? 'Localizando...' : 'Minha Localização'}
          </Button>
        </div>
      </div>

      {/* Map Container */}
      <div className="relative h-[calc(100vh-80px)]">
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          style={{ height: '100%', width: '100%' }}
          zoomControl={!isMobile}
        >
          <MapUpdater center={mapCenter} zoom={mapZoom} />
          
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* User location marker */}
          {userLocation && (
            <Marker position={userLocation}>
              <Popup>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <MapPin className="h-4 w-4 text-eco-blue" />
                    <span className="font-medium text-eco-gray-dark">Sua Localização</span>
                  </div>
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
                <div className="text-center min-w-[200px] p-2">
                  <h3 className="font-bold text-lg mb-2 text-eco-gray-dark">{supermarket.name}</h3>
                  <p className="text-sm text-eco-gray mb-3">{supermarket.address}</p>
                  
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <Badge variant="secondary" className="flex items-center gap-1 bg-eco-green-light text-eco-green-dark border-eco-green">
                      <Package className="h-3 w-3" />
                      {supermarket.productCount} produtos
                    </Badge>
                    {supermarket.hasPromotions && (
                      <Badge variant="destructive" className="flex items-center gap-1 bg-eco-orange text-white border-eco-orange">
                        <Percent className="h-3 w-3" />
                        Promoções
                      </Badge>
                    )}
                  </div>

                  <Button
                    onClick={() => setLocation(`/supermarket/${supermarket.id}/products`)}
                    className="w-full bg-eco-green hover:bg-eco-green-dark text-white font-semibold rounded-xl transition-colors"
                    size="sm"
                  >
                    Ver Produtos
                  </Button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Floating location status indicator */}
        {locationStatus === 'denied' && (
          <div className="absolute bottom-4 left-4 right-4 z-50">
            <div className="bg-eco-orange-light border border-eco-orange rounded-lg p-3 shadow-lg">
              <p className="text-sm text-eco-orange-dark text-center">
                Permita o acesso à localização para uma melhor experiência
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}