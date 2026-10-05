import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import {
  ShieldCheck,
  Tag,
  CheckCircle2,
  Lock,
  ArrowRight,
  GraduationCap,
  Sparkles,
  CreditCard,
  Building,
  Check,
  AlertTriangle,
  ShoppingBag,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useAuthModal } from '../context/AuthModalContext';
import { checkoutApi, type CheckoutOrderResult } from '../api/checkout';
import { paymentsApi } from '../api/payments';

export const CheckoutPage: React.FC = () => {
  const {
    items,
    subtotal,
    discount,
    total,
    appliedCoupon,
    isValidatingCoupon,
    applyCoupon,
    removeCoupon,
  } = useCart();

  const { user, isAuthenticated } = useAuth();
  const { openLogin } = useAuthModal();
  const navigate = useNavigate();

  const [couponInput, setCouponInput] = useState('');
  const [couponFeedback, setCouponFeedback] = useState<{ success: boolean; message: string } | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'CARD' | 'UPI' | 'NET_BANKING'>('UPI');
  const [processing, setProcessing] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [completedOrder, setCompletedOrder] = useState<CheckoutOrderResult | null>(null);

  // Client-side idempotency session token
  const [idempotencyKey] = useState<string>(() => `IDEMP-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`);

  useEffect(() => {
    if (!isAuthenticated && !completedOrder) {
      openLogin();
    }
  }, [isAuthenticated, completedOrder, openLogin]);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    setCouponFeedback(null);
    setCheckoutError(null);
    const res = await applyCoupon(couponInput.trim());
    setCouponFeedback(res);
    if (res.success) {
      setCouponInput('');
    }
  };

  const handleExecuteCheckout = async () => {
    if (!isAuthenticated) {
      openLogin();
      return;
    }

    if (items.length === 0) {
      setCheckoutError('Your cart is empty. Please add courses before checking out.');
      return;
    }

    setProcessing(true);
    setCheckoutError(null);

    try {
      const res = await checkoutApi.processCheckout({
        couponCode: appliedCoupon?.code,
        paymentMethod: `PAYMENT_${paymentMethod}`,
        idempotencyKey,
      });

      const payload = res.data;

      // 1. Zero Amount or already finalized order
      if (payload?.isZeroAmount || (res.success && payload?.order)) {
        if (payload?.order) {
          setCompletedOrder(payload.order);
        }
        return;
      }

      // 2. Active Cashfree Payment Session
      const sessionId = payload?.paymentSessionId || payload?.data?.paymentSessionId;
      if (sessionId) {
        // Launch Cashfree SDK checkout
        await paymentsApi.launchCashfreeCheckout({
          paymentSessionId: sessionId,
          mode: 'sandbox',
          redirectTarget: '_self',
        });
        return;
      }

      if (payload?.order) {
        setCompletedOrder(payload.order);
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.error?.message ||
        err?.response?.data?.message ||
        err?.message ||
        'Checkout processing failed. Please try again.';
      setCheckoutError(msg);
    } finally {
      setProcessing(false);
    }
  };

  // SUCCESS CONFIRMATION VIEW
  if (completedOrder) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-between">
        <Navbar />
        <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 py-12 w-full">
          <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-100 shadow-xl text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-20 h-20 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-inner border border-emerald-100">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-black tracking-wider uppercase">
                Payment & Enrollment Successful
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
                You're Officially Enrolled!
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-md mx-auto">
                Your payment of <span className="font-bold text-slate-900">₹{completedOrder.finalAmount.toLocaleString('en-IN')}</span> has been verified and lifetime course access is active in your Student Dashboard.
              </p>
            </div>

            {/* Order Details Card */}
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 text-left space-y-3 text-xs">
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="font-semibold text-slate-500">Order ID</span>
                <span className="font-mono font-bold text-slate-900">{completedOrder.orderId}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="font-semibold text-slate-500">Enrolled Items</span>
                <span className="font-bold text-slate-900">{completedOrder.items?.length || 1} course(s)</span>
              </div>
              {completedOrder.couponDiscount > 0 && (
                <div className="flex justify-between border-b border-slate-200 pb-2 text-emerald-700 font-bold">
                  <span>Coupon Applied ({completedOrder.couponCode})</span>
                  <span>-₹{completedOrder.couponDiscount.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="flex justify-between font-black text-sm text-slate-900 pt-1">
                <span>Total Paid</span>
                <span className="text-indigo-600">₹{completedOrder.finalAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <button
                onClick={() => navigate('/dashboard/student')}
                className="w-full sm:w-auto px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <GraduationCap className="w-4 h-4" />
                <span>Go to Student Dashboard</span>
              </button>
              <Link
                to="/courses"
                className="w-full sm:w-auto px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors text-center"
              >
                Explore More Courses
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // EMPTY CART CHECKOUT GUARD
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-between">
        <Navbar />
        <main className="flex-1 max-w-xl mx-auto px-4 py-16 text-center">
          <div className="bg-white rounded-3xl p-10 border border-slate-100 shadow-sm space-y-4">
            <ShoppingBag className="w-12 h-12 text-slate-400 mx-auto" />
            <h2 className="text-xl font-bold text-slate-900">Your Checkout is Empty</h2>
            <p className="text-xs text-slate-500">There are no items currently queued for checkout.</p>
            <Link
              to="/courses"
              className="inline-block px-6 py-2.5 bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-md"
            >
              Browse Courses
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-between">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        {/* Checkout Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">
            <Lock className="w-3.5 h-3.5" />
            <span>256-Bit SSL Encrypted Checkout</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Checkout & Access Activation
          </h1>
        </div>

        {checkoutError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-xs font-bold text-red-700 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>{checkoutError}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Student Details, Course Line Items & Payment Methods */}
          <div className="lg:col-span-8 space-y-6">
            {/* 1. Student Identity Account Card */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                    1
                  </div>
                  <h2 className="text-sm font-bold text-slate-900">Student Account & Access Entitlement</h2>
                </div>
                <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Verified User
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Enrolling Student</p>
                  <p className="font-bold text-slate-900 mt-0.5">
                    {user?.firstName} {user?.lastName}
                  </p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Email Address</p>
                  <p className="font-bold text-slate-900 mt-0.5 font-mono">{user?.email}</p>
                </div>
              </div>
            </div>

            {/* 2. Course Line Items with Scoped Discount Highlights */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                    2
                  </div>
                  <h2 className="text-sm font-bold text-slate-900">Order Items & Line-Level Pricing</h2>
                </div>
                <span className="text-xs font-bold text-slate-500">{items.length} Course(s)</span>
              </div>

              <div className="divide-y divide-slate-100">
                {items.map((item) => (
                  <div key={item.productId} className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-black rounded-md uppercase">
                          {item.productType}
                        </span>
                        {item.isEligibleForCoupon && (
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-md flex items-center gap-1 border border-emerald-200">
                            <Sparkles className="w-2.5 h-2.5" /> Coupon Target
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-bold text-slate-900">{item.title}</h3>
                      <p className="text-xs text-slate-500 font-medium">Instructor: {item.instructorName || 'Lead Instructor'}</p>
                    </div>

                    <div className="text-right shrink-0">
                      {item.discount > 0 ? (
                        <div>
                          <span className="text-xs text-slate-400 line-through block">
                            ₹{item.unitPrice.toLocaleString('en-IN')}
                          </span>
                          <span className="text-base font-black text-emerald-600">
                            ₹{item.finalPrice.toLocaleString('en-IN')}
                          </span>
                          <span className="text-[10px] font-bold text-emerald-700 block">
                            (Saved ₹{item.discount.toLocaleString('en-IN')})
                          </span>
                        </div>
                      ) : (
                        <span className="text-base font-black text-slate-900">
                          ₹{item.unitPrice.toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Payment Method Selection */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                  3
                </div>
                <h2 className="text-sm font-bold text-slate-900">Select Payment Method</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('UPI')}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                    paymentMethod === 'UPI'
                      ? 'border-indigo-600 bg-indigo-50/50 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <Sparkles className="w-5 h-5 text-indigo-600" />
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${paymentMethod === 'UPI' ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300'}`}>
                      {paymentMethod === 'UPI' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">Instant UPI & QR</p>
                    <p className="text-[11px] text-slate-500">Google Pay, PhonePe, Paytm</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('CARD')}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                    paymentMethod === 'CARD'
                      ? 'border-indigo-600 bg-indigo-50/50 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <CreditCard className="w-5 h-5 text-slate-700" />
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${paymentMethod === 'CARD' ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300'}`}>
                      {paymentMethod === 'CARD' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">Cards</p>
                    <p className="text-[11px] text-slate-500">Visa, Mastercard, RuPay</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('NET_BANKING')}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                    paymentMethod === 'NET_BANKING'
                      ? 'border-indigo-600 bg-indigo-50/50 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <Building className="w-5 h-5 text-slate-700" />
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${paymentMethod === 'NET_BANKING' ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300'}`}>
                      {paymentMethod === 'NET_BANKING' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">Net Banking</p>
                    <p className="text-[11px] text-slate-500">All major Indian banks</p>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Order Summary & Coupon Input */}
          <div className="lg:col-span-4">
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-5 sticky top-24">
              <h2 className="text-base font-black text-slate-900 pb-3 border-b border-slate-100">
                Order Summary
              </h2>

              <div className="space-y-3 text-xs sm:text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal ({items.length} items)</span>
                  <span className="font-bold text-slate-900">₹{subtotal.toLocaleString('en-IN')}</span>
                </div>

                <div className="flex justify-between text-slate-600 items-center">
                  <span className="flex items-center gap-1">
                    <span>Coupon Discount</span>
                    {appliedCoupon && (
                      <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded text-[10px] font-black font-mono">
                        {appliedCoupon.code}
                      </span>
                    )}
                  </span>
                  <span className="font-bold text-emerald-600">
                    {discount > 0 ? `-₹${discount.toLocaleString('en-IN')}` : '₹0'}
                  </span>
                </div>

                {appliedCoupon && (
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold">{appliedCoupon.description}</span>
                      <button
                        type="button"
                        onClick={removeCoupon}
                        className="text-red-500 hover:text-red-700 font-bold cursor-pointer text-[11px]"
                      >
                        Remove
                      </button>
                    </div>
                    {appliedCoupon.courseTitle && (
                      <p className="text-[11px] text-emerald-700">
                        Applied to: <span className="font-bold">{appliedCoupon.courseTitle}</span>
                      </p>
                    )}
                  </div>
                )}

                <div className="flex justify-between text-slate-600 text-xs">
                  <span>Taxes & Processing Fee</span>
                  <span className="text-slate-400 font-medium">Included (₹0)</span>
                </div>

                <div className="flex justify-between text-lg font-black text-slate-900 pt-3 border-t border-slate-100">
                  <span>Total Payable</span>
                  <span className="text-indigo-600">₹{total.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Coupon Input Form */}
              <form onSubmit={handleApplyCoupon} className="pt-2 space-y-2">
                <label className="block text-[11px] font-bold text-slate-500 uppercase">
                  Have a Promo Code?
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      placeholder="8-CHAR CODE (e.g. Ab7@X2!Q)"
                      value={couponInput}
                      maxLength={8}
                      disabled={isValidatingCoupon}
                      onChange={(e) => setCouponInput(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 bg-slate-50 text-xs text-slate-800 rounded-xl border border-slate-200 font-mono font-bold focus:outline-none focus:border-indigo-500 focus:bg-white"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isValidatingCoupon || !couponInput.trim()}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white text-xs font-bold rounded-xl shrink-0 cursor-pointer transition-colors flex items-center gap-1.5"
                  >
                    {isValidatingCoupon ? (
                      <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent" />
                    ) : (
                      <span>Apply</span>
                    )}
                  </button>
                </div>

                {couponFeedback && (
                  <p
                    className={`text-[11px] font-bold ${
                      couponFeedback.success ? 'text-emerald-600' : 'text-red-500'
                    }`}
                  >
                    {couponFeedback.message}
                  </p>
                )}
              </form>

              {/* Pay & Activate Action Button */}
              <button
                type="button"
                onClick={handleExecuteCheckout}
                disabled={processing}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:bg-indigo-400 text-white font-black text-sm rounded-2xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {processing ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    <span>Processing Enrollment...</span>
                  </div>
                ) : (
                  <>
                    <span>Pay ₹{total.toLocaleString('en-IN')} & Unlock Access</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="pt-2 text-center text-[11px] text-slate-400 space-y-1">
                <p className="flex items-center justify-center gap-1.5 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Instant access unlocked immediately upon payment
                </p>
                <p>30-Day Risk-Free Money Back Guarantee</p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};
