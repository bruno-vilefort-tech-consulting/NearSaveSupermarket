import { BaseService } from "./BaseService";
import { insertOrderSchema, orders, orderItems } from "@shared/schema";
import { eq, sql } from "drizzle-orm";
import { sendOrderStatusNotification, sendEcoPointsNotification } from "../push-service";

type Order = typeof orders.$inferSelect;
type InsertOrder = typeof orders.$inferInsert;

export class OrderService extends BaseService {
  
  async getAllOrders(): Promise<Order[]> {
    try {
      return await this.storage.getOrders();
    } catch (error) {
      this.handleError(error, "OrderService.getAllOrders");
    }
  }

  async getOrderById(id: number): Promise<Order | undefined> {
    try {
      return await this.storage.getOrder(id);
    } catch (error) {
      this.handleError(error, "OrderService.getOrderById");
    }
  }

  async getOrdersByCustomerEmail(email: string): Promise<Order[]> {
    try {
      console.log(`🔍 MONITORING: Querying orders for email ${email}`);
      
      const ordersResult = await this.db
        .select()
        .from(orders)
        .where(eq(orders.customerEmail, email))
        .orderBy(sql`${orders.createdAt} DESC`);

      console.log(`📊 MONITORING: Found ${ordersResult.length} orders for ${email}:`, 
        ordersResult.map(o => ({
          id: o.id,
          status: o.status,
          updated: o.updatedAt
        }))
      );

      return ordersResult;
    } catch (error) {
      this.handleError(error, "OrderService.getOrdersByCustomerEmail");
    }
  }

  async createOrder(orderData: Partial<InsertOrder>): Promise<Order> {
    try {
      const validatedData = insertOrderSchema.parse(orderData);
      return await this.storage.createOrder(validatedData);
    } catch (error) {
      this.handleError(error, "OrderService.createOrder");
    }
  }

  async updateOrderStatus(id: number, status: string): Promise<Order | undefined> {
    try {
      const order = await this.storage.updateOrderStatus(id, status);

      if (order && order.customerEmail) {
        await sendOrderStatusNotification(
          order.customerEmail,
          order.id,
          status
        ).catch(err => console.log('Push notification failed:', err));
      }

      return order;
    } catch (error) {
      this.handleError(error, "OrderService.updateOrderStatus");
    }
  }

  async getOrdersByStatus(status: string): Promise<Order[]> {
    try {
      const allOrders = await this.storage.getOrders();
      return allOrders.filter(order => order.status === status);
    } catch (error) {
      this.handleError(error, "OrderService.getOrdersByStatus");
    }
  }

  async getOrdersByDateRange(startDate: string, endDate: string): Promise<Order[]> {
    try {
      const allOrders = await this.storage.getOrders();
      return allOrders.filter(order => {
        if (!order.createdAt) return false;
        const orderDate = new Date(order.createdAt);
        return orderDate >= new Date(startDate) && orderDate <= new Date(endDate);
      });
    } catch (error) {
      this.handleError(error, "OrderService.getOrdersByDateRange");
    }
  }

  async calculateOrderStats(): Promise<{
    total: number;
    pending: number;
    completed: number;
    cancelled: number;
    totalRevenue: number;
  }> {
    try {
      const allOrders = await this.storage.getOrders();
      
      return {
        total: allOrders.length,
        pending: allOrders.filter(o => o.status === 'pending').length,
        completed: allOrders.filter(o => o.status === 'completed').length,
        cancelled: allOrders.filter(o => o.status.includes('cancelled')).length,
        totalRevenue: allOrders
          .filter(o => o.status === 'completed')
          .reduce((sum, o) => sum + parseFloat(o.totalAmount), 0)
      };
    } catch (error) {
      this.handleError(error, "OrderService.calculateOrderStats");
    }
  }
}