import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar,
  Clock,
  DollarSign,
  Globe,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Save,
  Video,
  User,
  ExternalLink,
  ShieldAlert,
  Sparkles,
  Star,
  ToggleLeft,
  ToggleRight,
  Info,
} from 'lucide-react';
import {
  consultationsApi,
  type ConsultationSettings,
  type DayAvailability,
  type WeeklyTimeSlot,
  type ConsultationBooking,
} from '../../api/consultations';
import { useToast } from '../../context/ToastContext';
import { useNavigate } from 'react-router-dom';

const DAYS_OF_WEEK: DayAvailability['dayOfWeek'][] = [
  'SUNDAY',
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
];

const DEFAULT_SCHEDULE: DayAvailability[] = DAYS_OF_WEEK.map((day) => ({
  dayOfWeek: day,
  isEnabled: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'].includes(day),
  slots: [{ startTime: '18:00', endTime: '21:00' }],
}));

export const InstructorConsultationsManager: React.FC = () => {
  const { success, error: toastError, info } = useToast();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'schedule' | 'bookings'>('schedule');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Consultation configuration state
  const [settings, setSettings] = useState<ConsultationSettings>({
    consultationEnabled: false,
    consultationFee: 500,
    consultationDuration: 45,
    consultationTimezone: 'Asia/Kolkata',
    consultationBufferMinutes: 15,
    consultationSetupCompleted: false,
    consultationPublished: false,
    weeklyAvailability: DEFAULT_SCHEDULE,
    unavailableDates: [],
  });

  // Bookings list state
  const [bookings, setBookings] = useState<ConsultationBooking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);

  // Exception Date input state
  const [newExceptionDate, setNewExceptionDate] = useState('');

  // 1. Fetch Instructor Settings
  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const data = await consultationsApi.getInstructorSettings();
      if (data) {
        setSettings({
          consultationEnabled: Boolean(data.consultationEnabled),
          consultationFee: data.consultationFee ?? 500,
          consultationDuration: data.consultationDuration || 45,
          consultationTimezone: data.consultationTimezone || 'Asia/Kolkata',
          consultationBufferMinutes: data.consultationBufferMinutes ?? 15,
          consultationSetupCompleted: Boolean(data.consultationSetupCompleted),
          consultationPublished: Boolean(data.consultationPublished),
          weeklyAvailability:
            data.weeklyAvailability && data.weeklyAvailability.length > 0
              ? data.weeklyAvailability
              : DEFAULT_SCHEDULE,
          unavailableDates: data.unavailableDates || [],
        });
      }
    } catch (err: any) {
      console.error('Failed to load consultation settings:', err);
      toastError('Load Error', err.response?.data?.message || 'Failed to load consultation settings.');
    } finally {
      setLoading(false);
    }
  }, [toastError]);

  // 2. Fetch Instructor Consultations
  const fetchBookings = useCallback(async () => {
    try {
      setLoadingBookings(true);
      const list = await consultationsApi.getMyConsultations();
      setBookings(list || []);
    } catch (err: any) {
      console.error('Failed to load consultation bookings:', err);
    } finally {
      setLoadingBookings(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
    fetchBookings();
  }, [fetchSettings, fetchBookings]);

  // Handle Toggle Enable / Disable
  const handleToggleConsultation = async () => {
    const nextVal = !settings.consultationEnabled;
    try {
      setSaving(true);
      const updated = await consultationsApi.updateInstructorSettings({
        consultationEnabled: nextVal,
      });
      setSettings((prev) => ({ ...prev, consultationEnabled: updated.consultationEnabled }));
      if (nextVal) {
        success('Consultations Enabled', 'Students can now discover and book 1-on-1 sessions when published.');
      } else {
        info('Consultations Disabled', 'You are now hidden from the student mentorship directory.');
      }
    } catch (err: any) {
      toastError('Update Failed', err.response?.data?.message || 'Could not toggle consultations.');
    } finally {
      setSaving(false);
    }
  };

  // Handle Save Full Configuration
  const handleSaveConfiguration = async () => {
    try {
      setSaving(true);
      // 1. Save general settings
      await consultationsApi.updateInstructorSettings({
        consultationFee: settings.consultationFee,
        consultationDuration: settings.consultationDuration,
        consultationTimezone: settings.consultationTimezone,
        consultationBufferMinutes: settings.consultationBufferMinutes,
        consultationPublished: true,
      });

      // 2. Save weekly availability & dates
      const res = await consultationsApi.saveWeeklyAvailability({
        weeklyAvailability: settings.weeklyAvailability,
        unavailableDates: settings.unavailableDates,
      });

      setSettings((prev) => ({
        ...prev,
        ...res,
        consultationSetupCompleted: res.consultationSetupCompleted,
        consultationPublished: true,
      }));

      success('Availability Saved & Published', 'Your 1-on-1 weekly schedule is now live and bookable.');
    } catch (err: any) {
      toastError('Save Error', err.response?.data?.message || 'Could not save availability schedule.');
    } finally {
      setSaving(false);
    }
  };

  // Day Schedule Mutations
  const handleToggleDay = (dayIndex: number) => {
    setSettings((prev) => {
      const updated = [...prev.weeklyAvailability];
      updated[dayIndex] = {
        ...updated[dayIndex],
        isEnabled: !updated[dayIndex].isEnabled,
      };
      return { ...prev, weeklyAvailability: updated };
    });
  };

  const handleAddTimeSlot = (dayIndex: number) => {
    setSettings((prev) => {
      const updated = [...prev.weeklyAvailability];
      const currentSlots = updated[dayIndex].slots || [];
      updated[dayIndex] = {
        ...updated[dayIndex],
        slots: [...currentSlots, { startTime: '09:00', endTime: '12:00' }],
      };
      return { ...prev, weeklyAvailability: updated };
    });
  };

  const handleRemoveTimeSlot = (dayIndex: number, slotIndex: number) => {
    setSettings((prev) => {
      const updated = [...prev.weeklyAvailability];
      const currentSlots = [...(updated[dayIndex].slots || [])];
      currentSlots.splice(slotIndex, 1);
      updated[dayIndex] = {
        ...updated[dayIndex],
        slots: currentSlots,
      };
      return { ...prev, weeklyAvailability: updated };
    });
  };

  const handleSlotTimeChange = (
    dayIndex: number,
    slotIndex: number,
    field: 'startTime' | 'endTime',
    value: string
  ) => {
    setSettings((prev) => {
      const updated = [...prev.weeklyAvailability];
      const currentSlots = [...(updated[dayIndex].slots || [])];
      currentSlots[slotIndex] = {
        ...currentSlots[slotIndex],
        [field]: value,
      };
      updated[dayIndex] = {
        ...updated[dayIndex],
        slots: currentSlots,
      };
      return { ...prev, weeklyAvailability: updated };
    });
  };

  // Unavailable Dates Mutations
  const handleAddUnavailableDate = () => {
    if (!newExceptionDate) return;
    if (settings.unavailableDates.includes(newExceptionDate)) {
      toastError('Date Exists', 'This date is already marked as unavailable.');
      return;
    }
    setSettings((prev) => ({
      ...prev,
      unavailableDates: [...prev.unavailableDates, newExceptionDate].sort(),
    }));
    setNewExceptionDate('');
  };

  const handleRemoveUnavailableDate = (dateStr: string) => {
    setSettings((prev) => ({
      ...prev,
      unavailableDates: prev.unavailableDates.filter((d) => d !== dateStr),
    }));
  };

  // LiveKit Join Meeting
  const handleJoinSession = (booking: ConsultationBooking) => {
    if (booking.meetingRoomCode) {
      navigate(`/webinars/live/${booking.meetingRoomCode}`);
    } else {
      toastError('Session Unavailable', 'No video room code associated with this booking.');
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-[#FA5A36] border-t-transparent" />
        <p className="text-xs font-semibold text-slate-500">Loading your consultation schedule...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner & Consultation Master Switch */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-[#FA5A36]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-orange-300 text-xs font-bold backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5" />
              1-on-1 Mentorship & Consultations
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Teach & Mentor Part-Time
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl font-medium leading-relaxed">
              Enable 1-on-1 consultations to advise students, share your industry expertise, and earn per session while balancing your full-time job.
            </p>
          </div>

          {/* Master Enable/Disable Toggle Card */}
          <div className="bg-white/10 backdrop-blur-md border border-white/15 p-4 sm:p-5 rounded-2xl flex flex-col gap-3 min-w-[240px]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-200">Consultation Status</span>
              <span
                className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                  settings.consultationEnabled
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-slate-700 text-slate-300'
                }`}
              >
                {settings.consultationEnabled ? 'Active & Open' : 'Disabled'}
              </span>
            </div>

            <button
              onClick={handleToggleConsultation}
              disabled={saving}
              className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm ${
                settings.consultationEnabled
                  ? 'bg-rose-500/90 hover:bg-rose-600 text-white'
                  : 'bg-[#FA5A36] hover:bg-[#E04322] text-white'
              }`}
            >
              {settings.consultationEnabled ? (
                <>
                  <ToggleRight className="w-4 h-4" />
                  <span>Disable 1-on-1 Bookings</span>
                </>
              ) : (
                <>
                  <ToggleLeft className="w-4 h-4" />
                  <span>Enable 1-on-1 Bookings</span>
                </>
              )}
            </button>

            {settings.consultationSetupCompleted ? (
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-300 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Weekly Schedule Configured</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-[11px] text-amber-300 font-semibold">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Complete weekly slots below</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sub Tabs: Schedule & Settings vs Upcoming Bookings */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('schedule')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'schedule'
                ? 'bg-[#FA5A36] text-white shadow-xs'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Weekly Availability & Pricing</span>
          </button>
          <button
            onClick={() => setActiveTab('bookings')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'bookings'
                ? 'bg-[#FA5A36] text-white shadow-xs'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Video className="w-4 h-4" />
            <span>Upcoming Consultations ({bookings.length})</span>
          </button>
        </div>

        {activeTab === 'schedule' && (
          <button
            onClick={handleSaveConfiguration}
            disabled={saving}
            className="px-5 py-2.5 bg-[#FA5A36] hover:bg-[#E04322] text-white font-bold text-xs rounded-xl transition flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Publishing...' : 'Publish Availability'}</span>
          </button>
        )}
      </div>

      {/* TAB 1: SCHEDULE & CONFIGURATION */}
      {activeTab === 'schedule' && (
        <div className="space-y-6">
          {/* Section 1: Session Parameters (Fee, Duration, Buffer, Timezone) */}
          <div className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 shadow-xs space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">Session Parameters</h3>
              <p className="text-xs text-slate-500 font-medium">
                Define your per-session pricing, call duration, and buffer time between consecutive meetings.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {/* Consultation Fee */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                  <span>Fee per Session (INR)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={settings.consultationFee}
                    onChange={(e) =>
                      setSettings((prev) => ({ ...prev, consultationFee: Number(e.target.value) }))
                    }
                    placeholder="0 for free"
                    className="w-full pl-7 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#FA5A36] focus:bg-white transition"
                  />
                </div>
                <p className="text-[11px] text-slate-400">Set to 0 to offer free introductory mentorship.</p>
              </div>

              {/* Duration */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Session Duration</span>
                </label>
                <select
                  value={settings.consultationDuration}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, consultationDuration: Number(e.target.value) }))
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#FA5A36] focus:bg-white transition"
                >
                  <option value={30}>30 Minutes</option>
                  <option value={45}>45 Minutes (Recommended)</option>
                  <option value={60}>60 Minutes (1 Hour)</option>
                </select>
                <p className="text-[11px] text-slate-400">Length of each 1-on-1 video call.</p>
              </div>

              {/* Buffer Time */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Buffer Time</span>
                </label>
                <select
                  value={settings.consultationBufferMinutes}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      consultationBufferMinutes: Number(e.target.value),
                    }))
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#FA5A36] focus:bg-white transition"
                >
                  <option value={0}>No Buffer (0 min)</option>
                  <option value={10}>10 Minutes</option>
                  <option value={15}>15 Minutes</option>
                  <option value={30}>30 Minutes</option>
                </select>
                <p className="text-[11px] text-slate-400">Cool-down break between sessions.</p>
              </div>

              {/* Timezone */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-slate-400" />
                  <span>Your Timezone</span>
                </label>
                <select
                  value={settings.consultationTimezone}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, consultationTimezone: e.target.value }))
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#FA5A36] focus:bg-white transition"
                >
                  <option value="Asia/Kolkata">India (IST, GMT+5:30)</option>
                  <option value="UTC">UTC (GMT+0:00)</option>
                  <option value="America/New_York">US Eastern (EST/EDT)</option>
                  <option value="America/Los_Angeles">US Pacific (PST/PDT)</option>
                  <option value="Europe/London">UK (GMT/BST)</option>
                  <option value="Asia/Singapore">Singapore (SGT, GMT+8)</option>
                </select>
                <p className="text-[11px] text-slate-400">Slot times are calculated from this timezone.</p>
              </div>
            </div>
          </div>

          {/* Section 2: 7-Day Weekly Availability Manager */}
          <div className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 shadow-xs space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">Weekly Availability (7 Days)</h3>
              <p className="text-xs text-slate-500 font-medium">
                Set the days and time windows you are open to take student sessions every week.
              </p>
            </div>

            <div className="space-y-3">
              {settings.weeklyAvailability.map((dayItem, dayIndex) => (
                <div
                  key={dayItem.dayOfWeek}
                  className={`p-4 rounded-2xl border transition-all ${
                    dayItem.isEnabled
                      ? 'bg-slate-50/70 border-slate-200'
                      : 'bg-slate-50/20 border-slate-100 opacity-60'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={dayItem.isEnabled}
                        onChange={() => handleToggleDay(dayIndex)}
                        className="w-4 h-4 rounded text-[#FA5A36] focus:ring-[#FA5A36] cursor-pointer"
                      />
                      <span className="text-xs font-bold text-slate-800 w-28 uppercase">
                        {dayItem.dayOfWeek}
                      </span>
                    </div>

                    {/* Time Slots for Enabled Days */}
                    {dayItem.isEnabled ? (
                      <div className="flex-1 flex flex-wrap items-center gap-3">
                        {dayItem.slots.map((slot, slotIndex) => (
                          <div
                            key={slotIndex}
                            className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs"
                          >
                            <input
                              type="time"
                              value={slot.startTime}
                              onChange={(e) =>
                                handleSlotTimeChange(dayIndex, slotIndex, 'startTime', e.target.value)
                              }
                              className="text-xs font-semibold text-slate-700 bg-transparent focus:outline-none"
                            />
                            <span className="text-slate-400 text-xs font-bold">to</span>
                            <input
                              type="time"
                              value={slot.endTime}
                              onChange={(e) =>
                                handleSlotTimeChange(dayIndex, slotIndex, 'endTime', e.target.value)
                              }
                              className="text-xs font-semibold text-slate-700 bg-transparent focus:outline-none"
                            />
                            {dayItem.slots.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveTimeSlot(dayIndex, slotIndex)}
                                className="text-slate-400 hover:text-red-500 p-0.5 transition cursor-pointer"
                                title="Remove time range"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ))}

                        <button
                          type="button"
                          onClick={() => handleAddTimeSlot(dayIndex)}
                          className="px-3 py-1 bg-white hover:bg-slate-100 text-[#FA5A36] border border-orange-200 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition shadow-2xs"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add Window</span>
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs font-medium text-slate-400 italic">
                        Unavailable all day
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Unavailable Dates & Exceptions */}
          <div className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 shadow-xs space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Unavailable Dates & Leave Exceptions</h3>
              <p className="text-xs text-slate-500 font-medium">
                Block specific calendar dates when you are traveling or unavailable, overriding your weekly schedule.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <input
                type="date"
                min={new Date().toISOString().split('T')[0]}
                value={newExceptionDate}
                onChange={(e) => setNewExceptionDate(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#FA5A36]"
              />
              <button
                type="button"
                onClick={handleAddUnavailableDate}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Block Date</span>
              </button>
            </div>

            {settings.unavailableDates.length > 0 ? (
              <div className="flex flex-wrap gap-2 pt-2">
                {settings.unavailableDates.map((dateStr) => (
                  <span
                    key={dateStr}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold"
                  >
                    <Calendar className="w-3 h-3" />
                    <span>{dateStr}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveUnavailableDate(dateStr)}
                      className="hover:text-rose-900 cursor-pointer ml-1"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 font-medium">
                No custom blocked dates added yet.
              </p>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: UPCOMING CONSULTATIONS */}
      {activeTab === 'bookings' && (
        <div className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Scheduled 1-on-1 Sessions</h3>
              <p className="text-xs text-slate-500 font-medium">
                Confirmed bookings from students with direct video classroom links.
              </p>
            </div>
            <button
              onClick={fetchBookings}
              className="text-xs font-bold text-[#FA5A36] hover:underline cursor-pointer"
            >
              Refresh Sessions
            </button>
          </div>

          {loadingBookings ? (
            <div className="py-16 flex flex-col items-center justify-center space-y-2">
              <div className="animate-spin rounded-full h-7 w-7 border-4 border-[#FA5A36] border-t-transparent" />
              <p className="text-xs text-slate-500 font-semibold">Loading your bookings...</p>
            </div>
          ) : bookings.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-14 h-14 bg-orange-50 text-[#FA5A36] rounded-2xl flex items-center justify-center mx-auto">
                <Calendar className="w-7 h-7" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">No Consultations Booked Yet</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto font-medium">
                Make sure your 1-on-1 consultation status is enabled and availability is published so students can book you.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map((b) => (
                <div
                  key={b.id}
                  className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#FA5A36] to-[#FF8A65] text-white flex items-center justify-center font-bold text-sm shrink-0">
                      {b.student?.name?.[0] || 'S'}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">{b.student?.name}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {b.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-medium">
                        Student Email: <span className="font-semibold text-slate-700">{b.student?.email}</span>
                      </p>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 font-medium pt-1">
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {new Date(b.startTime).toLocaleDateString('en-IN', {
                            weekday: 'short',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {new Date(b.startTime).toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}{' '}
                          ({b.durationMinutes} mins)
                        </span>
                        <span className="inline-flex items-center gap-1 font-semibold text-slate-900">
                          ₹{b.fee} {b.paymentStatus === 'FREE' ? '(Free Session)' : '(Paid)'}
                        </span>
                      </div>
                      {b.notes && (
                        <p className="text-xs text-slate-600 bg-white p-2.5 rounded-xl border border-slate-100 mt-2">
                          <span className="font-bold text-slate-700">Student Notes:</span> {b.notes}
                        </p>
                      )}
                      {b.consultationReview && (
                        <div className="mt-2 rounded-xl border border-amber-100 bg-amber-50/70 p-3 space-y-1.5">
                          <div className="flex items-center gap-1" aria-label={`${b.consultationReview.rating} out of 5 stars`}>
                            {Array.from({ length: 5 }, (_, index) => (
                              <Star
                                key={index}
                                className={`w-3.5 h-3.5 ${index < b.consultationReview!.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`}
                              />
                            ))}
                            <span className="ml-1 text-[10px] font-bold text-slate-600">Student review</span>
                          </div>
                          <p className="text-xs text-slate-700">{b.consultationReview.review}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end md:self-center">
                    <button
                      onClick={() => handleJoinSession(b)}
                      className="px-4 py-2.5 bg-[#FA5A36] hover:bg-[#E04322] text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-xs cursor-pointer transition"
                    >
                      <Video className="w-4 h-4" />
                      <span>Join Video Room</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
