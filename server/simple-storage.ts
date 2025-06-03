// Minimal storage implementation to get the app running
export interface SimpleStorage {
  getProducts(): Promise<any[]>;
  getOrders(): Promise<any[]>;
}

export class MemoryStorage implements SimpleStorage {
  async getProducts(): Promise<any[]> {
    return [
      {
        id: 1,
        name: "Banana Orgânica",
        originalPrice: "8.99",
        discountPrice: "5.99",
        category: "Frutas",
        expirationDate: "2025-06-05",
        ecoPoints: 15,
        quantity: 25
      },
      {
        id: 2,
        name: "Pão Integral",
        originalPrice: "6.50",
        discountPrice: "4.00",
        category: "Padaria",
        expirationDate: "2025-06-04",
        ecoPoints: 20,
        quantity: 12
      }
    ];
  }

  async getOrders(): Promise<any[]> {
    return [];
  }
}

export const simpleStorage = new MemoryStorage();