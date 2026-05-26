import React, { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import ChatArea from "./components/ChatArea";
import SettingsPanel from "./components/SettingsPanel";
import MediaStudio from "./components/MediaStudio";
import { ChatSession, Message, Persona } from "./types";
import { PRESET_PERSONAS } from "./data/personas";
import { Compass, Sparkles, SlidersHorizontal, Menu, ChevronLeft } from "lucide-react";

export default function App() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  
  const [workspace, setWorkspace] = useState<"chat" | "editor">("chat");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isApiKeyMissing, setIsApiKeyMissing] = useState(false);

  // Responsive Drawer display states
  const [isSidebarOpenMobile, setIsSidebarOpenMobile] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(true); // Open on desktop by default

  // On Mounting - Load sessions directly from localStorage
  useEffect(() => {
    const raw = localStorage.getItem("gemini_assistant_sessions");
    let loaded: ChatSession[] = [];
    if (raw) {
      try {
        loaded = JSON.parse(raw);
      } catch (e) {
        console.error("Could not parse saved chat configurations, setting defaults.", e);
      }
    }

    if (loaded.length === 0) {
      const defaultSes: ChatSession = {
        id: "default-session-" + Date.now(),
        title: "Welcome Chat",
        messages: [],
        createdAt: new Date().toISOString(),
        model: "gemini-3.5-flash",
        useSearch: false,
        systemInstruction: PRESET_PERSONAS[0].systemInstruction,
        presetPersonaId: PRESET_PERSONAS[0].id,
      };
      loaded = [defaultSes];
    }

    setSessions(loaded);
    setActiveSessionId(loaded[0].id);
  }, []);

  // Sync session states down to localStorage whenever altered
  const saveSessions = (updatedSessions: ChatSession[]) => {
    setSessions(updatedSessions);
    localStorage.setItem("gemini_assistant_sessions", JSON.stringify(updatedSessions));
  };

  const getActiveSession = (): ChatSession | null => {
    return sessions.find((s) => s.id === activeSessionId) || null;
  };

  const activeSession = getActiveSession();

  // Settings modification handlers on active session
  const updateActiveSessionField = <K extends keyof ChatSession>(
    field: K,
    value: ChatSession[K]
  ) => {
    if (!activeSessionId) return;
    const next = sessions.map((s) => {
      if (s.id === activeSessionId) {
        return { ...s, [field]: value };
      }
      return s;
    });
    saveSessions(next);
  };

  const handleSelectPersona = (persona: Persona) => {
    if (!activeSessionId) return;
    const next = sessions.map((s) => {
      if (s.id === activeSessionId) {
        return {
          ...s,
          presetPersonaId: persona.id,
          systemInstruction: persona.systemInstruction,
        };
      }
      return s;
    });
    saveSessions(next);
  };

  const handleCustomInstructionChange = (instruction: string) => {
    if (!activeSessionId) return;
    const next = sessions.map((s) => {
      if (s.id === activeSessionId) {
        // Detect if matches custom setup
        return {
          ...s,
          systemInstruction: instruction,
          presetPersonaId: "custom", // Break standard preset tag
        };
      }
      return s;
    });
    saveSessions(next);
  };

  // Chat conversation actions
  const handleCreateSession = () => {
    const newId = "session-" + Date.now();
    const defaultPersona = PRESET_PERSONAS[0];
    const newSession: ChatSession = {
      id: newId,
      title: `Conversation ${sessions.length + 1}`,
      messages: [],
      createdAt: new Date().toISOString(),
      model: "gemini-3.5-flash",
      useSearch: false,
      systemInstruction: defaultPersona.systemInstruction,
      presetPersonaId: defaultPersona.id,
    };
    const next = [newSession, ...sessions];
    saveSessions(next);
    setActiveSessionId(newId);
    setError(null);
    setIsApiKeyMissing(false);
  };

  const handleDeleteSession = (id: string) => {
    const next = sessions.filter((s) => s.id !== id);
    if (next.length === 0) {
      // Create new fallback if all sessions deleted
      const fallbackId = "session-" + Date.now();
      const defaultPersona = PRESET_PERSONAS[0];
      const fallbackSes: ChatSession = {
        id: fallbackId,
        title: "Welcome Chat",
        messages: [],
        createdAt: new Date().toISOString(),
        model: "gemini-3.5-flash",
        useSearch: false,
        systemInstruction: defaultPersona.systemInstruction,
        presetPersonaId: defaultPersona.id,
      };
      saveSessions([fallbackSes]);
      setActiveSessionId(fallbackId);
    } else {
      saveSessions(next);
      if (activeSessionId === id) {
        setActiveSessionId(next[0].id);
      }
    }
    setError(null);
    setIsApiKeyMissing(false);
  };

  const handleRenameSession = (id: string, newTitle: string) => {
    const next = sessions.map((s) => {
      if (s.id === id) {
        return { ...s, title: newTitle };
      }
      return s;
    });
    saveSessions(next);
  };

  const handleClearThread = () => {
    if (!activeSessionId) return;
    updateActiveSessionField("messages", []);
    setError(null);
    setIsApiKeyMissing(false);
  };

  // Backup handlers
  const handleExportAll = () => {
    try {
      const dataStr = JSON.stringify(sessions, null, 2);
      const blob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.id = "download-backup-anchor";
      link.href = url;
      link.download = `ai_assistant_backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e: any) {
      setError("Failed to generate backup export: " + e.message);
    }
  };

  const handleImportAll = (jsonData: string) => {
    try {
      const parsed = JSON.parse(jsonData);
      if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].id) {
        saveSessions(parsed);
        setActiveSessionId(parsed[0].id);
        setError(null);
        setIsApiKeyMissing(false);
      } else {
        throw new Error("Invalid format. Root must be an array of configured sessions.");
      }
    } catch (e: any) {
      setError("Failed import configuration: " + e.message);
    }
  };

  // Submit messages and fetch recommendations via the server API endpoint
  const handleSendMessage = async (text: string) => {
    if (!activeSession) return;
    
    // 1. Instantly register User prompt on UI
    const userMsg: Message = {
      id: "msg-" + Date.now(),
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
    };

    const currentMessages = [...activeSession.messages];
    const updatedMessagesWithUser = [...currentMessages, userMsg];
    
    // Prepare state
    setIsLoading(true);
    setError(null);
    setIsApiKeyMissing(false);

    // Auto-update conversation title if it was default
    let activeTitle = activeSession.title;
    if (activeSession.title.startsWith("Conversation") || activeSession.title === "Welcome Chat") {
      if (currentMessages.length === 0) {
        activeTitle = text.length > 25 ? text.slice(0, 22) + "..." : text;
      }
    }

    const nextSessions = sessions.map((s) => {
      if (s.id === activeSession.id) {
        return {
          ...s,
          title: activeTitle,
          messages: updatedMessagesWithUser,
        };
      }
      return s;
    });
    saveSessions(nextSessions);

    try {
      // Provide the pre-existing history parsed for alignment
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: text,
          history: currentMessages, // Server endpoint handles mapping
          model: activeSession.model,
          systemInstruction: activeSession.systemInstruction,
          useSearch: activeSession.useSearch,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "A communication failure occurred with the AI server.");
      }

      // Add Assistant response to messaging list
      const assistantMsg: Message = {
        id: "msg-ai-" + Date.now(),
        role: "assistant",
        content: data.text,
        timestamp: new Date().toISOString(),
        groundingChunks: data.groundingChunks,
      };

      const finalSessions = sessions.map((s) => {
        if (s.id === activeSession.id) {
          return {
            ...s,
            messages: [...updatedMessagesWithUser, assistantMsg],
          };
        }
        return s;
      });
      saveSessions(finalSessions);
    } catch (err: any) {
      console.error("API Call error:", err);
      setError(err.message || "An error occurred with our chat gateway.");
      if (err.message.includes("GEMINI_API_KEY") || err.message.toLowerCase().includes("api key missing")) {
        setIsApiKeyMissing(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const activePersona = PRESET_PERSONAS.find(
    (p) => p.id === activeSession?.presetPersonaId
  ) || {
    id: "custom",
    name: "Custom Persona",
    iconName: "Compass",
    description: "Custom system instruction parameters configured.",
    systemInstruction: activeSession?.systemInstruction || "",
    avatarColor: "bg-zinc-950/50 text-zinc-400 border-zinc-900/50",
    accentColor: "border-zinc-500 ring-zinc-500 text-zinc-400",
  };

  return (
    <div id="app-root-container" className="flex h-screen w-screen overflow-hidden bg-[#09090b] text-[#fafafa] font-sans">
      {/* Sidebar: Navigation drawer on desktop */}
      <div className="hidden md:block h-full flex-shrink-0 z-20">
        <Sidebar
          sessions={sessions}
          activeSessionId={activeSessionId}
          onSelectSession={setActiveSessionId}
          onCreateSession={handleCreateSession}
          onDeleteSession={handleDeleteSession}
          onRenameSession={handleRenameSession}
          onExportAll={handleExportAll}
          onImportAll={handleImportAll}
          workspace={workspace}
          onChangeWorkspace={setWorkspace}
        />
      </div>

      {/* Mobile Navigation Drawer overlay */}
      {isSidebarOpenMobile && (
        <div id="mobile-sidebar-overlay" className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 md:hidden flex">
          <div className="relative w-80 h-full max-w-[85vw] bg-[#121214] animate-in slide-in-from-left duration-200">
            <Sidebar
              sessions={sessions}
              activeSessionId={activeSessionId}
              onSelectSession={setActiveSessionId}
              onCreateSession={handleCreateSession}
              onDeleteSession={handleDeleteSession}
              onRenameSession={handleRenameSession}
              onExportAll={handleExportAll}
              onImportAll={handleImportAll}
              workspace={workspace}
              onChangeWorkspace={(ws) => {
                setWorkspace(ws);
                setIsSidebarOpenMobile(false);
              }}
              onCloseMobileSidebar={() => setIsSidebarOpenMobile(false)}
            />
          </div>
          <div className="flex-1" onClick={() => setIsSidebarOpenMobile(false)} />
        </div>
      )}

      {/* Main workspace layout */}
      <div className="flex-1 flex min-w-0 relative">
        {workspace === "editor" ? (
          <MediaStudio />
        ) : activeSession ? (
          <ChatArea
            messages={activeSession.messages}
            isLoading={isLoading}
            error={error}
            isApiKeyMissing={isApiKeyMissing}
            activePersona={activePersona}
            selectedModel={activeSession.model}
            useSearch={activeSession.useSearch}
            onSendMessage={handleSendMessage}
            onClearThread={handleClearThread}
            onToggleSidebarMobile={() => setIsSidebarOpenMobile(true)}
            onToggleSettings={() => setIsSettingsOpen(!isSettingsOpen)}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-[#09090b]">
            <Sparkles className="w-12 h-12 text-[#71717a] animate-pulse mb-3" />
            <h3 className="text-sm font-semibold text-[#fafafa]">No Chat Active</h3>
            <p className="text-xs text-[#71717a] mt-1 mb-4 max-w-xs">
              Load a conversation thread from backup or create a new one to begin chatting.
            </p>
            <button
              onClick={handleCreateSession}
              className="px-4 py-2 text-xs font-semibold text-[#fafafa] bg-[#18181b] hover:bg-[#27272a] border border-[#3f3f46] rounded-lg active:scale-95 transition-all cursor-pointer"
            >
              Start Chat
            </button>
          </div>
        )}

        {/* Collapsible Config Settings Panel */}
        {isSettingsOpen && activeSession && workspace === "chat" && (
          <div id="desktop-settings-container" className="hidden lg:block h-full flex-shrink-0 z-10 animate-in slide-in-from-right duration-200">
            <SettingsPanel
              model={activeSession.model}
              useSearch={activeSession.useSearch}
              systemInstruction={activeSession.systemInstruction}
              presetPersonaId={activeSession.presetPersonaId}
              onChangeModel={(val) => updateActiveSessionField("model", val)}
              onChangeUseSearch={(val) => updateActiveSessionField("useSearch", val)}
              onChangeSystemInstruction={handleCustomInstructionChange}
              onSelectPersona={handleSelectPersona}
              onClose={() => setIsSettingsOpen(false)}
            />
          </div>
        )}

        {/* Mobile slide-over Settings panel */}
        {isSettingsOpen && activeSession && workspace === "chat" && (
          <div id="mobile-settings-overlay" className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-xs z-35 flex justify-end">
            <div className="flex-1" onClick={() => setIsSettingsOpen(false)} />
            <div className="relative w-80 h-full max-w-[85vw] bg-[#121214] shadow-2xl animate-in slide-in-from-right duration-200">
              <SettingsPanel
                model={activeSession.model}
                useSearch={activeSession.useSearch}
                systemInstruction={activeSession.systemInstruction}
                presetPersonaId={activeSession.presetPersonaId}
                onChangeModel={(val) => updateActiveSessionField("model", val)}
                onChangeUseSearch={(val) => updateActiveSessionField("useSearch", val)}
                onChangeSystemInstruction={handleCustomInstructionChange}
                onSelectPersona={handleSelectPersona}
                onClose={() => setIsSettingsOpen(false)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
