import { Router } from "express";
import { OrderController } from "../controllers/OrderController";

const router = Router();
const orderController = new OrderController();

// GET /api/orders - Get all orders
router.get("/", orderController.getAllOrders);

// GET /api/orders/stats - Get order statistics
router.get("/stats", orderController.getOrderStats);

// GET /api/orders/status/:status - Get orders by status
router.get("/status/:status", orderController.getOrdersByStatus);

// GET /api/orders/date-range - Get orders by date range
router.get("/date-range", orderController.getOrdersByDateRange);

// GET /api/orders/:id - Get order by ID
router.get("/:id", orderController.getOrderById);

// GET /api/orders/customer/:email - Get orders by customer email
router.get("/customer/:email", orderController.getOrdersByCustomerEmail);

// POST /api/orders - Create new order
router.post("/", orderController.createOrder);

// PUT /api/orders/:id/status - Update order status
router.put("/:id/status", orderController.updateOrderStatus);

export default router;