import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, Plus, Minus, Trash2, MapPin, Clock } from "lucide-react";
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
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    phone: "",
    email: "",
    address: ""
  });

  // Carregar itens do carrinho do localStorage ao inicializar
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      setCartItems(JSON.parse(savedCart));
    } else {
      // Limpar qualquer carrinho anterior e começar vazio
      setCartItems([]);
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

  // Carregar informações do cliente do localStorage
  useEffect(() => {
    const savedCustomer = localStorage.getItem('customerInfo');
    if (savedCustomer) {
      const customer = JSON.parse(savedCustomer);
      setCustomerInfo({
        name: customer.name || "",
        phone: customer.phone || "",
        email: customer.email || "",
        address: ""
      });
    }
  }, []);

  const createOrderMutation = useMutation({
    mutationFn: async (orderData: any) => {
      return await apiRequest("/api/public/orders", {
        method: "POST",
        body: JSON.stringify(orderData),
        headers: {
          "Content-Type": "application/json",
        },
      });
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
    if (!customerInfo.name || !customerInfo.phone) {
      toast({
        title: "Informações obrigatórias",
        description: "Por favor, preencha nome e telefone.",
        variant: "destructive",
      });
      return;
    }

    if (deliveryType === "delivery" && !customerInfo.address) {
      toast({
        title: "Endereço obrigatório",
        description: "Por favor, informe o endereço para entrega.",
        variant: "destructive",
      });
      return;
    }

    const orderData = {
      customerName: customerInfo.name,
      customerEmail: customerInfo.email,
      customerPhone: customerInfo.phone,
      fulfillmentMethod: deliveryType === "delivery" ? "delivery" : "pickup",
      deliveryAddress: deliveryType === "delivery" ? customerInfo.address : null,
      totalAmount: (calculateTotal() + (deliveryType === "delivery" ? 5 : 0)).toFixed(2),
      items: cartItems.map(item => ({
        productId: item.id,
        quantity: item.quantity,
        priceAtTime: item.discountPrice
      }))
    };

    createOrderMutation.mutate(orderData);
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm p-4">
          <div className="flex items-center space-x-3">
            <Link href="/customer">
              <Button variant="ghost" size="sm">
                <ArrowLeft size={20} />
              </Button>
            </Link>
            <h1 className="text-xl font-bold text-gray-900">Carrinho</h1>
          </div>
        </div>

        <div className="p-4">
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-gray-500 mb-4">Seu carrinho está vazio</p>
              <Link href="/customer">
                <Button>Continuar Comprando</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm p-4">
        <div className="flex items-center space-x-3">
          <Link href="/customer">
            <Button variant="ghost" size="sm">
              <ArrowLeft size={20} />
            </Button>
          </Link>
          <h1 className="text-xl font-bold text-gray-900">Carrinho</h1>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Cart Items */}
        <Card>
          <CardContent className="p-4">
            <h2 className="font-semibold text-gray-900 mb-4">Seus Produtos</h2>
            <div className="space-y-4">
              {cartItems.map((item) => (
                <div key={item.id} className="flex items-center space-x-4 pb-4 border-b border-gray-100 last:border-b-0">
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                    {item.imageUrl ? (
                      <img 
                        src={item.imageUrl} 
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="w-6 h-6 bg-gray-300 rounded"></div>
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{item.name}</h3>
                    {item.createdBy?.supermarketName && (
                      <p className="text-sm text-blue-600 font-medium">{item.createdBy.supermarketName}</p>
                    )}
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-green-600 font-semibold">
                        {formatPrice(item.discountPrice)}
                      </span>
                      <span className="text-sm text-gray-500 line-through">
                        {formatPrice(item.originalPrice)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-8 h-8 p-0"
                    >
                      <Minus size={14} />
                    </Button>
                    <span className="w-8 text-center">{item.quantity}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-8 h-8 p-0"
                    >
                      <Plus size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(item.id)}
                      className="text-red-600 hover:text-red-700 ml-2"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Delivery Options */}
        <Card>
          <CardContent className="p-4">
            <h2 className="font-semibold text-gray-900 mb-4">Tipo de Entrega</h2>
            <RadioGroup value={deliveryType} onValueChange={setDeliveryType}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pickup" id="pickup" />
                <Label htmlFor="pickup" className="flex items-center space-x-2 cursor-pointer">
                  <MapPin size={16} />
                  <span>Retirar no Local (Grátis)</span>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="delivery" id="delivery" />
                <Label htmlFor="delivery" className="flex items-center space-x-2 cursor-pointer">
                  <Clock size={16} />
                  <span>Delivery (R$ 5,00)</span>
                </Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Customer Info */}
        <Card>
          <CardContent className="p-4">
            <h2 className="font-semibold text-gray-900 mb-4">Suas Informações</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nome Completo</Label>
                <Input
                  id="name"
                  value={customerInfo.name}
                  onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                  placeholder="Seu nome"
                />
              </div>
              <div>
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={customerInfo.phone}
                  onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                  placeholder="(11) 99999-9999"
                />
              </div>
              <div>
                <Label htmlFor="email">Email (opcional)</Label>
                <Input
                  id="email"
                  type="email"
                  value={customerInfo.email}
                  onChange={(e) => setCustomerInfo({...customerInfo, email: e.target.value})}
                  placeholder="seu@email.com"
                />
              </div>
              {deliveryType === "delivery" && (
                <div>
                  <Label htmlFor="address">Endereço para Entrega</Label>
                  <Input
                    id="address"
                    value={customerInfo.address}
                    onChange={(e) => setCustomerInfo({...customerInfo, address: e.target.value})}
                    placeholder="Rua, número, bairro"
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Order Summary */}
        <Card>
          <CardContent className="p-4">
            <h2 className="font-semibold text-gray-900 mb-4">Resumo do Pedido</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatPrice(calculateTotal().toString())}</span>
              </div>
              {deliveryType === "delivery" && (
                <div className="flex justify-between">
                  <span>Taxa de Entrega</span>
                  <span>R$ 5,00</span>
                </div>
              )}
              <div className="flex justify-between text-green-600">
                <span>Economia Total</span>
                <span>-{formatPrice(calculateSavings().toString())}</span>
              </div>
              <hr />
              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span>
                  {formatPrice((calculateTotal() + (deliveryType === "delivery" ? 5 : 0)).toString())}
                </span>
              </div>
            </div>

            <Button 
              onClick={handleCheckout}
              className="w-full mt-4 bg-green-600 hover:bg-green-700"
              disabled={!customerInfo.name || !customerInfo.phone || (deliveryType === "delivery" && !customerInfo.address)}
            >
              Finalizar Pedido
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}