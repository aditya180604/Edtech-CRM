import mongoose from 'mongoose';
import { Webinar, User } from '../../models/index.js';

export class WebinarsService {
  /**
   * Get public active and upcoming webinars, sorted chronologically by date & time
   */
  static async getUpcomingWebinars({ category, search, limit = 20, userId = null } = {}) {
    const now = new Date();
    // Active / upcoming webinars are either LIVE or SCHEDULED with startTime in future or not expired
    const query = {
      status: { $in: ['SCHEDULED', 'LIVE'] },
      endTime: { $gte: new Date(now.getTime() - 1000 * 60 * 60 * 4) }, // Include currently active or recent live
    };

    if (category && category !== 'ALL') {
      query.category = { $regex: new RegExp(`^${category}$`, 'i') };
    }

    if (search && search.trim()) {
      query.$or = [
        { title: { $regex: search.trim(), $options: 'i' } },
        { description: { $regex: search.trim(), $options: 'i' } },
        { category: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    const webinars = await Webinar.find(query)
      .populate('instructorId', 'firstName lastName email profilePhoto')
      .sort({ startTime: 1 }) // Chronological order: earliest scheduled first
      .limit(parseInt(limit, 10))
      .lean();

    const formatted = webinars.map((w) => {
      const instructor = w.instructorId || {};
      const instructorName = `${instructor.firstName || 'Instructor'} ${instructor.lastName || ''}`.trim();
      const startTime = new Date(w.startTime);
      const endTime = new Date(w.endTime);
      // Strictly live only if current time is between startTime and endTime
      const isLive = startTime <= now && endTime >= now;
      let computedStatus = w.status;
      if (isLive) {
        computedStatus = 'LIVE';
      } else if (now < startTime) {
        computedStatus = w.status === 'CANCELLED' ? 'CANCELLED' : 'SCHEDULED';
      } else if (now > endTime) {
        computedStatus = 'COMPLETED';
      }

      const registeredUserIds = Array.isArray(w.registrations)
        ? w.registrations.map((id) => id?.toString())
        : [];
      const isUserRegistered = userId ? registeredUserIds.includes(userId.toString()) : false;

      return {
        _id: w._id,
        id: w._id,
        webinarId: w.webinarId,
        title: w.title,
        slug: w.slug,
        description: w.description || '',
        category: w.category || 'General',
        startTime: w.startTime,
        endTime: w.endTime,
        timezone: w.timezone || 'UTC',
        capacity: w.capacity || 100,
        price: w.price || 0,
        currency: w.currency || 'INR',
        status: computedStatus,
        isLive,
        instructorId: instructor._id || null,
        instructorName,
        instructorAvatar: instructor.profilePhoto || null,
        registrationsCount: registeredUserIds.length,
        isUserRegistered,
        meetingUrl: w.meetingUrl || null,
        date: startTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        time: startTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
      };
    });

    return {
      webinars: formatted,
      count: formatted.length,
      hasUpcoming: formatted.length > 0,
    };
  }

  /**
   * Register a user / student for a webinar
   */
  static async registerStudent(webinarId, userId) {
    const webinar = await Webinar.findById(webinarId);
    if (!webinar) {
      throw new Error('Webinar not found');
    }

    if (!Array.isArray(webinar.registrations)) {
      webinar.registrations = [];
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);
    const isAlreadyRegistered = webinar.registrations.some(
      (id) => id.toString() === userId.toString()
    );

    if (!isAlreadyRegistered) {
      if (webinar.registrations.length >= (webinar.capacity || 100)) {
        throw new Error('Webinar has reached maximum capacity');
      }
      webinar.registrations.push(userObjectId);
      await webinar.save();
    }

    return {
      success: true,
      registered: true,
      registrationsCount: webinar.registrations.length,
      message: isAlreadyRegistered ? 'Already registered for this webinar' : 'Successfully registered for webinar',
    };
  }

  /**
   * Get single webinar details
   */
  static async getWebinarByIdOrSlug(identifier, userId = null) {
    const isObjectId = mongoose.Types.ObjectId.isValid(identifier);
    const query = isObjectId ? { _id: identifier } : { slug: identifier };

    const webinar = await Webinar.findOne(query)
      .populate('instructorId', 'firstName lastName email profilePhoto')
      .lean();

    if (!webinar) return null;

    const instructor = webinar.instructorId || {};
    const startTime = new Date(webinar.startTime);
    const endTime = new Date(webinar.endTime);
    const now = new Date();
    const isLive = webinar.status === 'LIVE' || (startTime <= now && endTime >= now);

    const registeredUserIds = Array.isArray(webinar.registrations)
      ? webinar.registrations.map((id) => id?.toString())
      : [];
    const isUserRegistered = userId ? registeredUserIds.includes(userId.toString()) : false;

    return {
      ...webinar,
      id: webinar._id,
      isLive,
      status: isLive ? 'LIVE' : webinar.status,
      instructorName: `${instructor.firstName || 'Instructor'} ${instructor.lastName || ''}`.trim(),
      instructorAvatar: instructor.profilePhoto || null,
      registrationsCount: registeredUserIds.length,
      isUserRegistered,
      date: startTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: startTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
    };
  }
}
