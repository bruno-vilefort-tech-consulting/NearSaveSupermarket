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
                  // ABSOLUTE BLOCK: No direct status updates allowed
                  if (values.status) {
                    console.log(`🚨 CRITICAL: Direct database update attempt on orders table`);
                    console.log(`🚨 Status being set to: ${values.status}`);
                    console.log(`🚨 Call stack:`, new Error().stack);
                    
                    // COMPLETE BLOCK - Only allow through updateOrderStatus with STAFF prefix
                    const stack = new Error().stack || '';
                    const isAuthorized = stack.includes('updateOrderStatus') && stack.includes('STAFF_');
                    
                    if (!isAuthorized) {
                      console.log(`🚫 BLOCKED: All direct status updates blocked. Status: ${values.status}`);
                      console.log(`🚫 Stack includes updateOrderStatus: ${stack.includes('updateOrderStatus')}`);
                      console.log(`🚫 Stack includes STAFF_: ${stack.includes('STAFF_')}`);
                      throw new Error(`SECURITY LOCKDOWN: All order status updates blocked. Only manual staff changes allowed.`);
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