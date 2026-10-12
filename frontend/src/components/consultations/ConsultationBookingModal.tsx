import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Calendar,
  Clock,
  DollarSign,
  User,
  CheckCircle2,
  AlertCircle,
  Video,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Send,
  Sparkles,
} from 'lucide-react';
import { load as loadCashfree } from '@cashfreepayments/cashfree-js';
import {
  consultationsApi,
  type ConsultationMentor,
  type BookableSlot,
  type MentorAvailabilityResponse,
} from '../../api/consultations';
import { useAuth } from '../../context/AuthContext';
import { useAuthModal } from '../../context/AuthModalContext';
import { useToast } from '../../context/ToastContext';
import { useNavigate } from 'react-router-dom';

interface ConsultationBookingModalProps {
  mentor: ConsultationMentor;
  isOpen: boolean;
  onClose: () => void;
  onBookingSuccess?: (bookingId: string) => void;
}

export const ConsultationBookingModal: React.FC<ConsultationBookingModalProps> = ({
  mentor,
  isOpen,
  onClose,
  onBookingSuccess,
}) => {
  const { user, isAuthenticated } = useAuth();
  const { openLogin } = useAuthModal();
  const { success, error: toastError, info } = useToast();
  const navigate = useNavigate();

  const [loadingSlots, setLoadingSlots] = useState(false);
  const [availability, setAvailability] = useState<MentorAvailabilityResponse | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<BookableSlot | null>(null);
  const [studentNotes, setStudentNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState<any | null>(null);

  // 1. Fetch Mentor Availability when modal opens
  useEffect(() => {
    if (!isOpen || !mentor) return;

    let isMounted = true;
    setLoadingSlots(true);
    setSelectedSlot(null);
    setBookingConfirmed(null);

    const mentorIdToFetch = mentor.instructorId || mentor.id || mentor.userId;
    consultationsApi
      .getMentorAvailability(mentorIdToFetch, { days: 14 })
      .then((data) => {
        if (!isMounted) return;
        setAvailability(data);

        // Auto-select first date that has available slots
        if (data && data.slots && data.slots.length > 0) {
          const firstDate = data.slots[0].date;
          setSelectedDate(firstDate);
        } else {
          setSelectedDate(new Date().toISOString().split('T')[0]);
        }
      })
      .catch((err) => {
        console.error('Failed to load mentor availability:', err);
        if (isMounted) {
          toastError('Error', err.response?.data?.message || 'Could not fetch mentor availability.');
        }
      })
      .finally(() => {
        if (isMounted) setLoadingSlots(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, mentor, toastError]);

  // Group slots by date
  const slotsByDate = useMemo(() => {
    const map: Record<string, BookableSlot[]> = {};
    if (!availability || !availability.slots) return map;

    for (const slot of availability.slots) {
      if (!map[slot.date]) {
        map[slot.date] = [];
      }
      map[slot.date].push(slot);
    }
    return map;
  }, [availability]);

  // Unique list of dates available
  const availableDates = useMemo(() => {
    return Object.keys(slotsByDate).sort();
  }, [slotsByDate]);

  // Slots for currently selected date
  const currentDaySlots = useMemo(() => {
    return slotsByDate[selectedDate] || [];
  }, [slotsByDate, selectedDate]);

  if (!isOpen) return null;

  // Handle Checkout / Booking
  const handleConfirmBooking = async () => {
    if (!isAuthenticated) {
      openLogin();
      return;
    }

    if (!selectedSlot) {
      toastError('Select Slot', 'Please choose a date and time slot for your consultation.');
      return;
    }

    try {
      setSubmitting(true);
      const targetInstructorId = mentor.instructorId || mentor.id || mentor.userId;

      // 1. Initiate booking reservation on backend
      const res = await consultationsApi.createBookingReservation({
        instructorId: targetInstructorId,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        notes: studentNotes.trim(),
      });

      // CASE A: FREE CONSULTATION
      if (res.isFree && res.booking) {
        setBookingConfirmed(res.booking);
        success('Consultation Confirmed', 'Your free 1-on-1 mentorship session is scheduled!');
        if (onBookingSuccess) onBookingSuccess(res.booking.id);
        return;
      }

      // CASE B: PAID CONSULTATION (Cashfree PG)
      if (res.paymentSessionId) {
        info('Opening Payment Gateway', 'Please complete payment to secure your consultation slot.');

        let cashfree: any = null;
        try {
          cashfree = await loadCashfree({ mode: 'sandbox' });
        } catch (e) {
          console.warn('Cashfree load error:', e);
        }

        if (cashfree) {
          const checkoutResult = await cashfree.checkout({
            paymentSessionId: res.paymentSessionId,
            redirectTarget: '_modal',
          });

          // Verify Payment
          try {
            const verifyRes = await consultationsApi.verifyPayment({
              bookingId: res.bookingId,
              orderId: res.orderId,
            });

            if (verifyRes.success && verifyRes.booking) {
              setBookingConfirmed(verifyRes.booking);
              success(
                'Payment Verified & Confirmed',
                'Confirmation email with video room link has been sent to your email.'
              );
              if (onBookingSuccess) onBookingSuccess(verifyRes.booking.id);
              return;
            }
          } catch (vErr: any) {
            console.error('Payment verification failed:', vErr);
            toastError('Payment Verification', vErr.response?.data?.message || 'Payment not completed.');
          }
        } else {
          toastError('Payment Error', 'Unable to initialize Cashfree payment gateway.');
        }
      }
    } catch (err: any) {
      console.error('Booking failed:', err);
      toastError('Booking Failed', err.response?.data?.message || err.message || 'Could not complete booking.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#FA5A36] to-[#FF8A65] text-white flex items-center justify-center font-bold text-xl shrink-0 overflow-hidden shadow-md">
              {mentor.profilePhoto ? (
                <img
                  src={mentor.profilePhoto}
                  alt={mentor.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                mentor.name[0] || 'M'
              )}
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-orange-500/20 text-orange-300 text-[10px] font-bold mb-1">
                <Sparkles className="w-3 h-3" />
                1-on-1 Mentorship
              </div>
              <h3 className="text-xl font-black text-white">{mentor.name}</h3>
              <p className="text-xs text-slate-300 font-medium">{mentor.headline}</p>
            </div>
          </div>

          {/* Quick Meta Pills */}
          <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-white/10 text-xs">
            <div className="flex items-center gap-1.5 text-slate-200">
              <Clock className="w-3.5 h-3.5 text-orange-400" />
              <span>{mentor.consultationDuration || 45} mins per session</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-200">
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-bold text-emerald-300">
                {mentor.consultationFee === 0 ? 'FREE' : `₹${mentor.consultationFee}`}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-200">
              <Video className="w-3.5 h-3.5 text-indigo-400" />
              <span>In-Platform LiveKit Video Room</span>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* STATE 1: BOOKING CONFIRMED SUCCESS */}
          {bookingConfirmed ? (
            <div className="py-8 text-center space-y-5">
              <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-xl font-black text-slate-900">Consultation Confirmed!</h4>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  We've sent calendar invites & confirmation emails to{' '}
                  <span className="font-bold text-slate-700">{user?.email}</span>.
                </p>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 max-w-md mx-auto text-left space-y-2 text-xs border border-slate-200">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Booking ID:</span>
                  <span className="font-bold text-slate-800 font-mono">
                    {bookingConfirmed.bookingCode || bookingConfirmed.id}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Mentor:</span>
                  <span className="font-bold text-slate-800">{mentor.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Date & Time:</span>
                  <span className="font-bold text-slate-800">
                    {new Date(bookingConfirmed.startTime).toLocaleString('en-IN', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Duration:</span>
                  <span className="font-bold text-slate-800">
                    {bookingConfirmed.durationMinutes} mins
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                {bookingConfirmed.meetingRoomCode && (
                  <button
                    onClick={() => {
                      onClose();
                      navigate(`/webinars/live/${bookingConfirmed.meetingRoomCode}`);
                    }}
                    className="px-5 py-2.5 bg-[#FA5A36] hover:bg-[#E04322] text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Video className="w-4 h-4" />
                    <span>Enter Video Room Now</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    onClose();
                    navigate('/dashboard/student');
                  }}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  View My Bookings
                </button>
              </div>
            </div>
          ) : loadingSlots ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-3">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-[#FA5A36] border-t-transparent" />
              <p className="text-xs font-semibold text-slate-500">Checking mentor calendar availability...</p>
            </div>
          ) : availableDates.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#FA5A36] flex items-center justify-center mx-auto">
                <Calendar className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">No Open Slots in Next 14 Days</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto font-medium">
                This mentor has no available consultation slots right now. Please check back soon or try another mentor.
              </p>
            </div>
          ) : (
            <>
              {/* Step 1: Select Date */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <span>1. Choose a Date</span>
                </label>
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                  {availableDates.map((dateStr) => {
                    const d = new Date(`${dateStr}T00:00:00`);
                    const isSelected = selectedDate === dateStr;
                    return (
                      <button
                        key={dateStr}
                        type="button"
                        onClick={() => {
                          setSelectedDate(dateStr);
                          setSelectedSlot(null);
                        }}
                        className={`flex-shrink-0 px-3.5 py-2.5 rounded-2xl text-center border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <p className="text-[10px] font-bold uppercase tracking-wider opacity-75">
                          {d.toLocaleDateString('en-US', { weekday: 'short' })}
                        </p>
                        <p className="text-sm font-extrabold">{d.getDate()}</p>
                        <p className="text-[10px] opacity-75">
                          {d.toLocaleDateString('en-US', { month: 'short' })}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 2: Select Time Slot */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>
                      2. Choose a Time Slot (
                      {currentDaySlots.filter((s) => s.isAvailable !== false).length} Available)
                    </span>
                  </label>
                  <div className="flex items-center gap-3 text-[10px] font-semibold">
                    <span className="flex items-center gap-1 text-emerald-700">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                      Available
                    </span>
                    <span className="flex items-center gap-1 text-slate-400">
                      <span className="w-2 h-2 rounded-full bg-slate-300 inline-block" />
                      Booked
                    </span>
                  </div>
                </div>

                {currentDaySlots.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No slots on this date.</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {currentDaySlots.map((slot) => {
                      const isAvailable = slot.isAvailable !== false;
                      const isSelected = selectedSlot?.slotId === slot.slotId;
                      const startTimeDisplay = new Date(slot.startTime).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                      });
                      const endTimeDisplay = new Date(slot.endTime).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                      });

                      return (
                        <button
                          key={slot.slotId}
                          type="button"
                          disabled={!isAvailable}
                          onClick={() => isAvailable && setSelectedSlot(slot)}
                          className={`p-3 rounded-xl border text-left transition-all ${
                            !isAvailable
                              ? 'bg-slate-100/80 border-slate-200 text-slate-400 cursor-not-allowed opacity-60'
                              : isSelected
                              ? 'bg-emerald-50 border-emerald-500 text-emerald-900 font-bold ring-2 ring-emerald-500 shadow-xs'
                              : 'bg-emerald-50/30 border-emerald-200 text-slate-800 hover:border-emerald-400 hover:bg-emerald-50/60 cursor-pointer'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold text-slate-900">{startTimeDisplay}</span>
                            <span
                              className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                                isAvailable
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-slate-200 text-slate-500'
                              }`}
                            >
                              {isAvailable ? 'Available' : 'Booked'}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-500 font-medium">to {endTimeDisplay}</div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Step 3: Student Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Send className="w-3.5 h-3.5 text-slate-500" />
                  <span>3. Topic or Questions for the Mentor (Optional)</span>
                </label>
                <textarea
                  rows={2}
                  value={studentNotes}
                  onChange={(e) => setStudentNotes(e.target.value)}
                  placeholder="e.g., Code review of my full-stack project, system design prep, resume feedback..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-[#FA5A36] focus:bg-white transition"
                />
              </div>

              {/* Step 4: Summary & Confirm Button */}
              <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="text-[11px] text-slate-400 font-semibold uppercase">Total Investment</div>
                  <div className="text-xl font-black text-slate-900">
                    {mentor.consultationFee === 0 ? 'FREE' : `₹${mentor.consultationFee}`}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleConfirmBooking}
                  disabled={!selectedSlot || submitting}
                  className="px-6 py-3 bg-[#FA5A36] hover:bg-[#E04322] disabled:opacity-40 text-white font-bold text-xs rounded-xl shadow-md shadow-[#FA5A36]/25 transition cursor-pointer flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent" />
                      <span>Reserving Slot...</span>
                    </div>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>
                        {mentor.consultationFee === 0
                          ? 'Confirm Free Booking'
                          : `Pay ₹${mentor.consultationFee} & Book Session`}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
