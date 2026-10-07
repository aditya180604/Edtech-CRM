import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  Bot,
  User,
  Copy,
  Check,
  Lightbulb,
  Code2,
  HelpCircle,
  AlertTriangle,
  FileText,
  RotateCcw,
  Loader2,
  Zap,
} from 'lucide-react';
import { aiApi } from '../../api/ai';

interface AiLearningCopilotTabProps {
  courseTitle: string;
  moduleTitle?: string;
  lessonTitle: string;
  lessonDescription?: string;
  userAvatar?: string | null;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  promptType?: string;
}

export const AiLearningCopilotTab: React.FC<AiLearningCopilotTabProps> = ({
  courseTitle,
  moduleTitle = 'Core Module',
  lessonTitle,
  lessonDescription = '',
  userAvatar = null,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-msg',
      role: 'model',
      text: `👋 **Hi there! I'm your EduTech AI Copilot.**\n\nI'm active on **${lessonTitle}**. Ask me any doubt, request a simpler explanation, get code snippets, or test your understanding with a quick quiz!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleCopyCode = (codeText: string, blockId: string) => {
    navigator.clipboard.writeText(codeText);
    setCopiedIndex(blockId);
    setTimeout(() => {
      setCopiedIndex(null);
    }, 2000);
  };

  const handleSendMessage = async (customPromptType?: any, customText?: string) => {
    const textToSend = customText !== undefined ? customText : inputQuery.trim();
    const promptTypeToSend = customPromptType || 'CUSTOM_QUERY';

    if (!textToSend && !customPromptType) return;

    const userMessageText =
      customPromptType === 'EXPLAIN_BEGINNER'
        ? '💡 Explain this lesson like I am a beginner'
        : customPromptType === 'CODE_EXAMPLE'
        ? '💻 Show me a practical code example for this lesson'
        : customPromptType === 'QUIZ_ME'
        ? '❓ Quiz me on this lesson'
        : customPromptType === 'COMMON_PITFALLS'
        ? '🐛 What common pitfalls should I avoid?'
        : customPromptType === 'SUMMARY'
        ? '📝 Give me a 3-bullet summary of this lesson'
        : textToSend;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: userMessageText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      promptType: promptTypeToSend,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setLoading(true);

    try {
      // Build history for backend
      const historyPayload = messages.slice(-6).map((m) => ({
        role: m.role,
        text: m.text,
      }));

      const res = await aiApi.askTutor({
        question: textToSend,
        promptType: promptTypeToSend,
        courseTitle,
        moduleTitle,
        lessonTitle,
        lessonDescription,
        history: historyPayload,
      });

      if (res?.success && res.data?.reply) {
        const modelMsg: ChatMessage = {
          id: `model-${Date.now()}`,
          role: 'model',
          text: res.data.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, modelMsg]);
      } else {
        throw new Error(res?.message || 'Failed to get response');
      }
    } catch (err: any) {
      const errMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'model',
        text: `⚠️ **Oops!** I ran into an issue generating a response: ${err?.message || 'Please check connection'}. Please try asking again.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: 'model',
        text: `🧹 **Chat reset.** Context remains active on **${lessonTitle}**. How can I help you next?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  // Helper to render formatted markdown with code snippets
  const renderFormattedText = (text: string, msgId: string) => {
    // Split by code blocks ```lang ... ```
    const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
    const parts = [];
    let lastIndex = 0;
    let match;
    let blockCount = 0;

    while ((match = codeBlockRegex.exec(text)) !== null) {
      // Push text before code block
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: text.slice(lastIndex, match.index),
        });
      }

      // Push code block
      const lang = match[1] || 'code';
      const code = match[2].trim();
      const blockId = `${msgId}-block-${blockCount++}`;
      parts.push({
        type: 'code',
        lang,
        code,
        blockId,
      });

      lastIndex = match.index + match[0].length;
    }

    // Push remaining text
    if (lastIndex < text.length) {
      parts.push({
        type: 'text',
        content: text.slice(lastIndex),
      });
    }

    return (
      <div className="space-y-3 leading-relaxed text-xs sm:text-sm">
        {parts.map((part, pIdx) => {
          if (part.type === 'code') {
            const isCopied = copiedIndex === part.blockId;
            return (
              <div key={pIdx} className="rounded-xl overflow-hidden border border-slate-800 bg-[#0f172a] my-2.5">
                <div className="flex items-center justify-between px-3.5 py-1.5 bg-[#1e293b] border-b border-slate-800 text-[11px] text-slate-400 font-mono">
                  <span className="uppercase font-bold tracking-wider text-cyan-400">{part.lang}</span>
                  <button
                    type="button"
                    onClick={() => handleCopyCode(part.code!, part.blockId!)}
                    className="flex items-center gap-1 text-slate-300 hover:text-white transition-colors cursor-pointer px-2 py-0.5 rounded bg-slate-700/60 hover:bg-slate-700"
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400 font-bold">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy code</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-3.5 text-xs text-slate-100 font-mono overflow-x-auto leading-relaxed">
                  <code>{part.code}</code>
                </pre>
              </div>
            );
          }

          // Process simple markdown paragraphs, bold, lists, and inline code
          const lines = (part.content || '').split('\n');
          return (
            <div key={pIdx} className="space-y-1.5">
              {lines.map((line, lIdx) => {
                if (!line.trim()) return <div key={lIdx} className="h-1" />;

                // Bullet point
                if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
                  const content = line.trim().slice(2);
                  return (
                    <div key={lIdx} className="flex items-start gap-2 pl-2">
                      <span className="text-cyan-600 font-bold mt-0.5">•</span>
                      <span>{renderInlineMarkdown(content)}</span>
                    </div>
                  );
                }

                // Numbered list
                const numMatch = line.trim().match(/^(\d+)\.\s+(.*)/);
                if (numMatch) {
                  return (
                    <div key={lIdx} className="flex items-start gap-2 pl-2">
                      <span className="text-indigo-600 font-bold font-mono text-[11px] mt-0.5">{numMatch[1]}.</span>
                      <span>{renderInlineMarkdown(numMatch[2])}</span>
                    </div>
                  );
                }

                return <p key={lIdx}>{renderInlineMarkdown(line)}</p>;
              })}
            </div>
          );
        })}
      </div>
    );
  };

  const renderInlineMarkdown = (lineStr: string) => {
    // Simple inline parser for bold **text** and inline `code`
    const tokens = lineStr.split(/(\*\*.*?\*\*|`.*?`)/g);
    return tokens.map((token, idx) => {
      if (token.startsWith('**') && token.endsWith('**')) {
        return <strong key={idx} className="font-bold text-slate-900">{token.slice(2, -2)}</strong>;
      }
      if (token.startsWith('`') && token.endsWith('`')) {
        return (
          <code key={idx} className="px-1.5 py-0.5 bg-slate-100 text-indigo-700 font-mono text-[11px] rounded border border-slate-200">
            {token.slice(1, -1)}
          </code>
        );
      }
      return token;
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden flex flex-col h-[600px]">
      {/* 1. Header & Context Badge */}
      <div className="p-4 bg-slate-50 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-xs">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                EduTech AI Copilot
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live Mentor
                </span>
              </h3>
            </div>
            <p className="text-[11px] text-slate-500 truncate max-w-md">
              Context: <span className="font-semibold text-slate-700">{lessonTitle}</span> ({courseTitle})
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={clearChat}
          className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium transition cursor-pointer px-2.5 py-1 rounded-lg hover:bg-slate-200/60"
          title="Reset chat"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Clear</span>
        </button>
      </div>

      {/* 2. 1-Click Fast Prompt Chips */}
      <div className="px-4 py-2.5 bg-indigo-50/50 border-b border-indigo-100/60 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 flex items-center gap-1 shrink-0">
          <Zap className="w-3 h-3 text-indigo-600" /> Prompts:
        </span>

        <button
          type="button"
          disabled={loading}
          onClick={() => handleSendMessage('EXPLAIN_BEGINNER')}
          className="px-2.5 py-1 rounded-lg bg-white border border-indigo-200/80 hover:border-indigo-400 text-indigo-800 text-[11px] font-semibold flex items-center gap-1 shrink-0 transition shadow-2xs hover:scale-[1.02] cursor-pointer disabled:opacity-50"
        >
          <Lightbulb className="w-3 h-3 text-amber-500" />
          <span>Explain Like Beginner</span>
        </button>

        <button
          type="button"
          disabled={loading}
          onClick={() => handleSendMessage('CODE_EXAMPLE')}
          className="px-2.5 py-1 rounded-lg bg-white border border-indigo-200/80 hover:border-indigo-400 text-indigo-800 text-[11px] font-semibold flex items-center gap-1 shrink-0 transition shadow-2xs hover:scale-[1.02] cursor-pointer disabled:opacity-50"
        >
          <Code2 className="w-3 h-3 text-cyan-500" />
          <span>Code Example</span>
        </button>

        <button
          type="button"
          disabled={loading}
          onClick={() => handleSendMessage('QUIZ_ME')}
          className="px-2.5 py-1 rounded-lg bg-white border border-indigo-200/80 hover:border-indigo-400 text-indigo-800 text-[11px] font-semibold flex items-center gap-1 shrink-0 transition shadow-2xs hover:scale-[1.02] cursor-pointer disabled:opacity-50"
        >
          <HelpCircle className="w-3 h-3 text-purple-500" />
          <span>Quiz Me</span>
        </button>

        <button
          type="button"
          disabled={loading}
          onClick={() => handleSendMessage('COMMON_PITFALLS')}
          className="px-2.5 py-1 rounded-lg bg-white border border-indigo-200/80 hover:border-indigo-400 text-indigo-800 text-[11px] font-semibold flex items-center gap-1 shrink-0 transition shadow-2xs hover:scale-[1.02] cursor-pointer disabled:opacity-50"
        >
          <AlertTriangle className="w-3 h-3 text-rose-500" />
          <span>Common Pitfalls</span>
        </button>

        <button
          type="button"
          disabled={loading}
          onClick={() => handleSendMessage('SUMMARY')}
          className="px-2.5 py-1 rounded-lg bg-white border border-indigo-200/80 hover:border-indigo-400 text-indigo-800 text-[11px] font-semibold flex items-center gap-1 shrink-0 transition shadow-2xs hover:scale-[1.02] cursor-pointer disabled:opacity-50"
        >
          <FileText className="w-3 h-3 text-emerald-500" />
          <span>3-Bullet Summary</span>
        </button>
      </div>

      {/* 3. Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            {/* Avatar */}
            <div
              className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 shadow-xs ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gradient-to-tr from-cyan-600 to-indigo-600 text-white'
              }`}
            >
              {msg.role === 'user' ? (
                userAvatar ? (
                  <img src={userAvatar} alt="User" className="w-full h-full rounded-xl object-cover" />
                ) : (
                  <User className="w-3.5 h-3.5" />
                )
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
            </div>

            {/* Bubble */}
            <div
              className={`max-w-[85%] rounded-2xl p-4 shadow-xs ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-tr-xs'
                  : 'bg-slate-50 border border-slate-100 text-slate-800 rounded-tl-xs'
              }`}
            >
              {msg.role === 'user' ? (
                <p className="text-xs sm:text-sm font-medium whitespace-pre-wrap">{msg.text}</p>
              ) : (
                renderFormattedText(msg.text, msg.id)
              )}
              <span
                className={`block text-[10px] mt-1.5 font-medium ${
                  msg.role === 'user' ? 'text-indigo-200 text-right' : 'text-slate-400'
                }`}
              >
                {msg.timestamp}
              </span>
            </div>
          </div>
        ))}

        {/* Loading Indicator */}
        {loading && (
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-white shadow-xs shrink-0">
              <Sparkles className="w-3.5 h-3.5 animate-spin" />
            </div>
            <div className="bg-slate-50 border border-slate-100 rounded-2xl rounded-tl-xs p-4 shadow-xs text-xs text-slate-500 font-medium flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
              <span>Analyzing lesson context & generating tailored explanation...</span>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* 4. Chat Input Bar */}
      <div className="p-3.5 bg-white border-t border-slate-100 shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            disabled={loading}
            placeholder={`Ask anything about "${lessonTitle}" or paste a code question...`}
            className="flex-1 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white focus:outline-none rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-800 font-medium transition placeholder:text-slate-400"
          />
          <button
            type="submit"
            disabled={loading || !inputQuery.trim()}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/20 transition flex items-center gap-1.5 cursor-pointer"
          >
            <span>Ask</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
