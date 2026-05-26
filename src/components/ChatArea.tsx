import React, { useState, useRef, useEffect } from "react";
import { 
  Send, 
  Sparkles, 
  AlertCircle,
  Clock,
  Trash2,
  SlidersHorizontal,
  Menu,
  Globe,
  ExternalLink,
  Plus,
  Compass,
  Lightbulb,
  Terminal,
  FileText,
  Mic,
  Volume2,
  VolumeX
} from "lucide-react";
import Markdown from "react-markdown";
import { Message, Persona } from "../types";
import { getPersonaIcon } from "./SettingsPanel";

interface ChatAreaProps {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  isApiKeyMissing: boolean;
  activePersona: Persona;
  selectedModel: string;
  useSearch: boolean;
  onSendMessage: (text: string) => void;
  onClearThread: () => void;
  onToggleSidebarMobile: () => void;
  onToggleSettings: () => void;
}

const STARTER_PROMPTS = [
  {
    text: "Explain quantum computing using a simple mental model.",
    icon: <Lightbulb className="w-4 h-4 text-amber-500" />,
    heading: "Socratic Concept"
  },
  {
    text: "Review my React TS architecture and improve performance.",
    icon: <Terminal className="w-4 h-4 text-emerald-500" />,
    heading: "Code Optimization"
  },
  {
    text: "Draft an engaging blog post layout for a new organic coffee brand.",
    icon: <Compass className="w-4 h-4 text-pink-500" />,
    heading: "Writing Craft"
  },
  {
    text: "Deconstruct the logical pros and cons of implementing remote-first policies.",
    icon: <FileText className="w-4 h-4 text-purple-500" />,
    heading: "Strategic Analysis"
  }
];

export default function ChatArea({
  messages,
  isLoading,
  error,
  isApiKeyMissing,
  activePersona,
  selectedModel,
  useSearch,
  onSendMessage,
  onClearThread,
  onToggleSidebarMobile,
  onToggleSettings,
}: ChatAreaProps) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [isListening, setIsListening] = useState(false);
  const [isTtsEnabled, setIsTtsEnabled] = useState(true);
  const [recognitionError, setRecognitionError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const lastSpokenMessageIdRef = useRef<string | null>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = "ta-IN"; // தமிழ் மொழிக்கு

      rec.onstart = () => {
        setIsListening(true);
        setRecognitionError(null);
      };

      rec.onresult = (event: any) => {
        const speechToText = event.results[0][0].transcript;
        setInput(prev => prev ? `${prev} ${speechToText}` : speechToText);
      };

      rec.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        if (event.error === "no-speech") {
          setRecognitionError("No speech detected. Please try speaking again.");
        } else if (event.error === "not-allowed") {
          setRecognitionError("Microphone permission was denied. Please allow microphone access in your browser or try opening the app in a new tab to bypass iframe sandbox limits.");
        } else {
          setRecognitionError(`Speech Recognition: ${event.error}`);
        }
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
    }
  }, []);

  // Text to Speech voice synthesizer
  const speakText = (text: string) => {
    if (!window.speechSynthesis) return;
    
    // Stop any ongoing speech
    window.speechSynthesis.cancel();

    // Remove markdown code blocks and formatting characters for natural readout
    const cleanText = text
      .replace(/```[\s\S]*?```/g, "") // remove code blocks
      .replace(/`.*?`/g, "") // remove inline code
      .replace(/[*#`_\-]/g, "") // remove bold/italic markers
      .replace(/\[.*?\]\(.*?\)/g, "") // remove links
      .replace(/\s+/g, " ")
      .trim();

    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = "ta-IN"; // Set lang to Tamil (தமிழ்)
    
    // Attempt to locate native Tamil voice
    const voices = window.speechSynthesis.getVoices();
    const tamilVoice = voices.find(v => v.lang.startsWith("ta"));
    if (tamilVoice) {
      utterance.voice = tamilVoice;
    }

    window.speechSynthesis.speak(utterance);
  };

  // Trigger TTS auto-readout for new assistant responses
  useEffect(() => {
    if (messages.length === 0) return;
    
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.role === "assistant" && lastMessage.id !== lastSpokenMessageIdRef.current) {
      lastSpokenMessageIdRef.current = lastMessage.id;
      if (isTtsEnabled && !isLoading) {
        speakText(lastMessage.content);
      }
    }
  }, [messages, isTtsEnabled, isLoading]);

  // Handle listen toggle
  const toggleListening = () => {
    if (!recognitionRef.current) {
      setRecognitionError("Speech Recognition is not supported in this browser. Try Chrome or Safari.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        if (window.speechSynthesis) {
          window.speechSynthesis.cancel(); // Silence voice read-out when you begin dictating
        }
        recognitionRef.current.start();
      } catch (err) {
        console.error("Failed to start speech recognition", err);
      }
    }
  };

  // Cancel voice speak on component unmount
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    onSendMessage(input.trim());
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleStarterClick = (promptText: string) => {
    onSendMessage(promptText);
  };

  return (
    <div id="app-chat-area" className="flex-1 flex flex-col h-full bg-[#09090b] text-[#fafafa] relative min-w-0">
      {/* Top Header Controls */}
      <header className="h-16 border-b border-[#27272a] bg-[#09090b] sticky top-0 z-10 flex items-center justify-between px-6">
        <div className="flex items-center space-x-3.5 min-w-0">
          <button
            id="mobile-sidebar-toggle-btn"
            onClick={onToggleSidebarMobile}
            className="md:hidden p-1.5 rounded-lg text-[#71717a] hover:bg-[#18181b] hover:text-[#e4e4e7]"
            title="Open Conversations"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <div className="flex items-center space-x-2 min-w-0">
            <span className="font-serif italic text-lg text-[#a1a1aa] hidden sm:inline select-none">Conversation /</span>
            <span className="text-sm font-medium text-[#e4e4e7] truncate">
              {activePersona.name}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-3.5">
          {/* Status Dot */}
          <div className="flex items-center space-x-2.5 text-xs text-[#71717a] font-sans">
            <span className="w-2 h-2 rounded-full bg-[#22c55e] shadow-[0_0_8px_#22c55e]" />
            <span className="hidden sm:inline">Assistant is Online</span>
          </div>

          <div className="h-4 w-[1px] bg-[#27272a] hidden sm:block" />

          {messages.length > 0 && (
            <button
              id="clear-thread-btn"
              onClick={onClearThread}
              className="p-1.5 rounded-lg text-[#71717a] hover:bg-[#18181b] hover:text-red-400 transition-colors cursor-pointer"
              title="Clear Thread Messages"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <button
            id="toggle-settings-btn"
            onClick={onToggleSettings}
            className="p-1.5 rounded-lg text-[#71717a] hover:bg-[#18181b] hover:text-[#fafafa] transition-colors cursor-pointer"
            title="Configure System Settings"
          >
            <SlidersHorizontal className="w-4.5 h-4.5" />
          </button>
        </div>
      </header>

      {/* Main Messages & Logs Stream */}
      <div className="flex-1 overflow-y-auto px-6 py-8 md:px-12 md:py-10">
        <div className="max-w-3xl mx-auto h-full flex flex-col justify-between">
          
          {messages.length === 0 ? (
            /* Blank Conversation / Quick Action Cards */
            <div className="my-auto py-10 flex flex-col justify-center items-center">
              <div className="p-3 bg-[#18181b] border border-[#27272a] rounded-xl mb-4 text-[#a1a1aa] shadow-lg animate-pulse">
                {getPersonaIcon(activePersona.iconName, "w-8 h-8")}
              </div>
              <h2 className="text-xl font-serif italic text-[#fafafa] tracking-tight text-center">
                Explore as {activePersona.name}
              </h2>
              <p className="text-xs text-[#71717a] text-center max-w-sm mt-1 mb-8 leading-relaxed font-sans">
                {activePersona.description}
              </p>

              {/* Suggestions Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full max-w-2xl select-none">
                {STARTER_PROMPTS.map((prompt, i) => (
                  <button
                    id={`starter-prompt-${i}`}
                    key={i}
                    onClick={() => handleStarterClick(prompt.text)}
                    className="p-4 bg-[#121214] border border-[#27272a] rounded-xl hover:border-[#3f3f46] hover:bg-[#18181b] cursor-pointer text-left transition-all group"
                  >
                    <div className="flex items-center space-x-2">
                      {prompt.icon}
                      <span className="text-[10px] font-mono font-semibold text-[#52525b] group-hover:text-[#a1a1aa] transition-colors uppercase">
                        {prompt.heading}
                      </span>
                    </div>
                    <p className="text-xs text-[#a1a1aa] font-medium mt-1.5 line-clamp-2 leading-relaxed">
                      {prompt.text}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Normal Message Stream List */
            <div className="space-y-8">
              {messages.map((message) => {
                const isAI = message.role === "assistant";
                return (
                  <div
                    id={`chat-msg-${message.id}`}
                    key={message.id}
                    className={`flex items-start space-x-4 ${isAI ? "" : "flex-row-reverse space-x-reverse"}`}
                  >
                    {isAI ? (
                      <div className="w-9 h-9 border border-[#3f3f46] bg-[#27272a] text-[#a1a1aa] rounded flex items-center justify-center text-xs font-mono font-bold select-none flex-shrink-0 mt-0.5">
                        AI
                      </div>
                    ) : (
                      <div className="w-9 h-9 border border-[#3f3f46] bg-[#3f3f46] text-[#ffffff] rounded flex items-center justify-center text-xs font-mono font-bold select-none flex-shrink-0 mt-0.5">
                        ME
                      </div>
                    )}
                    
                    <div className="max-w-[80%] min-w-0">
                      {/* Message Bubble container */}
                      <div className={isAI ? "text-left text-sm text-[#d4d4d8] leading-relaxed py-1" : "text-left"}>
                        {isAI ? (
                          <div className="markdown-body select-text">
                            <Markdown>{message.content}</Markdown>
                          </div>
                        ) : (
                          <div className="markdown-body text-[#fafafa] bg-[#18181b] border border-[#27272a] rounded-xl px-4 py-2.5 max-w-lg shadow-sm font-sans leading-relaxed select-text font-normal inline-block">
                            <Markdown>{message.content}</Markdown>
                          </div>
                        )}
                      </div>

                      {/* Display Search Grounding Sources if referenced */}
                      {isAI && message.groundingChunks && message.groundingChunks.length > 0 && (
                        <div className="mt-3 pl-3.5 border-l border-[#3f3f46] space-y-1.5 select-none">
                          <div className="flex items-center space-x-1.5 text-[9px] font-semibold text-[#52525b] uppercase tracking-widest">
                            <Globe className="w-3 h-3 text-[#52525b]" />
                            <span>Sources referenced:</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5 py-1">
                            {message.groundingChunks.map((chunk, index) => {
                              if (!chunk.web?.uri) return null;
                              return (
                                <a
                                  id={`grounding-link-${message.id}-${index}`}
                                  key={index}
                                  href={chunk.web.uri}
                                  target="_blank"
                                  referrerPolicy="no-referrer"
                                  className="inline-flex items-center space-x-1 bg-[#121214] hover:bg-[#18181b] border border-[#27272a] rounded px-2 py-0.5 text-[10px] text-[#a1a1aa] transition-colors font-medium cursor-pointer"
                                >
                                  <span className="truncate max-w-[140px]">
                                    {chunk.web.title || `Source ${index + 1}`}
                                  </span>
                                  <ExternalLink className="w-2.5 h-2.5 text-[#52525b] flex-shrink-0" />
                                </a>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Message timestamp metadata */}
                      <div className={`text-[9px] font-mono text-[#3f3f46] mt-1.5 flex items-center gap-1.5 select-none ${!isAI ? "justify-end mr-1" : "ml-1"}`}>
                        <Clock className="w-2.5 h-2.5" />
                        <span>{new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        {isAI && (
                          <>
                            <span className="text-[#27272a]">|</span>
                            <button
                              onClick={() => speakText(message.content)}
                              className="text-[#71717a] hover:text-[#fafafa] font-sans hover:underline cursor-pointer flex items-center space-x-1"
                              title="Listen to Tamil audio readout"
                            >
                              <Volume2 className="w-2.5 h-2.5" />
                              <span>Listen</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Thinking loader placeholder */}
          {isLoading && (
            <div id="assistant-thinking-indicator" className="flex items-start space-x-4 mt-8">
              <div className="w-9 h-9 border border-[#3f3f46] bg-[#27272a] text-[#a1a1aa] rounded flex items-center justify-center text-xs font-mono font-bold select-none flex-shrink-0 animate-pulse">
                AI
              </div>
              <div className="bg-[#121214] border border-[#27272a] rounded-lg px-4 py-2 text-sm text-[#71717a] font-sans flex items-center space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#71717a] animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-[#71717a] animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-[#71717a] animate-bounce" style={{ animationDelay: '300ms' }} />
                <span className="text-[13px]">Thinking...</span>
              </div>
            </div>
          )}

          {/* Persistent API Key or General Execution Error Message */}
          {error && (
            <div id="api-execution-error-alert" className="p-4 bg-red-950/20 border border-red-900/40 rounded-xl my-6 flex items-start space-x-3 shadow-3xs max-w-2xl mx-auto">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1 space-y-1">
                <h3 className="text-xs font-bold text-red-400 leading-tight">API Client Execution Fail</h3>
                <p className="text-xs text-red-300 font-sans select-text whitespace-pre-wrap">
                  {error}
                </p>
                {isApiKeyMissing && (
                  <div className="mt-2 text-[11px] bg-[#09090b] border border-red-900/30 rounded-lg p-3 text-slate-400 font-medium font-sans leading-relaxed">
                    Please secure a Gemini API Key inside AI Studio settings. Go to the <span className="font-bold text-slate-200">Secrets panel</span> in the bottom bar or left menu, add a variable named <code className="bg-slate-900 px-1 py-0.5 rounded text-red-400 font-bold font-mono">GEMINI_API_KEY</code>, and paste your key.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Empty spacing for aligning scroll bar perfectly */}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Footer Chat Form Box */}
      <footer className="p-6 bg-[#09090b] border-t border-[#27272a]">
        <div className="max-w-3xl mx-auto">
          {/* Input Area Group */}
          <div className="bg-[#18181b] border border-[#27272a] rounded-xl px-4 py-3 flex flex-col space-y-2">
            <div className="flex items-center justify-between space-x-3">
              <textarea
                id="message-text-area"
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isListening ? "கேட்டுக் கொண்டிருக்கிறேன்..." : "Type your message or click 🎤 to speak in Tamil..."}
                disabled={isLoading}
                className="flex-1 text-sm bg-transparent border-none text-[#fafafa] placeholder-[#52525b] focus:outline-none focus:ring-0 resize-none max-h-36 pr-4"
                style={{ minHeight: "24px" }}
              />
              
              <div className="flex items-center space-x-2">
                {/* Tamil Speech Voice Dictation */}
                <button
                  type="button"
                  onClick={toggleListening}
                  className={`p-2 rounded-lg cursor-pointer transition-all ${
                    isListening
                      ? "bg-red-950/40 text-red-400 border border-red-900/40 animate-pulse"
                      : "text-[#71717a] hover:text-[#fafafa] hover:bg-[#27272a]/50"
                  }`}
                  title={isListening ? "Stop Listening" : "Tamil Voice Dictation (🎤)"}
                >
                  <Mic className="w-4 h-4" />
                </button>

                {/* AI Text to Speech Readout Toggle */}
                <button
                  type="button"
                  onClick={() => {
                    const nextTts = !isTtsEnabled;
                    setIsTtsEnabled(nextTts);
                    if (!nextTts && window.speechSynthesis) {
                      window.speechSynthesis.cancel();
                    }
                  }}
                  className={`p-2 rounded-lg cursor-pointer transition-all ${
                    isTtsEnabled
                      ? "text-emerald-400 hover:text-emerald-300"
                      : "text-[#52525b] hover:text-[#71717a]"
                  }`}
                  title={isTtsEnabled ? "Mute automatic voice reading" : "Enable automatic Tamil voice read-out"}
                >
                  {isTtsEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </button>

                <div className="h-5 w-[1px] bg-[#27272a]" />

                {/* Submit Send */}
                <button
                  id="send-message-btn"
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="p-1 flex-shrink-0 text-[#52525b] hover:text-[#a1a1aa] disabled:text-[#27272a] transition-colors cursor-pointer"
                  title="Submit Prompt"
                >
                  <svg className="w-4.5 h-4.5 fill-current" viewBox="0 0 24 24">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path>
                  </svg>
                </button>
              </div>
            </div>

            {/* Listening pulse line indicator */}
            {isListening && (
              <div className="flex items-center space-x-2 text-[11px] text-red-500 font-sans">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                <span>கேட்டுக் கொண்டிருக்கிறேன்... தமிழில் பேசவும் (Listening... speak in Tamil)</span>
              </div>
            )}
            {recognitionError && (
              <div className="text-[11px] text-red-400 font-sans">
                {recognitionError}
              </div>
            )}
          </div>
          <div className="mt-3 text-center text-[11px] text-[#3f3f46] tracking-wide select-none">
            AI may generate inaccurate info. Check important info.
          </div>
        </div>
      </footer>
    </div>
  );
}
