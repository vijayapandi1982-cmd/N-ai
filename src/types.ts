export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  groundingChunks?: GroundingChunk[];
}

export interface Persona {
  id: string;
  name: string;
  iconName: string;
  description: string;
  systemInstruction: string;
  avatarColor: string;
  accentColor: string;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string;
  model: string;
  useSearch: boolean;
  systemInstruction: string;
  presetPersonaId?: string;
}
