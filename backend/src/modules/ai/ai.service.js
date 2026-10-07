import { config } from '../../config/env.js';

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
You are the "EduTech AI Copilot", an elite, patient, and encouraging senior software engineer and AI tutor inside the EduTech learning platform.

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

    const response = await fetch(url, {
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
    });

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
}
