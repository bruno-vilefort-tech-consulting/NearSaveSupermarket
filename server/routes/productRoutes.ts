import { Router } from "express";
import { ProductController } from "../controllers/ProductController";
import { isAuthenticated } from "../replitAuth";
import multer from "multer";
import path from "path";

const uploadDir = path.join(process.cwd(), "uploads");
const upload = multer({
  dest: uploadDir,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

const router = Router();
const productController = new ProductController();

// Public routes
router.get("/public", productController.getPublicProducts);

// Authenticated routes
router.get("/", isAuthenticated, productController.getAllProducts);
router.get("/:id", isAuthenticated, productController.getProductById);
router.post("/", isAuthenticated, upload.single("image"), productController.createProduct);
router.put("/:id", isAuthenticated, upload.single("image"), productController.updateProduct);
router.delete("/:id", productController.deleteProduct);

// Category routes
router.get("/category/:category", productController.getProductsByCategory);

// Admin routes
router.get("/admin/missing-images", productController.getMissingImages);

// Staff specific routes
router.get("/staff", productController.getStaffProducts);
router.post("/staff", upload.single("image"), productController.createStaffProduct);
router.put("/staff/:id", upload.single("image"), productController.updateStaffProduct);
router.delete("/staff/:id", productController.deleteStaffProduct);

export default router;