import { Router } from "express";
import { ProductController } from "../controllers/ProductController";

const router = Router();
const productController = new ProductController();

// GET /api/products - Get all products
router.get("/", productController.getAllProducts);

// GET /api/products/:id - Get product by ID
router.get("/:id", productController.getProductById);

// POST /api/products - Create new product
router.post("/", productController.createProduct);

// PUT /api/products/:id - Update product
router.put("/:id", productController.updateProduct);

// DELETE /api/products/:id - Delete product
router.delete("/:id", productController.deleteProduct);

// GET /api/products/category/:category - Get products by category
router.get("/category/:category", productController.getProductsByCategory);

// GET /api/products/admin/missing-images - Get products with missing images
router.get("/admin/missing-images", productController.getMissingImages);

// POST /api/products/:id/upload-image - Upload product image
router.post("/:id/upload-image", productController.uploadProductImage);

export default router;