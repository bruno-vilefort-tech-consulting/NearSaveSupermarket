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

// Create monitoring proxy to track all database operations
const originalDb = drizzle({ client: pool, schema });

const monitoringProxy = new Proxy(originalDb, {
  get(target, prop) {
    const originalMethod = target[prop];
    
    // Monitor execute method for direct SQL
    if (prop === 'execute') {
      return function(query: any) {
        const queryStr = query.sql || String(query);
        if (queryStr.includes('UPDATE orders') && queryStr.includes('status')) {
          console.log(`🚨 CRITICAL: Direct SQL order status update detected!`);
          console.log(`🚨 Query: ${queryStr}`);
          console.log(`🚨 Stack trace:`, new Error().stack);
        }
        return originalMethod.call(target, query);
      };
    }
    
    // Monitor update method
    if (prop === 'update') {
      return function(table: any) {
        const updateProxy = originalMethod.call(target, table);
        
        if (table === schema.orders) {
          // Simplified monitoring without interference
          console.log(`🔄 Orders update detected`);
        }
        
        return updateProxy;
      };
    }
    
    return originalMethod;
  }
});

export const db = monitoringProxy;