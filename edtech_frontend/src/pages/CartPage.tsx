import React from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Trash2, ArrowRight, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

export const CartPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-between">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        {/* Breadcrumb & Steps */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-4">
            Shopping Cart
          </h1>
          <div className="flex items-center gap-3 text-xs font-semibold text-slate-400">
            <span className="text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
              1. Cart
            </span>
            <span>→</span>
            <span>2. Details</span>
            <span>→</span>
            <span>3. Payment</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Cart Items List */}
          <div className="lg:col-span-8 space-y-4">
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-cyan-500/10 text-cyan-600 flex items-center justify-center font-bold text-xs shrink-0">
                  TOPIC
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">React Hooks Deep Dive</h3>
                  <p className="text-xs text-slate-500">Atomic Skill • Topic Access</p>
                  <span className="text-xs text-emerald-600 font-semibold mt-1 inline-block">
                    ✓ Eligible for ₹299 full-course upgrade credit
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-base font-extrabold text-slate-900 block">₹299</span>
                <button className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 mt-1 font-medium">
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove</span>
                </button>
              </div>
            </div>

            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center font-bold text-xs shrink-0">
                  TOPIC
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">State Management in React</h3>
                  <p className="text-xs text-slate-500">Atomic Skill • Topic Access</p>
                  <span className="text-xs text-emerald-600 font-semibold mt-1 inline-block">
                    ✓ Eligible for ₹299 full-course upgrade credit
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-base font-extrabold text-slate-900 block">₹299</span>
                <button className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 mt-1 font-medium">
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove</span>
                </button>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-4">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-4">
              <h2 className="text-lg font-bold text-slate-900 pb-3 border-b border-slate-100">
                Order Summary
              </h2>

              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal (2 items)</span>
                  <span className="font-semibold text-slate-900">₹598</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Discount</span>
                  <span className="font-semibold text-emerald-600">-₹0</span>
                </div>
                <div className="flex justify-between text-base font-extrabold text-slate-900 pt-3 border-t border-slate-100">
                  <span>Total</span>
                  <span className="text-indigo-600">₹598</span>
                </div>
              </div>

              {/* Coupon input */}
              <div className="pt-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter Coupon Code"
                    className="w-full px-3 py-2 bg-slate-50 text-xs text-slate-800 rounded-xl border border-slate-200 uppercase font-semibold focus:outline-none focus:border-indigo-500"
                  />
                  <button className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shrink-0">
                    Apply
                  </button>
                </div>
              </div>

              <Link
                to="/signup"
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-sm rounded-xl shadow-md shadow-indigo-600/25 transition-all flex items-center justify-center gap-2"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <div className="pt-2 text-center">
                <span className="text-[11px] text-slate-400 flex items-center justify-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  100% Secure Checkout with Razorpay & UPI
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};
