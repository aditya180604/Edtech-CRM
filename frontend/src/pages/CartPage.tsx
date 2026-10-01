import React, { useState } from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Trash2, ArrowRight, ShieldCheck, ShoppingBag, Tag } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useAuthModal } from '../context/AuthModalContext';
import { useToast } from '../context/ToastContext';

export const CartPage: React.FC = () => {
  const {
    items,
    removeFromCart,
    clearCart,
    subtotal,
    discount,
    total,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
  } = useCart();
  const { isAuthenticated } = useAuth();
  const { openLogin } = useAuthModal();
  const { success } = useToast();
  const navigate = useNavigate();

  const [couponInput, setCouponInput] = useState('');
  const [couponFeedback, setCouponFeedback] = useState<{ success: boolean; message: string } | null>(null);
  const [checkingOut, setCheckingOut] = useState(false);

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    const res = applyCoupon(couponInput.trim());
    setCouponFeedback(res);
    if (res.success) {
      setCouponInput('');
    }
  };

  const handleCheckout = () => {
    if (!isAuthenticated) {
      openLogin();
      return;
    }
    setCheckingOut(true);
    setTimeout(() => {
      success(
        '🎉 Enrollment Successful!',
        `Enrolled into ${items.length} item(s) for ₹${total.toLocaleString('en-IN')}. Access is unlocked in your Student Dashboard.`
      );
      clearCart();
      setCheckingOut(false);
      navigate('/dashboard/student');
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-between">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        {/* Breadcrumb & Steps */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-3">
            Shopping Cart
          </h1>
          <div className="flex items-center gap-3 text-xs font-semibold text-slate-400">
            <span className="text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100 font-bold">
              1. Cart ({items.length})
            </span>
            <span>→</span>
            <span>2. Details</span>
            <span>→</span>
            <span>3. Payment</span>
          </div>
        </div>

        {items.length === 0 ? (
          /* Empty Cart State */
          <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center max-w-xl mx-auto space-y-4 shadow-xs">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto shadow-2xs">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-black text-slate-900">Your Cart is Empty</h2>
            <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-sm mx-auto">
              Explore our wide range of full-length industrial courses and standalone atomic topics to start learning today.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/courses"
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/20 transition-all"
              >
                Browse All Courses
              </Link>
              <Link
                to="/topics"
                className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
              >
                Explore Atomic Topics
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Dynamic Cart Items List */}
            <div className="lg:col-span-8 space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:border-slate-200"
                >
                  <div className="flex items-start sm:items-center gap-4 min-w-0">
                    <div
                      className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center font-black text-xs shrink-0 ${
                        item.type === 'COURSE'
                          ? 'bg-indigo-500/10 text-indigo-600 border border-indigo-100'
                          : 'bg-cyan-500/10 text-cyan-700 border border-cyan-100'
                      }`}
                    >
                      {item.type}
                    </div>

                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        {item.category && (
                          <span className="text-[10px] font-black uppercase text-indigo-600 tracking-wider">
                            {item.category}
                          </span>
                        )}
                        {item.instructorName && (
                          <span className="text-[11px] text-slate-400 font-medium">
                            • By {item.instructorName}
                          </span>
                        )}
                      </div>

                      <h3 className="text-base font-bold text-slate-900 leading-snug">
                        {item.title}
                      </h3>

                      <p className="text-xs text-slate-500 font-medium">
                        {item.type === 'COURSE'
                          ? 'Full Course Lifetime Access • Certificate Included'
                          : 'Atomic Skill • Topic Access'}
                      </p>

                      {item.type === 'TOPIC' && (
                        <span className="text-[11px] text-emerald-600 font-bold inline-block">
                          ✓ Eligible for ₹{item.price} full-course upgrade credit
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-50 shrink-0">
                    <span className="text-base sm:text-lg font-black text-slate-900 block">
                      {item.price === 0 ? 'FREE' : `₹${item.price.toLocaleString('en-IN')}`}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.id)}
                      className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 font-bold cursor-pointer transition-colors p-1"
                      title="Remove from Cart"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Dynamic Order Summary */}
            <div className="lg:col-span-4">
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-4 sticky top-24">
                <h2 className="text-base sm:text-lg font-black text-slate-900 pb-3 border-b border-slate-100">
                  Order Summary
                </h2>

                <div className="space-y-2.5 text-xs sm:text-sm">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal ({items.length} {items.length === 1 ? 'item' : 'items'})</span>
                    <span className="font-bold text-slate-900">₹{subtotal.toLocaleString('en-IN')}</span>
                  </div>

                  <div className="flex justify-between text-slate-600 items-center">
                    <span className="flex items-center gap-1">
                      <span>Discount</span>
                      {appliedCoupon && (
                        <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded text-[10px] font-black">
                          {appliedCoupon.code}
                        </span>
                      )}
                    </span>
                    <span className="font-bold text-emerald-600">
                      {discount > 0 ? `-₹${discount.toLocaleString('en-IN')}` : '₹0'}
                    </span>
                  </div>

                  {appliedCoupon && (
                    <div className="p-2 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center justify-between text-[11px] text-emerald-800">
                      <span className="font-semibold">{appliedCoupon.description}</span>
                      <button
                        type="button"
                        onClick={removeCoupon}
                        className="text-red-500 hover:text-red-700 font-bold ml-2 cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  )}

                  <div className="flex justify-between text-base sm:text-lg font-black text-slate-900 pt-3 border-t border-slate-100">
                    <span>Total</span>
                    <span className="text-indigo-600">
                      {total === 0 ? 'FREE' : `₹${total.toLocaleString('en-IN')}`}
                    </span>
                  </div>
                </div>

                {/* Coupon Input Form */}
                <form onSubmit={handleApplyCoupon} className="pt-2 space-y-2">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        placeholder="COUPON CODE (e.g. EDU10)"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value)}
                        className="w-full pl-8 pr-3 py-2 bg-slate-50 text-xs text-slate-800 rounded-xl border border-slate-200 uppercase font-bold focus:outline-none focus:border-indigo-500 focus:bg-white"
                      />
                    </div>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shrink-0 cursor-pointer transition-colors"
                    >
                      Apply
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

                {/* Checkout Action Button */}
                <button
                  type="button"
                  onClick={handleCheckout}
                  disabled={checkingOut}
                  className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:bg-indigo-400 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {checkingOut ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      <span>Processing Enrollment...</span>
                    </div>
                  ) : (
                    <>
                      <span>{isAuthenticated ? 'Proceed to Checkout' : 'Login to Checkout'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="pt-2 text-center">
                  <span className="text-[11px] text-slate-400 flex items-center justify-center gap-1.5 font-medium">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    100% Secure Checkout with Razorpay & UPI
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};
