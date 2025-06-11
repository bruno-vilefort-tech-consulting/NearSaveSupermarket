import { db } from "../db";
import { orders, staffUsers } from "@shared/schema";
import { eq, sum, and } from "drizzle-orm";
import { IPaymentsStorage } from "./types";

export class PaymentsStorage implements IPaymentsStorage {
  async updateOrderRefund(orderId: number, refundData: {
    pixRefundId: string;
    refundAmount: string;
    refundStatus: string;
    refundDate: Date;
    refundReason: string;
  }): Promise<void> {
    await db
      .update(orders)
      .set({
        pixRefundId: refundData.pixRefundId,
        refundAmount: refundData.refundAmount,
        refundStatus: refundData.refundStatus,
        refundDate: refundData.refundDate,
        refundReason: refundData.refundReason,
        updatedAt: new Date()
      })
      .where(eq(orders.id, orderId));
  }

  async updateSupermarketPaymentStatus(staffId: number, status: string, notes?: string): Promise<void> {
    await db
      .update(orders)
      .set({
        supermarketPaymentStatus: status,
        supermarketPaymentNotes: notes,
        updatedAt: new Date()
      })
      .where(eq(orders.supermarketId, staffId));
  }

  async getSupermarketPaymentSummary(staffId?: number): Promise<any> {
    let conditions = [eq(orders.status, 'completed')];
    
    if (staffId) {
      conditions.push(eq(orders.supermarketId, staffId));
    }

    const results = await db
      .select({
        supermarketId: orders.supermarketId,
        supermarketName: staffUsers.companyName,
        totalRevenue: sum(orders.totalAmount),
        pendingAmount: sum(orders.totalAmount),
        paidAmount: sum(orders.totalAmount),
      })
      .from(orders)
      .leftJoin(staffUsers, eq(orders.supermarketId, staffUsers.id))
      .where(and(...conditions))
      .groupBy(orders.supermarketId, staffUsers.companyName);

    return results.map(result => ({
      supermarketId: result.supermarketId,
      supermarketName: result.supermarketName || 'Supermercado',
      totalRevenue: parseFloat(result.totalRevenue || '0'),
      pendingAmount: parseFloat(result.pendingAmount || '0'),
      paidAmount: parseFloat(result.paidAmount || '0'),
    }));
  }
}