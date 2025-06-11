import { Request, Response } from "express";
import { OrderService } from "../services/OrderService";
import { insertOrderSchema } from "@shared/schema";

export class OrderController {
  private orderService: OrderService;

  constructor() {
    this.orderService = new OrderService();
  }

  getAllOrders = async (req: Request, res: Response) => {
    try {
      const { status } = req.query;
      const filters = status ? { status: status as string } : undefined;
      const orders = await this.orderService.getAllOrders(filters);
      res.json(orders);
    } catch (error: any) {
      console.error("Error getting orders:", error);
      res.status(500).json({ error: error.message });
    }
  };

  getOrderStats = async (req: Request, res: Response) => {
    try {
      const stats = await this.orderService.getOrderStatistics();
      res.json(stats);
    } catch (error: any) {
      console.error("Error getting order stats:", error);
      res.status(500).json({ error: error.message });
    }
  };

  getOrdersByStatus = async (req: Request, res: Response) => {
    try {
      const { status } = req.params;
      const orders = await this.orderService.getOrdersByStatus(status);
      res.json(orders);
    } catch (error: any) {
      console.error("Error getting orders by status:", error);
      res.status(500).json({ error: error.message });
    }
  };

  getOrdersByDateRange = async (req: Request, res: Response) => {
    try {
      const { startDate, endDate } = req.query;
      if (!startDate || !endDate) {
        return res.status(400).json({ error: "Start date and end date are required" });
      }
      const orders = await this.orderService.getOrdersByDateRange(
        startDate as string, 
        endDate as string
      );
      res.json(orders);
    } catch (error: any) {
      console.error("Error getting orders by date range:", error);
      res.status(500).json({ error: error.message });
    }
  };

  getOrderById = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid order ID" });
      }
      const order = await this.orderService.getOrderById(id);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      res.json(order);
    } catch (error: any) {
      console.error("Error getting order by ID:", error);
      res.status(500).json({ error: error.message });
    }
  };

  getOrdersByCustomerEmail = async (req: Request, res: Response) => {
    try {
      const { email } = req.params;
      const orders = await this.orderService.getOrdersByCustomerEmail(email);
      res.json(orders);
    } catch (error: any) {
      console.error("Error getting orders by customer email:", error);
      res.status(500).json({ error: error.message });
    }
  };

  createOrder = async (req: Request, res: Response) => {
    try {
      const { orderData, items } = req.body;
      if (!orderData || !items || !Array.isArray(items)) {
        return res.status(400).json({ error: "Order data and items are required" });
      }
      
      const order = await this.orderService.createOrder(orderData, items);
      res.status(201).json(order);
    } catch (error: any) {
      console.error("Error creating order:", error);
      res.status(500).json({ error: error.message });
    }
  };

  updateOrderStatus = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid order ID" });
      }
      
      if (!status) {
        return res.status(400).json({ error: "Status is required" });
      }

      const order = await this.orderService.updateOrderStatus(id, status);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      
      res.json(order);
    } catch (error: any) {
      console.error("Error updating order status:", error);
      res.status(500).json({ error: error.message });
    }
  };
}