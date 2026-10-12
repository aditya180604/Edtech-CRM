import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  Calendar,
  Clock,
  Video,
  CheckCircle2,
  AlertCircle,
  User,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { slotsApi, type TeachingSlotItem, type BookingItem } from '../../api/slots';
import { useAuth } from '../../context/AuthContext';

interface SlotBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  instructorId?: string;
  courseId?: string;
  instructorName?: string;
  instructorAvatar?: string;
  courseTitle?: string;
}

export const SlotBookingModal: React.FC<SlotBookingModalProps> = ({
  isOpen,
  onClose,
  instructorId,
  courseId,
  instructorName = 'Instructor',
  instructorAvatar,
  courseTitle,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [slots, setSlots] = useState<TeachingSlotItem[]>([]);
  const [loadingSlots, setLoadingSlots] = useState<boolean>(true);
  const [selectedSlot, setSelectedSlot] = useState<TeachingSlotItem | null>(null);
  const [studentNotes, setStudentNotes] = useState<string>('');
  const [bookingLoading, setBookingLoading] = useState<boolean>(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [confirmedBooking, setConfirmedBooking] = useState<{
    booking: BookingItem;
    roomCode?: string;
  } | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setSelectedSlot(null);
      setStudentNotes('');
      setBookingError(null);
      setConfirmedBooking(null);
      return;
    }

    setLoadingSlots(true);
    setBookingError(null);
    slotsApi
      .getAvailableSlots({
        instructorId,
        courseId,
      })
      .then((res) => {
        if (res.success && Array.isArray(res.data)) {
          setSlots(res.data);
          if (res.data.length > 0) {
            setSelectedSlot(res.data[0]);
          }
        }
      })
      .catch((err) => {
        console.error('Failed to load slots', err);
        setBookingError('Unable to load available slots at this moment.');
      })
      .finally(() => {
        setLoadingSlots(false);
      });
  }, [isOpen, instructorId, courseId]);

  if (!isOpen) return null;

  const handleConfirmBooking = async () => {
    if (!selectedSlot) return;
    if (!user) {
      setBookingError('Please sign in to book a session.');
      return;
    }

    setBookingLoading(true);
    setBookingError(null);

    try {
      const res = await slotsApi.bookSlot(selectedSlot._id, { notes: studentNotes });
      if (res.success && res.data) {
        setConfirmedBooking({
          booking: res.data.booking,
          roomCode: res.data.roomCode || selectedSlot.roomCode,
        });
      } else {
        setBookingError(res.message || 'Booking could not be completed.');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to book slot.';
      setBookingError(msg);
    } finally {
      setBookingLoading(false);
    }
  };

  const formatSlotDate = (isoStr: string) => {
    const d = new Date(isoStr);
    return d.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatSlotTime = (isoStart: string, isoEnd: string) => {
    const s = new Date(isoStart);
    const e = new Date(isoEnd);
    return `${s.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${e.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FA5A36]/10 text-[#FA5A36] flex items-center justify-center font-bold">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {confirmedBooking ? 'Booking Confirmed!' : 'Book a Live Session'}
              </h3>
              <p className="text-xs text-slate-500">
                {confirmedBooking
                  ? 'Your slot is secured on the calendar'
                  : `Choose an available slot with ${instructorName}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Confirmed Success State */}
          {confirmedBooking ? (
            <div className="space-y-6 text-center py-4">
              <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-800 text-[11px] font-bold rounded-full mb-2">
                  CONFIRMED • #{confirmedBooking.booking.bookingCode}
                </span>
                <h4 className="text-lg font-bold text-slate-900">Session Successfully Booked</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  A confirmation notification has been sent. You can join the LiveKit session room directly when the session starts.
                </p>
              </div>

              {selectedSlot && (
                <div className="bg-slate-50 border border-slate-200/70 rounded-2xl p-4 text-left space-y-2 max-w-md mx-auto text-xs">
                  <div className="flex items-center justify-between font-semibold text-slate-900">
                    <span>{selectedSlot.title}</span>
                    <span className="text-[#FA5A36] font-bold">{selectedSlot.durationMinutes} mins</span>
                  </div>
                  <div className="text-slate-600 flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{formatSlotDate(selectedSlot.startTime)}</span>
                  </div>
                  <div className="text-slate-600 flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{formatSlotTime(selectedSlot.startTime, selectedSlot.endTime)}</span>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                {confirmedBooking.roomCode && (
                  <button
                    onClick={() => {
                      onClose();
                      navigate(`/webinar/room/${confirmedBooking.roomCode}`);
                    }}
                    className="px-5 py-2.5 bg-[#FA5A36] hover:bg-[#E04322] text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition cursor-pointer"
                  >
                    <Video className="w-4 h-4" />
                    <span>Enter Live Classroom</span>
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Instructor Card Header */}
              <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                {instructorAvatar ? (
                  <img
                    src={instructorAvatar}
                    alt={instructorName}
                    className="w-11 h-11 rounded-xl object-cover border border-slate-200"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-xl bg-slate-200 flex items-center justify-center text-slate-500 font-bold">
                    <User className="w-5 h-5" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate">{instructorName}</p>
                  <p className="text-[11px] text-slate-500 truncate">
                    {courseTitle || 'Live 1-on-1 Mentorship & Code Review'}
                  </p>
                </div>
              </div>

              {/* Error Alert */}
              {bookingError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-700">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <span>{bookingError}</span>
                </div>
              )}

              {/* Slot Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Select Available Date & Time Slot
                </label>

                {loadingSlots ? (
                  <div className="py-8 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-slate-300 border-t-[#FA5A36] rounded-full animate-spin" />
                    <span>Loading instructor availability...</span>
                  </div>
                ) : slots.length === 0 ? (
                  <div className="py-8 px-4 text-center bg-slate-50 rounded-2xl border border-slate-100 text-slate-500 text-xs space-y-1">
                    <Clock className="w-6 h-6 mx-auto text-slate-300 mb-1" />
                    <p className="font-semibold text-slate-700">No available slots right now</p>
                    <p className="text-[11px] text-slate-400">
                      The instructor has not opened new slots yet. Please check back later or contact support.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto p-1">
                    {slots.map((slot) => {
                      const isSelected = selectedSlot?._id === slot._id;
                      return (
                        <div
                          key={slot._id}
                          onClick={() => setSelectedSlot(slot)}
                          className={`p-3 rounded-2xl border transition-all cursor-pointer text-left ${
                            isSelected
                              ? 'border-[#FA5A36] bg-[#FA5A36]/5 shadow-xs ring-1 ring-[#FA5A36]'
                              : 'border-slate-200 hover:border-slate-300 bg-white'
                          }`}
                        >
                          <div className="flex items-center justify-between text-xs font-bold text-slate-900 mb-1">
                            <span className="truncate">{slot.title}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">
                              {slot.durationMinutes}m
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-600 flex items-center gap-1.5 mb-0.5">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            <span>{formatSlotDate(slot.startTime)}</span>
                          </div>
                          <div className="text-[11px] text-slate-600 flex items-center gap-1.5">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>{formatSlotTime(slot.startTime, slot.endTime)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Student Notes */}
              {selectedSlot && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    What would you like to focus on? <span className="font-normal text-slate-400">(Optional)</span>
                  </label>
                  <textarea
                    rows={2}
                    value={studentNotes}
                    onChange={(e) => setStudentNotes(e.target.value)}
                    placeholder="e.g. System design doubt, resume review, or debugging microservices..."
                    className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#FA5A36]/30 focus:border-[#FA5A36] transition"
                  />
                </div>
              )}

              {/* Confirmation CTA */}
              <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                <div className="text-xs">
                  <span className="text-slate-400">Session Format: </span>
                  <span className="font-semibold text-slate-700">Live Interactive Classroom</span>
                </div>
                <button
                  type="button"
                  onClick={handleConfirmBooking}
                  disabled={!selectedSlot || bookingLoading}
                  className="px-5 py-2.5 bg-[#FA5A36] hover:bg-[#E04322] disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs shadow-[#FA5A36]/25 transition cursor-pointer flex items-center gap-1.5"
                >
                  {bookingLoading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Confirm Booking</span>
                      <ArrowRight className="w-3.5 h-3.5" />
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
