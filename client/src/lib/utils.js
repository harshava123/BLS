import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Phone number validation utilities
export const validatePhoneNumber = (phone) => {
  if (!phone) return { isValid: false, error: "Phone number is required" };
  
  // Remove all non-digit characters
  const cleanPhone = phone.replace(/\D/g, '');
  
  if (cleanPhone.length !== 10) {
    return { isValid: false, error: "Phone number must be exactly 10 digits" };
  }
  
  if (!/^[6-9]/.test(cleanPhone)) {
    return { isValid: false, error: "Phone number must start with 6, 7, 8, or 9" };
  }
  
  return { isValid: true, error: null };
};

export const formatPhoneNumber = (phone) => {
  // Remove all non-digit characters
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Format as XXX-XXX-XXXX
  if (cleanPhone.length >= 6) {
    return `${cleanPhone.slice(0, 3)}-${cleanPhone.slice(3, 6)}-${cleanPhone.slice(6, 10)}`;
  } else if (cleanPhone.length >= 3) {
    return `${cleanPhone.slice(0, 3)}-${cleanPhone.slice(3)}`;
  } else {
    return cleanPhone;
  }
};
