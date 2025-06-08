import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MapPin, Clock, User, Phone, Mail, CreditCard, Smartphone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface OrderItem {
  productId: number;
  productName: string;
  quantity: number;
  priceAtTime: string;
  imageUrl?: string;
  expirationDate: string;
  supermarketName?: string;
}

interface OrderReviewData {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryType: string;
  deliveryAddress?: string;
  totalAmount: string;
  items: OrderItem[];
}

export default function OrderReview() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [orderData, setOrderData] = useState<OrderReviewData | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("pix");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const savedOrderReview = localStorage.getItem('orderReview');
    if (savedOrderReview) {
      setOrderData(JSON.parse(savedOrderReview));
    } else {
      // Se não há dados de revisão, volta para o carrinho
      navigate('/customer/cart');
    }
  }, [navigate]);

  const formatPrice = (price: string) => {
    return `R$ ${parseFloat(price).toFixed(2).replace('.', ',')}`;
  };

  const calculateSubtotal = () => {
    if (!orderData) return 0;
    return orderData.items.reduce((total, item) => total + (parseFloat(item.priceAtTime) * item.quantity), 0);
  };

  const handleContinuePayment = async () => {
    if (!orderData) return;

    setIsProcessing(true);

    try {
      if (paymentMethod === 'pix') {
        // Criar pedido com status awaiting_payment para PIX
        const response = await fetch('/api/orders/create-with-pix', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            customerName: orderData.customerName,
            customerEmail: orderData.customerEmail,
            customerPhone: orderData.customerPhone,
            totalAmount: orderData.totalAmount,
            items: orderData.items
          }),
        });

        if (!response.ok) {
          throw new Error('Erro ao criar pedido');
        }

        const result = await response.json();
        
        // Limpar carrinho e dados de revisão
        localStorage.removeItem('cart');
        localStorage.removeItem('orderReview');
        
        // Salvar dados do pagamento PIX
        localStorage.setItem('pixPaymentData', JSON.stringify({
          orderId: result.orderId,
          pixPayment: result.pixPayment,
          expirationDate: result.expirationDate,
          customerData: orderData
        }));

        // Redirecionar para tela de pagamento PIX
        navigate(`/pix-payment/${result.orderId}`);
      } else if (paymentMethod === 'card') {
        // Criar pedido com status awaiting_payment para Stripe
        const response = await fetch('/api/public/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            customerName: orderData.customerName,
            customerEmail: orderData.customerEmail,
            customerPhone: orderData.customerPhone,
            fulfillmentMethod: orderData.deliveryType,
            deliveryAddress: orderData.deliveryAddress,
            totalAmount: orderData.totalAmount,
            paymentMethod: 'stripe',
            items: orderData.items.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
              priceAtTime: item.priceAtTime
            }))
          }),
        });

        if (!response.ok) {
          throw new Error('Erro ao criar pedido');
        }

        const result = await response.json();
        
        // Limpar carrinho e dados de revisão
        localStorage.removeItem('cart');
        localStorage.removeItem('orderReview');

        // Redirecionar para checkout Stripe
        navigate(`/stripe-checkout/${result.id}`);
      }
      
    } catch (error) {
      console.error('Erro ao criar pedido:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao processar pedido. Tente novamente.',
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (!orderData) {
    return (
      <div className="min-h-screen bg-eco-gray-light flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-eco-blue mx-auto mb-4"></div>
          <p className="text-eco-gray">Carregando revisão do pedido...</p>
        </div>
      </div>
    );
  }

  // Agrupar itens por supermercado
  const supermarkets = orderData.items.reduce((acc: any[], item) => {
    const supermarketName = item.supermarketName || 'Supermercado';
    let supermarket = acc.find(s => s.name === supermarketName);
    
    if (!supermarket) {
      supermarket = { name: supermarketName, items: [] };
      acc.push(supermarket);
    }
    
    supermarket.items.push(item);
    return acc;
  }, []);

  return (
    <div className="min-h-screen bg-eco-gray-light">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center">
          <Link href="/cart">
            <ArrowLeft className="h-6 w-6 text-eco-gray" />
          </Link>
          <h1 className="ml-4 text-lg font-bold text-eco-gray-dark">Revisar Pedido</h1>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-4">
        
        {/* Informações do Cliente */}
        <Card className="bg-white border-eco-green-light">
          <CardHeader className="pb-3">
            <CardTitle className="text-eco-green flex items-center gap-2">
              <User className="h-4 w-4" />
              Dados do Cliente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <User className="h-3 w-3 text-eco-gray" />
              <span className="text-eco-gray-dark">{orderData.customerName}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-3 w-3 text-eco-gray" />
              <span className="text-eco-gray-dark">{orderData.customerEmail}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-3 w-3 text-eco-gray" />
              <span className="text-eco-gray-dark">{orderData.customerPhone}</span>
            </div>
          </CardContent>
        </Card>

        {/* Tipo de Entrega */}
        <Card className="bg-white border-eco-orange-light">
          <CardHeader className="pb-3">
            <CardTitle className="text-eco-orange flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Entrega
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              {orderData.deliveryType === "delivery" ? (
                <div>
                  <p className="font-medium text-eco-gray-dark">Entrega a domicílio</p>
                  <p className="text-eco-gray mt-1">{orderData.deliveryAddress}</p>
                  <p className="text-eco-orange text-xs mt-1">Taxa de entrega: R$ 5,00</p>
                </div>
              ) : (
                <div>
                  <p className="font-medium text-eco-gray-dark">Retirada no local</p>
                  <p className="text-eco-green text-xs mt-1">Sem taxa de entrega</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Itens do Pedido */}
        {supermarkets.map((supermarket, index) => (
          <Card key={index} className="bg-white border-eco-green-light">
            <CardHeader className="pb-3">
              <CardTitle className="text-eco-green text-sm flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {supermarket.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {supermarket.items.map((item: OrderItem, itemIndex: number) => (
                <div key={itemIndex} className="flex gap-3 py-2 border-b border-eco-gray-light last:border-b-0">
                  {item.imageUrl && (
                    <img 
                      src={item.imageUrl} 
                      alt={item.productName}
                      className="w-12 h-12 object-cover rounded-lg"
                    />
                  )}
                  <div className="flex-1">
                    <h4 className="font-medium text-sm text-eco-gray-dark">{item.productName}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="h-3 w-3 text-eco-orange" />
                      <span className="text-xs text-eco-orange">
                        Válido até {new Date(item.expirationDate).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm font-semibold text-eco-green">
                        {formatPrice(item.priceAtTime)}
                      </span>
                      <span className="text-sm text-eco-gray">
                        Qty: {item.quantity}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}

        {/* Método de Pagamento */}
        <Card className="bg-white border-eco-green-light">
          <CardHeader className="pb-3">
            <CardTitle className="text-eco-green flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Método de Pagamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div 
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  paymentMethod === 'pix' 
                    ? 'border-eco-green bg-eco-green/10' 
                    : 'border-eco-gray-light hover:border-eco-green/50'
                }`}
                onClick={() => setPaymentMethod('pix')}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full border-2 ${
                    paymentMethod === 'pix' ? 'border-eco-green bg-eco-green' : 'border-eco-gray-light'
                  }`}>
                    {paymentMethod === 'pix' && (
                      <div className="w-full h-full rounded-full bg-white scale-50"></div>
                    )}
                  </div>
                  <Smartphone className="h-5 w-5 text-eco-green" />
                  <div>
                    <p className="font-medium text-eco-gray-dark">PIX</p>
                    <p className="text-xs text-eco-gray">Pagamento instantâneo</p>
                  </div>
                </div>
              </div>
              
              <div 
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  paymentMethod === 'card' 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-eco-gray-light hover:border-blue-500/50'
                }`}
                onClick={() => setPaymentMethod('card')}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full border-2 ${
                    paymentMethod === 'card' ? 'border-blue-500 bg-blue-500' : 'border-eco-gray-light'
                  }`}>
                    {paymentMethod === 'card' && (
                      <div className="w-full h-full rounded-full bg-white scale-50"></div>
                    )}
                  </div>
                  <CreditCard className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="font-medium text-eco-gray-dark">Cartão</p>
                    <p className="text-xs text-eco-gray">Crédito ou débito</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resumo do Pedido */}
        <Card className="bg-white border-eco-green-light">
          <CardHeader className="pb-3">
            <CardTitle className="text-eco-green">Resumo do Pedido</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-eco-gray-dark">Subtotal</span>
                <span className="text-eco-gray-dark">{formatPrice(calculateSubtotal().toString())}</span>
              </div>
              {orderData.deliveryType === "delivery" && (
                <div className="flex justify-between">
                  <span className="text-eco-gray-dark">Taxa de entrega</span>
                  <span className="text-eco-gray-dark">R$ 5,00</span>
                </div>
              )}
              <div className="border-t border-eco-green-light pt-2 flex justify-between font-semibold text-base">
                <span className="text-eco-gray-dark">Total</span>
                <span className="text-eco-green">{formatPrice(orderData.totalAmount)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Botão Continuar */}
        <Button 
          className="w-full bg-eco-green hover:bg-eco-green-dark text-white font-semibold h-12 rounded-xl transition-colors"
          onClick={handleContinuePayment}
          disabled={isProcessing}
        >
          {isProcessing ? 'Processando...' : 'Continuar para Pagamento'}
        </Button>

        {/* Botão Voltar */}
        <Button 
          variant="outline"
          className="w-full border-eco-green text-eco-green hover:bg-eco-green-light"
          onClick={() => navigate('/customer/cart')}
          disabled={isProcessing}
        >
          Voltar ao Carrinho
        </Button>
      </div>
    </div>
  );
}