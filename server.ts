import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "5mb" }));

// Lazy initializer for the Google GenAI client
let aiInstance: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is missing. Please add it in the Secrets panel on AI Studio (Settings > Secrets).");
  }
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiInstance;
}

// REST Endpoint to communicate with Gemini
app.post("/api/chat", async (req, res): Promise<any> => {
  try {
    const { message, history, model, systemInstruction, useSearch } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const ai = getGeminiClient();

    // Map frontend rules to standard user/model content parts
    // Aligning roles: user -> "user", assistant/ai/model -> "model"
    const contents: any[] = [];
    
    // Add existing history
    if (Array.isArray(history)) {
      history.forEach((msg: any) => {
        const role = msg.role === "user" ? "user" : "model";
        contents.push({
          role,
          parts: [{ text: msg.content }],
        });
      });
    }

    // Add current message
    contents.push({
      role: "user",
      parts: [{ text: message }],
    });

    let activeModel = model || "gemini-3.5-flash";

    // Build model configuration
    const config: any = {};
    if (systemInstruction) {
      config.systemInstruction = systemInstruction;
    }
    if (useSearch) {
      config.tools = [{ googleSearch: {} }];
    }

    let response: any;
    let attempts = 0;
    const maxAttempts = 2;

    while (attempts < maxAttempts) {
      try {
        response = await ai.models.generateContent({
          model: activeModel,
          contents,
          config,
        });
        break; // Successful call!
      } catch (err: any) {
        attempts++;
        const errorMessage = typeof err === "object" && err !== null && err.message 
          ? err.message 
          : String(err || "");

        const isQuotaError = errorMessage.includes("429") || 
                             errorMessage.includes("RESOURCE_EXHAUSTED") || 
                             errorMessage.includes("quota") || 
                             errorMessage.includes("limit");

        if (isQuotaError && attempts < maxAttempts) {
          console.warn(`Transient rate limit hit. Retrying attempt ${attempts}/${maxAttempts} in 1.5 seconds...`);
          await new Promise((resolve) => setTimeout(resolve, 1500));
          continue;
        }

        // If rate limits persist and we aren't already on the Lite model,
        // attempt a final fallback call to the lightweight gemini-3.1-flash-lite
        if (isQuotaError && activeModel !== "gemini-3.1-flash-lite") {
          console.warn(`Quota exhausted for ${activeModel}. Initiating automatic fallback to gemini-3.1-flash-lite...`);
          try {
            // Simplify configuration (disable expensive web grounding tools to clear quota constraints)
            const fallbackConfig = { ...config };
            if (fallbackConfig.tools) {
              delete fallbackConfig.tools;
            }
            response = await ai.models.generateContent({
              model: "gemini-3.1-flash-lite",
              contents,
              config: fallbackConfig,
            });
            break; // Fallback succeeded!
          } catch (fallbackErr: any) {
            console.error("Lite fallback also failed:", fallbackErr);
            throw err; // Throw the original error or the primary error
          }
        }

        throw err;
      }
    }

    const text = response.text || "";
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    return res.json({
      text,
      groundingChunks,
    });
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    let errorMessage = typeof error === "object" && error !== null && error.message 
      ? error.message 
      : String(error || "An unknown error occurred during resource generation.");

    // Detect if it is a quota limit / rate limit 429 issue
    const isQuotaError = errorMessage.includes("429") || 
                         errorMessage.includes("RESOURCE_EXHAUSTED") || 
                         errorMessage.includes("quota") || 
                         errorMessage.includes("limit") ||
                         errorMessage.includes("rate-limiting");

    if (isQuotaError) {
      errorMessage = "Gemini API Quota / Rate-Limit Exceeded (Error 429 - RESOURCE_EXHAUSTED).\n\n" +
                     "Your active API Key has exhausted its standard requests limit. " +
                     "This occurs if you are on the Gemini Free Tier (which typically enforces limits like 15 Requests Per Minute).\n\n" +
                     "To resolve this issue:\n" +
                     "• Switch to a faster/lighter model: Click the Settings (sliders icon in the top right) and change the active AI Model to \"Gemini 3.1 Flash Lite\" (this model uses fewer credentials limits).\n" +
                     "• Wait 60 seconds and try to send your prompt again.\n" +
                     "• Add a custom GEMINI_API_KEY with elevated quotas under the bottom bar's Secrets panel.";
    }

    return res.status(isQuotaError ? 429 : 500).json({ 
      error: errorMessage,
      isApiKeyMissing: errorMessage.includes("GEMINI_API_KEY") || errorMessage.includes("API key not found")
    });
  }
});

// Setup dev and production static delivery
async function setupServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

setupServer().catch((err) => {
  console.error("Vite server initialization failed:", err);
});
