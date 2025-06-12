# SaveUp - Sustainable Supermarket Platform

## Overview

SaveUp is a comprehensive multi-tenanted platform for sustainable supermarket operations. It helps reduce food waste by connecting customers with discounted products nearing expiration dates, while incorporating an eco-points system to encourage sustainable consumption. The platform supports three distinct user roles: customers, supermarket staff, and administrators.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with Shadcn/UI components
- **Build Tool**: Vite for development and production builds
- **PWA Features**: Service worker, manifest, and push notifications
- **Multi-App Structure**: Separate applications for customer, staff, and admin interfaces

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Replit Auth integration with session management
- **API Design**: RESTful endpoints with middleware-based request handling

### Deployment Strategy
- **Platform**: Replit with autoscale deployment
- **Build Process**: Vite build + esbuild for server bundling
- **Static Serving**: Express static middleware for production assets
- **Environment Detection**: Automatic production mode detection

## Key Components

### 1. Multi-Tenanted User System
- **Replit Users**: Platform authentication users (mandatory)
- **Staff Users**: Supermarket employees with location-based services
- **Customers**: End-users with CPF validation and eco-points tracking
- **Admin Users**: Platform administrators with full access

### 2. Product Management
- **Inventory System**: Real-time stock tracking with expiration dates
- **Dynamic Pricing**: Original and discount pricing with automatic calculations
- **Image Management**: Product photo uploads with file validation
- **Category System**: Organized product categorization

### 3. Order Processing
- **Multi-Payment Support**: PIX, credit cards, and Stripe integration
- **Fulfillment Methods**: Pickup and delivery options
- **Status Tracking**: Real-time order status updates
- **Inventory Synchronization**: Automatic stock updates on order completion

### 4. Eco-Points System
- **Waste Reduction Rewards**: Points based on product expiration proximity
- **Tiered Scoring**: Higher points for products closer to expiration
- **Action Tracking**: Comprehensive logging of eco-friendly actions
- **Gamification**: Encouraging sustainable consumption through rewards

### 5. Payment Integration
- **Mercado Pago**: PIX payments with QR codes and refund support
- **Stripe**: Credit card processing with secure tokenization
- **Refund Management**: Automated refund processing for cancelled orders
- **Payment Tracking**: Comprehensive payment status monitoring

## Data Flow

### Customer Journey
1. **Registration**: CPF validation and location-based supermarket discovery
2. **Product Discovery**: Browse products with eco-points preview
3. **Order Placement**: Multi-item cart with fulfillment method selection
4. **Payment Processing**: Secure payment with multiple options
5. **Order Fulfillment**: Status tracking and completion confirmation
6. **Eco-Points Reward**: Automatic points calculation and award

### Staff Operations
1. **Registration**: CNPJ validation and location setup
2. **Product Management**: Add, update, and manage inventory
3. **Order Processing**: Confirm items and manage fulfillment
4. **Analytics Dashboard**: Revenue tracking and performance metrics
5. **Marketing Tools**: Promotional campaigns and customer engagement

### Admin Functions
1. **Platform Oversight**: Monitor all users and transactions
2. **Data Analytics**: Comprehensive reporting and insights
3. **System Management**: User approvals and platform configuration

## External Dependencies

### Authentication & Security
- **Replit Auth**: OpenID Connect integration for user authentication
- **bcrypt**: Password hashing for staff and customer accounts
- **express-session**: Session management with PostgreSQL storage

### Payment Processing
- **Stripe**: Credit card payments and subscription management
- **Mercado Pago**: PIX payments and Brazilian payment methods
- **Payment Webhooks**: Real-time payment status updates

### Communication Services
- **SendGrid**: Email notifications and password reset functionality
- **Web Push**: Browser push notifications for order updates
- **VAPID**: Secure push notification authentication

### Database & Storage
- **Neon PostgreSQL**: Serverless PostgreSQL database
- **Drizzle ORM**: Type-safe database queries and migrations
- **Multer**: File upload handling for product images

### Development Tools
- **Vite**: Fast development server and build tool
- **esbuild**: Production server bundling
- **Tailwind CSS**: Utility-first CSS framework
- **Shadcn/UI**: Pre-built React components

## Deployment Strategy

### Build Process
1. **Frontend Build**: Vite compiles React app to static assets
2. **Server Build**: esbuild bundles TypeScript server to JavaScript
3. **Asset Optimization**: Automatic minification and compression
4. **PWA Generation**: Service worker and manifest file creation

### Production Configuration
- **Static File Serving**: Express serves built assets with proper MIME types
- **Environment Detection**: Automatic production mode detection
- **Health Checks**: API endpoints for monitoring and status
- **Error Handling**: Comprehensive error middleware and logging

### Replit Integration
- **Auto-deploy**: Automated deployment on code changes
- **Environment Variables**: Secure configuration management
- **Database Provisioning**: Automatic PostgreSQL setup
- **Port Configuration**: Multiple port handling for development

## Changelog
- June 12, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.