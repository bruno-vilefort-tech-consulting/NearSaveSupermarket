import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { MapPin, Package, Percent, Navigation } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import L from 'leaflet';

interface SupermarketLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  supermarketName: string;
}

interface SupermarketLocation {
  id: number;
  name: string;
  address: string;
  latitude: string;
  longitude: string;
  productCount: number;
  hasPromotions: boolean;
}

// Create custom icon for the supermarket
const createIcon = (hasPromotions: boolean, productCount: number) => {
  const iconColor = hasPromotions ? '#FF6B35' : '#2ECC71';
  const iconSize = productCount > 50 ? 35 : productCount > 20 ? 30 : 25;
  
  return L.divIcon({
    html: `
      <div style="
        background-color: ${iconColor};
        width: ${iconSize}px;
        height: ${iconSize}px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 12px;
      ">
        🏪
      </div>
    `,
    className: 'custom-div-icon',
    iconSize: [iconSize, iconSize],
    iconAnchor: [iconSize / 2, iconSize / 2],
  });
};

export default function SupermarketLocationModal({ isOpen, onClose, supermarketName }: SupermarketLocationModalProps) {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const defaultCenter: [number, number] = [-18.9188, -48.2766]; // Uberlândia center

  const { data: supermarket, isLoading } = useQuery<SupermarketLocation>({
    queryKey: [`/api/customer/supermarket/location/${encodeURIComponent(supermarketName)}`],
    enabled: isOpen && !!supermarketName,
  });

  // Get user location
  useEffect(() => {
    if (isOpen && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
        },
        (error) => {
          console.log('Geolocation error:', error);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
      );
    }
  }, [isOpen]);

  const openInMaps = () => {
    if (supermarket?.latitude && supermarket?.longitude) {
      const lat = parseFloat(supermarket.latitude);
      const lng = parseFloat(supermarket.longitude);
      
      // Try to open in Google Maps app first, fallback to web
      const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
      window.open(googleMapsUrl, '_blank');
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl w-[95vw] h-[90vh] p-0 overflow-hidden flex flex-col">
        <DialogHeader className="p-4 pb-2 flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-lg font-bold text-eco-gray-dark">
            <MapPin className="h-5 w-5 text-eco-green" />
            Localização do Supermercado
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="animate-spin w-8 h-8 border-4 border-eco-green border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-eco-gray">Carregando localização...</p>
            </div>
          </div>
        ) : supermarket ? (
          <div className="flex-1 flex flex-col">
            {/* Supermarket Info */}
            <div className="px-4 pb-2 flex-shrink-0">
              <div className="bg-eco-gray-light rounded-lg p-3">
                <h3 className="font-bold text-base mb-1 text-eco-gray-dark">{supermarket.name}</h3>
                <div className="flex items-center text-xs text-eco-gray mb-2">
                  <MapPin size={12} className="mr-1" />
                  {supermarket.address}
                </div>
                
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary" className="flex items-center gap-1 bg-eco-green-light text-eco-green-dark border-eco-green text-xs">
                    <Package className="h-2 w-2" />
                    {supermarket.productCount} produtos
                  </Badge>
                  {supermarket.hasPromotions && (
                    <Badge variant="destructive" className="flex items-center gap-1 bg-eco-orange text-white border-eco-orange text-xs">
                      <Percent className="h-2 w-2" />
                      Promoções
                    </Badge>
                  )}
                </div>

                <Button
                  onClick={openInMaps}
                  className="bg-eco-blue hover:bg-eco-blue-dark text-white font-semibold rounded-xl transition-colors flex items-center gap-1"
                  size="sm"
                >
                  <Navigation className="h-3 w-3" />
                  Como Chegar
                </Button>
              </div>
            </div>

            {/* Map */}
            <div className="flex-1 px-4 pb-4 min-h-0">
              <div className="h-full rounded-lg overflow-hidden border border-eco-gray-light">
                <MapContainer
                  center={supermarket.latitude && supermarket.longitude 
                    ? [parseFloat(supermarket.latitude), parseFloat(supermarket.longitude)]
                    : defaultCenter
                  }
                  zoom={15}
                  style={{ height: '100%', width: '100%' }}
                  className="z-0"
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  
                  {/* User location marker */}
                  {userLocation && (
                    <Marker 
                      position={userLocation}
                      icon={L.divIcon({
                        html: `
                          <div style="
                            background-color: #3B82F6;
                            width: 16px;
                            height: 16px;
                            border-radius: 50%;
                            border: 3px solid white;
                            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                          "></div>
                        `,
                        className: 'user-location-icon',
                        iconSize: [16, 16],
                        iconAnchor: [8, 8],
                      })}
                    >
                      <Popup>
                        <div className="text-center">
                          <p className="font-semibold text-eco-blue">Sua Localização</p>
                        </div>
                      </Popup>
                    </Marker>
                  )}

                  {/* Supermarket marker */}
                  {supermarket.latitude && supermarket.longitude && (
                    <Marker
                      position={[parseFloat(supermarket.latitude), parseFloat(supermarket.longitude)]}
                      icon={createIcon(supermarket.hasPromotions, supermarket.productCount)}
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
                            onClick={openInMaps}
                            className="w-full bg-eco-blue hover:bg-eco-blue-dark text-white font-semibold rounded-xl transition-colors flex items-center gap-2"
                            size="sm"
                          >
                            <Navigation className="h-4 w-4" />
                            Como Chegar
                          </Button>
                        </div>
                      </Popup>
                    </Marker>
                  )}
                </MapContainer>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <MapPin className="h-16 w-16 text-eco-gray mx-auto mb-4" />
              <p className="text-eco-gray">Localização não encontrada para este supermercado</p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}