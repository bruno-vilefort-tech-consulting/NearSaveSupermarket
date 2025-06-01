import { useState, useEffect } from "react";

interface Customer {
  id: number;
  cpf: string;
  fullName: string;
  phone: string;
  email: string;
  ecoPoints: number;
  totalEcoActions: number;
  isActive: number;
  createdAt: string;
  updatedAt: string;
}

export function useCustomerAuth() {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const customerInfo = localStorage.getItem('customerInfo');
    if (customerInfo) {
      try {
        const parsedCustomer = JSON.parse(customerInfo);
        setCustomer(parsedCustomer);
      } catch (error) {
        console.error('Error parsing customer info:', error);
        localStorage.removeItem('customerInfo');
      }
    }
    setIsLoading(false);
  }, []);

  const logout = () => {
    localStorage.removeItem('customerInfo');
    setCustomer(null);
    window.location.href = '/customer/login';
  };

  return {
    customer,
    isLoading,
    isAuthenticated: !!customer,
    logout,
  };
}