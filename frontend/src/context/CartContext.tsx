import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { cartApi, type CartLineItem } from '../api/cart';
import { checkoutApi, type AppliedCouponQuote, type CheckoutQuoteResponse } from '../api/checkout';
import { useAuth } from './AuthContext';

interface CartContextType {
  items: CartLineItem[];
  itemCount: number;
  subtotal: number;
  discount: number;
  credit: number;
  total: number;
  currency: string;
  appliedCoupon: AppliedCouponQuote | null;
  quote: CheckoutQuoteResponse | null;
  loading: boolean;
  isValidatingCoupon: boolean;
  addToCart: (
    productId: string,
    productType?: 'COURSE' | 'CONTENT_OFFERING',
    meta?: { title?: string; price?: number; thumbnail?: string; courseId?: string; topicId?: string }
  ) => Promise<{ success: boolean; message?: string }>;
  removeFromCart: (productId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  isInCart: (productId: string) => boolean;
  applyCoupon: (code: string) => Promise<{ success: boolean; message: string }>;
  removeCoupon: () => Promise<void>;
  refreshQuote: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const GUEST_STORAGE_KEY = 'edtech_guest_cart_v2';
const GUEST_COUPON_KEY = 'edtech_guest_coupon_code';

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();

  const [items, setItems] = useState<CartLineItem[]>([]);
  const [quote, setQuote] = useState<CheckoutQuoteResponse | null>(null);
  const [couponCode, setCouponCode] = useState<string>(() => {
    try {
      return localStorage.getItem(GUEST_COUPON_KEY) || '';
    } catch {
      return '';
    }
  });

  const [loading, setLoading] = useState(false);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

  // Fetch Cart & Live Quote
  const syncCart = useCallback(
    async (currentCoupon = couponCode, guestItemsOverride?: any[]) => {
      if (!isAuthenticated) {
        // Guest cart from localStorage
        try {
          const raw = localStorage.getItem(GUEST_STORAGE_KEY);
          const guestItems = guestItemsOverride || (raw ? JSON.parse(raw) : []);
          if (!guestItems || guestItems.length === 0) {
            setItems([]);
            setQuote(null);
            return;
          }
          // Request quote for guest items
          const res = await checkoutApi.getQuote({
            couponCode: currentCoupon || undefined,
            items: guestItems,
          }).catch(() => null);

          if (res?.success && res.data && Array.isArray(res.data.items) && res.data.items.length > 0) {
            setItems(res.data.items);
            setQuote(res.data);
          } else {
            // Offline/fallback item representation for guest cart
            const fallbackItems: CartLineItem[] = guestItems.map((g: any) => ({
              productId: g.productId || g.id || g._id,
              productType: g.productType || 'COURSE',
              title: g.title || 'Course Item',
              unitPrice: g.price || 0,
              discount: 0,
              finalPrice: g.price || 0,
              currency: 'INR',
              thumbnail: g.thumbnail,
            }));
            setItems(fallbackItems);
          }
        } catch {
          setItems([]);
        }
        return;
      }

      // Authenticated User: Load from Backend
      try {
        setLoading(true);
        // First, check if there was a guest cart to merge
        const rawGuest = localStorage.getItem(GUEST_STORAGE_KEY);
        if (rawGuest) {
          try {
            const parsedGuest = JSON.parse(rawGuest);
            if (Array.isArray(parsedGuest) && parsedGuest.length > 0) {
              await cartApi.mergeGuestCart(
                parsedGuest.map((p: any) => ({
                  productType: p.productType || 'COURSE',
                  productId: p.productId || p.id || p._id,
                }))
              );
              localStorage.removeItem(GUEST_STORAGE_KEY);
            }
          } catch {
            localStorage.removeItem(GUEST_STORAGE_KEY);
          }
        }

        // Get live quote from backend
        const quoteRes = await checkoutApi.getQuote({ couponCode: currentCoupon || undefined });
        if (quoteRes.success && quoteRes.data) {
          setItems(quoteRes.data.items);
          setQuote(quoteRes.data);
        } else {
          // Fallback to basic cart
          const cartRes = await cartApi.getCart();
          if (cartRes.success && cartRes.data) {
            setItems(cartRes.data.items);
          }
        }
      } catch (err) {
        console.error('Failed to sync backend cart:', err);
      } finally {
        setLoading(false);
      }
    },
    [isAuthenticated, couponCode]
  );

  useEffect(() => {
    syncCart(couponCode);
  }, [isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

  // Add Item
  const addToCart = async (
    productId: string,
    productType: 'COURSE' | 'CONTENT_OFFERING' = 'COURSE',
    meta?: { title?: string; price?: number; thumbnail?: string; courseId?: string; topicId?: string }
  ): Promise<{ success: boolean; message?: string }> => {
    if (!isAuthenticated) {
      // Guest cart
      try {
        const raw = localStorage.getItem(GUEST_STORAGE_KEY);
        const currentGuest = raw ? JSON.parse(raw) : [];
        const exists = currentGuest.some((g: any) => (g.productId || g.id) === productId);
        if (exists) {
          return { success: false, message: 'This item is already in your cart.' };
        }
        currentGuest.push({ productId, productType, ...meta });
        localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(currentGuest));
        await syncCart(couponCode, currentGuest);
        return { success: true, message: 'Added to cart successfully!' };
      } catch (err: any) {
        return { success: false, message: err?.message || 'Failed to add to cart.' };
      }
    }

    // Authenticated
    try {
      const res = await cartApi.addItem({ productType, productId });
      if (res.success) {
        await syncCart();
        return { success: true, message: 'Added to cart successfully!' };
      }
      return { success: false, message: res.message || 'Failed to add item.' };
    } catch (err: any) {
      const msg = err?.response?.data?.error?.message || err?.response?.data?.message || err?.message || 'Failed to add item.';
      return { success: false, message: msg };
    }
  };

  // Remove Item
  const removeFromCart = async (productId: string) => {
    if (!isAuthenticated) {
      try {
        const raw = localStorage.getItem(GUEST_STORAGE_KEY);
        const currentGuest = raw ? JSON.parse(raw) : [];
        const filtered = currentGuest.filter((g: any) => (g.productId || g.id) !== productId);
        localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(filtered));
        await syncCart();
      } catch {}
      return;
    }

    try {
      await cartApi.removeItem(productId);
      await syncCart();
    } catch (err) {
      console.error('Failed to remove item:', err);
    }
  };

  // Clear Cart
  const clearCart = async () => {
    localStorage.removeItem(GUEST_STORAGE_KEY);
    localStorage.removeItem(GUEST_COUPON_KEY);
    setCouponCode('');

    if (isAuthenticated) {
      try {
        await cartApi.clearCart();
      } catch (err) {
        console.error('Failed to clear cart:', err);
      }
    }
    setItems([]);
    setQuote(null);
  };

  const isInCart = (productId: string) => {
    return items.some((i) => i.productId === productId || i.courseId === productId);
  };

  // Apply Coupon
  const applyCoupon = async (code: string): Promise<{ success: boolean; message: string }> => {
    const cleanCode = code.trim();
    if (!cleanCode) {
      return { success: false, message: 'Please enter an 8-character coupon code.' };
    }

    setIsValidatingCoupon(true);
    try {
      const res = await checkoutApi.getQuote({ couponCode: cleanCode });
      if (res.success && res.data?.coupon?.applied) {
        setCouponCode(cleanCode);
        try {
          localStorage.setItem(GUEST_COUPON_KEY, cleanCode);
        } catch {}
        setItems(res.data.items);
        setQuote(res.data);

        const discountAmt = res.data.discount;
        const targetCourse = res.data.coupon.courseTitle ? ` for "${res.data.coupon.courseTitle}"` : '';
        return {
          success: true,
          message: `Coupon "${res.data.coupon.code}" applied${targetCourse}! You saved ₹${discountAmt.toLocaleString('en-IN')}.`,
        };
      } else {
        return { success: false, message: 'Invalid coupon code.' };
      }
    } catch (err: any) {
      const errorMsg =
        err?.response?.data?.error?.message ||
        err?.response?.data?.message ||
        err?.message ||
        'Failed to validate coupon code.';
      return { success: false, message: errorMsg };
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  // Remove Coupon
  const removeCoupon = async () => {
    setCouponCode('');
    try {
      localStorage.removeItem(GUEST_COUPON_KEY);
    } catch {}
    await syncCart('');
  };

  const refreshQuote = async () => {
    await syncCart(couponCode);
  };

  // Computed values from authoritative server quote
  const subtotal = quote?.subtotal ?? items.reduce((sum, i) => sum + (Number(i.unitPrice) || 0), 0);
  const discount = quote?.discount ?? 0;
  const credit = quote?.credit ?? 0;
  const total = quote?.finalAmount ?? Math.max(0, subtotal - discount - credit);
  const currency = quote?.currency || 'INR';
  const appliedCoupon = quote?.coupon?.applied ? quote.coupon : null;

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount: quote?.itemCount ?? items.length,
        subtotal,
        discount,
        credit,
        total,
        currency,
        appliedCoupon,
        quote,
        loading,
        isValidatingCoupon,
        addToCart,
        removeFromCart,
        clearCart,
        isInCart,
        applyCoupon,
        removeCoupon,
        refreshQuote,
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
