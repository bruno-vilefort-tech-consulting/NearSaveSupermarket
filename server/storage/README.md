# Storage Layer Modularization

This directory contains the modularized storage layer for the SaveUp application. The original 2285-line storage.ts file has been broken down into smaller, context-separated modules for better maintainability and development efficiency.

## Architecture Overview

The storage layer follows a modular pattern where each module handles a specific domain of the application:

```
server/storage/
├── types.ts           # All storage interface definitions
├── index.ts           # Main orchestrator and exports
├── users.ts           # Replit Auth user operations
├── staff.ts           # Staff user management
├── customers.ts       # Customer operations and authentication
├── admin.ts           # Admin user operations
├── products.ts        # Product CRUD operations
├── orders.ts          # Order management and processing
├── statistics.ts      # Analytics and reporting
├── eco-actions.ts     # Eco-friendly actions and points
├── auth.ts            # Password reset and authentication tokens
├── notifications.ts   # Push notifications
├── payments.ts        # Payment and refund operations
├── marketing.ts       # Marketing subscriptions
└── README.md          # This file
```

## Module Responsibilities

### Core Operations
- **users.ts**: Handles Replit authentication users (mandatory for platform integration)
- **staff.ts**: Manages supermarket staff users, approvals, and location updates
- **customers.ts**: Customer registration, authentication, and supermarket discovery
- **admin.ts**: Administrative user operations and validation

### Business Logic
- **products.ts**: Product creation, updates, inventory management
- **orders.ts**: Order lifecycle, item confirmation, payment status
- **statistics.ts**: Dashboard analytics, financial statements, revenue tracking
- **eco-actions.ts**: Environmental impact tracking and points system

### Support Services
- **auth.ts**: Password reset tokens for both customers and staff
- **notifications.ts**: Push notification subscription management
- **payments.ts**: PIX refunds and supermarket payment processing
- **marketing.ts**: Marketing subscription lifecycle management

## Usage

### Importing the Storage Layer

```typescript
// Use the complete storage interface (recommended)
import { storage } from "./storage";

// Use specific modules if needed
import { ProductStorage, OrderStorage } from "./storage";

// Access interfaces for type checking
import { IProductStorage, IOrderStorage } from "./storage/types";
```

### Example Usage

```typescript
// Get all products with filters
const products = await storage.getProducts({ 
  category: 'food', 
  isActive: true 
});

// Create a new order
const order = await storage.createOrder(orderData, orderItems);

// Update order status
await storage.updateOrderStatus(orderId, 'completed');

// Get statistics for a specific staff member
const stats = await storage.getStatsForStaff(staffId);
```

## Interface Compliance

Each storage module implements its corresponding interface from `types.ts`, ensuring:
- Type safety across the application
- Consistent method signatures
- Easy testing and mocking
- Clear contract definitions

## Backward Compatibility

The main `storage.ts` file now acts as a re-export layer, maintaining full backward compatibility:

```typescript
// This still works exactly as before
import { storage } from "./storage";
await storage.getProducts();
```

## Migration Benefits

1. **Maintainability**: Each module focuses on a single responsibility
2. **Development Speed**: Easier to locate and modify specific functionality
3. **Code Organization**: Logical separation of concerns
4. **Testing**: Smaller, focused modules are easier to test
5. **Collaboration**: Multiple developers can work on different modules
6. **Performance**: Faster IDE navigation and code analysis

## Database Schema Compliance

All modules work with the existing database schema defined in `shared/schema.ts` without requiring any structural changes. The modularization is purely organizational and does not affect:
- Database tables or relationships
- Existing API endpoints
- Frontend integrations
- Data integrity

## Error Handling

Each module implements consistent error handling patterns:
- Database constraint violations
- Type validation errors
- Business logic validations
- Proper error propagation

This modular approach significantly improves the codebase's maintainability while preserving all existing functionality.