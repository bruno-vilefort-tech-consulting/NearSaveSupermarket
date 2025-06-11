# Modular Route Structure

This directory contains the modularized route structure for the SaveUp application. The original monolithic `routes.ts` file (4300+ lines) has been split into logical modules for better maintainability and development efficiency.

## Structure Overview

```
server/routes/
├── index.ts          # Main router that registers all modules
├── auth.ts           # Authentication and user routes
├── staff.ts          # Staff/supermarket management routes
├── public.ts         # Public customer-facing routes
├── orders.ts         # Order management and cancellation routes
├── payments.ts       # Payment processing (PIX and Stripe)
├── products.ts       # Product CRUD operations
├── uploads.ts        # File upload and static serving
└── README.md         # This documentation
```

## Module Responsibilities

### `index.ts`
- Central route registration
- Express app configuration
- Middleware setup
- Server creation

### `auth.ts`
- User authentication endpoints
- Session management
- Protected route handlers

### `staff.ts`
- Staff user registration and login
- CNPJ validation
- Staff profile management
- Staff-specific product management
- Staff statistics and analytics
- Order management for staff users

### `public.ts`
- Public product catalog
- Customer order retrieval
- Eco-actions and points
- Public order creation
- Customer-facing endpoints

### `orders.ts`
- Order cancellation (customer and staff)
- Order status management
- Refund processing
- Order retrieval and filtering

### `payments.ts`
- PIX payment creation and confirmation
- Stripe payment intent management
- Payment status verification
- Webhook handling
- Refund processing

### `products.ts`
- Product CRUD operations
- Authenticated product management
- Image upload handling
- Product statistics

### `uploads.ts`
- File upload configuration
- Static file serving
- Image management
- Missing image detection

## Key Features

### Error Handling
All modules include comprehensive error handling with proper HTTP status codes and descriptive error messages.

### Logging
Structured logging throughout all modules for debugging and monitoring.

### Security
- Authentication middleware where required
- Input validation using Zod schemas
- File upload restrictions and validation

### Performance
- Caching mechanisms for payment intents
- Efficient database queries
- Proper connection management

## Usage

The modular structure is automatically loaded through the main `index.ts` file. No changes are required to the application startup process.

### Adding New Routes

To add new routes:

1. Create a new module file in this directory
2. Export a registration function that takes an Express app
3. Import and call the function in `index.ts`

Example:
```typescript
// routes/newmodule.ts
import type { Express } from "express";

export function registerNewModuleRoutes(app: Express) {
  app.get("/api/newmodule", (req, res) => {
    res.json({ message: "New module working" });
  });
}

// routes/index.ts
import { registerNewModuleRoutes } from "./newmodule";

export async function registerRoutes(app: Express): Promise<Server> {
  // ... existing code
  registerNewModuleRoutes(app);
  // ... rest of code
}
```

## Benefits

1. **Maintainability**: Smaller, focused files are easier to understand and modify
2. **Collaboration**: Multiple developers can work on different modules simultaneously
3. **Testing**: Individual modules can be tested in isolation
4. **Performance**: Faster compilation and development reload times
5. **Organization**: Logical grouping of related functionality

## Migration Notes

The original `routes.ts` file has been backed up as `routes.ts.backup`. All functionality has been preserved and reorganized without any breaking changes to the API endpoints.