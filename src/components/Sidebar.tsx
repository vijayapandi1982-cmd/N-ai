import React, { useState, useRef } from "react";
import { 
  Plus, 
  MessageSquare, 
  Trash2, 
  Edit2, 
  Download, 
  Upload, 
  Check, 
  X, 
  Sparkles, 
  Search, 
  MessageCircleQuestion,
  History,
  Sliders,
  Image as ImageIcon,
  Video as VideoIcon,
  Music as MusicIcon
} from "lucide-react";
import { ChatSession } from "../types";

interface SidebarProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onCreateSession: () => void;
  onDeleteSession: (id: string) => void;
  onRenameSession: (id: string, newTitle: string) => void;
  onExportAll: () => void;
  onImportAll: (jsonData: string) => void;
  onCloseMobileSidebar?: () => void;
  workspace: "chat" | "editor";
  onChangeWorkspace: (workspace: "chat" | "editor") => void;
}

export default function Sidebar({
  sessions,
  activeSessionId,
  onSelectSession,
  onCreateSession,
  onDeleteSession,
  onRenameSession,
  onExportAll,
  onImportAll,
  onCloseMobileSidebar,
  workspace,
  onChangeWorkspace,
}: SidebarProps) {
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isMediaPopupOpen, setIsMediaPopupOpen] = useState(false);
  const studioPhotoInputRef = useRef<HTMLInputElement>(null);
  const studioVideoInputRef = useRef<HTMLInputElement>(null);
  const studioAudioInputRef = useRef<HTMLInputElement>(null);

  const handleAddMedia = (type: "photo" | "video" | "audio", file: File) => {
    const url = URL.createObjectURL(file);
    const detail = { type, url, name: file.name };
    
    // Switch to Creative Studio (editor) workspace
    onChangeWorkspace("editor");

    // Close options panel
    setIsMediaPopupOpen(false);

    // Save pending upload globally as buffer
    (window as any).__pendingStudioMedia = detail;

    // Dispatch the custom event safely
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent("add-studio-media", { detail }));
    }, 100);
  };

  const startRename = (session: ChatSession, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSessionId(session.id);
    setEditTitle(session.title);
  };

  const saveRename = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (editTitle.trim()) {
      onRenameSession(id, editTitle.trim());
    }
    setEditingSessionId(null);
  };

  const cancelRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSessionId(null);
  };

  const handleImportChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      if (typeof text === "string") {
        onImportAll(text);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const filteredSessions = sessions.filter((session) =>
    session.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div id="app-sidebar" className="flex flex-col h-full bg-[#121214] border-r border-[#27272a] w-full md:w-80 font-sans text-stone-200">
      {/* Brand Header */}
      <div className="p-6 border-b border-[#27272a]">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <h1 className="font-serif italic text-xl text-[#a1a1aa] font-normal leading-none tracking-tight">N ai</h1>
            <p className="text-[9px] font-mono text-[#52525b] mt-1 tracking-wider">POWERED BY GEMINI</p>
          </div>
          {onCloseMobileSidebar && (
            <button
              id="close-mobile-sidebar-btn"
              onClick={onCloseMobileSidebar}
              className="md:hidden p-1.5 rounded-lg text-[#71717a] hover:bg-[#18181b] hover:text-[#e4e4e7]"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Modern Workspace Selector Tabs */}
      <div className="px-6 pt-5 pb-2 flex flex-col space-y-1.5">
        <span className="text-[9px] font-bold text-[#52525b] uppercase tracking-widest block mb-1">SELECT STUDIO WORKSPACE</span>
        
        {/* Workspace: AI Chat */}
        <button
          onClick={() => onChangeWorkspace("chat")}
          className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
            workspace === "chat"
              ? "bg-[#18181b] text-emerald-400 border-emerald-950/60 shadow-[0_4px_20px_-4px_rgba(16,185,129,0.1)]"
              : "bg-transparent text-[#71717a] border-transparent hover:text-[#fafafa] hover:bg-[#18181b]/30"
          }`}
        >
          <MessageSquare className={`w-4 h-4 ${workspace === "chat" ? "text-emerald-400 animate-pulse" : "text-[#52525b]"}`} />
          <div className="text-left">
            <div className="leading-none">AI Chatbot</div>
            <span className="text-[8px] opacity-60 font-mono">Conversations & Voice</span>
          </div>
        </button>

        {/* Workspace: Creative Studio */}
        <button
          onClick={() => onChangeWorkspace("editor")}
          className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
            workspace === "editor"
              ? "bg-[#18181b] text-indigo-400 border-indigo-950/60 shadow-[0_4px_20px_-4px_rgba(99,102,241,0.1)]"
              : "bg-transparent text-[#71717a] border-transparent hover:text-[#fafafa] hover:bg-[#18181b]/30"
          }`}
        >
          <Sparkles className={`w-4 h-4 ${workspace === "editor" ? "text-indigo-400 animate-pulse" : "text-[#52525b]"}`} />
          <div className="text-left">
            <div className="leading-none">Photo & Video Studio</div>
            <span className="text-[8px] opacity-60 font-mono">Visual Editing & Overlays</span>
          </div>
        </button>
      </div>

      <div className="h-[1px] bg-[#27272a] mx-6 my-2" />

      {/* Primary Action Button */}
      {workspace === "chat" ? (
        <div className="px-6 py-2 select-none">
          <button
            id="btn-new-chat"
            onClick={() => {
              onCreateSession();
              if (onCloseMobileSidebar) onCloseMobileSidebar();
            }}
            className="flex items-center justify-center w-full px-4 py-2.5 space-x-2 text-sm font-medium text-[#edf2f7] bg-[#18181b] hover:bg-[#27272a] border border-[#3f3f46] rounded-lg active:scale-[0.98] transition-all cursor-pointer shadow-none"
          >
            <Plus className="w-4 h-4 text-[#71717a]" />
            <span>New Conversation</span>
          </button>
        </div>
      ) : (
        <div className="px-6 py-2 select-none">
          <div className="bg-indigo-950/10 border border-indigo-900/30 rounded-lg p-3 text-center">
            <p className="text-[10px] font-mono text-indigo-400">Media Compositor Locked</p>
            <p className="text-[9px] text-[#52525b] mt-1 font-sans">Active in Photo & Video workspace panel</p>
          </div>
        </div>
      )}

      {/* Search Input with Integrated Plus Symbol to edit media */}
      <div className="px-6 pb-2 pt-2 relative">
        <div className="relative flex items-center">
          <Search className="absolute left-3 w-3.5 h-3.5 text-[#52525b]" />
          <input
            id="search-chat-input"
            type="text"
            placeholder={workspace === "chat" ? "Search conversations..." : "Search preset catalog..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-10 py-1.5 text-xs text-[#fafafa] bg-[#18181b] border border-[#27272a] rounded-lg placeholder-[#52525b] focus:outline-none focus:border-[#3f3f46]"
          />
          <button
            onClick={() => setIsMediaPopupOpen(!isMediaPopupOpen)}
            className="absolute right-2 p-1.5 rounded-lg text-emerald-400 hover:bg-emerald-950/40 hover:text-emerald-300 transition-colors flex items-center justify-center cursor-pointer"
            title="Tapping here allows you to add videos, photos, and music to edit..."
          >
            <Plus className="w-4 h-4 font-extrabold" />
          </button>
        </div>

        {/* Floating Custom Popover / Dropdown Menu for Studio Media additions */}
        {isMediaPopupOpen && (
          <div className="absolute left-6 right-6 mt-1.5 p-1.5 bg-[#121214] border border-[#27272a] rounded-xl shadow-2xl z-50 flex flex-col space-y-1 animate-in fade-in slide-in-from-top-1 duration-150">
            <div className="px-2.5 py-1 text-[9px] font-mono text-[#52525b] uppercase tracking-wider">
              Import Content to Editor
            </div>
            
            <button
              onClick={() => studioPhotoInputRef.current?.click()}
              className="w-full flex items-center space-x-2 px-2 py-1.5 text-left text-xs text-[#a1a1aa] hover:text-[#fafafa] hover:bg-[#18181b] rounded-lg transition-colors cursor-pointer"
            >
              <ImageIcon className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
              <span>Add Custom Photo / Image</span>
            </button>

            <button
              onClick={() => studioVideoInputRef.current?.click()}
              className="w-full flex items-center space-x-2 px-2 py-1.5 text-left text-xs text-[#a1a1aa] hover:text-[#fafafa] hover:bg-[#18181b] rounded-lg transition-colors cursor-pointer"
            >
              <VideoIcon className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
              <span>Add Custom Video Track</span>
            </button>

            <button
              onClick={() => studioAudioInputRef.current?.click()}
              className="w-full flex items-center space-x-2 px-2 py-1.5 text-left text-xs text-[#a1a1aa] hover:text-[#fafafa] hover:bg-[#18181b] rounded-lg transition-colors cursor-pointer"
            >
              <MusicIcon className="w-3.5 h-3.5 text-pink-400 flex-shrink-0" />
              <span>Add Custom Audio Soundtrack</span>
            </button>
          </div>
        )}

        {/* Hidden inputs to capture uploaded custom assets */}
        <input
          ref={studioPhotoInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleAddMedia("photo", file);
          }}
        />
        <input
          ref={studioVideoInputRef}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleAddMedia("video", file);
          }}
        />
        <input
          ref={studioAudioInputRef}
          type="file"
          accept="audio/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleAddMedia("audio", file);
          }}
        />
      </div>

      {/* Chat Histories List */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1">
        {workspace === "chat" ? (
          <>
            <div className="pb-3 text-[10px] uppercase tracking-[0.1em] font-bold text-[#52525b] flex items-center gap-1.5">
              <History className="w-3.5 h-3.5" />
              <span>Recent History</span>
            </div>
        {filteredSessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center px-4">
            <MessageCircleQuestion className="w-8 h-8 text-[#3f3f46] mb-1.5" />
            <p className="text-xs text-[#52525b]">
              {searchTerm ? "No sessions match search" : "No recent conversations"}
            </p>
          </div>
        ) : (
          filteredSessions.map((session) => {
            const isActive = session.id === activeSessionId;
            const isEditing = session.id === editingSessionId;

            return (
              <div
                id={`session-item-${session.id}`}
                key={session.id}
                onClick={() => {
                  onSelectSession(session.id);
                  if (onCloseMobileSidebar) onCloseMobileSidebar();
                }}
                className={`group flex items-center justify-between px-3 py-2 border rounded-lg cursor-pointer transition-colors relative select-none ${
                  isActive
                    ? "bg-[#18181b] border-[#27272a] text-[#e4e4e7]"
                    : "text-[#71717a] border-transparent hover:bg-[#18181b]/40 hover:text-[#d4d4d8]"
                }`}
              >
                <div className="flex items-center space-x-2.5 w-full min-w-0">
                  <MessageSquare className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? "text-[#a1a1aa]" : "text-[#52525b]"}`} />
                  
                  {isEditing ? (
                    <input
                      id={`rename-input-${session.id}`}
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          onRenameSession(session.id, editTitle);
                          setEditingSessionId(null);
                        } else if (e.key === "Escape") {
                          setEditingSessionId(null);
                        }
                      }}
                      className="w-full px-1 py-0.5 text-xs text-[#fafafa] bg-[#09090b] border border-[#3f3f46] rounded focus:outline-none"
                      autoFocus
                    />
                  ) : (
                    <span className="text-[13px] truncate pr-8">
                      {session.title}
                    </span>
                  )}
                </div>

                {/* Overlaid edit/delete actions, showing on row hover */}
                {!isEditing && (
                  <div className="absolute right-2 opacity-0 group-hover:opacity-100 flex items-center space-x-1 pl-4 py-1 rounded-r-lg bg-gradient-to-l from-[#18181b]/95 via-[#18181b] to-transparent transition-opacity">
                    <button
                      id={`btn-edit-${session.id}`}
                      onClick={(e) => startRename(session, e)}
                      title="Rename"
                      className="p-1 rounded text-[#71717a] hover:text-[#e4e4e7] hover:bg-[#27272a]"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      id={`btn-delete-${session.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteSession(session.id);
                      }}
                      title="Delete"
                      className="p-1 rounded text-[#71717a] hover:text-red-400 hover:bg-red-950/20"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {isEditing && (
                  <div className="flex items-center space-x-1 flex-shrink-0 z-10">
                    <button
                      id={`btn-save-rename-${session.id}`}
                      onClick={(e) => saveRename(session.id, e)}
                      className="p-1 rounded text-emerald-400 hover:bg-emerald-950/20"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      id={`btn-cancel-rename-${session.id}`}
                      onClick={cancelRename}
                      className="p-1 rounded text-red-400 hover:bg-red-950/20"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center px-4 space-y-2 select-none">
            <Sparkles className="w-8 h-8 text-indigo-400 animate-pulse" />
            <p className="text-xs text-[#a1a1aa] font-medium">Creative Studio Active</p>
            <p className="text-[10px] text-[#52525b] max-w-xs font-sans leading-relaxed">
              Adjust filters, load soundtracks, apply AI styles, or test orientation scales on the main stage.
            </p>
          </div>
        )}
      </div>

      {/* Backup and Utility Config Toolbar */}
      <div className="p-4 border-t border-[#27272a] bg-[#09090b] space-y-3">
        <div className="text-[10px] font-semibold text-[#52525b] tracking-wide uppercase">Backup & Sync</div>
        <div className="grid grid-cols-2 gap-2">
          <button
            id="export-chats-btn"
            onClick={onExportAll}
            className="flex items-center justify-center space-x-1.5 w-full px-2 py-1.5 text-xs font-medium text-[#c5c5d2] bg-[#121214] border border-[#27272a] rounded-lg hover:bg-[#18181b] hover:text-[#fafafa] cursor-pointer transition-all"
            title="Export chat backups as human-readable JSON"
          >
            <Download className="w-3.5 h-3.5 text-[#71717a]" />
            <span>Export</span>
          </button>
          <button
            id="import-chats-btn"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center space-x-1.5 w-full px-2 py-1.5 text-xs font-medium text-[#c5c5d2] bg-[#121214] border border-[#27272a] rounded-lg hover:bg-[#18181b] hover:text-[#fafafa] cursor-pointer transition-all"
            title="Import configuration JSON exports"
          >
            <Upload className="w-3.5 h-3.5 text-[#71717a]" />
            <span>Import</span>
          </button>
          <input
            id="import-chats-input"
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImportChange}
            className="hidden"
          />
        </div>
        <div className="text-[11px] text-[#3f3f46] tracking-wide pt-1">
          Gemini Connected
        </div>
      </div>
    </div>
  );
}
