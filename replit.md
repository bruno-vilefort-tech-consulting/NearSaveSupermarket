# SaveUp - Sustainable Supermarket Platform

## Overview

SaveUp is a comprehensive multi-application platform that connects supermarkets with customers to reduce food waste through discounted products nearing expiration. Built as a Progressive Web App (PWA), it features three distinct applications: Customer, Staff (Supermarket), and Admin portals, each with specialized functionality for different user types.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query (React Query) for server state
- **UI Components**: shadcn/ui with Radix UI primitives
- **Styling**: Tailwind CSS with custom eco-friendly color scheme
- **Build Tool**: Vite for development and production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript (ESM modules)
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Replit Auth integration with session-based auth
- **API Architecture**: RESTful API with role-based access control

### Multi-App Structure
The application uses a unique multi-app configuration defined in `app-config.json`:
- **Customer App**: Main consumer portal (green theme)
- **Staff App**: Supermarket management dashboard (blue theme)  
- **Admin App**: SaveUp administrative panel (purple theme)

## Key Components

### Authentication System
- **Replit Auth**: Primary authentication provider with OpenID Connect
- **Custom Auth**: Staff and customer registration with bcrypt password hashing
- **Session Management**: PostgreSQL-backed session storage
- **Password Reset**: Email-based password recovery with SendGrid

### Product Management
- **Product Lifecycle**: Full CRUD operations with image upload support
- **Expiration Tracking**: Date-based filtering and eco-points calculation
- **Category System**: 12 predefined categories (Padaria, Laticínios, etc.)
- **Inventory Management**: Stock tracking with quantity management

### Order Processing
- **Multi-Payment Support**: Stripe, Mercado Pago PIX, and card payments
- **Order States**: Pending → Prepared → Shipped → Picked Up/Delivered
- **Real-time Updates**: Auto-refresh with sound notifications for staff
- **Fulfillment Options**: Pickup and delivery methods

### Eco-Points System
- **Sustainability Rewards**: Points based on product expiration proximity
- **Scoring Rules**: 100 points for same-day expiration, scaling down to 10 points for 15-30 days
- **Gamification**: Achievements and milestones to encourage sustainable purchases

### Payment Integration
- **Stripe**: Credit card processing with secure checkout
- **Mercado Pago**: PIX payments for Brazilian market
- **Payment States**: Comprehensive tracking from creation to completion
- **Refund Support**: Automated refund processing for cancellations

### Marketing & Sponsorship
- **Staff Marketing**: Subscription-based promotion system
- **Stripe Subscriptions**: Recurring billing for marketing plans
- **Campaign Management**: Analytics and performance tracking

## Data Flow

### Customer Journey
1. Browse supermarkets and products via geolocation
2. Add items to cart with real-time availability checking
3. Select payment method (Stripe, PIX, or card)
4. Complete purchase and earn eco-points
5. Track order status and pickup/delivery

### Staff Workflow
1. Register supermarket with CNPJ validation
2. Add products with expiration dates and discounts
3. Manage incoming orders with status updates
4. Process payments and track revenue
5. Access marketing tools and analytics

### Admin Operations
1. Approve/reject staff registrations
2. Monitor platform analytics and metrics
3. Manage system-wide settings and configurations
4. Handle dispute resolution and support

## External Dependencies

### Payment Providers
- **Stripe**: Credit card processing, webhooks, and subscriptions
- **Mercado Pago**: PIX payments for Brazilian market
- **Configuration**: Environment variables for API keys and webhook URLs

### Communication Services
- **SendGrid**: Transactional emails for password reset and notifications
- **Web Push**: Browser notifications for order updates
- **VAPID Keys**: Push notification authentication

### Cloud Services
- **Neon Database**: PostgreSQL hosting with connection pooling
- **File Storage**: Local file system for product images
- **CDN**: Static asset serving through Vite build process

### Maps & Location
- **Leaflet**: Interactive maps for supermarket locations
- **Geolocation API**: Browser-based location services
- **Coordinate Storage**: Latitude/longitude in database

## Deployment Strategy

### Production Build
- **Vite Build**: Optimized bundle with code splitting
- **Static Files**: Served from `dist/public` directory
- **Environment**: Production mode with error handling
- **Asset Optimization**: CSS and JS minification

### Development Environment
- **Hot Reload**: Vite development server with HMR
- **Auto-refresh**: API endpoints refresh every 5-30 seconds
- **Error Handling**: Runtime error overlay for debugging
- **Database**: Auto-provisioned PostgreSQL on Replit

### PWA Features
- **Service Worker**: Offline functionality and caching
- **Web Manifest**: App-like installation experience
- **Push Notifications**: Real-time order updates
- **Responsive Design**: Mobile-first approach

### Environment Configuration
```bash
# Required Environment Variables
DATABASE_URL=postgresql://...
STRIPE_SECRET_KEY=sk_...
MERCADOPAGO_ACCESS_TOKEN=...
SENDGRID_API_KEY=...
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
SESSION_SECRET=...
```

## Changelog

- June 20, 2025: Initial setup
- June 20, 2025: Otimização completa da arquitetura do servidor:
  
  **Modularização de Rotas** - Dividido arquivo routes.ts de 4300 linhas em 8 módulos:
  - `auth.ts` (311 linhas) - Autenticação e registro de usuários
  - `products.ts` (268 linhas) - Gestão de produtos e uploads
  - `orders.ts` (223 linhas) - Processamento de pedidos
  - `payments.ts` (285 linhas) - Integração com Stripe e Mercado Pago
  - `admin.ts` (216 linhas) - Funcionalidades administrativas
  - `staff.ts` (269 linhas) - Gestão de supermercados
  - `push.ts` (106 linhas) - Notificações push
  - `index.ts` (45 linhas) - Orquestração das rotas
  - Redução de 4300 para 1723 linhas totais
  
  **Modularização de Storage** - Dividido arquivo storage.ts de 2286 linhas em 6 módulos:
  - `users.ts` (263 linhas) - Operações de usuários, staff e clientes
  - `products.ts` (215 linhas) - Gestão de produtos e inventário
  - `orders.ts` (387 linhas) - Processamento de pedidos e itens
  - `analytics.ts` (544 linhas) - Estatísticas e relatórios financeiros
  - `misc.ts` (218 linhas) - Tokens, notificações push e ações eco
  - `index.ts` (487 linhas) - Interface unificada e orquestração
  - Redução de 2286 para 2114 linhas totais com melhor organização

## User Preferences

Preferred communication style: Simple, everyday language.