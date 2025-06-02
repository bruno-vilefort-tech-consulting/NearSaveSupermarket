import { MercadoPagoConfig, Payment } from 'mercadopago';

if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {
  throw new Error("MERCADOPAGO_ACCESS_TOKEN environment variable must be set");
}

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
  options: {
    timeout: 5000,
    idempotencyKey: 'abc'
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

    const result = await payment.create({ body: paymentData });

    if (!result.point_of_interaction?.transaction_data?.qr_code) {
      throw new Error('Failed to generate PIX code');
    }

    return {
      id: result.id!.toString(),
      status: result.status!,
      pixCopyPaste: result.point_of_interaction.transaction_data.qr_code,
      qrCodeBase64: result.point_of_interaction.transaction_data.qr_code_base64,
      expirationDate: result.date_of_expiration || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };
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