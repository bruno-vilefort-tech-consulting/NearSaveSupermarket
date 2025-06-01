import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Create a proxy to intercept all database operations
const dbProxy = new Proxy(drizzle({ client: pool, schema }), {
  get(target, prop) {
    const originalMethod = target[prop];
    
    // Intercept update operations
    if (prop === 'update') {
      return function(table: any) {
        const updateProxy = originalMethod.call(target, table);
        
        // Check if this is an orders table update
        if (table === schema.orders) {
          return new Proxy(updateProxy, {
            get(updateTarget, updateProp) {
              if (updateProp === 'set') {
                return function(values: any) {
                  // Log any attempt to update order status
                  if (values.status) {
                    console.log(`🚨 CRITICAL: Direct database update attempt on orders table`);
                    console.log(`🚨 Status being set to: ${values.status}`);
                    console.log(`🚨 Call stack:`, new Error().stack);
                    
                    // Block unauthorized status updates
                    const stack = new Error().stack || '';
                    if (!stack.includes('updateOrderStatus') && values.status !== 'pending') {
                      console.log(`🚫 BLOCKED: Unauthorized direct status update to ${values.status}`);
                      throw new Error(`SECURITY: Direct order status updates are not allowed. Use updateOrderStatus method.`);
                    }
                  }
                  
                  return updateTarget[updateProp].call(updateTarget, values);
                };
              }
              return updateTarget[updateProp];
            }
          });
        }
        
        return updateProxy;
      };
    }
    
    return originalMethod;
  }
});

export const db = dbProxy;