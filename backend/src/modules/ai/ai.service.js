import { config } from '../../config/env.js';
import { trackExternal } from '../../utils/requestContext.js';
import mammoth from 'mammoth';

const GEMINI_TIMEOUT_MS = parseInt(process.env.GEMINI_TIMEOUT_MS || '25000', 10);

export class AiService {
  /**
   * Generate Context-Aware AI Tutor Response using Google Gemini
   */
  static async generateTutorResponse({
    question,
    courseTitle = 'Full Stack Engineering',
    moduleTitle = 'Core Fundamentals',
    lessonTitle = 'Active Lesson',
    lessonDescription = '',
    codeSnippet = '',
    promptType = 'CUSTOM_QUERY',
    history = [],
  }) {
    const apiKey = config.ai.geminiApiKey;
    if (!apiKey) {
      throw new Error('Gemini API Key is not configured in backend .env.');
    }

    // 1. Build context-aware system instructions based on prompt type
    let promptInstruction = '';
    switch (promptType) {
      case 'EXPLAIN_BEGINNER':
        promptInstruction = `The student requested: "Explain this lesson like I am a complete beginner." Break down the core concepts in "${lessonTitle}" using intuitive, everyday real-world analogies, zero jargon, and crystal-clear explanations.`;
        break;
      case 'CODE_EXAMPLE':
        promptInstruction = `The student requested: "Give me a practical code example for this lesson." Provide a clean, modern, production-grade code snippet demonstrating "${lessonTitle}". Include helpful inline comments and explain what each section does step-by-step.`;
        break;
      case 'QUIZ_ME':
        promptInstruction = `The student requested: "Quiz me on this lesson." Generate 1 engaging multiple-choice conceptual question directly testing understanding of "${lessonTitle}". Provide 4 options (A, B, C, D) followed by the correct answer with a brief explanation.`;
        break;
      case 'COMMON_PITFALLS':
        promptInstruction = `The student requested: "What are common pitfalls and mistakes for this topic?" List the top 3-4 common bugs, antipatterns, or misconceptions developers encounter when working with "${lessonTitle}" and show how to fix or prevent them.`;
        break;
      case 'SUMMARY':
        promptInstruction = `The student requested: "Give me a quick 3-bullet summary." Provide exactly 3 high-impact, actionable bullet points summarizing the most important takeaways from "${lessonTitle}".`;
        break;
      default:
        promptInstruction = `The student asked: "${question}"`;
    }

    const systemPrompt = `
You are the "VStudyOnline AI Copilot", an elite, patient, and encouraging senior software engineer and AI tutor inside the VStudyOnline learning platform.

### CURRENT CLASSROOM CONTEXT:
- Course: "${courseTitle}"
- Module: "${moduleTitle}"
- Current Lesson: "${lessonTitle}"
${lessonDescription ? `- Lesson Description: "${lessonDescription}"` : ''}
${codeSnippet ? `- Attached Code Snippet:\n\`\`\`\n${codeSnippet}\n\`\`\`` : ''}

### INSTRUCTIONS:
1. Always keep your response strictly tailored to the current lesson context ("${lessonTitle}" in "${courseTitle}").
2. Format your response cleanly using GitHub-flavored Markdown.
3. Use formatted code blocks with appropriate language tags (e.g. \`\`\`javascript, \`\`\`python, \`\`\`typescript, \`\`\`sql) for any code.
4. Keep explanations concise, practical, and easy to read.
5. End with an encouraging 1-sentence prompt or tip to keep the student engaged.

### STUDENT REQUEST:
${promptInstruction}
`.trim();

    // 2. Prepare conversation contents
    const contents = [];

    // Include recent chat history (up to last 6 turns)
    if (Array.isArray(history) && history.length > 0) {
      const recentHistory = history.slice(-6);
      for (const msg of recentHistory) {
        contents.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text || msg.content || '' }],
        });
      }
    }

    // Add current prompt
    contents.push({
      role: 'user',
      parts: [{ text: systemPrompt }],
    });

    // 3. Call Google Gemini API
    const model = 'gemini-2.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const response = await trackExternal('gemini', GEMINI_TIMEOUT_MS, (signal) => fetch(url, {
      signal,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: 0.4,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1500,
        },
      }),
    }));

    if (!response.ok) {
      const errBody = await response.text();
      console.error('[Gemini API Error]:', errBody);
      throw new Error(`Gemini API error (${response.status}): ${response.statusText}`);
    }

    const data = await response.json();
    const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!replyText) {
      throw new Error('No response returned from AI model.');
    }

    return {
      reply: replyText,
      lessonContext: {
        courseTitle,
        moduleTitle,
        lessonTitle,
      },
      promptType,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Parse Course Curriculum from raw text or uploaded document (PDF/Word/Text)
   * Using OpenAI gpt-4o-mini
   */
  static async parseCurriculumWithAi({ text = '', fileDataUrl = '', fileName = '', fileType = '' }) {
    const apiKey = config.ai.openaiApiKey;
    const model = config.ai.openaiModel || 'gpt-4o-mini';

    let extractedText = (text || '').trim();

    // If fileDataUrl is provided, extract raw text from base64
    if (fileDataUrl) {
      try {
        const base64Data = fileDataUrl.includes(',') ? fileDataUrl.split(',')[1] : fileDataUrl;
        const buffer = Buffer.from(base64Data, 'base64');

        const isDocx =
          (fileType && (fileType.includes('word') || fileType.includes('officedocument'))) ||
          (fileName && (fileName.endsWith('.docx') || fileName.endsWith('.doc')));
        const isPdf =
          (fileType && fileType.includes('pdf')) || (fileName && fileName.endsWith('.pdf'));

        if (isDocx) {
          const mammothResult = await mammoth.extractRawText({ buffer });
          extractedText = (mammothResult.value || '') + '\n' + extractedText;
        } else if (isPdf) {
          const rawString = buffer.toString('binary');
          const textBlocks = rawString.match(/\(([^()]+)\)[\s]*T[jJ]/g) || [];
          if (textBlocks.length > 0) {
            const pdfText = textBlocks.map((b) => b.replace(/^\(|\)[\s]*T[jJ]$/g, '')).join(' ');
            extractedText = pdfText + '\n' + extractedText;
          } else {
            const cleanStr = buffer.toString('utf-8').replace(/[^\x20-\x7E\n\r\t]/g, ' ');
            extractedText = cleanStr + '\n' + extractedText;
          }
        } else {
          // Plain text / markdown
          extractedText = buffer.toString('utf-8') + '\n' + extractedText;
        }
      } catch (fileErr) {
        console.warn('[Curriculum Parser] File text extraction note:', fileErr.message);
      }
    }

    extractedText = extractedText.trim();
    if (!extractedText || extractedText.length < 5) {
      throw new Error('Please provide course syllabus text or an uploaded document (PDF, Word, or Text).');
    }

    if (!apiKey) {
      throw new Error('OpenAI API Key is not configured in backend .env.');
    }

    const systemPrompt = `You are an elite educational curriculum designer and parser for an online learning platform.
Extract and organize the course curriculum into a structured JSON hierarchy of sequential Modules and Topics.

For each Module:
- "title": Clean module title (strip any "Module 1:" or "Chapter 1:" prefixes).

For each Topic inside a Module:
- "title": Clear, concise lesson/topic title.
- "description": Brief 1-2 sentence overview of what will be learned (empty string "" if not mentioned).
- "duration": Estimated duration in minutes as a number (e.g. 20, 30, 45). Default to 30 if not mentioned.
- "videoUrl": Direct video link (YouTube, Vimeo, MP4, Google Drive, or Cloudinary URL) if present in the text, otherwise "". Do NOT invent fake URLs.
- "price": Price as a number (default 0).
- "isFree": Boolean (true if marked as Free Preview / Introductory lesson, otherwise false).

Also extract overall course parameters if mentioned in the document:
- "courseTitle": Course title (or empty string if not mentioned).
- "courseDescription": Course overview (or empty string if not mentioned).
- "price": Overall course price as a number (0 if not mentioned).
- "duration": Overall course duration in hours as a number (0 if not mentioned).

CRITICAL: Return ONLY a valid JSON object matching this exact schema:
{
  "courseTitle": string,
  "courseDescription": string,
  "price": number,
  "duration": number,
  "modules": [
    {
      "title": string,
      "topics": [
        {
          "title": string,
          "description": string,
          "duration": number,
          "videoUrl": string,
          "price": number,
          "isFree": boolean
        }
      ]
    }
  ]
}
If any fields are missing in the user input, leave them as empty string "" or 0 as specified.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: extractedText },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('[OpenAI API Error]:', errText);
      throw new Error(`OpenAI API error (${response.status}): ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('OpenAI returned empty curriculum response.');
    }

    let parsed = JSON.parse(content);

    // Normalize output structure to ensure strict frontend compatibility
    const normalizedModules = (parsed.modules || []).map((m, mIdx) => ({
      title: (m.title || `Module ${mIdx + 1}`).replace(/^Module\s*\d+\s*:\s*/i, '').trim(),
      topics: (m.topics || []).map((t, tIdx) => ({
        title: (t.title || `Topic ${tIdx + 1}`).trim(),
        description: (t.description || '').trim(),
        duration: Math.max(1, parseInt(t.duration, 10) || 30),
        videoUrl: (t.videoUrl || '').trim(),
        price: Math.max(0, parseFloat(t.price) || 0),
        isFree: Boolean(t.isFree),
      })),
    }));

    return {
      courseTitle: parsed.courseTitle || '',
      courseDescription: parsed.courseDescription || '',
      price: parseFloat(parsed.price) || 0,
      duration: parseFloat(parsed.duration) || 0,
      modules: normalizedModules,
      stats: {
        totalModules: normalizedModules.length,
        totalTopics: normalizedModules.reduce(
          (acc, m) => acc + (m.topics ? m.topics.length : 0),
          0
        ),
        totalDurationMinutes: normalizedModules.reduce(
          (acc, m) =>
            acc + (m.topics ? m.topics.reduce((sum, t) => sum + (t.duration || 0), 0) : 0),
          0
        ),
      },
    };
  }
}
