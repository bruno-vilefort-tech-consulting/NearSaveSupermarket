import { MercadoPagoConfig, Payment } from 'mercadopago';

if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {
  throw new Error("MERCADOPAGO_ACCESS_TOKEN environment variable must be set");
}

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
  options: {
    timeout: 5000
  }
});

const payment = new Payment(client);

export interface PixPaymentData {
  amount: number;
  description: string;
  orderId: string;
  customerEmail: string;
  customerName: string;
  customerPhone?: string;
}

export interface PixPaymentResponse {
  id: string;
  status: string;
  pixCopyPaste: string;
  qrCodeBase64?: string;
  expirationDate: string;
}

export async function createPixPayment(data: PixPaymentData): Promise<PixPaymentResponse> {
  try {
    console.log('Creating PIX payment with Mercado Pago...');
    console.log('Using access token:', process.env.MERCADOPAGO_ACCESS_TOKEN?.substring(0, 10) + '...');
    
    const paymentData = {
      transaction_amount: data.amount,
      description: data.description,
      payment_method_id: 'pix',
      external_reference: data.orderId,
      payer: {
        email: data.customerEmail,
        first_name: data.customerName.split(' ')[0],
        last_name: data.customerName.split(' ').slice(1).join(' ') || ''
      }
    };

    console.log('Payment data being sent:', JSON.stringify(paymentData, null, 2));
    
    const result = await payment.create({ body: paymentData });
    
    console.log('Full Mercado Pago response:', JSON.stringify(result, null, 2));
    console.log('Point of interaction:', result.point_of_interaction);
    console.log('Transaction data:', result.point_of_interaction?.transaction_data);

    if (!result.point_of_interaction?.transaction_data?.qr_code) {
      throw new Error('Failed to generate PIX code');
    }

    const pixResponse = {
      id: result.id!.toString(),
      status: result.status!,
      pixCopyPaste: result.point_of_interaction.transaction_data.qr_code,
      qrCodeBase64: result.point_of_interaction.transaction_data.qr_code_base64,
      expirationDate: result.date_of_expiration || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };
    
    console.log('PIX response being returned:', JSON.stringify(pixResponse, null, 2));
    
    return pixResponse;
  } catch (error) {
    console.error('Mercado Pago error:', error);
    throw new Error('Failed to create PIX payment');
  }
}

export async function getPaymentStatus(paymentId: string) {
  try {
    const result = await payment.get({ id: paymentId });
    return {
      id: result.id!.toString(),
      status: result.status!,
      statusDetail: result.status_detail!,
      externalReference: result.external_reference!
    };
  } catch (error) {
    console.error('Error getting payment status:', error);
    throw new Error('Failed to get payment status');
  }
}

// Interface para dados de pagamento por cartão
export interface CardPaymentData {
  amount: number;
  description: string;
  orderId: string;
  cardData: {
    number: string;
    name: string;
    expiry: string;
    cvv: string;
  };
  customerData: {
    name: string;
    email: string;
    phone: string;
  };
}

// Interface para resposta de pagamento por cartão
export interface CardPaymentResponse {
  success: boolean;
  paymentId?: string;
  status?: string;
  message?: string;
  transactionAmount?: number;
}

// Criar pagamento por cartão
export async function createCardPayment(data: CardPaymentData): Promise<CardPaymentResponse> {
  try {
    console.log('Creating card payment with Mercado Pago...');
    
    // Configurar SDK com token de cartão
    if (!process.env.MERCADOPAGO_ACCESS_TOKEN_CARD) {
      throw new Error('MERCADOPAGO_ACCESS_TOKEN_CARD not configured');
    }
    
    const mercadopago = new MercadoPagoConfig({ 
      accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN_CARD 
    });
    const cardPayment = new Payment(mercadopago);
    
    // Separar mês e ano da data de validade
    const [month, year] = data.cardData.expiry.split('/');
    const fullYear = year.length === 2 ? `20${year}` : year;
    
    // Remover espaços do número do cartão
    const cardNumber = data.cardData.number.replace(/\s/g, '');
    
    const paymentData = {
      transaction_amount: data.amount,
      description: data.description,
      payment_method_id: getCardBrand(cardNumber),
      payer: {
        email: data.customerData.email,
        first_name: data.customerData.name.split(' ')[0],
        last_name: data.customerData.name.split(' ').slice(1).join(' ') || '',
        phone: {
          number: data.customerData.phone
        }
      },
      card: {
        number: cardNumber,
        security_code: data.cardData.cvv,
        expiration_month: parseInt(month),
        expiration_year: parseInt(fullYear),
        cardholder: {
          name: data.cardData.name
        }
      },
      external_reference: data.orderId,
      notification_url: process.env.REPLIT_DOMAINS 
        ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}/api/mercadopago/webhook`
        : undefined
    };

    console.log('Sending payment data to Mercado Pago:', {
      ...paymentData,
      card: { ...paymentData.card, number: '****', security_code: '***' }
    });

    const result = await cardPayment.create({ body: paymentData });
    console.log('Mercado Pago card payment response:', result);

    return {
      success: true,
      paymentId: result.id!.toString(),
      status: result.status!,
      transactionAmount: result.transaction_amount!,
      message: result.status === 'approved' ? 'Pagamento aprovado' : 'Pagamento processado'
    };

  } catch (error: any) {
    console.error('Erro ao criar pagamento por cartão:', error);
    return {
      success: false,
      message: error.message || 'Erro interno do servidor'
    };
  }
}

// Determinar a bandeira do cartão baseado no número
function getCardBrand(cardNumber: string): string {
  const firstDigit = cardNumber.charAt(0);
  const firstTwoDigits = parseInt(cardNumber.substring(0, 2));
  const firstFourDigits = parseInt(cardNumber.substring(0, 4));

  // Visa
  if (firstDigit === '4') {
    return 'visa';
  }
  
  // Mastercard
  if (firstFourDigits >= 5100 && firstFourDigits <= 5599) {
    return 'master';
  }
  if (firstFourDigits >= 2221 && firstFourDigits <= 2720) {
    return 'master';
  }
  
  // Elo
  if ([4011, 4312, 4389, 4514, 4573, 4576, 5041, 5066, 5067, 6277, 6362, 6363].includes(firstFourDigits)) {
    return 'elo';
  }
  
  // American Express
  if (firstTwoDigits === 34 || firstTwoDigits === 37) {
    return 'amex';
  }
  
  // Hipercard
  if (firstFourDigits === 6062) {
    return 'hipercard';
  }
  
  // Default para visa se não conseguir identificar
  return 'visa';
}