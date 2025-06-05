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
    console.log(`Checking payment status for ID: ${paymentId}`);
    const result = await payment.get({ id: paymentId });
    
    const response = {
      id: result.id?.toString() || paymentId,
      status: result.status || 'unknown',
      statusDetail: result.status_detail || 'unknown',
      externalReference: result.external_reference || '',
      transactionAmount: result.transaction_amount || 0,
      amount: result.transaction_amount || 0
    };
    
    console.log(`Payment status response:`, response);
    return response;
  } catch (error: any) {
    console.error('Error getting payment status:', {
      paymentId,
      error: error.message,
      stack: error.stack
    });
    
    // Return a safe fallback instead of throwing
    return {
      id: paymentId,
      status: 'error',
      statusDetail: 'api_error',
      externalReference: '',
      transactionAmount: 0,
      amount: 0,
      error: error.message
    };
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

// Função auxiliar para criar token do cartão
async function createCardToken(cardNumber: string, securityCode: string, expirationMonth: number, expirationYear: number, cardholderName: string): Promise<string> {
  const mercadopago = new MercadoPagoConfig({ 
    accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN_CARD! 
  });
  
  // Usar a API direta para criar o token
  const response = await fetch('https://api.mercadopago.com/v1/card_tokens', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN_CARD}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      card_number: cardNumber,
      security_code: securityCode,
      expiration_month: expirationMonth,
      expiration_year: expirationYear,
      cardholder: {
        name: cardholderName
      }
    })
  });

  const tokenData = await response.json();
  
  if (!response.ok) {
    throw new Error(`Failed to create card token: ${tokenData.message}`);
  }
  
  return tokenData.id;
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
    
    // Criar token do cartão
    const cardToken = await createCardToken(cardNumber, data.cardData.cvv, parseInt(month), parseInt(fullYear), data.cardData.name);
    console.log('Card token created successfully');
    
    const paymentData = {
      transaction_amount: data.amount,
      description: data.description,
      payment_method_id: getCardBrand(cardNumber),
      token: cardToken,
      installments: 1,
      payer: {
        email: data.customerData.email,
        first_name: data.customerData.name.split(' ')[0],
        last_name: data.customerData.name.split(' ').slice(1).join(' ') || '',
        phone: {
          number: data.customerData.phone
        }
      },
      external_reference: data.orderId,
      notification_url: process.env.REPLIT_DOMAINS 
        ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}/api/mercadopago/webhook`
        : undefined
    };

    console.log('Sending payment data to Mercado Pago:', {
      ...paymentData,
      token: '****'
    });

    const result = await cardPayment.create({ body: paymentData });
    console.log('Mercado Pago card payment response:', JSON.stringify(result, null, 2));
    
    if (result.status_detail) {
      console.log('Payment rejection reason:', result.status_detail);
    }

    return {
      success: true,
      paymentId: result.id!.toString(),
      status: result.status!,
      transactionAmount: result.transaction_amount!,
      message: result.status === 'approved' ? 'Pagamento aprovado' : 'Pagamento processado'
    };

  } catch (error: any) {
    console.error('Erro ao criar pagamento por cartão:', error);
    
    let errorMessage = 'Erro interno do servidor';
    if (error.message === 'bin_not_found') {
      errorMessage = 'Cartão não aceito no ambiente de teste. Use credenciais de produção para aceitar todos os cartões.';
    } else if (error.cause && error.cause[0] && error.cause[0].description) {
      errorMessage = error.cause[0].description;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return {
      success: false,
      message: errorMessage
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

// Interfaces para cancelamento PIX
export interface PixCancelData {
  paymentId: string;
  reason?: string;
}

export interface PixCancelResponse {
  success: boolean;
  paymentId?: string;
  status?: string;
  message?: string;
  error?: string;
}

// Interfaces para estorno PIX
export interface PixRefundData {
  paymentId: string;
  amount?: number; // Opcional - se não fornecido, estorna o valor total
  reason?: string;
}

export interface PixRefundResponse {
  success: boolean;
  refundId?: string;
  status?: string;
  amount?: number;
  message?: string;
  error?: string;
}

// Função para cancelar pagamento PIX
export async function cancelPixPayment(data: PixCancelData): Promise<PixCancelResponse> {
  try {
    console.log('🚫 [PIX CANCEL] Iniciando cancelamento para pagamento:', data.paymentId);
    
    if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {
      throw new Error('Token de acesso do Mercado Pago não configurado');
    }

    // Primeiro, verificar o status atual do pagamento
    const paymentStatus = await getPaymentStatus(data.paymentId);
    console.log('🚫 [PIX CANCEL] Status atual do pagamento:', paymentStatus);
    
    if (!paymentStatus) {
      return {
        success: false,
        paymentId: data.paymentId,
        error: 'Pagamento não encontrado'
      };
    }

    // PIX só pode ser cancelado se ainda estiver pendente
    if (paymentStatus.status === 'approved') {
      console.log('🚫 [PIX CANCEL] Pagamento já foi aprovado, não pode ser cancelado');
      return {
        success: false,
        paymentId: data.paymentId,
        status: paymentStatus.status,
        error: 'Pagamento já foi aprovado e não pode ser cancelado'
      };
    }

    if (paymentStatus.status === 'cancelled') {
      console.log('🚫 [PIX CANCEL] Pagamento já está cancelado');
      return {
        success: true,
        paymentId: data.paymentId,
        status: 'cancelled',
        message: 'Pagamento já estava cancelado'
      };
    }

    // Cancelar o pagamento no Mercado Pago
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${data.paymentId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`
      },
      body: JSON.stringify({
        status: 'cancelled',
        ...(data.reason && {
          metadata: {
            cancellation_reason: data.reason
          }
        })
      })
    });

    const result = await response.json();
    console.log('🚫 [PIX CANCEL] Resposta do Mercado Pago:', result);

    if (!response.ok) {
      console.error('❌ [PIX CANCEL] Erro na requisição:', result);
      return {
        success: false,
        paymentId: data.paymentId,
        error: result.message || 'Erro ao cancelar pagamento no Mercado Pago'
      };
    }

    return {
      success: true,
      paymentId: result.id.toString(),
      status: result.status,
      message: 'Pagamento PIX cancelado com sucesso'
    };

  } catch (error) {
    console.error('❌ [PIX CANCEL] Erro no cancelamento:', error);
    return {
      success: false,
      paymentId: data.paymentId,
      error: error instanceof Error ? error.message : 'Erro desconhecido ao cancelar pagamento'
    };
  }
}

export interface RefundStatusResponse {
  success: boolean;
  refundId: string;
  status: string;
  amount?: number;
  message?: string;
  error?: string;
}

// Função para verificar status de estorno PIX
export async function checkRefundStatus(paymentId: string): Promise<RefundStatusResponse> {
  try {
    console.log('🔍 [PIX REFUND STATUS] Verificando status do pagamento:', paymentId);
    
    if (!process.env.MERCADO_PAGO_ACCESS_TOKEN) {
      throw new Error('Token de acesso do Mercado Pago não configurado');
    }

    // Try to get payment details which should include refund information
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      }
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('❌ [PIX REFUND STATUS] Erro ao consultar API:', result);
      return {
        success: false,
        refundId: paymentId,
        status: 'error',
        message: result.message || 'Erro ao consultar status do estorno na API do Mercado Pago',
        error: result.error || 'API_ERROR'
      };
    }

    if (!result || Object.keys(result).length === 0) {
      console.log('⚠️ [PIX REFUND STATUS] Resposta vazia da API');
      return {
        success: false,
        refundId: paymentId,
        status: 'error',
        message: 'Resposta vazia da API do Mercado Pago',
        error: 'EMPTY_RESPONSE'
      };
    }

    console.log('✅ [PIX REFUND STATUS] Payment data obtido:', result);

    // Check if payment has refunds
    if (result.refunds && result.refunds.length > 0) {
      const latestRefund = result.refunds[result.refunds.length - 1];
      console.log('✅ [PIX REFUND STATUS] Refund encontrado:', latestRefund);
      
      return {
        success: true,
        refundId: latestRefund.id.toString(),
        status: latestRefund.status,
        amount: latestRefund.amount,
        message: 'Status do estorno consultado com sucesso'
      };
    } else {
      console.log('⚠️ [PIX REFUND STATUS] Nenhum estorno encontrado no pagamento');
      return {
        success: false,
        refundId: paymentId,
        status: 'not_found',
        message: 'Nenhum estorno encontrado para este pagamento'
      };
    }

  } catch (error) {
    console.error('❌ [PIX REFUND STATUS] Erro na consulta:', error);
    return {
      success: false,
      refundId: paymentId,
      status: 'error',
      message: 'Erro interno ao consultar status do estorno',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
}

// Função para calcular valor disponível para estorno
export async function getRefundableAmount(paymentId: string): Promise<{ totalAmount: number; refundedAmount: number; availableAmount: number }> {
  try {
    const paymentStatus = await getPaymentStatus(paymentId);
    if (!paymentStatus) {
      throw new Error('Pagamento não encontrado');
    }

    // Buscar histórico de estornos
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}/refunds`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`
      }
    });

    const refundsData = await response.json();
    const refunds = response.ok ? refundsData.results || [] : [];
    
    // Calcular valor total já estornado
    const refundedAmount = refunds
      .filter((refund: any) => refund.status === 'approved')
      .reduce((total: number, refund: any) => total + (refund.amount || 0), 0);

    const totalAmount = parseFloat(paymentStatus.transactionAmount?.toString() || paymentStatus.amount?.toString() || '0');
    const availableAmount = totalAmount - refundedAmount;

    console.log(`💰 [REFUND CALC] Pagamento ${paymentId}: Total R$ ${totalAmount}, Estornado R$ ${refundedAmount}, Disponível R$ ${availableAmount}`);

    return {
      totalAmount,
      refundedAmount,
      availableAmount
    };
  } catch (error: any) {
    console.error('❌ [REFUND CALC] Erro ao calcular valor disponível:', error);
    throw error;
  }
}

export async function createPixRefund(data: PixRefundData): Promise<PixRefundResponse> {
  try {
    console.log('🔄 [PIX REFUND] Iniciando estorno para pagamento:', data.paymentId);
    
    if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {
      throw new Error('Token de acesso do Mercado Pago não configurado');
    }

    // Primeiro, verificar se o pagamento existe e está elegível para estorno
    const paymentStatus = await getPaymentStatus(data.paymentId);
    if (!paymentStatus || paymentStatus.status !== 'approved') {
      return {
        success: false,
        error: `Pagamento não está elegível para estorno. Status: ${paymentStatus?.status || 'NOT_FOUND'}`
      };
    }

    // Verificar valor disponível para estorno
    const refundableInfo = await getRefundableAmount(data.paymentId);
    
    // Se foi especificado um valor, verificar se está disponível
    let refundAmount = data.amount;
    if (refundAmount) {
      if (refundAmount > refundableInfo.availableAmount) {
        return {
          success: false,
          error: `Valor solicitado (R$ ${refundAmount.toFixed(2)}) excede o disponível para estorno (R$ ${refundableInfo.availableAmount.toFixed(2)})`
        };
      }
    } else {
      // Se não foi especificado valor, estornar o valor total disponível
      refundAmount = refundableInfo.availableAmount;
    }

    // Verificar se há valor disponível para estorno
    if (refundAmount <= 0) {
      return {
        success: false,
        error: `Não há valor disponível para estorno. Valor total já estornado: R$ ${refundableInfo.refundedAmount.toFixed(2)}`
      };
    }

    // Dados do estorno
    const refundData: any = {
      amount: refundAmount
    };
    
    if (data.reason) {
      refundData.metadata = {
        reason: data.reason
      };
    }

    console.log(`🔄 [PIX REFUND] Dados do estorno: R$ ${refundAmount.toFixed(2)} de R$ ${refundableInfo.availableAmount.toFixed(2)} disponível`);

    // Fazer requisição de estorno para o Mercado Pago
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${data.paymentId}/refunds`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
        'X-Idempotency-Key': `refund_${data.paymentId}_${Date.now()}`
      },
      body: JSON.stringify(refundData)
    });

    const result = await response.json();
    console.log('🔄 [PIX REFUND] Resposta do Mercado Pago:', result);

    if (!response.ok) {
      console.error('❌ [PIX REFUND] Erro na requisição:', result);
      return {
        success: false,
        error: result.message || 'Erro ao processar estorno no Mercado Pago'
      };
    }

    return {
      success: true,
      refundId: result.id,
      status: result.status,
      amount: result.amount,
      message: 'Estorno processado com sucesso'
    };

  } catch (error: any) {
    console.error('❌ [PIX REFUND] Erro ao criar estorno:', error);
    return {
      success: false,
      error: error.message || 'Erro interno ao processar estorno'
    };
  }
}