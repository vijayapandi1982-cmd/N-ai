import React from "react";
import { 
  Sparkles, 
  Code2, 
  PenLine, 
  Scale, 
  GraduationCap, 
  Globe, 
  Cpu, 
  SlidersHorizontal,
  X,
  Info
} from "lucide-react";
import { PRESET_PERSONAS } from "../data/personas";
import { Persona } from "../types";

export function getPersonaIcon(iconName: string, className = "w-4 h-4") {
  switch (iconName) {
    case "Sparkles": return <Sparkles className={className} />;
    case "Code2": return <Code2 className={className} />;
    case "PenLine": return <PenLine className={className} />;
    case "Scale": return <Scale className={className} />;
    case "GraduationCap": return <GraduationCap className={className} />;
    default: return <Sparkles className={className} />;
  }
}

interface SettingsPanelProps {
  model: string;
  useSearch: boolean;
  systemInstruction: string;
  presetPersonaId?: string;
  onChangeModel: (model: string) => void;
  onChangeUseSearch: (useSearch: boolean) => void;
  onChangeSystemInstruction: (instruction: string) => void;
  onSelectPersona: (persona: Persona) => void;
  onClose?: () => void;
}

export default function SettingsPanel({
  model,
  useSearch,
  systemInstruction,
  presetPersonaId,
  onChangeModel,
  onChangeUseSearch,
  onChangeSystemInstruction,
  onSelectPersona,
  onClose,
}: SettingsPanelProps) {
  return (
    <div id="settings-panel" className="bg-[#121214] border-l border-[#27272a] h-full flex flex-col w-full md:w-80 text-[#fafafa] font-sans">
      {/* Settings Header */}
      <div className="p-4 border-b border-[#27272a] flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <SlidersHorizontal className="w-4 h-4 text-[#a1a1aa]" />
          <h2 className="text-sm font-semibold text-[#e4e4e7]">Assistant Configuration</h2>
        </div>
        {onClose && (
          <button
            id="close-settings-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#71717a] hover:bg-[#18181b] hover:text-[#fafafa] cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Model Setup */}
        <div className="space-y-2">
          <div className="flex items-center space-x-1.5 text-xs font-semibold text-[#52525b] uppercase tracking-widest">
            <Cpu className="w-3.5 h-3.5 text-[#52525b]" />
            <span>AI Model Selection</span>
          </div>
          <div className="relative">
            <select
              id="select-model-dropdown"
              value={model}
              onChange={(e) => onChangeModel(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-[#18181b] border border-[#27272a] rounded-lg text-[#fafafa] focus:outline-none focus:border-[#3f3f46] cursor-pointer"
            >
              <option value="gemini-3.5-flash">Gemini 3.5 Flash (Default)</option>
              <option value="gemini-3.1-flash-lite">Gemini 3.1 Flash Lite</option>
            </select>
          </div>
          <p className="text-[10px] text-[#52525b] leading-relaxed font-sans mt-1">
            Gemini 3.5 Flash is recommended for general reasoning and fast answers.
          </p>
        </div>

        {/* Web Search Feature */}
        <div className="p-3.5 bg-[#18181b] rounded-xl border border-[#27272a] space-y-2.5">
          <div className="flex items-start justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center space-x-1.5 text-xs font-semibold text-[#fafafa]">
                <Globe className="w-4 h-4 text-[#a1a1aa]" />
                <span>Google Search Grounding</span>
              </div>
              <p className="text-[10px] text-[#71717a] leading-relaxed">
                Empower the assistant of searching contemporary live web data to return fresh citations and links.
              </p>
            </div>
            <button
              id="toggle-search-grounding"
              type="button"
              onClick={() => onChangeUseSearch(!useSearch)}
              className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                useSearch ? "bg-emerald-600" : "bg-[#27272a]"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  useSearch ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Preset Personas Option */}
        <div className="space-y-2.5">
          <div className="text-xs font-semibold text-[#52525b] uppercase tracking-widest">
            Prebuilt Personas
          </div>
          <div className="grid grid-cols-1 gap-2">
            {PRESET_PERSONAS.map((persona) => {
              const isSelected = presetPersonaId === persona.id;
              return (
                <button
                  id={`persona-btn-${persona.id}`}
                  key={persona.id}
                  onClick={() => onSelectPersona(persona)}
                  className={`flex items-start p-2.5 rounded-xl text-left border text-xs transition-all cursor-pointer ${
                    isSelected
                      ? "border-[#3f3f46] bg-[#1a1a1e] shadow-sm text-[#fafafa]"
                      : "border-[#27272a] hover:border-[#3f3f46] hover:bg-[#18181b]/50 text-[#a1a1aa]"
                  }`}
                >
                  <div className={`p-1.5 rounded-lg mr-2.5 flex-shrink-0 border ${persona.avatarColor}`}>
                    {getPersonaIcon(persona.iconName, "w-4 h-4")}
                  </div>
                  <div>
                    <div className="font-semibold text-[#e4e4e7]">{persona.name}</div>
                    <div className="text-[10px] text-[#71717a] mt-0.5 line-clamp-2">
                      {persona.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Persona Instruction */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-[#52525b] uppercase tracking-widest">
            <span>System Instruction</span>
            {presetPersonaId && presetPersonaId !== "custom" && (
              <span className="text-[10px] font-sans font-normal text-emerald-400 bg-emerald-950/30 px-1.5 py-0.5 rounded">
                Preset Locked
              </span>
            )}
          </div>
          <div>
            <textarea
              id="system-instruction-textarea"
              rows={4}
              value={systemInstruction}
              onChange={(e) => onChangeSystemInstruction(e.target.value)}
              placeholder="Inject custom instructions to shape assistant personality..."
              className="w-full p-2.5 text-xs bg-[#18181b] border border-[#27272a] rounded-lg text-[#fafafa] focus:outline-none focus:border-[#3f3f46] font-sans resize-y"
            />
          </div>
          <div className="flex items-start space-x-1 p-2 bg-neutral-900 border border-neutral-800 rounded-lg">
            <Info className="w-3.5 h-3.5 text-[#a1a1aa] flex-shrink-0 mt-0.5" />
            <p className="text-[10px] text-[#71717a] leading-relaxed">
              Modifying instructions directly shifts the active mode to a &quot;Custom Persona&quot; setup.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
