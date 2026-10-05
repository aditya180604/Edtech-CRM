import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import {
  CheckCircle2,
  XCircle,
  Clock,
  GraduationCap,
  ArrowRight,
  RefreshCw,
  ShoppingBag,
  ShieldCheck,
} from 'lucide-react';
import { paymentsApi, type PaymentStatusResponse } from '../api/payments';
import { useCart } from '../context/CartContext';

export const CheckoutResultPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshQuote } = useCart();

  const orderId = searchParams.get('order_id') || searchParams.get('orderId') || '';

  const [loading, setLoading] = useState<boolean>(true);
  const [statusData, setStatusData] = useState<PaymentStatusResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isFinalizedRef = useRef<boolean>(false);
  const cartClearedRef = useRef<boolean>(false);
  const pollCountRef = useRef<number>(0);
  const maxPolls = 8;

  const verifyStatus = useCallback(
    async (isInitial = false) => {
      if (!orderId) {
        setErrorMsg('No order ID provided in payment return URL.');
        setLoading(false);
        return;
      }

      if (isInitial) {
        setLoading(true);
      }

      try {
        const res = await paymentsApi.getPaymentStatus(orderId);
        if (res.success && res.data) {
          setStatusData(res.data);
          setErrorMsg(null);

          // 1. Success state reached
          if (res.data.paymentStatus === 'SUCCESS') {
            isFinalizedRef.current = true;
            setLoading(false);

            if (!cartClearedRef.current) {
              cartClearedRef.current = true;
              refreshQuote();
            }
            return;
          }

          // 2. Terminal Failure / Cancelled state
          if (res.data.paymentStatus === 'FAILED' || res.data.paymentStatus === 'CANCELLED') {
            isFinalizedRef.current = true;
            setLoading(false);
            return;
          }

          // 3. Still Pending / Initiated
          pollCountRef.current += 1;
          if (pollCountRef.current >= maxPolls) {
            setLoading(false);
          }
        }
      } catch (err: any) {
        const msg =
          err?.response?.data?.error?.message ||
          err?.response?.data?.message ||
          err?.message ||
          'Unable to verify payment status with LMS server.';
        setErrorMsg(msg);
        setLoading(false);
      }
    },
    [orderId, refreshQuote]
  );

  useEffect(() => {
    isFinalizedRef.current = false;
    cartClearedRef.current = false;
    pollCountRef.current = 0;

    // Run first verification immediately
    verifyStatus(true);

    // Polling interval
    const interval = setInterval(() => {
      if (isFinalizedRef.current || pollCountRef.current >= maxPolls) {
        clearInterval(interval);
        return;
      }
      verifyStatus(false);
    }, 2500);

    return () => {
      clearInterval(interval);
    };
  }, [orderId]); // Only triggers on orderId change

  const handleManualRefresh = () => {
    isFinalizedRef.current = false;
    pollCountRef.current = 0;
    verifyStatus(true);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-between">
      <Navbar />
      <main className="flex-1 max-w-2xl mx-auto px-4 sm:px-6 py-12 sm:py-16 w-full flex items-center justify-center">
        {/* 1. Loading & Polling State */}
        {loading && (
          <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-100 shadow-xl text-center space-y-6 w-full animate-in fade-in zoom-in-95 duration-200">
            <div className="w-20 h-20 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto shadow-inner border border-indigo-100 relative">
              <RefreshCw className="w-9 h-9 animate-spin text-indigo-600" />
            </div>
            <div className="space-y-2">
              <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs font-black tracking-wider uppercase">
                Server Verification in Progress
              </span>
              <h1 className="text-2xl font-black text-slate-900">Verifying Payment with Cashfree</h1>
              <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
                Securely confirming your transaction status with the payment gateway. Please do not close or refresh this tab.
              </p>
            </div>
            {orderId && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-600">
                Order Reference: {orderId}
              </div>
            )}
          </div>
        )}

        {/* 2. Success State */}
        {!loading && statusData?.paymentStatus === 'SUCCESS' && (
          <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-100 shadow-xl text-center space-y-6 w-full animate-in fade-in zoom-in-95 duration-200">
            <div className="w-20 h-20 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-inner border border-emerald-100">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-black tracking-wider uppercase">
                Payment Verified & Course Unlocked
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
                You're Officially Enrolled!
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-md mx-auto">
                Your payment of{' '}
                <span className="font-bold text-slate-900">
                  ₹{(statusData.amount || 0).toLocaleString('en-IN')}
                </span>{' '}
                has been verified server-side. Your lifetime learning access is now active.
              </p>
            </div>

            {/* Verification Receipt Details */}
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 text-left space-y-3 text-xs">
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="font-semibold text-slate-500">Order ID</span>
                <span className="font-mono font-bold text-slate-900">{statusData.orderId}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="font-semibold text-slate-500">Payment Status</span>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-black text-[11px]">
                  VERIFIED SUCCESS
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="font-semibold text-slate-500">Access Entitlement</span>
                <span className="font-bold text-emerald-600 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> ACTIVE & UNLOCKED
                </span>
              </div>
              <div className="flex justify-between font-black text-sm text-slate-900 pt-1">
                <span>Total Amount Paid</span>
                <span className="text-indigo-600">
                  ₹{(statusData.amount || 0).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <button
                onClick={() => navigate('/dashboard/student')}
                className="w-full sm:w-auto px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <GraduationCap className="w-4 h-4" />
                <span>Go to Student Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <Link
                to="/courses"
                className="w-full sm:w-auto px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors text-center"
              >
                Explore More Courses
              </Link>
            </div>
          </div>
        )}

        {/* 3. Pending / Awaiting Webhook Confirmation State */}
        {!loading && (statusData?.paymentStatus === 'PENDING' || statusData?.paymentStatus === 'INITIATED') && (
          <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-100 shadow-xl text-center space-y-6 w-full animate-in fade-in zoom-in-95 duration-200">
            <div className="w-20 h-20 rounded-3xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto shadow-inner border border-amber-100">
              <Clock className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-black tracking-wider uppercase">
                Payment Awaiting Confirmation
              </span>
              <h1 className="text-2xl font-black text-slate-900">Payment in Progress</h1>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                We are waiting for Cashfree payment gateway confirmation. Once the bank completes processing, access will unlock automatically.
              </p>
            </div>

            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-800 space-y-1">
              <p className="font-bold">If you completed payment in your UPI app or bank window:</p>
              <p className="text-[11px] text-amber-700">
                It can take up to 60 seconds for the bank confirmation webhook to reach our server.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={handleManualRefresh}
                className="w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Check Status Again</span>
              </button>
              <button
                onClick={() => navigate('/dashboard/student')}
                className="w-full sm:w-auto px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        )}

        {/* 4. Failure or Cancelled State */}
        {!loading && (statusData?.paymentStatus === 'FAILED' || statusData?.paymentStatus === 'CANCELLED' || errorMsg) && (
          <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-100 shadow-xl text-center space-y-6 w-full animate-in fade-in zoom-in-95 duration-200">
            <div className="w-20 h-20 rounded-3xl bg-red-50 text-red-600 flex items-center justify-center mx-auto shadow-inner border border-red-100">
              <XCircle className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-black tracking-wider uppercase">
                Payment Not Completed
              </span>
              <h1 className="text-2xl font-black text-slate-900">
                {statusData?.paymentStatus === 'CANCELLED' ? 'Transaction Cancelled' : 'Payment Failed'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                {errorMsg ||
                  statusData?.failureReason ||
                  'Your transaction was not completed. If any money was deducted by your bank, it will be automatically refunded within 3-5 business days.'}
              </p>
            </div>

            {orderId && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-mono text-slate-600">
                Reference: {orderId}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <button
                onClick={() => navigate('/checkout')}
                className="w-full sm:w-auto px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Retry Checkout</span>
              </button>
              <Link
                to="/cart"
                className="w-full sm:w-auto px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 text-center"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Return to Cart</span>
              </Link>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};
