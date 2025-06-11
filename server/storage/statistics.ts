import { db } from "../db";
import { orders, orderItems, products, staffUsers } from "@shared/schema";
import { eq, desc, count, sum, and, sql, gte, lte } from "drizzle-orm";
import { IStatisticsStorage } from "./types";

export class StatisticsStorage implements IStatisticsStorage {
  async getStatsForStaff(staffId: number): Promise<any> {
    const totalOrders = await db
      .select({ count: count() })
      .from(orders)
      .where(eq(orders.createdByStaff, staffId));

    const totalRevenue = await db
      .select({ revenue: sum(orders.totalAmount) })
      .from(orders)
      .where(and(
        eq(orders.createdByStaff, staffId),
        eq(orders.status, 'completed')
      ));

    const recentOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.createdByStaff, staffId))
      .orderBy(desc(orders.createdAt))
      .limit(10);

    return {
      totalOrders: totalOrders[0]?.count || 0,
      totalRevenue: parseFloat(totalRevenue[0]?.revenue || '0'),
      recentOrders
    };
  }

  async getDashboardStats(): Promise<any> {
    const totalOrders = await db
      .select({ count: count() })
      .from(orders);

    const totalRevenue = await db
      .select({ revenue: sum(orders.totalAmount) })
      .from(orders)
      .where(eq(orders.status, 'completed'));

    const totalProducts = await db
      .select({ count: count() })
      .from(products);

    const totalStaff = await db
      .select({ count: count() })
      .from(staffUsers);

    return {
      totalOrders: totalOrders[0]?.count || 0,
      totalRevenue: parseFloat(totalRevenue[0]?.revenue || '0'),
      totalProducts: totalProducts[0]?.count || 0,
      totalStaff: totalStaff[0]?.count || 0
    };
  }

  async getOrderStatsByPeriod(startDate: Date, endDate: Date): Promise<any> {
    const orderStats = await db
      .select({
        count: count(),
        revenue: sum(orders.totalAmount)
      })
      .from(orders)
      .where(and(
        gte(orders.createdAt, startDate),
        lte(orders.createdAt, endDate)
      ));

    return {
      orderCount: orderStats[0]?.count || 0,
      totalRevenue: parseFloat(orderStats[0]?.revenue || '0')
    };
  }

  async getFinancialStatement(staffId?: number): Promise<any> {
    let conditions = [eq(orders.status, 'completed')];
    
    if (staffId) {
      conditions.push(eq(orders.createdByStaff, staffId));
    }

    const results = await db
      .select({
        id: orders.id,
        customerName: orders.customerName,
        totalAmount: orders.totalAmount,
        completedAt: sql<string>`to_char(${orders.updatedAt}, 'YYYY-MM-DD')`,
        dueDate: sql<string>`to_char(${orders.createdAt} + interval '30 days', 'YYYY-MM-DD')`,
        netAmount: orders.totalAmount,
        status: orders.status,
        orderItems: sql<any>`json_agg(
          json_build_object(
            'id', ${orderItems.id},
            'quantity', ${orderItems.quantity},
            'product', json_build_object(
              'name', ${products.name}
            )
          )
        )`
      })
      .from(orders)
      .leftJoin(orderItems, eq(orders.id, orderItems.orderId))
      .leftJoin(products, eq(orderItems.productId, products.id))
      .where(and(...conditions))
      .groupBy(orders.id)
      .orderBy(desc(orders.updatedAt));

    return results.map(result => ({
      ...result,
      orderItems: result.orderItems || []
    }));
  }

  async getRevenueAnalytics(period: 'week' | 'month' | 'year' = 'month'): Promise<any> {
    const periodMap = {
      week: '7 days',
      month: '30 days',
      year: '365 days'
    };

    const results = await db
      .select({
        period: sql<string>`to_char(${orders.createdAt}, 'YYYY-MM-DD')`,
        revenue: sum(orders.totalAmount),
        orderCount: count(orders.id)
      })
      .from(orders)
      .where(and(
        eq(orders.status, 'completed'),
        gte(orders.createdAt, sql`now() - interval '${sql.raw(periodMap[period])}'`)
      ))
      .groupBy(sql`to_char(${orders.createdAt}, 'YYYY-MM-DD')`)
      .orderBy(sql`to_char(${orders.createdAt}, 'YYYY-MM-DD')`);

    return results.map(result => ({
      period: result.period,
      revenue: parseFloat(result.revenue || '0'),
      orderCount: result.orderCount
    }));
  }
}