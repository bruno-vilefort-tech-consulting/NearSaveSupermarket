import { storage } from "../storage";
import { db } from "../db";

export abstract class BaseService {
  protected storage = storage;
  protected db = db;
  
  protected handleError(error: any, context: string): never {
    console.error(`Error in ${context}:`, error);
    throw new Error(`${context} failed: ${error.message}`);
  }
  
  protected validateInput<T>(data: T, validator: (data: T) => boolean, message: string): void {
    if (!validator(data)) {
      throw new Error(message);
    }
  }
}