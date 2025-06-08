import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, Plus, Minus, Trash2, MapPin, Clock, User, Phone, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLanguage } from "@/hooks/useLanguage";

interface CartItem {
  id: number;
  name: string;
  originalPrice: string;
  discountPrice: string;
  quantity: number;
  imageUrl?: string;
  expirationDate: string;
  supermarketId?: string;
  supermarketName?: string;
  createdBy?: {
    supermarketName?: string;
    supermarketAddress?: string;
  };
}

export default function CustomerCart() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { t, language } = useLanguage();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [deliveryType, setDeliveryType] = useState("pickup");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [customerInfo, setCustomerInfo] = useState<any>(null);

  // Debug: verificar idioma atual
  console.log('Cart component loaded - Language:', language);
  console.log('Cart title translation:', t('cart.title'));
  console.log('Current URL:', window.location.href);
  console.log('Component ID: CART_COMPONENT_PT_BR_v3');
  
  // Force clear localStorage cache for translations
  useEffect(() => {
    console.log('Cart component mounted with language:', language);
    console.log('Translation test - empty cart:', t('cart.empty'));
    console.log('Translation test - continue shopping:', t('cart.continueShopping'));
  }, [language]);

  // Carregar itens do carrinho e informações do cliente do localStorage
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      setCartItems(JSON.parse(savedCart));
    }

    const savedCustomer = localStorage.getItem('customerInfo');
    if (savedCustomer) {
      setCustomerInfo(JSON.parse(savedCustomer));
    }
  }, []);

  // Salvar no localStorage sempre que o carrinho for atualizado
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const formatPrice = (price: string) => {
    return `R$ ${parseFloat(price).toFixed(2).replace('.', ',')}`;
  };

  const updateQuantity = (id: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      const updatedItems = cartItems.filter(item => item.id !== id);
      setCartItems(updatedItems);
      // Se o carrinho ficar vazio, limpar também o ID do supermercado
      if (updatedItems.length === 0) {
        localStorage.removeItem('cartSupermarketId');
      }
    } else {
      setCartItems(cartItems.map(item => 
        item.id === id ? { ...item, quantity: newQuantity } : item
      ));
    }
  };

  const removeItem = (id: number) => {
    const updatedItems = cartItems.filter(item => item.id !== id);
    setCartItems(updatedItems);
    // Se o carrinho ficar vazio, limpar também o ID do supermercado
    if (updatedItems.length === 0) {
      localStorage.removeItem('cartSupermarketId');
    }
  };

  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem('cart');
    localStorage.removeItem('cartSupermarketId');
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      return total + (parseFloat(item.discountPrice) * item.quantity);
    }, 0);
  };

  const calculateSavings = () => {
    return cartItems.reduce((savings, item) => {
      const originalTotal = parseFloat(item.originalPrice) * item.quantity;
      const discountTotal = parseFloat(item.discountPrice) * item.quantity;
      return savings + (originalTotal - discountTotal);
    }, 0);
  };

  // Agrupar itens por supermercado
  const getSupermarckets = () => {
    const supermarkets = new Map();
    
    cartItems.forEach(item => {
      const supermarketName = item.createdBy?.supermarketName || "Supermercado";
      const supermarketAddress = item.createdBy?.supermarketAddress || "Endereço não informado";
      
      if (!supermarkets.has(supermarketName)) {
        supermarkets.set(supermarketName, {
          name: supermarketName,
          address: supermarketAddress,
          items: []
        });
      }
      
      supermarkets.get(supermarketName).items.push(item);
    });
    
    return Array.from(supermarkets.values());
  };

  const createOrderMutation = useMutation({
    mutationFn: async (orderData: any) => {
      const response = await fetch("/api/public/orders", {
        method: "POST",
        body: JSON.stringify(orderData),
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: t('cart.orderSuccess'),
        description: t('cart.orderSuccessDescription'),
      });
      clearCart();
      navigate("/customer");
    },
    onError: (error) => {
      console.error("Erro ao criar pedido:", error);
      toast({
        title: t('cart.orderError'),
        description: t('cart.orderErrorDescription'),
        variant: "destructive",
      });
    },
  });

  const handleCheckout = async () => {
    if (deliveryType === "delivery" && !deliveryAddress.trim()) {
      toast({
        title: t('cart.addressRequired'),
        description: t('cart.addressRequiredDescription'),
        variant: "destructive",
      });
      return;
    }

    // Verificar se há informações do cliente
    if (!customerInfo?.fullName || !customerInfo?.email) {
      toast({
        title: t('cart.requiredInfo'),
        description: t('cart.requiredInfoDescription'),
        variant: "destructive",
      });
      return;
    }

    // Salvar dados do pedido para a tela de revisão
    const orderData = {
      customerName: customerInfo.fullName,
      customerEmail: customerInfo.email,
      customerPhone: customerInfo.phone || "",
      deliveryType,
      deliveryAddress: deliveryType === "delivery" ? deliveryAddress : null,
      totalAmount: (calculateTotal() + (deliveryType === "delivery" ? 5 : 0)).toFixed(2),
      items: cartItems.map(item => ({
        productId: item.id,
        productName: item.name,
        quantity: item.quantity,
        priceAtTime: item.discountPrice,
        imageUrl: item.imageUrl,
        expirationDate: item.expirationDate,
        supermarketName: item.createdBy?.supermarketName || item.supermarketName
      }))
    };

    localStorage.setItem('orderReview', JSON.stringify(orderData));
    
    // Redirecionar para tela de revisão do pedido
    navigate('/order-review');
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-eco-gray-light">
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-md mx-auto px-4 py-4 flex items-center">
            <Link href="/customer">
              <ArrowLeft className="h-6 w-6 text-eco-gray" />
            </Link>
            <div className="ml-4">
              <h1 className="text-lg font-bold text-eco-gray-dark">{t('cart.title')} - v2.0 {new Date().getTime()}</h1>
              <small className="text-xs text-red-500">Lang: {language} | Cart Updated</small>
            </div>
          </div>
        </div>

        <div className="max-w-md mx-auto p-4 pt-8">
          <div className="text-center">
            <div className="mb-4">
              <div className="w-16 h-16 bg-eco-orange-light rounded-full mx-auto flex items-center justify-center">
                <span className="text-2xl">🛒</span>
              </div>
            </div>
            <div className="bg-red-100 p-2 rounded mb-4">
              <p className="text-xs text-red-600">CART COMPONENT PT-BR v5 - {Date.now()}</p>
            </div>
            <h2 className="text-xl font-semibold mb-2 text-eco-gray-dark">SEU CARRINHO ESTÁ VAZIO</h2>
            <p className="text-eco-gray mb-6">Adicione produtos para começar suas compras sustentáveis</p>
            <Link href="/customer">
              <Button className="w-full bg-eco-green hover:bg-eco-green-dark text-white font-semibold py-2 rounded-xl transition-colors">
                CONTINUAR COMPRANDO
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const supermarkets = getSupermarckets();

  return (
    <div className="min-h-screen bg-eco-gray-light">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center">
          <Link href="/customer">
            <ArrowLeft className="h-6 w-6 text-eco-gray" />
          </Link>
          <div className="ml-4">
            <h1 className="text-lg font-semibold text-eco-gray-dark">{t('cart.title')} ({cartItems.length})</h1>
            <p className="text-sm text-eco-gray">
              {supermarkets.length === 1 
                ? `${supermarkets[0].name}` 
                : `${supermarkets.length} ${t('cart.supermarkets')}`
              }
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-4">
        {/* Itens do Carrinho agrupados por Supermercado */}
        {supermarkets.map((supermarket, index) => (
          <div key={index} className="space-y-3">
            {/* Header do Supermercado */}
            <div className="bg-eco-green-light p-3 rounded-lg border-l-4 border-eco-green">
              <h3 className="font-semibold text-eco-green-dark">{supermarket.name}</h3>
              <div className="flex items-center text-sm text-eco-green mt-1">
                <MapPin size={12} className="mr-1" />
                {supermarket.address}
              </div>
            </div>

            {/* Itens do Supermercado */}
            {supermarket.items.map((item: CartItem) => (
              <Card key={item.id} className="bg-white border-eco-green-light">
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    {item.imageUrl && (
                      <img 
                        src={item.imageUrl} 
                        alt={item.name}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                    )}
                    <div className="flex-1">
                      <h4 className="font-medium text-sm text-eco-gray-dark">{item.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="h-3 w-3 text-eco-orange" />
                        <span className="text-xs text-eco-orange">
                          {t('cart.validUntil')} {new Date(item.expirationDate).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <div>
                          <span className="text-sm font-semibold text-eco-green">
                            {formatPrice(item.discountPrice)}
                          </span>
                          <span className="text-xs text-eco-gray line-through ml-2">
                            {formatPrice(item.originalPrice)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0 border-eco-green hover:bg-eco-green hover:text-white"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="text-sm font-medium w-8 text-center text-eco-gray-dark">
                            {item.quantity}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0 border-eco-green hover:bg-eco-green hover:text-white"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700 border-red-300 hover:border-red-500"
                            onClick={() => removeItem(item.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ))}

        {/* Informações do Cliente */}
        {customerInfo && (
          <Card className="bg-white border-eco-blue-light">
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3 text-eco-gray-dark">{t('cart.customerData')}</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-eco-blue" />
                  <span className="text-eco-gray-dark">{customerInfo.fullName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-eco-blue" />
                  <span className="text-eco-gray-dark">{customerInfo.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-eco-blue" />
                  <span className="text-eco-gray-dark">{customerInfo.email}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Informações do Cliente */}
        <Card className="bg-white border-eco-blue-light">
          <CardContent className="p-4">
            <h3 className="font-semibold mb-3 text-eco-gray-dark flex items-center gap-2">
              <User className="h-4 w-4 text-eco-blue" />
              {t('cart.customerInfo')}
            </h3>
            <div className="space-y-3">
              <div>
                <Label htmlFor="fullName" className="text-eco-gray-dark">{t('cart.fullName')}</Label>
                <Input
                  id="fullName"
                  value={customerInfo?.fullName || ""}
                  onChange={(e) => {
                    const updated = { ...customerInfo, fullName: e.target.value };
                    setCustomerInfo(updated);
                    localStorage.setItem('customerInfo', JSON.stringify(updated));
                  }}
                  placeholder={t('cart.fullNamePlaceholder')}
                  className="border-eco-gray-light focus:border-eco-blue focus:ring-eco-blue"
                />
              </div>
              <div>
                <Label htmlFor="email" className="text-eco-gray-dark flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  {t('cart.email')}
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={customerInfo?.email || ""}
                  onChange={(e) => {
                    const updated = { ...customerInfo, email: e.target.value };
                    setCustomerInfo(updated);
                    localStorage.setItem('customerInfo', JSON.stringify(updated));
                  }}
                  placeholder={t('cart.emailPlaceholder')}
                  className="border-eco-gray-light focus:border-eco-blue focus:ring-eco-blue"
                />
              </div>
              <div>
                <Label htmlFor="phone" className="text-eco-gray-dark flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {t('cart.phone')}
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={customerInfo?.phone || ""}
                  onChange={(e) => {
                    const updated = { ...customerInfo, phone: e.target.value };
                    setCustomerInfo(updated);
                    localStorage.setItem('customerInfo', JSON.stringify(updated));
                  }}
                  placeholder={t('cart.phonePlaceholder')}
                  className="border-eco-gray-light focus:border-eco-blue focus:ring-eco-blue"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tipo de Entrega */}
        <Card className="bg-white border-eco-orange-light">
          <CardContent className="p-4">
            <h3 className="font-semibold mb-3 text-eco-gray-dark">{t('cart.deliveryMethod')}</h3>
            <RadioGroup value={deliveryType} onValueChange={setDeliveryType}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pickup" id="pickup" />
                <Label htmlFor="pickup" className="flex-1 text-eco-gray-dark">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-eco-orange" />
                    <span>{t('cart.pickupFree')}</span>
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="delivery" id="delivery" />
                <Label htmlFor="delivery" className="flex-1 text-eco-gray-dark">
                  <div className="flex items-center gap-2">
                    <span>🚚</span>
                    <span>{t('cart.deliveryFee')}</span>
                  </div>
                </Label>
              </div>
            </RadioGroup>
            
            {deliveryType === "delivery" && (
              <div className="mt-3">
                <Label htmlFor="address" className="text-eco-gray-dark">{t('cart.deliveryAddress')}</Label>
                <Input
                  id="address"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder={t('cart.deliveryAddressPlaceholder')}
                  className="border-eco-gray-light focus:border-eco-orange focus:ring-eco-orange"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Resumo do Pedido */}
        <Card className="bg-white border-eco-green-light">
          <CardContent className="p-4">
            <h3 className="font-semibold mb-3 text-eco-gray-dark">{t('cart.orderSummary')}</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-eco-gray-dark">{t('cart.subtotal')}</span>
                <span className="text-eco-gray-dark">{formatPrice(calculateTotal().toString())}</span>
              </div>
              <div className="flex justify-between text-eco-green">
                <span>{t('cart.savings')}</span>
                <span>-{formatPrice(calculateSavings().toString())}</span>
              </div>
              {deliveryType === "delivery" && (
                <div className="flex justify-between">
                  <span className="text-eco-gray-dark">{t('cart.delivery')}</span>
                  <span className="text-eco-gray-dark">R$ 5,00</span>
                </div>
              )}
              <div className="border-t border-eco-green-light pt-2 flex justify-between font-semibold">
                <span className="text-eco-gray-dark">{t('cart.total')}</span>
                <span className="text-eco-gray-dark">{formatPrice((calculateTotal() + (deliveryType === "delivery" ? 5 : 0)).toString())}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Botão de Finalizar */}
        <Button 
          className="w-full bg-eco-green hover:bg-eco-green-dark text-white font-semibold h-12 rounded-xl transition-colors"
          onClick={handleCheckout}
          disabled={createOrderMutation.isPending}
        >
          {createOrderMutation.isPending ? t('cart.processing') : t('cart.finishOrder')}
        </Button>
      </div>
    </div>
  );
}