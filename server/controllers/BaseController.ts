import { Request, Response, NextFunction } from "express";

export abstract class BaseController {
  
  protected handleSuccess(res: Response, data: any, statusCode: number = 200): void {
    res.status(statusCode).json(data);
  }

  protected handleError(res: Response, error: any, statusCode: number = 500): void {
    console.error('Controller Error:', error);
    res.status(statusCode).json({ 
      error: error.message || 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  }

  protected validateRequired(req: Request, fields: string[]): string[] {
    const missing = fields.filter(field => !req.body[field]);
    return missing;
  }

  protected asyncHandler(fn: Function) {
    return (req: Request, res: Response, next: NextFunction) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }
}