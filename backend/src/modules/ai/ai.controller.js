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

  /**
   * POST /api/v1/ai/parse-curriculum
   * Parse Course Curriculum from raw text or document (PDF/Word/Text) using OpenAI
   */
  static parseCurriculum = asyncHandler(async (req, res) => {
    const { text, fileDataUrl, fileName, fileType } = req.body || {};

    if (!text && !fileDataUrl) {
      return res.status(400).json({
        success: false,
        message: 'Please provide course syllabus text or an uploaded document.',
      });
    }

    const result = await AiService.parseCurriculumWithAi({
      text,
      fileDataUrl,
      fileName,
      fileType,
    });

    return ApiResponse.success(res, result, 'Curriculum parsed successfully.');
  });
}
