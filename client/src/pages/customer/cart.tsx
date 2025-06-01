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

interface CartItem {
  id: number;
  name: string;
  originalPrice: string;
  discountPrice: string;
  quantity: number;
  imageUrl?: string;
  expirationDate: string;
  createdBy?: {
    supermarketName?: string;
    supermarketAddress?: string;
  };
}

export default function CustomerCart() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [deliveryType, setDeliveryType] = useState("pickup");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [customerInfo, setCustomerInfo] = useState<any>(null);

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
      setCartItems(cartItems.filter(item => item.id !== id));
    } else {
      setCartItems(cartItems.map(item => 
        item.id === id ? { ...item, quantity: newQuantity } : item
      ));
    }
  };

  const removeItem = (id: number) => {
    setCartItems(cartItems.filter(item => item.id !== id));
  };

  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem('cart');
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
        title: "Pedido realizado com sucesso!",
        description: "Você receberá uma confirmação em breve.",
      });
      clearCart();
      navigate("/customer");
    },
    onError: (error) => {
      console.error("Erro ao criar pedido:", error);
      toast({
        title: "Erro ao finalizar pedido",
        description: "Tente novamente ou entre em contato conosco.",
        variant: "destructive",
      });
    },
  });

  const handleCheckout = () => {
    if (deliveryType === "delivery" && !deliveryAddress.trim()) {
      toast({
        title: "Endereço obrigatório",
        description: "Por favor, informe o endereço para entrega.",
        variant: "destructive",
      });
      return;
    }

    // Salvar dados do pedido
    localStorage.setItem('orderData', JSON.stringify({
      customerName: customerInfo?.fullName || "",
      customerEmail: customerInfo?.email || "",
      customerPhone: customerInfo?.phone || "",
      fulfillmentMethod: deliveryType === "delivery" ? "delivery" : "pickup",
      deliveryAddress: deliveryType === "delivery" ? deliveryAddress : null,
      totalAmount: (calculateTotal() + (deliveryType === "delivery" ? 5 : 0)).toFixed(2),
      items: cartItems.map(item => ({
        productId: item.id,
        quantity: item.quantity,
        priceAtTime: item.discountPrice
      }))
    }));

    // Redirecionar para a tela de pagamento
    navigate("/customer/payment");
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-md mx-auto px-4 py-4 flex items-center">
            <Link href="/customer">
              <ArrowLeft className="h-6 w-6 text-gray-600" />
            </Link>
            <h1 className="ml-4 text-lg font-semibold">Carrinho</h1>
          </div>
        </div>

        <div className="max-w-md mx-auto p-4 pt-8">
          <div className="text-center">
            <div className="mb-4">
              <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto flex items-center justify-center">
                <span className="text-2xl">🛒</span>
              </div>
            </div>
            <h2 className="text-xl font-semibold mb-2">Seu carrinho está vazio</h2>
            <p className="text-gray-600 mb-6">Adicione produtos com desconto para continuar</p>
            <Link href="/customer">
              <Button className="w-full bg-green-600 hover:bg-green-700">
                Continuar Comprando
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const supermarkets = getSupermarckets();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center">
          <Link href="/customer">
            <ArrowLeft className="h-6 w-6 text-gray-600" />
          </Link>
          <div className="ml-4">
            <h1 className="text-lg font-semibold">Carrinho ({cartItems.length})</h1>
            <p className="text-sm text-gray-500">
              {supermarkets.length === 1 
                ? `${supermarkets[0].name}` 
                : `${supermarkets.length} supermercados`
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
            <div className="bg-green-50 p-3 rounded-lg border-l-4 border-green-600">
              <h3 className="font-semibold text-green-800">{supermarket.name}</h3>
              <div className="flex items-center text-sm text-green-600 mt-1">
                <MapPin size={12} className="mr-1" />
                {supermarket.address}
              </div>
            </div>

            {/* Itens do Supermercado */}
            {supermarket.items.map((item: CartItem) => (
              <Card key={item.id} className="bg-white">
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
                      <h4 className="font-medium text-sm">{item.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="h-3 w-3 text-orange-500" />
                        <span className="text-xs text-orange-600">
                          Válido até {new Date(item.expirationDate).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <div>
                          <span className="text-sm font-semibold text-green-600">
                            {formatPrice(item.discountPrice)}
                          </span>
                          <span className="text-xs text-gray-500 line-through ml-2">
                            {formatPrice(item.originalPrice)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="text-sm font-medium w-8 text-center">
                            {item.quantity}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
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
          <Card className="bg-white">
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3">Dados do Cliente</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-400" />
                  <span>{customerInfo.fullName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span>{customerInfo.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span>{customerInfo.email}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tipo de Entrega */}
        <Card className="bg-white">
          <CardContent className="p-4">
            <h3 className="font-semibold mb-3">Forma de Retirada</h3>
            <RadioGroup value={deliveryType} onValueChange={setDeliveryType}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pickup" id="pickup" />
                <Label htmlFor="pickup" className="flex-1">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>Retirar no local - Grátis</span>
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="delivery" id="delivery" />
                <Label htmlFor="delivery" className="flex-1">
                  <div className="flex items-center gap-2">
                    <span>🚚</span>
                    <span>Entrega - R$ 5,00</span>
                  </div>
                </Label>
              </div>
            </RadioGroup>
            
            {deliveryType === "delivery" && (
              <div className="mt-3">
                <Label htmlFor="address">Endereço para Entrega *</Label>
                <Input
                  id="address"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="Rua, número, bairro, cidade"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Resumo do Pedido */}
        <Card className="bg-white">
          <CardContent className="p-4">
            <h3 className="font-semibold mb-3">Resumo do Pedido</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatPrice(calculateTotal().toString())}</span>
              </div>
              <div className="flex justify-between text-green-600">
                <span>Economia</span>
                <span>-{formatPrice(calculateSavings().toString())}</span>
              </div>
              {deliveryType === "delivery" && (
                <div className="flex justify-between">
                  <span>Entrega</span>
                  <span>R$ 5,00</span>
                </div>
              )}
              <div className="border-t pt-2 flex justify-between font-semibold">
                <span>Total</span>
                <span>{formatPrice((calculateTotal() + (deliveryType === "delivery" ? 5 : 0)).toString())}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Botão de Finalizar */}
        <Button 
          className="w-full bg-green-600 hover:bg-green-700 h-12"
          onClick={handleCheckout}
          disabled={createOrderMutation.isPending}
        >
          {createOrderMutation.isPending ? "Processando..." : "Finalizar Pedido"}
        </Button>
      </div>
    </div>
  );
}