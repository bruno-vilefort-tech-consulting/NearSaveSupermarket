import { useState, useEffect } from "react";

interface StaffUser {
  id: number;
  email: string;
  phone: string;
  address: string;
  companyName: string;
  isActive: number;
  createdAt: string;
  updatedAt: string;
}

export function useStaffAuth() {
  const [staffUser, setStaffUser] = useState<StaffUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if staff is logged in
    const staffInfo = localStorage.getItem('staffInfo');
    if (staffInfo) {
      try {
        const parsedStaffInfo = JSON.parse(staffInfo);
        setStaffUser(parsedStaffInfo);
      } catch (error) {
        localStorage.removeItem('staffInfo');
      }
    }
    setIsLoading(false);
  }, []);

  const logout = () => {
    localStorage.removeItem('staffInfo');
    setStaffUser(null);
    window.location.href = '/';
  };

  return {
    staffUser,
    isStaffAuthenticated: !!staffUser,
    isLoading,
    logout,
  };
}