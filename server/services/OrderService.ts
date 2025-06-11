import { BaseService } from "./BaseService";
import { insertOrderSchema, type Order, orders, orderItems, customers } from "@shared/schema";
import { eq, and, sql } from "drizzle-orm";
import { sendOrderStatusNotification, sendEcoPointsNotification } from "../push-service";

export class OrderService extends BaseService {
  
  async getAllOrders(): Promise<Order[]> {
    try {
      return await this.storage.getOrders();
    } catch (error) {
      this.handleError(error, "OrderService.getAllOrders");
    }
  }

  async getOrderById(id: number): Promise<Order | null> {
    try {
      return await this.storage.getOrderById(id);
    } catch (error) {
      this.handleError(error, "OrderService.getOrderById");
    }
  }

  async getOrdersByCustomerEmail(email: string): Promise<Order[]> {
    try {
      console.log(`🔍 MONITORING: Querying orders for email ${email}`);
      
      const ordersResult = await this.db
        .select({
          id: orders.id,
          customerName: orders.customerName,
          customerEmail: orders.customerEmail,
          customerPhone: orders.customerPhone,
          customerAddress: orders.customerAddress,
          items: orders.items,
          total: orders.total,
          status: orders.status,
          paymentMethod: orders.paymentMethod,
          paymentId: orders.paymentId,
          ecoPoints: orders.ecoPoints,
          supermarketId: orders.supermarketId,
          createdAt: orders.createdAt,
          updatedAt: orders.updatedAt
        })
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

  async createOrder(orderData: any): Promise<Order> {
    try {
      const validatedData = insertOrderSchema.parse(orderData);
      return await this.storage.createOrder(validatedData);
    } catch (error) {
      this.handleError(error, "OrderService.createOrder");
    }
  }

  async updateOrderStatus(id: number, status: string, updatedBy?: string): Promise<Order> {
    try {
      const order = await this.storage.updateOrder(id, { 
        status, 
        updatedAt: new Date().toISOString() 
      });

      // Send push notification for status updates
      if (order.customerEmail) {
        await sendOrderStatusNotification(
          order.customerEmail,
          order.id,
          status
        ).catch(err => console.log('Push notification failed:', err));
      }

      // Award eco points for completed orders
      if (status === 'completed' && order.ecoPoints && order.ecoPoints > 0) {
        await sendEcoPointsNotification(
          order.customerEmail,
          order.ecoPoints
        ).catch(err => console.log('Eco points notification failed:', err));
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
          .reduce((sum, o) => sum + o.total, 0)
      };
    } catch (error) {
      this.handleError(error, "OrderService.calculateOrderStats");
    }
  }
}