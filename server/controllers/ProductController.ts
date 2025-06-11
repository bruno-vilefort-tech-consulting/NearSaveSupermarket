import { Request, Response } from "express";
import { BaseController } from "./BaseController";
import { ProductService } from "../services/ProductService";
import multer from "multer";
import path from "path";
import fs from "fs";

const productService = new ProductService();

const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

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

export class ProductController extends BaseController {
  
  getAllProducts = this.asyncHandler(async (req: Request, res: Response) => {
    const products = await productService.getAllProducts();
    this.handleSuccess(res, products);
  });

  getProductById = this.asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const product = await productService.getProductById(id);
    
    if (!product) {
      return this.handleError(res, new Error("Product not found"), 404);
    }
    
    this.handleSuccess(res, product);
  });

  createProduct = this.asyncHandler(async (req: Request, res: Response) => {
    const missing = this.validateRequired(req, ['name', 'category', 'originalPrice', 'discountPrice', 'quantity', 'expirationDate']);
    if (missing.length > 0) {
      return this.handleError(res, new Error(`Missing required fields: ${missing.join(', ')}`), 400);
    }

    const product = await productService.createProduct({
      ...req.body,
      createdBy: req.body.createdBy || null,
      createdByStaff: req.body.createdByStaff || null
    });
    
    this.handleSuccess(res, product, 201);
  });

  updateProduct = this.asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const product = await productService.updateProduct(id, req.body);
    
    if (!product) {
      return this.handleError(res, new Error("Product not found"), 404);
    }
    
    this.handleSuccess(res, product);
  });

  deleteProduct = this.asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    await productService.deleteProduct(id);
    this.handleSuccess(res, { message: "Product deleted successfully" });
  });

  getProductsByCategory = this.asyncHandler(async (req: Request, res: Response) => {
    const category = req.params.category;
    const products = await productService.getProductsByCategory(category);
    this.handleSuccess(res, products);
  });

  getMissingImages = this.asyncHandler(async (req: Request, res: Response) => {
    const missingImages = await productService.getMissingImages();
    this.handleSuccess(res, missingImages);
  });

  uploadProductImage = this.asyncHandler(async (req: Request, res: Response) => {
    upload.single('image')(req, res, async (err) => {
      if (err) {
        return this.handleError(res, err, 400);
      }

      if (!req.file) {
        return this.handleError(res, new Error("No file uploaded"), 400);
      }

      const id = parseInt(req.params.id);
      const imageUrl = `/uploads/${req.file.filename}`;
      
      const product = await productService.updateProduct(id, { imageUrl });
      
      if (!product) {
        return this.handleError(res, new Error("Product not found"), 404);
      }
      
      this.handleSuccess(res, { imageUrl, product });
    });
  });
}