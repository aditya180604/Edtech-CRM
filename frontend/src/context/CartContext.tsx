import React, { createContext, useContext, useState, useEffect } from 'react';
import type { CartItem } from '../types';

interface AppliedCoupon {
  code: string;
  percent?: number;
  amount?: number;
  description: string;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  isInCart: (id: string) => boolean;
  itemCount: number;
  subtotal: number;
  discount: number;
  total: number;
  appliedCoupon: AppliedCoupon | null;
  applyCoupon: (code: string) => { success: boolean; message: string };
  removeCoupon: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const STORAGE_KEY = 'edtech_shopping_cart';
const COUPON_STORAGE_KEY = 'edtech_applied_coupon';

const VALID_COUPONS: Record<string, { percent?: number; amount?: number; description: string }> = {
  EDU10: { percent: 10, description: '10% Educational Discount' },
  WELCOME50: { percent: 50, description: '50% Welcome Discount' },
  SAVE20: { percent: 20, description: '20% Special Savings' },
  DEV100: { amount: 100, description: '₹100 Developer Voucher' },
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(() => {
    try {
      const stored = localStorage.getItem(COUPON_STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (err) {
      console.warn('Failed to save cart to localStorage:', err);
    }
  }, [items]);

  useEffect(() => {
    try {
      if (appliedCoupon) {
        localStorage.setItem(COUPON_STORAGE_KEY, JSON.stringify(appliedCoupon));
      } else {
        localStorage.removeItem(COUPON_STORAGE_KEY);
      }
    } catch (err) {
      console.warn('Failed to save coupon to localStorage:', err);
    }
  }, [appliedCoupon]);

  const addToCart = (item: CartItem) => {
    setItems((prev) => {
      // Prevent duplicate additions
      const exists = prev.some((i) => i.id === item.id);
      if (exists) return prev;
      return [...prev, item];
    });
  };

  const removeFromCart = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const clearCart = () => {
    setItems([]);
    setAppliedCoupon(null);
  };

  const isInCart = (id: string) => {
    return items.some((i) => i.id === id);
  };

  const subtotal = items.reduce((sum, item) => sum + (Number(item.price) || 0), 0);

  let discount = 0;
  if (appliedCoupon && subtotal > 0) {
    if (appliedCoupon.percent) {
      discount = Math.round((subtotal * appliedCoupon.percent) / 100);
    } else if (appliedCoupon.amount) {
      discount = Math.min(appliedCoupon.amount, subtotal);
    }
  }

  const total = Math.max(0, subtotal - discount);

  const applyCoupon = (code: string): { success: boolean; message: string } => {
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      return { success: false, message: 'Please enter a coupon code.' };
    }

    const match = VALID_COUPONS[cleanCode];
    if (match) {
      const couponObj: AppliedCoupon = {
        code: cleanCode,
        percent: match.percent,
        amount: match.amount,
        description: match.description,
      };
      setAppliedCoupon(couponObj);
      return { success: true, message: `Coupon applied: ${match.description}!` };
    }

    return { success: false, message: 'Invalid coupon code. Try EDU10, WELCOME50, or SAVE20' };
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        clearCart,
        isInCart,
        itemCount: items.length,
        subtotal,
        discount,
        total,
        appliedCoupon,
        applyCoupon,
        removeCoupon,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
