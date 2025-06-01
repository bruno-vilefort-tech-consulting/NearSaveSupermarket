import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, CreditCard, Smartphone, CheckCircle, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function CustomerPayment() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [paymentMethod, setPaymentMethod] = useState("pix");
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [orderData, setOrderData] = useState<any>(null);
  
  // Dados do cartão
  const [cardData, setCardData] = useState({
    number: "",
    name: "",
    expiry: "",
    cvv: ""
  });

  // Carregar dados do pedido
  useEffect(() => {
    const savedOrderData = localStorage.getItem('orderData');
    if (savedOrderData) {
      setOrderData(JSON.parse(savedOrderData));
    } else {
      // Se não há dados do pedido, voltar para o carrinho
      navigate("/customer/cart");
    }
  }, [navigate]);

  // Processar pagamento e criar pedido
  const processPaymentMutation = useMutation({
    mutationFn: async (data: { method: string; cardData?: any }) => {
      // Simular delay de processamento de pagamento
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Criar o pedido após pagamento aprovado
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
      
      const order = await response.json();
      return { success: true, order, transactionId: Math.random().toString(36).substr(2, 9) };
    },
    onSuccess: () => {
      setPaymentSuccess(true);
      // Limpar carrinho e dados do pedido
      localStorage.removeItem('cart');
      localStorage.removeItem('orderData');
      
      toast({
        title: "Pagamento aprovado!",
        description: "Seu pedido foi confirmado com sucesso.",
      });
      
      // Redirecionar após 3 segundos
      setTimeout(() => {
        navigate("/customer");
      }, 3000);
    },
    onError: () => {
      setIsProcessing(false);
      toast({
        title: "Erro no pagamento",
        description: "Tente novamente ou escolha outro método.",
        variant: "destructive",
      });
    },
  });

  const handlePayment = () => {
    if (paymentMethod === "card") {
      if (!cardData.number || !cardData.name || !cardData.expiry || !cardData.cvv) {
        toast({
          title: "Dados incompletos",
          description: "Preencha todos os campos do cartão.",
          variant: "destructive",
        });
        return;
      }
    }

    setIsProcessing(true);
    processPaymentMutation.mutate({
      method: paymentMethod,
      cardData: paymentMethod === "card" ? cardData : undefined
    });
  };

  // Formatar número do cartão
  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  // Formatar data de expiração
  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  if (paymentSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto p-4">
          <Card className="text-center">
            <CardContent className="p-8">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Pagamento Aprovado!</h2>
              <p className="text-gray-600 mb-4">Seu pedido foi confirmado com sucesso.</p>
              <p className="text-sm text-gray-500">Redirecionando...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center">
          <Link href="/customer/cart">
            <ArrowLeft className="h-6 w-6 text-gray-600" />
          </Link>
          <div className="ml-4">
            <h1 className="text-lg font-semibold">Pagamento</h1>
            <p className="text-sm text-green-600 font-medium">Supermercado Silva</p>
            <p className="text-xs text-gray-500">Rua das Flores, 123 - Centro</p>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-4">
        {/* Resumo do pedido */}
        {orderData && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Resumo do Pedido</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between text-sm mb-2">
                <span>Subtotal</span>
                <span>R$ {(parseFloat(orderData.totalAmount) - (orderData.fulfillmentMethod === "delivery" ? 5 : 0)).toFixed(2).replace('.', ',')}</span>
              </div>
              {orderData.fulfillmentMethod === "delivery" && (
                <div className="flex justify-between text-sm mb-2">
                  <span>Taxa de entrega</span>
                  <span>R$ 5,00</span>
                </div>
              )}
              <div className="border-t pt-2 flex justify-between font-semibold">
                <span>Total</span>
                <span className="text-green-600">R$ {parseFloat(orderData.totalAmount).toFixed(2).replace('.', ',')}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Método de pagamento */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Método de Pagamento</CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
              <div className="flex items-center space-x-2 p-3 border rounded-lg">
                <RadioGroupItem value="pix" id="pix" />
                <Label htmlFor="pix" className="flex items-center cursor-pointer flex-1">
                  <Smartphone className="h-5 w-5 text-blue-600 mr-2" />
                  <div>
                    <p className="font-medium">PIX</p>
                    <p className="text-sm text-gray-600">Pagamento instantâneo</p>
                  </div>
                </Label>
              </div>
              
              <div className="flex items-center space-x-2 p-3 border rounded-lg">
                <RadioGroupItem value="card" id="card" />
                <Label htmlFor="card" className="flex items-center cursor-pointer flex-1">
                  <CreditCard className="h-5 w-5 text-green-600 mr-2" />
                  <div>
                    <p className="font-medium">Cartão de Crédito/Débito</p>
                    <p className="text-sm text-gray-600">Visa, Mastercard, Elo</p>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* PIX */}
        {paymentMethod === "pix" && (
          <Card>
            <CardContent className="p-6 text-center">
              <Smartphone className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Pagamento via PIX</h3>
              <p className="text-sm text-gray-600 mb-4">
                Após confirmar, você receberá o QR Code para finalizar o pagamento.
              </p>
              <div className="flex items-center justify-center text-sm text-gray-500">
                <Lock className="h-4 w-4 mr-1" />
                Pagamento seguro e instantâneo
              </div>
            </CardContent>
          </Card>
        )}

        {/* Dados do cartão */}
        {paymentMethod === "card" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Dados do Cartão</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="cardNumber">Número do cartão</Label>
                <Input
                  id="cardNumber"
                  placeholder="1234 5678 9012 3456"
                  value={cardData.number}
                  onChange={(e) => setCardData({
                    ...cardData,
                    number: formatCardNumber(e.target.value)
                  })}
                  maxLength={19}
                />
              </div>

              <div>
                <Label htmlFor="cardName">Nome no cartão</Label>
                <Input
                  id="cardName"
                  placeholder="João Silva"
                  value={cardData.name}
                  onChange={(e) => setCardData({
                    ...cardData,
                    name: e.target.value.toUpperCase()
                  })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="expiry">Validade</Label>
                  <Input
                    id="expiry"
                    placeholder="MM/AA"
                    value={cardData.expiry}
                    onChange={(e) => setCardData({
                      ...cardData,
                      expiry: formatExpiry(e.target.value)
                    })}
                    maxLength={5}
                  />
                </div>
                <div>
                  <Label htmlFor="cvv">CVV</Label>
                  <Input
                    id="cvv"
                    placeholder="123"
                    value={cardData.cvv}
                    onChange={(e) => setCardData({
                      ...cardData,
                      cvv: e.target.value.replace(/\D/g, '')
                    })}
                    maxLength={4}
                  />
                </div>
              </div>

              <div className="flex items-center justify-center text-sm text-gray-500">
                <Lock className="h-4 w-4 mr-1" />
                Seus dados estão protegidos com criptografia SSL
              </div>
            </CardContent>
          </Card>
        )}

        {/* Botão de pagamento */}
        <Button
          onClick={handlePayment}
          disabled={isProcessing}
          className="w-full bg-green-600 hover:bg-green-700 h-12 text-lg"
        >
          {isProcessing ? (
            <div className="flex items-center">
              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
              Processando...
            </div>
          ) : (
            `Finalizar Pagamento - R$ ${orderData ? parseFloat(orderData.totalAmount).toFixed(2).replace('.', ',') : '0,00'}`
          )}
        </Button>

        <p className="text-xs text-gray-500 text-center">
          Ao finalizar o pagamento, você concorda com nossos termos de uso.
        </p>
      </div>
    </div>
  );
}