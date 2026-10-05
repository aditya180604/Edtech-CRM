import mongoose from 'mongoose';
import { Notification, Webinar } from '../../models/index.js';

export class NotificationsService {
  /**
   * Get user notifications & auto-sync "Started" notifications for live webinars
   */
  static async getUserNotifications(userId) {
    if (!userId) return { notifications: [], unreadCount: 0, activeStartedWebinars: [] };

    const userObjectId = new mongoose.Types.ObjectId(userId);
    const now = new Date();

    // 1. Find all active webinars where this user is either registered or the host instructor
    const activeWebinars = await Webinar.find({
      $or: [
        { registrations: userObjectId },
        { instructorId: userObjectId },
      ],
      startTime: { $lte: now },
      endTime: { $gte: now },
    }).lean();

    // 2. Ensure each active webinar has a "Started" notification generated for this user
    for (const w of activeWebinars) {
      const existing = await Notification.findOne({
        userId: userObjectId,
        type: 'WEBINAR_STARTED',
        entityId: w._id,
      });

      if (!existing) {
        await Notification.create({
          notificationId: `notif_${w._id}_${userId}_${Date.now()}`,
          userId: userObjectId,
          type: 'WEBINAR_STARTED',
          title: `Webinar Started: ${w.title}`,
          message: `The webinar "${w.title}" has started! Join the live session now.`,
          status: 'Started',
          meetingUrl: w.meetingUrl || '',
          entityType: 'WEBINAR',
          entityId: w._id,
          isRead: false,
          createdAt: new Date(),
        });
      } else if (w.meetingUrl && existing.meetingUrl !== w.meetingUrl) {
        await Notification.updateOne({ _id: existing._id }, { $set: { meetingUrl: w.meetingUrl } });
      }
    }

    // 3. Fetch notifications for user (newest first)
    const notifications = await Notification.find({ userId: userObjectId })
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();

    const unreadCount = await Notification.countDocuments({
      userId: userObjectId,
      isRead: false,
    });

    const activeStartedWebinars = activeWebinars.map((w) => ({
      id: w._id,
      title: w.title,
      category: w.category,
      meetingUrl: w.meetingUrl || '',
      startTime: w.startTime,
      endTime: w.endTime,
      status: 'Started',
      isInstructor: w.instructorId?.toString() === userId.toString(),
    }));

    return {
      notifications,
      unreadCount,
      activeStartedWebinars,
    };
  }

  /**
   * Mark a single notification as read
   */
  static async markAsRead(userId, notificationId) {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const updated = await Notification.findOneAndUpdate(
      {
        $or: [
          { _id: new mongoose.Types.ObjectId(notificationId) },
          { notificationId },
        ],
        userId: userObjectId,
      },
      {
        $set: { isRead: true, readAt: new Date() },
      },
      { new: true }
    );
    return updated;
  }

  /**
   * Mark all notifications as read for user
   */
  static async markAllAsRead(userId) {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const result = await Notification.updateMany(
      { userId: userObjectId, isRead: false },
      { $set: { isRead: true, readAt: new Date() } }
    );
    return { modifiedCount: result.modifiedCount };
  }

  /**
   * Trigger explicit started notification for all participants when a webinar launches
   */
  static async triggerWebinarStarted(webinarId) {
    const webinar = await Webinar.findById(webinarId);
    if (!webinar) return;

    const recipients = new Set();
    if (webinar.instructorId) {
      recipients.add(webinar.instructorId.toString());
    }
    if (Array.isArray(webinar.registrations)) {
      webinar.registrations.forEach((id) => recipients.add(id.toString()));
    }

    const createdNotifs = [];
    for (const recipientId of recipients) {
      const recipientObjectId = new mongoose.Types.ObjectId(recipientId);
      const existing = await Notification.findOne({
        userId: recipientObjectId,
        type: 'WEBINAR_STARTED',
        entityId: webinar._id,
      });

      if (!existing) {
        const notif = await Notification.create({
          notificationId: `notif_${webinar._id}_${recipientId}_${Date.now()}`,
          userId: recipientObjectId,
          type: 'WEBINAR_STARTED',
          title: `Webinar Started: ${webinar.title}`,
          message: `The webinar "${webinar.title}" has started! Join the live session now.`,
          status: 'Started',
          meetingUrl: webinar.meetingUrl || '',
          entityType: 'WEBINAR',
          entityId: webinar._id,
          isRead: false,
          createdAt: new Date(),
        });
        createdNotifs.push(notif);
      }
    }
    return createdNotifs;
  }
}
