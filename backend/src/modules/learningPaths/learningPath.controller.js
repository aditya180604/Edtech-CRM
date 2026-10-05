import { LearningPathService } from './learningPath.service.js';
import { ApiResponse } from '../../utils/apiResponse.js';

export class LearningPathController {
  static async getLearningPaths(req, res) {
    try {
      const { search, level, limit, page } = req.query;
      const userId = req.user?._id || req.user?.id || req.user?.userId || null;
      const result = await LearningPathService.getLearningPaths({ search, level, limit, page, userId });
      return ApiResponse.success(res, result, 'Learning paths retrieved successfully');
    } catch (error) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  static async enrollLearningPath(req, res) {
    try {
      const { slugOrId } = req.params;
      const userId = req.user?._id || req.user?.id || req.user?.userId;
      const result = await LearningPathService.enrollLearningPath({ slugOrId, userId });
      return ApiResponse.success(res, result, result.message || 'Enrolled in learning path successfully');
    } catch (error) {
      const status = error.message.startsWith('UNAUTHORIZED') ? 401 : error.message.startsWith('NOT_FOUND') ? 404 : 400;
      return ApiResponse.error(res, error.message, status);
    }
  }

  static async getLearningPathBySlug(req, res) {
    try {
      const { slugOrId } = req.params;
      const userId = req.user?._id || req.user?.id || null;
      const result = await LearningPathService.getLearningPathBySlug(slugOrId, userId);
      if (!result) {
        return ApiResponse.error(res, 'Learning path not found', 404);
      }
      return ApiResponse.success(res, result, 'Learning path roadmap retrieved successfully');
    } catch (error) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  static async getTopicDetail(req, res) {
    try {
      const { topicId } = req.params;
      const userId = req.user?._id || req.user?.id || null;
      const result = await LearningPathService.getTopicDetail(topicId, userId);
      if (!result) {
        return ApiResponse.error(res, 'Topic not found', 404);
      }
      return ApiResponse.success(res, result, 'Topic and tutor offerings retrieved successfully');
    } catch (error) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  static async getOfferingDetail(req, res) {
    try {
      const { offeringId } = req.params;
      const userId = req.user?._id || req.user?.id || null;
      const result = await LearningPathService.getOfferingDetail(offeringId, userId);
      if (!result) {
        return ApiResponse.error(res, 'Tutor offering not found', 404);
      }
      return ApiResponse.success(res, result, 'Offering details retrieved successfully');
    } catch (error) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  static async getOfferingLessonContent(req, res) {
    try {
      const { offeringId, lessonId } = req.params;
      const userId = req.user?._id || req.user?.id || req.user?.userId;
      const result = await LearningPathService.getOfferingLessonContent(offeringId, lessonId, userId);
      return ApiResponse.success(res, result, 'Lesson content authorized and retrieved');
    } catch (error) {
      const status = error.message.startsWith('FORBIDDEN') ? 403 : error.message.startsWith('UNAUTHORIZED') ? 401 : 404;
      return ApiResponse.error(res, error.message, status);
    }
  }

  static async purchaseOffering(req, res) {
    try {
      const { offeringId } = req.params;
      const userId = req.user?._id || req.user?.id || req.user?.userId;
      const { paymentMethod } = req.body;
      const result = await LearningPathService.purchaseOffering({ offeringId, userId, paymentMethod });
      return ApiResponse.success(res, result, result.message || 'Offering purchased successfully');
    } catch (error) {
      const status = error.message.startsWith('FORBIDDEN') ? 403 : error.message.startsWith('UNAUTHORIZED') ? 401 : 400;
      return ApiResponse.error(res, error.message, status);
    }
  }

  static async updateOfferingProgress(req, res) {
    try {
      const { offeringId } = req.params;
      const userId = req.user?._id || req.user?.id || req.user?.userId;
      const { lessonId, watchedSeconds, totalSeconds, completed } = req.body;
      const result = await LearningPathService.updateOfferingProgress({
        offeringId,
        lessonId,
        userId,
        watchedSeconds,
        totalSeconds,
        completed,
      });
      return ApiResponse.success(res, result, 'Progress updated successfully');
    } catch (error) {
      return ApiResponse.error(res, error.message, 400);
    }
  }
}
