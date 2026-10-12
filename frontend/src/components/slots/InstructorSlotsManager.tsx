import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  Plus,
  Video,
  X,
  AlertCircle,
  CheckCircle2,
  Users,
  User,
  Trash2,
  MessageSquare,
} from 'lucide-react';
import { slotsApi, type TeachingSlotItem } from '../../api/slots';

export const InstructorSlotsManager: React.FC = () => {
  const navigate = useNavigate();

  const [slots, setSlots] = useState<TeachingSlotItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [slotTitle, setSlotTitle] = useState<string>('1-on-1 Mentorship & Code Review');
  const [slotType, setSlotType] = useState<'ONE_ON_ONE' | 'SMALL_GROUP' | 'LIVE_CLASS'>('ONE_ON_ONE');
  const [slotDate, setSlotDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [slotTime, setSlotTime] = useState<string>('18:00');
  const [durationMinutes, setDurationMinutes] = useState<number>(45);
  const [capacity, setCapacity] = useState<number>(1);
  const [price, setPrice] = useState<number>(0);
  const [description, setDescription] = useState<string>('');

  const [saving, setSaving] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const fetchSlots = () => {
    setLoading(true);
    slotsApi
      .getInstructorSlots({ status: statusFilter === 'ALL' ? undefined : statusFilter })
      .then((res) => {
        if (res.success && Array.isArray(res.data)) {
          setSlots(res.data);
        }
      })
      .catch((err) => {
        console.error('Failed to load slots', err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchSlots();
  }, [statusFilter]);

  const handleCreateSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    setFormSuccess(null);

    try {
      const startDateTime = new Date(`${slotDate}T${slotTime}:00`);
      if (isNaN(startDateTime.getTime())) {
        throw new Error('Please select a valid date and time.');
      }
      if (startDateTime <= new Date()) {
        throw new Error('Slot start time must be in the future.');
      }

      const res = await slotsApi.createInstructorSlot({
        title: slotTitle.trim(),
        description: description.trim(),
        slotType,
        startTime: startDateTime.toISOString(),
        durationMinutes: Number(durationMinutes),
        capacity: slotType === 'ONE_ON_ONE' ? 1 : Number(capacity),
        price: Number(price),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });

      if (res.success) {
        setFormSuccess('Availability slot created successfully!');
        setTimeout(() => {
          setIsCreateModalOpen(false);
          setFormSuccess(null);
          fetchSlots();
        }, 1000);
      } else {
        setFormError(res.message || 'Failed to create slot.');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to create slot.';
      setFormError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelSlot = async (slotId: string) => {
    if (!window.confirm('Are you sure you want to cancel this teaching slot? Any booked students will be notified.')) {
      return;
    }
    try {
      await slotsApi.cancelInstructorSlot(slotId, 'Instructor schedule conflict');
      fetchSlots();
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Failed to cancel slot.');
    }
  };

  const totalSlots = slots.length;
  const availableSlots = slots.filter((s) => s.status === 'AVAILABLE').length;
  const bookedSlots = slots.filter((s) => s.status === 'BOOKED' || s.bookedCount > 0).length;

  return (
    <div className="space-y-6">
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">Teaching Slots & Live Availability</h2>
          <p className="text-xs text-slate-500 font-medium">
            Define available time windows for 1-on-1 mentorship, code reviews, and live cohorts.
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#FA5A36] hover:bg-[#E04322] text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add Availability Slot</span>
        </button>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-slate-700">
          <p className="text-2xl font-black text-slate-900">{totalSlots}</p>
          <p className="font-semibold text-slate-500">Total Created Slots</p>
        </div>
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-800">
          <p className="text-2xl font-black text-emerald-900">{availableSlots}</p>
          <p className="font-semibold text-emerald-700">Available for Booking</p>
        </div>
        <div className="p-4 rounded-2xl bg-purple-50 border border-purple-100 text-purple-800">
          <p className="text-2xl font-black text-purple-900">{bookedSlots}</p>
          <p className="font-semibold text-purple-700">Booked by Students</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1 border-b border-slate-100 pb-3">
        {['ALL', 'AVAILABLE', 'BOOKED', 'CANCELLED'].map((tab) => (
          <button
            key={tab}
            onClick={() => setStatusFilter(tab)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              statusFilter === tab
                ? 'bg-[#FA5A36] text-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            {tab === 'ALL' ? 'All Slots' : tab.charAt(0) + tab.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Slots List */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-12 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
            <div className="w-5 h-5 border-2 border-slate-300 border-t-[#FA5A36] rounded-full animate-spin" />
            <span>Loading availability slots...</span>
          </div>
        ) : slots.length === 0 ? (
          <div className="py-12 text-center bg-slate-50 rounded-2xl border border-slate-100 text-slate-400 text-xs space-y-1">
            <Calendar className="w-8 h-8 mx-auto text-slate-300 mb-1 stroke-1" />
            <p className="font-semibold text-slate-700">No teaching slots found</p>
            <p className="text-[11px] text-slate-400">
              Click "Add Availability Slot" to define your teaching schedule for students.
            </p>
          </div>
        ) : (
          slots.map((slot) => {
            const hasBooking = slot.bookings && slot.bookings.length > 0;
            const isAvailable = slot.status === 'AVAILABLE' && slot.bookedCount < slot.capacity;

            return (
              <div
                key={slot._id}
                className="p-5 rounded-2xl border border-slate-100 bg-white hover:border-slate-200 transition space-y-3 shadow-2xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          isAvailable
                            ? 'bg-emerald-100 text-emerald-800'
                            : slot.status === 'BOOKED' || hasBooking
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {isAvailable ? 'AVAILABLE' : slot.status === 'BOOKED' || hasBooking ? 'BOOKED' : slot.status}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-400">
                        {slot.slotType === 'ONE_ON_ONE' ? '1-on-1 Session' : 'Group Cohort'} • {slot.durationMinutes} mins
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900">{slot.title}</h4>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {slot.roomCode && (
                      <button
                        onClick={() => navigate(`/webinar/room/${slot.roomCode}`)}
                        className="px-3.5 py-2 bg-[#FA5A36] hover:bg-[#E04322] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        <Video className="w-3.5 h-3.5" />
                        <span>Enter Classroom</span>
                      </button>
                    )}
                    {slot.status !== 'CANCELLED' && (
                      <button
                        onClick={() => handleCancelSlot(slot._id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition cursor-pointer"
                        title="Cancel Slot"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Date & Time details */}
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 pt-1">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      {new Date(slot.startTime).toLocaleDateString(undefined, {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      {new Date(slot.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                      {new Date(slot.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      Capacity: {slot.bookedCount} / {slot.capacity}
                    </span>
                  </div>
                </div>

                {/* If Booked: Show Student Information */}
                {hasBooking && (
                  <div className="p-3 bg-purple-50/70 border border-purple-100 rounded-xl space-y-2 mt-2">
                    <p className="text-[11px] font-bold text-purple-900">Booked Attendees:</p>
                    {slot.bookings!.map((b) => (
                      <div key={b._id} className="flex items-center justify-between text-xs text-slate-700">
                        <div className="flex items-center gap-2">
                          {b.userId?.profilePhoto ? (
                            <img
                              src={b.userId.profilePhoto}
                              alt="student"
                              className="w-6 h-6 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-purple-200 text-purple-800 flex items-center justify-center text-[10px] font-bold">
                              <User className="w-3 h-3" />
                            </div>
                          )}
                          <div>
                            <span className="font-semibold text-slate-900">
                              {b.userId?.firstName} {b.userId?.lastName}
                            </span>
                            <span className="text-slate-500 text-[10px] ml-2 font-mono">
                              ({b.userId?.email})
                            </span>
                          </div>
                        </div>
                        {b.notes && (
                          <div className="text-[11px] text-slate-600 max-w-xs truncate flex items-center gap-1">
                            <MessageSquare className="w-3 h-3 text-slate-400" />
                            <span>"{b.notes}"</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Add Availability Slot Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-[#FA5A36]/10 text-[#FA5A36] flex items-center justify-center font-bold">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">New Availability Slot</h3>
                  <p className="text-[11px] text-slate-500">Open a live slot for students to book</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSlot} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}
              {formSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{formSuccess}</span>
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Session Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={slotTitle}
                  onChange={(e) => setSlotTitle(e.target.value)}
                  placeholder="e.g. 1-on-1 Mentorship & System Design Review"
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#FA5A36]/30 focus:border-[#FA5A36]"
                />
              </div>

              {/* Slot Type */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSlotType('ONE_ON_ONE');
                    setCapacity(1);
                  }}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
                    slotType === 'ONE_ON_ONE'
                      ? 'border-[#FA5A36] bg-[#FA5A36]/5 text-[#FA5A36]'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  1-on-1 Mentorship
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSlotType('SMALL_GROUP');
                    setCapacity(5);
                  }}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
                    slotType === 'SMALL_GROUP'
                      ? 'border-[#FA5A36] bg-[#FA5A36]/5 text-[#FA5A36]'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  Group Live Class
                </button>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={slotDate}
                    onChange={(e) => setSlotDate(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#FA5A36]/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Start Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    required
                    value={slotTime}
                    onChange={(e) => setSlotTime(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#FA5A36]/30"
                  />
                </div>
              </div>

              {/* Duration */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Duration (Minutes)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[30, 45, 60].map((mins) => (
                    <button
                      type="button"
                      key={mins}
                      onClick={() => setDurationMinutes(mins)}
                      className={`py-2 rounded-xl border text-xs font-bold transition cursor-pointer ${
                        durationMinutes === mins
                          ? 'border-[#FA5A36] bg-[#FA5A36]/5 text-[#FA5A36]'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {mins} mins
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 bg-[#FA5A36] hover:bg-[#E04322] disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs shadow-[#FA5A36]/25 transition cursor-pointer"
                >
                  {saving ? 'Creating Slot...' : 'Create Availability Slot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
