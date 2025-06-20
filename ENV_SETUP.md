# Configuração das Variáveis de Ambiente

Este projeto usa variáveis de ambiente para configurar diferentes aspectos da aplicação. Siga os passos abaixo para configurar corretamente.

## 1. Copie o arquivo de exemplo

```bash
cp .env.example .env
```

## 2. Configure as variáveis necessárias

Edite o arquivo `.env` com suas credenciais e configurações:

### Banco de Dados
- `DATABASE_URL`: URL de conexão com o PostgreSQL
- Exemplo: `postgresql://usuario:senha@localhost:5432/nearsave`

### Servidor
- `PORT`: Porta onde o servidor vai rodar (padrão: 5000)
- `SESSION_SECRET`: Chave secreta para as sessões (use uma chave forte)
- `NODE_ENV`: Ambiente de execução (development, production)

### Pagamentos - Stripe
- `STRIPE_SECRET_KEY`: Chave secreta do Stripe
- `STRIPE_WEBHOOK_SECRET`: Segredo do webhook do Stripe
- `STRIPE_BASIC_PRICE_ID`: ID do preço básico no Stripe
- `STRIPE_PREMIUM_PRICE_ID`: ID do preço premium no Stripe

### Pagamentos - MercadoPago
- `MERCADOPAGO_ACCESS_TOKEN`: Token de acesso do MercadoPago
- `MERCADOPAGO_ACCESS_TOKEN_CARD`: Token para pagamentos com cartão
- `MERCADO_PAGO_ACCESS_TOKEN`: Token alternativo do MercadoPago

### Notificações Push
- `VAPID_PUBLIC_KEY`: Chave pública VAPID para push notifications
- `VAPID_PRIVATE_KEY`: Chave privada VAPID para push notifications

### Email - SendGrid
- `SENDGRID_API_KEY`: Chave da API do SendGrid

### Replit (se aplicável)
- `REPL_ID`: ID do seu Repl
- `ISSUER_URL`: URL do emissor OIDC

### Frontend (Vite)
Variáveis que começam com `VITE_` são expostas para o frontend:
- `VITE_API_URL`: URL da API (ex: http://localhost:5000)
- `VITE_STRIPE_PUBLISHABLE_KEY`: Chave pública do Stripe
- `VITE_MERCADOPAGO_PUBLIC_KEY`: Chave pública do MercadoPago
- `VITE_VAPID_PUBLIC_KEY`: Chave pública VAPID

## 3. Execução

Depois de configurar o `.env`, você pode executar:

```bash
# Desenvolvimento
npm run dev

# Produção
npm run build
npm start
```

## 4. Verificação

O arquivo `.env` já está configurado para ser carregado automaticamente pelos scripts npm.

## Notas Importantes

- ⚠️ **NUNCA** commite o arquivo `.env` no Git
- O arquivo `.env.example` serve como template
- As variáveis `VITE_*` são as únicas expostas para o frontend
- Mantenha suas chaves secretas seguras 