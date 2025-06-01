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
                  // CRITICAL SECURITY: Block all direct order status updates
                  if (values.status) {
                    console.log(`🚨 CRITICAL ALERT: Direct order status update detected!`);
                    console.log(`🚨 Target status: ${values.status}`);
                    console.log(`🚨 Call origin:`, new Error().stack);
                    
                    // Check if this is an authorized call from updateOrderStatus
                    const stack = new Error().stack || '';
                    if (!stack.includes('updateOrderStatus')) {
                      console.log(`🛑 SECURITY BLOCK: Unauthorized direct database update blocked`);
                      throw new Error('SECURITY: Direct order status updates are forbidden. Use updateOrderStatus method only.');
                    }
                    
                    console.log(`✅ AUTHORIZED: Status update from updateOrderStatus method`);
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