import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, ShoppingCart, Store, MapPin, Package, ArrowRight, Leaf, LogOut, Menu, X } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { PushNotificationToggle } from "@/components/PushNotificationToggle";
import { MobilePushDiagnostic } from "@/components/MobilePushDiagnostic";

interface Supermarket {
  id: number;
  name: string;
  address: string;
  productCount: number;
}

interface SupermarketWithLocation {
  id: number;
  name: string;
  address: string;
  latitude: string | null;
  longitude: string | null;
  productCount: number;
  hasPromotions: boolean;
  distance?: number;
}

export default function CustomerHome() {
  const [, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [cartCount, setCartCount] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { t } = useLanguage();
  const [customerInfo, setCustomerInfo] = useState<any>(null);
  const [userLocation, setUserLocation] = useState<{latitude: number, longitude: number} | null>(null);
  const [locationPermission, setLocationPermission] = useState<'granted' | 'denied' | 'prompt' | 'loading'>('loading');

  // Função para calcular distância entre duas coordenadas usando fórmula de Haversine
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Raio da Terra em km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Obter localização do usuário
  const getUserLocation = () => {
    if (!navigator.geolocation) {
      console.log('Geolocalização não suportada pelo navegador');
      setLocationPermission('denied');
      return;
    }

    // Verificar permissão primeiro
    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        console.log('Status da permissão de geolocalização:', result.state);
        if (result.state === 'denied') {
          setLocationPermission('denied');
          return;
        }
      }).catch(() => {
        // Se não conseguir verificar a permissão, continua tentando obter localização
        console.log('Não foi possível verificar permissão, tentando obter localização...');
      });
    }

    console.log('Tentando obter localização do usuário...');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log('Localização obtida com sucesso:', {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
        setUserLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
        setLocationPermission('granted');
      },
      (error) => {
        console.error('Erro ao obter localização:', {
          code: error.code,
          message: error.message,
          errorTypes: {
            1: 'PERMISSION_DENIED',
            2: 'POSITION_UNAVAILABLE', 
            3: 'TIMEOUT'
          }
        });
        
        switch (error.code) {
          case 1: // PERMISSION_DENIED
            setLocationPermission('denied');
            break;
          case 2: // POSITION_UNAVAILABLE
          case 3: // TIMEOUT
            setLocationPermission('denied');
            break;
          default:
            setLocationPermission('denied');
        }
      },
      {
        enableHighAccuracy: false, // Mudar para false para ser mais compatível
        timeout: 15000, // Aumentar timeout
        maximumAge: 600000 // 10 minutos
      }
    );
  };

  // Carregar dados iniciais e obter localização
  useEffect(() => {
    const cartItems = JSON.parse(localStorage.getItem('cart') || '[]');
    const totalItems = cartItems.reduce((total: number, item: any) => total + item.quantity, 0);
    setCartCount(totalItems);

    const savedCustomer = localStorage.getItem('customerInfo');
    if (savedCustomer) {
      setCustomerInfo(JSON.parse(savedCustomer));
    }

    // Obter localização do usuário
    getUserLocation();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('customerInfo');
    localStorage.removeItem('cart');
    setCustomerInfo(null);
    navigate("/");
  };

  const { data: supermarkets, isLoading } = useQuery({
    queryKey: ["/api/customer/supermarkets-with-locations"],
  });

  // Filtrar supermercados por proximidade (20km) e termo de busca
  const filteredSupermarkets = React.useMemo(() => {
    if (!supermarkets || !Array.isArray(supermarkets)) return [];
    
    let filtered = supermarkets as SupermarketWithLocation[];
    
    // Se temos localização do usuário, filtrar por proximidade
    if (userLocation && locationPermission === 'granted') {
      filtered = filtered
        .map((supermarket: SupermarketWithLocation) => {
          if (supermarket.latitude && supermarket.longitude) {
            const distance = calculateDistance(
              userLocation.latitude,
              userLocation.longitude,
              parseFloat(supermarket.latitude),
              parseFloat(supermarket.longitude)
            );
            return { ...supermarket, distance };
          }
          return supermarket;
        })
        .filter((supermarket: SupermarketWithLocation) => {
          // Mostrar apenas supermercados dentro de 20km
          return !supermarket.distance || supermarket.distance <= 20;
        })
        .sort((a: SupermarketWithLocation, b: SupermarketWithLocation) => {
          // Ordenar por distância (mais próximos primeiro)
          if (a.distance && b.distance) return a.distance - b.distance;
          if (a.distance && !b.distance) return -1;
          if (!a.distance && b.distance) return 1;
          return 0;
        });
    }
    
    // Filtrar por termo de busca
    if (searchTerm) {
      filtered = filtered.filter((supermarket: SupermarketWithLocation) =>
        supermarket.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filtered;
  }, [supermarkets, userLocation, locationPermission, searchTerm]);

  const handleSupermarketClick = (supermarketId: number, supermarketName: string) => {
    navigate(`/customer/supermarket/${supermarketId}/products?name=${encodeURIComponent(supermarketName)}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">{t('customer.loadingSupermarkets')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                <Leaf className="text-white" size={20} />
              </div>
              <h1 className="text-lg font-bold text-gray-900">{t('landing.title')}</h1>
            </div>

            {/* Desktop Menu */}
            <div className="hidden lg:flex items-center space-x-4">
              <div className="hidden xl:block">
                <p className="text-sm text-gray-600">
                  {t('dashboard.welcome')}, <span className="font-medium">{customerInfo?.fullName}</span>
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/customer/eco-points")}
                className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
              >
                <Leaf size={16} className="mr-1" />
                {customerInfo?.ecoPoints || 0} pts
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/customer/orders")}
              >
                <Package size={16} className="mr-1" />
                {t('nav.myOrders')}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/customer/supermarket-map")}
                className="relative"
              >
                <MapPin size={16} className="mr-2" />
                Mapa
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/customer/cart")}
                className="relative"
              >
                <ShoppingCart size={16} className="mr-2" />
                {t('customer.cart')}
                {cartCount > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                    {cartCount}
                  </Badge>
                )}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-gray-600 hover:text-gray-900"
              >
                <LogOut size={16} className="mr-1" />
                {t('customer.logout')}
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <div className="lg:hidden flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/customer/supermarket-map")}
                className="relative"
              >
                <MapPin size={16} />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/customer/cart")}
                className="relative"
              >
                <ShoppingCart size={16} />
                {cartCount > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                    {cartCount}
                  </Badge>
                )}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2"
              >
                {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black bg-opacity-50" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="fixed right-0 top-0 h-full w-80 bg-white shadow-xl transform transition-transform duration-300">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">{t('customer.menu')}</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2"
                >
                  <X size={20} />
                </Button>
              </div>

              {/* User Info */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">{t('customer.hello')},</p>
                <p className="font-medium text-gray-900">{customerInfo?.fullName}</p>
                <div className="flex items-center mt-2">
                  <Leaf size={16} className="text-green-600 mr-1" />
                  <span className="text-sm font-medium text-green-700">
                    {customerInfo?.ecoPoints || 0} {t('customer.ecoPointsFooter')}
                  </span>
                </div>
              </div>

              {/* Menu Items */}
              <div className="space-y-3">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-left h-12"
                  onClick={() => {
                    navigate("/customer/eco-points");
                    setIsMobileMenuOpen(false);
                  }}
                >
                  <Leaf size={20} className="mr-3 text-green-600" />
                  <div>
                    <div className="font-medium">{t('customer.ecoPointsFooter')}</div>
                    <div className="text-xs text-gray-500">{customerInfo?.ecoPoints || 0} {t('customer.pointsAvailable')}</div>
                  </div>
                </Button>

                <Button
                  variant="ghost"
                  className="w-full justify-start text-left h-12"
                  onClick={() => {
                    navigate("/customer/orders");
                    setIsMobileMenuOpen(false);
                  }}
                >
                  <Package size={20} className="mr-3 text-blue-600" />
                  <div>
                    <div className="font-medium">{t('nav.myOrders')}</div>
                    <div className="text-xs text-gray-500">{t('customer.purchaseHistory')}</div>
                  </div>
                </Button>

                <Button
                  variant="ghost"
                  className="w-full justify-start text-left h-12"
                  onClick={() => {
                    navigate("/customer/cart");
                    setIsMobileMenuOpen(false);
                  }}
                >
                  <ShoppingCart size={20} className="mr-3 text-orange-600" />
                  <div>
                    <div className="font-medium">{t('customer.cart')}</div>
                    <div className="text-xs text-gray-500">
                      {cartCount > 0 ? `${cartCount} ${t('customer.items')}` : t('customer.empty')}
                    </div>
                  </div>
                </Button>

                <hr className="my-4" />

                {/* Push Notifications Toggle */}
                {customerInfo?.email && (
                  <div className="mb-4">
                    <PushNotificationToggle customerEmail={customerInfo.email} />
                  </div>
                )}

                <Button
                  variant="ghost"
                  className="w-full justify-start text-left h-12 text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => {
                    handleLogout();
                    setIsMobileMenuOpen(false);
                  }}
                >
                  <LogOut size={20} className="mr-3" />
                  <div>
                    <div className="font-medium">{t('customer.logout')}</div>
                    <div className="text-xs text-gray-500">{t('customer.logoutAction')}</div>
                  </div>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Eco Points Highlight */}
        <Card className="mb-8 bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="bg-green-100 p-3 rounded-full">
                  <Leaf size={24} className="text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {t('customer.ecoPointsProgram')}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {t('customer.youHave')} <span className="font-bold text-green-600">{customerInfo?.ecoPoints || 0} {t('customer.points')}</span> {t('customer.sustainablePurchases')}
                  </p>
                </div>
              </div>
              <Button
                onClick={() => navigate("/customer/eco-points")}
                className="bg-green-600 hover:bg-green-700"
              >
                {t('customer.learnMore')}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Location Status */}
        {locationPermission === 'loading' && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center">
              <MapPin className="animate-pulse text-blue-600 mr-2" size={20} />
              <span className="text-blue-800">Obtendo sua localização...</span>
            </div>
          </div>
        )}
        
        {locationPermission === 'denied' && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="space-y-3">
              <div className="flex items-center">
                <MapPin className="text-blue-600 mr-2" size={20} />
                <span className="text-blue-800 font-medium">Ativar localização para supermercados próximos</span>
              </div>
              <p className="text-sm text-blue-700">
                Para ver apenas supermercados próximos (20km), você precisa:
              </p>
              <ul className="text-sm text-blue-700 list-disc list-inside space-y-1">
                <li>Clicar no ícone 🔒 ou ⓘ ao lado da URL no navegador</li>
                <li>Alterar "Localização" para "Permitir"</li>
                <li>Recarregar a página ou clicar no botão abaixo</li>
              </ul>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  console.log('Tentando reativar localização...');
                  getUserLocation();
                }}
                className="border-blue-300 text-blue-700 hover:bg-blue-100"
              >
                Tentar Novamente
              </Button>
            </div>
          </div>
        )}

        {locationPermission === 'granted' && userLocation && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <MapPin className="text-green-600 mr-2" size={20} />
              <span className="text-green-800">Mostrando supermercados próximos (até 20km)</span>
            </div>
          </div>
        )}

        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            {t('customer.supermarketsWithOffers')}
          </h2>
          <p className="text-sm text-gray-600">
            {locationPermission === 'granted' ? 'Supermercados próximos com as melhores ofertas' : t('customer.findBestDiscounts')}
          </p>
        </div>

        {/* Search */}
        <div className="mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder={t('customer.searchSupermarkets')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Supermarkets Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSupermarkets.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Store size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {t('customer.noSupermarketsFound')}
              </h3>
              <p className="text-gray-600">
                {searchTerm ? t('customer.tryAnotherSearch') : t('customer.noSupermarketsAvailable')}
              </p>
            </div>
          ) : (
            filteredSupermarkets.map((supermarket: SupermarketWithLocation) => (
              <Card
                key={supermarket.id}
                className="hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-green-600"
                onClick={() => handleSupermarketClick(supermarket.id, supermarket.name)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                        <Store className="text-green-600" size={24} />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-semibold text-gray-900">
                          {supermarket.name}
                        </CardTitle>
                        <div className="flex items-center text-sm text-gray-600 mt-1">
                          <MapPin size={14} className="mr-1" />
                          {supermarket.address}
                        </div>
                        {supermarket.distance && (
                          <div className="flex items-center text-xs text-blue-600 mt-1 font-medium">
                            <MapPin size={12} className="mr-1" />
                            {supermarket.distance.toFixed(1)} km de distância
                          </div>
                        )}
                      </div>
                    </div>
                    <ArrowRight className="text-gray-400" size={20} />
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Package className="text-green-600" size={16} />
                      <span className="text-sm font-medium text-gray-700">
                        {supermarket.productCount} {t('customer.productsOnSale')}
                      </span>
                    </div>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      {t('customer.available')}
                    </Badge>
                  </div>

                  <div className="mt-4">
                    <Button
                      className="w-full bg-green-600 hover:bg-green-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSupermarketClick(supermarket.id, supermarket.name);
                      }}
                    >
                      {t('customer.viewProducts')}
                      <ArrowRight size={16} className="ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>



      </div>
    </div>
  );
}