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
  Download,
  Mail,
  FileText,
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
  const [downloadingPdf, setDownloadingPdf] = useState<boolean>(false);

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

  const handleDownloadReceipt = async () => {
    if (!orderId) return;
    try {
      setDownloadingPdf(true);
      const blob = await paymentsApi.downloadReceiptPdf(orderId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Receipt-${orderId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      console.error('Failed to download receipt PDF:', err);
      alert('Could not download PDF receipt. Please check your email for the attached copy.');
    } finally {
      setDownloadingPdf(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/70 font-sans flex flex-col justify-between">
      <Navbar />
      <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16 w-full flex items-center justify-center">
        {/* 1. Loading & Polling State */}
        {loading && (
          <div className="bg-white rounded-2xl p-8 sm:p-12 border border-slate-200/80 shadow-sm text-center space-y-6 w-full animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-2xl bg-orange-50 text-[#FA5A36] flex items-center justify-center mx-auto border border-orange-100 relative">
              <RefreshCw className="w-7 h-7 animate-spin text-[#FA5A36]" />
            </div>
            <div className="space-y-2">
              <span className="inline-block px-3 py-1 bg-orange-50 text-[#FA5A36] border border-orange-200/60 rounded-full text-xs font-semibold tracking-wide">
                Verification in Progress
              </span>
              <h1 className="text-2xl font-bold text-slate-900">Verifying Payment with Cashfree</h1>
              <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
                Securely confirming your transaction status with the payment gateway. Please do not close or refresh this tab.
              </p>
            </div>
            {orderId && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-mono font-medium text-slate-600">
                Order Reference: {orderId}
              </div>
            )}
          </div>
        )}

        {/* 2. Success State */}
        {!loading && statusData?.paymentStatus === 'SUCCESS' && (
          <div className="bg-white rounded-2xl p-8 sm:p-12 border border-slate-200/80 shadow-sm text-center space-y-6 w-full animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200/60 rounded-full text-xs font-semibold tracking-wide">
                Payment Verified & Course Unlocked
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
                You're Officially Enrolled!
              </h1>
              <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
                Your payment of{' '}
                <span className="font-bold text-slate-900">
                  ₹{(statusData.amount || 0).toLocaleString('en-IN')}
                </span>{' '}
                has been verified server-side. Your lifetime learning access is now active.
              </p>
            </div>

            {/* Verification Receipt Details */}
            <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 text-left space-y-3 text-xs sm:text-sm">
              <div className="flex justify-between border-b border-slate-200/70 pb-2.5">
                <span className="font-medium text-slate-500">Order ID</span>
                <span className="font-mono font-semibold text-slate-900">{statusData.orderId}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/70 pb-2.5">
                <span className="font-medium text-slate-500">Payment Status</span>
                <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded font-semibold text-xs">
                  VERIFIED SUCCESS
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-200/70 pb-2.5">
                <span className="font-medium text-slate-500">Access Entitlement</span>
                <span className="font-semibold text-emerald-600 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" /> ACTIVE & UNLOCKED
                </span>
              </div>
              <div className="flex justify-between font-bold text-sm sm:text-base text-slate-900 pt-1">
                <span>Total Amount Paid</span>
                <span className="text-[#FA5A36]">
                  ₹{(statusData.amount || 0).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Confirmation Email & PDF Receipt Notice */}
            <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200/70 text-left flex items-start gap-3">
              <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg shrink-0 mt-0.5">
                <Mail className="w-4 h-4" />
              </div>
              <div className="text-xs sm:text-sm text-emerald-950 space-y-1">
                <p className="font-semibold text-emerald-900">
                  Confirmation Email & Official Invoice Dispatched
                </p>
                <p className="text-emerald-700 text-xs">
                  We've sent an official purchase confirmation with your itemized invoice and PDF receipt attached directly to your registered email address.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={() => navigate('/dashboard/student')}
                className="w-full sm:w-auto px-7 py-3 bg-[#FA5A36] hover:bg-[#e04825] text-white font-semibold text-sm rounded-xl shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <GraduationCap className="w-4 h-4" />
                <span>Go to Student Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={handleDownloadReceipt}
                disabled={downloadingPdf}
                className="w-full sm:w-auto px-6 py-3 bg-white hover:bg-slate-50 text-slate-700 font-medium text-sm rounded-xl border border-slate-200 transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {downloadingPdf ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-slate-500" />
                ) : (
                  <Download className="w-4 h-4 text-slate-600" />
                )}
                <span>Download PDF Receipt</span>
              </button>
              <Link
                to="/courses"
                className="w-full sm:w-auto px-6 py-3 bg-white hover:bg-slate-50 text-slate-700 font-medium text-sm rounded-xl border border-slate-200 transition-colors text-center"
              >
                Explore More
              </Link>
            </div>
          </div>
        )}

        {/* 3. Pending / Awaiting Webhook Confirmation State */}
        {!loading && (statusData?.paymentStatus === 'PENDING' || statusData?.paymentStatus === 'INITIATED') && (
          <div className="bg-white rounded-2xl p-8 sm:p-12 border border-slate-200/80 shadow-sm text-center space-y-6 w-full animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-100">
              <Clock className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="inline-block px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200/60 rounded-full text-xs font-semibold tracking-wide">
                Payment Awaiting Confirmation
              </span>
              <h1 className="text-2xl font-bold text-slate-900">Payment in Progress</h1>
              <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
                We are waiting for Cashfree payment gateway confirmation. Once the bank completes processing, access will unlock automatically.
              </p>
            </div>

            <div className="p-4 bg-amber-50/70 rounded-xl border border-amber-200/80 text-xs sm:text-sm text-amber-800 space-y-1">
              <p className="font-semibold">If you completed payment in your UPI app or bank window:</p>
              <p className="text-xs text-amber-700">
                It can take up to 60 seconds for the bank confirmation webhook to reach our server.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={handleManualRefresh}
                className="w-full sm:w-auto px-6 py-2.5 bg-[#FA5A36] hover:bg-[#e04825] text-white font-semibold text-sm rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Check Status Again</span>
              </button>
              <button
                onClick={() => navigate('/dashboard/student')}
                className="w-full sm:w-auto px-6 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-medium text-sm rounded-xl border border-slate-200 transition-colors cursor-pointer"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        )}

        {/* 4. Failure or Cancelled State */}
        {!loading && (statusData?.paymentStatus === 'FAILED' || statusData?.paymentStatus === 'CANCELLED' || errorMsg) && (
          <div className="bg-white rounded-2xl p-8 sm:p-12 border border-slate-200/80 shadow-sm text-center space-y-6 w-full animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100">
              <XCircle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="inline-block px-3 py-1 bg-rose-50 text-rose-800 border border-rose-200/60 rounded-full text-xs font-semibold tracking-wide">
                Payment Not Completed
              </span>
              <h1 className="text-2xl font-bold text-slate-900">
                {statusData?.paymentStatus === 'CANCELLED' ? 'Transaction Cancelled' : 'Payment Failed'}
              </h1>
              <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
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

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
              <button
                onClick={() => navigate('/checkout')}
                className="w-full sm:w-auto px-7 py-3 bg-[#FA5A36] hover:bg-[#e04825] text-white font-semibold text-sm rounded-xl shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Retry Checkout</span>
              </button>
              <Link
                to="/cart"
                className="w-full sm:w-auto px-6 py-3 bg-white hover:bg-slate-50 text-slate-700 font-medium text-sm rounded-xl border border-slate-200 transition-colors flex items-center justify-center gap-2 text-center"
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
