import { MailService } from '@sendgrid/mail';

if (!process.env.SENDGRID_API_KEY) {
  throw new Error("SENDGRID_API_KEY environment variable must be set");
}

const mailService = new MailService();
mailService.setApiKey(process.env.SENDGRID_API_KEY);

interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  try {
    await mailService.send({
      to: params.to,
      from: params.from,
      subject: params.subject,
      text: params.text,
      html: params.html,
    });
    return true;
  } catch (error) {
    console.error('SendGrid email error:', error);
    return false;
  }
}

export function generatePasswordResetEmail(resetLink: string, customerName: string): { subject: string; text: string; html: string } {
  const subject = "Redefinição de Senha - EcoMart";
  
  const text = `
Olá ${customerName},

Você solicitou a redefinição de sua senha no EcoMart.

Para criar uma nova senha, clique no link abaixo:
${resetLink}

Este link é válido por 1 hora.

Se você não solicitou esta redefinição, ignore este email.

Atenciosamente,
Equipe EcoMart
  `;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">EcoMart</h1>
        <p style="color: #d1fae5; margin: 10px 0 0 0;">Menos desperdício, mais valor</p>
      </div>
      
      <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 10px 10px;">
        <h2 style="color: #374151; margin-bottom: 20px;">Redefinição de Senha</h2>
        
        <p style="color: #6b7280; line-height: 1.6; margin-bottom: 25px;">
          Olá <strong>${customerName}</strong>,
        </p>
        
        <p style="color: #6b7280; line-height: 1.6; margin-bottom: 25px;">
          Você solicitou a redefinição de sua senha no EcoMart. Para criar uma nova senha, clique no botão abaixo:
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
            Redefinir Senha
          </a>
        </div>
        
        <p style="color: #9ca3af; font-size: 14px; line-height: 1.5; margin-top: 25px;">
          Este link é válido por <strong>1 hora</strong>. Se você não conseguir clicar no botão, copie e cole este link no seu navegador:
        </p>
        
        <p style="color: #6b7280; font-size: 14px; word-break: break-all; background: #f9fafb; padding: 10px; border-radius: 4px;">
          ${resetLink}
        </p>
        
        <p style="color: #9ca3af; font-size: 14px; margin-top: 25px;">
          Se você não solicitou esta redefinição, ignore este email. Sua senha permanecerá inalterada.
        </p>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        
        <p style="color: #9ca3af; font-size: 12px; text-align: center;">
          Atenciosamente,<br>
          <strong>Equipe EcoMart</strong><br>
          Uma iniciativa sustentável da UP Brasil
        </p>
      </div>
    </div>
  `;

  return { subject, text, html };
}