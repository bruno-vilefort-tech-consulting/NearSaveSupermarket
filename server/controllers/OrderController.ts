import { Request, Response } from "express";
import { BaseController } from "./BaseController";
import { OrderService } from "../services/OrderService";

const orderService = new OrderService();

export class OrderController extends BaseController {
  
  getAllOrders = this.asyncHandler(async (req: Request, res: Response) => {
    const orders = await orderService.getAllOrders();
    this.handleSuccess(res, orders);
  });

  getOrderById = this.asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const order = await orderService.getOrderById(id);
    
    if (!order) {
      return this.handleError(res, new Error("Order not found"), 404);
    }
    
    this.handleSuccess(res, order);
  });

  getOrdersByCustomerEmail = this.asyncHandler(async (req: Request, res: Response) => {
    const email = req.params.email;
    const orders = await orderService.getOrdersByCustomerEmail(email);
    this.handleSuccess(res, orders);
  });

  createOrder = this.asyncHandler(async (req: Request, res: Response) => {
    const missing = this.validateRequired(req, ['customerName', 'totalAmount', 'fulfillmentMethod']);
    if (missing.length > 0) {
      return this.handleError(res, new Error(`Missing required fields: ${missing.join(', ')}`), 400);
    }

    const order = await orderService.createOrder(req.body);
    this.handleSuccess(res, order, 201);
  });

  updateOrderStatus = this.asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const { status } = req.body;
    
    if (!status) {
      return this.handleError(res, new Error("Status is required"), 400);
    }

    const order = await orderService.updateOrderStatus(id, status);
    
    if (!order) {
      return this.handleError(res, new Error("Order not found"), 404);
    }
    
    this.handleSuccess(res, order);
  });

  getOrdersByStatus = this.asyncHandler(async (req: Request, res: Response) => {
    const status = req.params.status;
    const orders = await orderService.getOrdersByStatus(status);
    this.handleSuccess(res, orders);
  });

  getOrdersByDateRange = this.asyncHandler(async (req: Request, res: Response) => {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return this.handleError(res, new Error("Start date and end date are required"), 400);
    }
    
    const orders = await orderService.getOrdersByDateRange(startDate as string, endDate as string);
    this.handleSuccess(res, orders);
  });

  getOrderStats = this.asyncHandler(async (req: Request, res: Response) => {
    const stats = await orderService.calculateOrderStats();
    this.handleSuccess(res, stats);
  });
}