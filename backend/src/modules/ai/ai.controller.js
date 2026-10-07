import { AiService } from './ai.service.js';
import { ApiResponse, asyncHandler } from '../../utils/apiResponse.js';

export class AiController {
  /**
   * POST /api/v1/ai/tutor
   * Ask In-Classroom Context-Aware AI Tutor
   */
  static askTutor = asyncHandler(async (req, res) => {
    const {
      question,
      courseTitle,
      moduleTitle,
      lessonTitle,
      lessonDescription,
      codeSnippet,
      promptType,
      history,
    } = req.body || {};

    if (!question && !promptType) {
      return res.status(400).json({
        success: false,
        message: 'Question or promptType is required.',
      });
    }

    const result = await AiService.generateTutorResponse({
      question,
      courseTitle,
      moduleTitle,
      lessonTitle,
      lessonDescription,
      codeSnippet,
      promptType,
      history,
    });

    return ApiResponse.success(res, result, 'AI Tutor response generated.');
  });
}
