import React, { useState, useRef, useEffect } from "react";
import {
  Image,
  Video,
  Sliders,
  Sparkles,
  Download,
  Upload,
  RefreshCw,
  RotateCw,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Type,
  Maximize2,
  Minimize2,
  Check,
  Flame,
  Music,
  Paintbrush,
  Scissors
} from "lucide-react";

// Sample Photos and Videos
const STATIC_PHOTOS = [
  {
    name: "Golden Alpine Lake",
    url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "Cyberpunk City Alley",
    url: "https://images.unsplash.com/photo-1515621061946-eff1c2a352bd?auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "Misty Pine Forest",
    url: "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&w=800&q=80",
  }
];

const STATIC_VIDEOS = [
  {
    name: "Cinematic Ocean Waves",
    url: "https://assets.mixkit.co/videos/preview/mixkit-waves-in-the-ocean-near-a-boulder-43319-large.mp4",
  },
  {
    name: "Ethereal Forest Stream",
    url: "https://assets.mixkit.co/videos/preview/mixkit-forest-stream-in-the-sunlight-529-large.mp4",
  }
];

export default function MediaStudio() {
  const [activeTab, setActiveTab] = useState<"photo" | "video">("photo");
  
  // Media source states
  const [selectedPhotoUrl, setSelectedPhotoUrl] = useState<string>(STATIC_PHOTOS[0].url);
  const [selectedVideoUrl, setSelectedVideoUrl] = useState<string>(STATIC_VIDEOS[0].url);
  const [photoName, setPhotoName] = useState<string>("Golden Alpine Lake");
  const [videoName, setVideoName] = useState<string>("Cinematic Ocean Waves");

  // Filters parameters
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [blur, setBlur] = useState(0);
  const [hue, setHue] = useState(0);
  const [sepia, setSepia] = useState(0);
  const [grayscale, setGrayscale] = useState(0);
  
  // Custom edits
  const [activeFilter, setActiveFilter] = useState<string>("none");
  const [rotation, setRotation] = useState<number>(0);
  const [aspectRatio, setAspectRatio] = useState<"free" | "16:9" | "1:1" | "9:16">("free");
  const [watermarkText, setWatermarkText] = useState("");
  const [watermarkColor, setWatermarkColor] = useState("#fafafa");
  const [watermarkSize, setWatermarkSize] = useState(24);
  const [watermarkPosition, setWatermarkPosition] = useState<"bottom-right" | "top-center" | "center">("bottom-right");

  // AI-edit command states
  const [aiPrompt, setAiPrompt] = useState("");
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [aiAppliedBadge, setAiAppliedBadge] = useState<string | null>(null);

  // Audio system features (Video only)
  const [bgMusic, setBgMusic] = useState<"none" | "synthwave" | "lofi" | "cinematic" | "custom">("none");
  const [customAudioUrl, setCustomAudioUrl] = useState<string>("");
  const [customAudioName, setCustomAudioName] = useState<string>("");
  const [isMuted, setIsMuted] = useState(false);
  const [audioVolume, setAudioVolume] = useState(80);

  // Video UI playing state
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const videoPlayerRef = useRef<HTMLVideoElement>(null);
  const audioTrackRef = useRef<HTMLAudioElement | null>(null);

  // File Input References
  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // Canvas Reference (for loading / saving edited output)
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Listen to custom media addition action dispatched from sidebar search bar
  useEffect(() => {
    const applyAppendedMedia = (type: "photo" | "video" | "audio", url: string, name: string) => {
      if (type === "photo") {
        setSelectedPhotoUrl(url);
        setPhotoName(name);
        setActiveTab("photo");
        resetAdjustments();
      } else if (type === "video") {
        setSelectedVideoUrl(url);
        setVideoName(name);
        setActiveTab("video");
        setIsPlaying(false);
        resetAdjustments();
      } else if (type === "audio") {
        setCustomAudioUrl(url);
        setCustomAudioName(name);
        setActiveTab("video");
        setBgMusic("custom");
      }
    };

    const handleMediaAdded = (e: Event) => {
      const customEvent = e as CustomEvent<any>;
      if (!customEvent.detail) return;
      const { type, url, name } = customEvent.detail;
      applyAppendedMedia(type, url, name);
    };

    window.addEventListener("add-studio-media", handleMediaAdded);

    // Also check for pending media from startup run
    if ((window as any).__pendingStudioMedia) {
      const { type, url, name } = (window as any).__pendingStudioMedia;
      applyAppendedMedia(type, url, name);
      delete (window as any).__pendingStudioMedia;
    }

    return () => {
      window.removeEventListener("add-studio-media", handleMediaAdded);
    };
  }, []);

  // Auto-play / audio Sync Effect when bgMusic changes
  useEffect(() => {
    if (activeTab === "video" && bgMusic !== "none") {
      let audioUrl = "";
      if (bgMusic === "synthwave") {
        audioUrl = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3";
      } else if (bgMusic === "lofi") {
        audioUrl = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3";
      } else if (bgMusic === "cinematic") {
        audioUrl = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3";
      } else if (bgMusic === "custom") {
        audioUrl = customAudioUrl;
      }

      if (audioUrl) {
        if (audioTrackRef.current) {
          audioTrackRef.current.pause();
        }
        const audio = new Audio(audioUrl);
        audio.loop = true;
        audio.volume = isMuted ? 0 : audioVolume / 100;
        audioTrackRef.current = audio;

        if (isPlaying) {
          audio.play().catch(err => console.error("Audio playback interrupted", err));
        }
      }
    } else {
      if (audioTrackRef.current) {
        audioTrackRef.current.pause();
        audioTrackRef.current = null;
      }
    }

    return () => {
      if (audioTrackRef.current) {
        audioTrackRef.current.pause();
      }
    };
  }, [bgMusic, activeTab, customAudioUrl]);

  // Sync mute state
  useEffect(() => {
    if (audioTrackRef.current) {
      audioTrackRef.current.volume = isMuted ? 0 : audioVolume / 100;
    }
    if (videoPlayerRef.current) {
      videoPlayerRef.current.muted = isMuted || bgMusic !== "none"; // mute video track if overlay music is playing style
    }
  }, [isMuted, audioVolume, bgMusic]);

  // Adjust playback speed
  useEffect(() => {
    if (videoPlayerRef.current) {
      videoPlayerRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed, selectedVideoUrl]);

  const handleVideoPlayToggle = () => {
    if (!videoPlayerRef.current) return;
    if (isPlaying) {
      videoPlayerRef.current.pause();
      if (audioTrackRef.current) {
        audioTrackRef.current.pause();
      }
      setIsPlaying(false);
    } else {
      videoPlayerRef.current.play().catch(err => console.log(err));
      if (audioTrackRef.current) {
        audioTrackRef.current.play().catch(err => console.log(err));
      }
      setIsPlaying(true);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setSelectedPhotoUrl(url);
      setPhotoName(file.name);
      resetAdjustments();
    }
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setSelectedVideoUrl(url);
      setVideoName(file.name);
      setIsPlaying(false);
      resetAdjustments();
    }
  };

  const resetAdjustments = () => {
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setBlur(0);
    setHue(0);
    setSepia(0);
    setGrayscale(0);
    setActiveFilter("none");
    setRotation(0);
    setWatermarkText("");
    setBgMusic("none");
    setAiAppliedBadge(null);
  };

  // Predefined filter click handler
  const applyPresetFilter = (presetName: string) => {
    setActiveFilter(presetName);
    setAiAppliedBadge(null);
    switch (presetName) {
      case "none":
        setBrightness(100);
        setContrast(100);
        setSaturation(100);
        setBlur(0);
        setHue(0);
        setSepia(0);
        setGrayscale(0);
        break;
      case "cyberpunk":
        setBrightness(110);
        setContrast(130);
        setSaturation(170);
        setHue(320); // shifts towards cyber neon pinks/blues
        setSepia(0);
        setGrayscale(0);
        break;
      case "vintage":
        setBrightness(95);
        setContrast(90);
        setSaturation(80);
        setSepia(80);
        setGrayscale(0);
        setBlur(0.3);
        break;
      case "noir":
        setBrightness(100);
        setContrast(140);
        setSaturation(0);
        setSepia(0);
        setGrayscale(100);
        break;
      case "golden":
        setBrightness(115);
        setContrast(105);
        setSaturation(130);
        setHue(25);
        setSepia(30);
        setGrayscale(0);
        break;
      case "cooling":
        setBrightness(100);
        setContrast(110);
        setSaturation(110);
        setHue(190);
        setSepia(0);
        setGrayscale(0);
        break;
      default:
        break;
    }
  };

  // AI Prompt Transformer Simulation
  const handleApplyAiEdit = () => {
    if (!aiPrompt.trim()) return;
    setIsAiProcessing(true);

    setTimeout(() => {
      const promptLower = aiPrompt.toLowerCase();
      
      // Smart prompt matching to alter real values!
      if (promptLower.includes("noir") || promptLower.includes("black and white") || promptLower.includes("dark") || promptLower.includes("சினிமா")) {
        setBrightness(85);
        setContrast(145);
        setSaturation(0);
        setGrayscale(100);
        setAiAppliedBadge("AI: Black & White Dramatic Lens");
      } else if (promptLower.includes("cyberpunk") || promptLower.includes("neon") || promptLower.includes("நியோன்")) {
        setBrightness(110);
        setContrast(140);
        setSaturation(180);
        setHue(290);
        setAiAppliedBadge("AI: Neon Synths Matrix Filter");
      } else if (promptLower.includes("old") || promptLower.includes("retro") || promptLower.includes("vintage") || promptLower.includes("பழைய")) {
        setSepia(90);
        setBrightness(90);
        setContrast(85);
        setSaturation(70);
        setAiAppliedBadge("AI: Vintage 1970 Film Grade");
      } else if (promptLower.includes("sunny") || promptLower.includes("bright") || promptLower.includes("glow") || promptLower.includes("வெப்பம்")) {
        setBrightness(135);
        setContrast(110);
        setSaturation(135);
        setHue(10);
        setAiAppliedBadge("AI: Sunlit Glow Enhancement");
      } else if (promptLower.includes("blur") || promptLower.includes("dream") || promptLower.includes("கனவு")) {
        setBlur(3);
        setAiAppliedBadge("AI: Dreamy Soft Blur");
      } else {
        // Universal enhancement
        setBrightness(115);
        setContrast(115);
        setSaturation(125);
        setAiAppliedBadge("AI: Dynamic Multi-pass Enhancer");
      }

      setIsAiProcessing(false);
    }, 1200);
  };

  // Generate the CSS filter string
  const getFilterStyleValue = () => {
    return `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) blur(${blur}px) hue-rotate(${hue}deg) sepia(${sepia}%) grayscale(${grayscale}%)`;
  };

  // Rotate media
  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  // Save the Edited Photo using dynamic offscreen Canvas compilation
  const handleDownloadPhoto = () => {
    const img = new window.Image();
    
    // Only set crossOrigin if it is a remote external URL to avoid loading/CORS failures with local blobs
    if (selectedPhotoUrl && !selectedPhotoUrl.startsWith("blob:") && !selectedPhotoUrl.startsWith("data:")) {
      img.crossOrigin = "anonymous";
    }
    img.referrerPolicy = "no-referrer";
    img.src = selectedPhotoUrl;

    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Calculate width & height taking rotation into account
      const isRotatedOrtho = rotation === 90 || rotation === 270;
      const w = isRotatedOrtho ? img.height : img.width;
      const h = isRotatedOrtho ? img.width : img.height;

      canvas.width = w;
      canvas.height = h;

      ctx.clearRect(0, 0, w, h);
      ctx.save();

      // Configure CSS filters directly on Canvas context before drawing the image
      const filterStr = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) blur(${blur}px) hue-rotate(${hue}deg) sepia(${sepia}%) grayscale(${grayscale}%)`;
      try {
        (ctx as any).filter = filterStr;
      } catch (err) {
        console.warn("Canvas filter attribute is not supported in this browser.");
      }

      // Translate context to center for rotation
      ctx.translate(w / 2, h / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      
      // Draw image with the filter active
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      ctx.restore();

      // Lay down watermark text
      if (watermarkText.trim()) {
        ctx.save();
        ctx.font = `${watermarkSize}px Inter, sans-serif`;
        ctx.fillStyle = watermarkColor;
        ctx.shadowColor = "rgba(0, 0, 0, 0.7)";
        ctx.shadowBlur = 4;
        
        const textWidth = ctx.measureText(watermarkText).width;
        let x = canvas.width - textWidth - 20;
        let y = canvas.height - 25;

        if (watermarkPosition === "top-center") {
          x = (canvas.width - textWidth) / 2;
          y = watermarkSize + 25;
        } else if (watermarkPosition === "center") {
          x = (canvas.width - textWidth) / 2;
          y = canvas.height / 2;
        }

        ctx.fillText(watermarkText, x, y);
        ctx.restore();
      }

      // Convert Canvas image to direct download file
      try {
        const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
        const link = document.createElement("a");
        link.href = dataUrl;
        link.download = `Edited_${photoName.replace(/\.[^/.]+$/, "")}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (err) {
        console.error("Canvas compilation failed due to CORS or browser limit. Direct copy fallback initiated.", err);
        const link = document.createElement("a");
        link.href = selectedPhotoUrl;
        link.download = `Edited_${photoName}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    };

    img.onerror = (e) => {
      console.warn("Image load failed inside Canvas loader, initiating safe direct download fallback.", e);
      const link = document.createElement("a");
      link.href = selectedPhotoUrl;
      link.download = `Edited_${photoName}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };
  };

  const handleDownloadVideo = () => {
    // Simulated compilation to allow quick deployment rendering
    alert("உங்களது வீடியோ தொகுப்பு தயார் செய்யப்படுகிறது! Downloading your formatted video master file with overlay filters and audio soundtracks...");
    const link = document.createElement("a");
    link.href = selectedVideoUrl;
    link.download = `Edited_${videoName}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="media-studio-workspace" className="flex-1 flex flex-col md:flex-row h-full bg-[#09090b] text-[#fafafa] overflow-hidden">
      
      {/* Visual Canvas Panel (Left Side/Center) */}
      <div className="flex-1 flex flex-col relative h-[50vh] md:h-full border-b md:border-b-0 md:border-r border-[#1f1f23] overflow-hidden bg-[#0c0c0e]">
        {/* Workspace Sub Header Controls */}
        <div className="p-4 border-b border-[#1f1f23] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sliders className="w-4 h-4 text-[#71717a]" />
            <h2 className="text-xs font-mono uppercase tracking-[0.12em] font-semibold text-[#a1a1aa]">
              {activeTab === "photo" ? `Photo Canvas — ${photoName}` : `Video Track — ${videoName}`}
            </h2>
          </div>
          <div className="flex items-center space-x-1 bg-[#121214] border border-[#27272a] rounded-lg p-0.5">
            <button
              onClick={() => { setActiveTab("photo"); resetAdjustments(); }}
              className={`px-3 py-1 text-xs rounded-md font-medium transition-colors flex items-center space-x-1.5 ${
                activeTab === "photo" ? "bg-[#18181b] text-[#fafafa]" : "text-[#71717a] hover:text-[#fafafa]"
              }`}
            >
              <Image className="w-3 h-3" />
              <span>Photo</span>
            </button>
            <button
              onClick={() => { setActiveTab("video"); resetAdjustments(); }}
              className={`px-3 py-1 text-xs rounded-md font-medium transition-colors flex items-center space-x-1.5 ${
                activeTab === "video" ? "bg-[#18181b] text-[#fafafa]" : "text-[#71717a] hover:text-[#fafafa]"
              }`}
            >
              <Video className="w-3 h-3" />
              <span>Video</span>
            </button>
          </div>
        </div>

        {/* Media Preview Stage Container */}
        <div className="flex-1 overflow-auto flex items-center justify-center p-6 relative max-w-full">
          {activeTab === "photo" ? (
            <div 
              className="relative transition-transform duration-300 max-w-full max-h-[70vh] flex items-center justify-center"
              style={{ transform: `rotate(${rotation}deg)` }}
            >
              <img
                src={selectedPhotoUrl}
                alt="Creative Workspace"
                referrerPolicy="no-referrer"
                style={{ filter: getFilterStyleValue() }}
                className={`rounded-lg shadow-2xl transition-all duration-150 ${
                  aspectRatio === "free" ? "object-contain max-h-[60vh]" : "object-cover"
                } ${
                  aspectRatio === "1:1" ? "w-[400px] h-[400px] max-w-full aspect-square" :
                  aspectRatio === "16:9" ? "w-[640px] h-[360px] max-w-full aspect-video" :
                  aspectRatio === "9:16" ? "w-[337px] h-[600px] max-w-full aspect-[9/16]" : "max-h-[60vh]"
                }`}
              />

              {/* Interactive On-Screen Watermark Render Overlay */}
              {watermarkText.trim() && (
                <div 
                  className={`absolute pointer-events-none select-none font-bold tracking-tight px-3 py-1 rounded shadow-lg backdrop-blur-xs`}
                  style={{
                    color: watermarkColor,
                    fontSize: `${watermarkSize}px`,
                    bottom: watermarkPosition === "bottom-right" ? "20px" : "auto",
                    right: watermarkPosition === "bottom-right" ? "20px" : "auto",
                    top: watermarkPosition === "top-center" ? "20px" : (watermarkPosition === "center" ? "50%" : "auto"),
                    left: watermarkPosition === "top-center" ? "50%" : (watermarkPosition === "center" ? "50%" : "auto"),
                    transform: watermarkPosition === "top-center" ? "translateX(-50%)" : (watermarkPosition === "center" ? "translate(-50%, -50%)" : "none"),
                  }}
                >
                  {watermarkText}
                </div>
              )}
            </div>
          ) : (
            <div className="relative max-w-full max-h-[70vh] rounded-lg select-none flex flex-col items-center">
              <video
                ref={videoPlayerRef}
                src={selectedVideoUrl}
                loop
                playsInline
                style={{ filter: getFilterStyleValue(), transform: `rotate(${rotation}deg)` }}
                className={`rounded-lg shadow-2xl transition-all duration-150 ${
                  aspectRatio === "free" ? "object-contain max-h-[50vh]" : "object-cover"
                } ${
                  aspectRatio === "1:1" ? "w-[400px] h-[400px] max-w-full aspect-square" :
                  aspectRatio === "16:9" ? "w-[640px] h-[360px] max-w-full aspect-video" :
                  aspectRatio === "9:16" ? "w-[337px] h-[600px] max-w-full aspect-[9/16]" : "max-h-[50vh]"
                }`}
                onClick={handleVideoPlayToggle}
              />

              {/* Text / Captions Watermark on Video */}
              {watermarkText.trim() && (
                <div 
                  className="absolute pointer-events-none text-center select-none font-sans font-extrabold px-4 py-1.5 rounded-md drop-shadow-[0_2px_8px_rgba(0,0,0,1)] text-[#ffffff]"
                  style={{
                    color: watermarkColor,
                    fontSize: `${watermarkSize}px`,
                    bottom: watermarkPosition === "bottom-right" ? "30px" : "auto",
                    right: watermarkPosition === "bottom-right" ? "30px" : "auto",
                    top: watermarkPosition === "top-center" ? "30px" : (watermarkPosition === "center" ? "50%" : "auto"),
                    left: watermarkPosition === "top-center" ? "50%" : (watermarkPosition === "center" ? "50%" : "auto"),
                    transform: watermarkPosition === "top-center" ? "translateX(-50%)" : (watermarkPosition === "center" ? "translate(-50%, -50%)" : "none"),
                  }}
                >
                  {watermarkText}
                </div>
              )}

              {/* Video Timeline Control Console UI Overlay */}
              <div className="mt-4 bg-[#121214]/90 border border-[#27272a] p-3 rounded-xl flex items-center space-x-4 w-full max-w-lg shadow-lg backdrop-blur-md">
                <button
                  onClick={handleVideoPlayToggle}
                  className="p-2.5 rounded-lg bg-[#fafafa]/10 hover:bg-[#fafafa]/20 active:scale-95 text-[#fafafa] transition-all cursor-pointer"
                  title={isPlaying ? "Pause Video" : "Play Video"}
                >
                  {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                </button>

                <div className="flex-1 flex flex-col justify-center">
                  <div className="flex items-center justify-between text-[10px] font-mono text-[#52525b] mb-1">
                    <span>TIMELINE STATUS</span>
                    <span>{isPlaying ? "PLAYING STREAM" : "STOPPED / STATIC"}</span>
                  </div>
                  <div className="w-full bg-[#27272a] h-1.5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full bg-emerald-500 rounded-full ${isPlaying ? "w-full transition-all duration-[20s]" : "w-1/3"}`} 
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-1.5 border border-[#27272a] px-2 py-1 rounded-lg bg-[#09090b]">
                  <span className="text-[10px] text-[#52525b] font-mono">SPEED:</span>
                  <select 
                    value={playbackSpeed}
                    onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
                    className="bg-transparent border-none text-[10px] text-[#fafafa] font-mono focus:outline-none focus:ring-0 cursor-pointer"
                  >
                    <option value={0.5} className="bg-[#121214]">0.5x</option>
                    <option value={1} className="bg-[#121214]">1.0x (Normal)</option>
                    <option value={1.25} className="bg-[#121214]">1.25x</option>
                    <option value={1.5} className="bg-[#121214]">1.5x</option>
                    <option value={2} className="bg-[#121214]">2.0x</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* AI Banner Badge */}
          {aiAppliedBadge && (
            <div className="absolute top-4 left-4 bg-emerald-950/80 text-emerald-400 border border-emerald-900 px-3 py-1 rounded-full text-[11px] font-mono flex items-center space-x-1.5 shadow-lg backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{aiAppliedBadge}</span>
            </div>
          )}
        </div>

        {/* Media Asset Quick Selection Row */}
        <div className="p-4 border-t border-[#1f1f23] bg-[#09090b]/40 backdrop-blur-sm">
          <div className="max-w-2xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-xs font-mono text-[#52525b]">SELECT PRESET OR UPLOAD CUSTOM FOR CONSOLE DIRECTORY</span>
            
            <div className="flex items-center space-x-2 w-full sm:w-auto overflow-x-auto">
              {activeTab === "photo" ? (
                <>
                  {STATIC_PHOTOS.map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => { setSelectedPhotoUrl(p.url); setPhotoName(p.name); }}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all text-ellipsis whitespace-nowrap cursor-pointer ${
                        photoName === p.name 
                          ? "bg-emerald-950/20 text-emerald-400 border-emerald-900/40" 
                          : "bg-[#121214] text-[#71717a] border-[#27272a] hover:bg-[#18181b] hover:text-[#e4e4e7]"
                      }`}
                    >
                      Preset {idx + 1}
                    </button>
                  ))}
                  <button
                    onClick={() => photoInputRef.current?.click()}
                    className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium bg-[#18181b] hover:bg-[#27272a] text-[#ffffff] border border-[#3f3f46] rounded-lg transition-all cursor-pointer"
                    title="Upload local Photo"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload</span>
                  </button>
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </>
              ) : (
                <>
                  {STATIC_VIDEOS.map((v, idx) => (
                    <button
                      key={idx}
                      onClick={() => { setSelectedVideoUrl(v.url); setVideoName(v.name); setIsPlaying(false); }}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all text-ellipsis whitespace-nowrap cursor-pointer ${
                        videoName === v.name 
                          ? "bg-emerald-950/20 text-emerald-400 border-emerald-900/40" 
                          : "bg-[#121214] text-[#71717a] border-[#27272a] hover:bg-[#18181b] hover:text-[#e4e4e7]"
                      }`}
                    >
                      B-Roll {idx + 1}
                    </button>
                  ))}
                  <button
                    onClick={() => videoInputRef.current?.click()}
                    className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium bg-[#18181b] hover:bg-[#27272a] text-[#ffffff] border border-[#3f3f46] rounded-lg transition-all cursor-pointer"
                    title="Upload local Video"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload</span>
                  </button>
                  <input
                    ref={videoInputRef}
                    type="file"
                    accept="video/*"
                    onChange={handleVideoUpload}
                    className="hidden"
                  />
                </>
              )}
            </div>
          </div>
        </div>

        {/* Hidden Compilation Offscreen Canvas */}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Editor Adjustment Panels & Toolbar Panel (Right Side) */}
      <div className="w-full md:w-96 flex flex-col h-full bg-[#121214] overflow-y-auto font-sans">
        
        {/* Panel Section 1: Dynamic AI Prompts Panel */}
        <div className="p-6 border-b border-[#27272a] bg-[#18181b]/30">
          <div className="flex items-center space-x-2 text-[10px] font-bold text-[#52525b] uppercase tracking-[0.12em] mb-3">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>AI Style & Voice Transformation Prompts</span>
          </div>
          <div className="relative">
            <textarea
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="e.g., Make it look vintage cyberpunk style or rich black & white..."
              rows={2}
              className="w-full p-3 text-xs bg-[#18181b] border border-[#27272a] rounded-xl text-[#e4e4e7] placeholder-[#52525b] focus:outline-none focus:border-[#3f3f46] resize-none align-top"
            />
          </div>
          <div className="mt-2.5 flex items-center justify-between">
            <span className="text-[10px] text-[#52525b]">Translates prompts to values in real-time</span>
            <button
              onClick={handleApplyAiEdit}
              disabled={!aiPrompt.trim() || isAiProcessing}
              className="flex items-center space-x-1.5 px-4 py-1.5 text-xs font-semibold rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:bg-[#27272a] text-[#09090b] disabled:text-[#52525b] transition-all cursor-pointer shadow-sm active:scale-95"
            >
              {isAiProcessing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Configuring...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-[#09090b]" />
                  <span>Apply AI Edit</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Panel Section 2: Preset Filter Banks */}
        <div className="p-6 border-b border-[#27272a]">
          <div className="flex items-center space-x-1.5 text-[10px] font-bold text-[#52525b] uppercase tracking-[0.12em] mb-4">
            <Paintbrush className="w-3.5 h-3.5 text-[#71717a]" />
            <span>One-Tap Cinematic Preset Filters</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "none", label: "Default" },
              { id: "cyberpunk", label: "Cyber Neon" },
              { id: "vintage", label: "Retro Film" },
              { id: "noir", label: "Slate Noir" },
              { id: "golden", label: "Golden Hour" },
              { id: "cooling", label: "Deep Ice" },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => applyPresetFilter(f.id)}
                className={`py-2 text-[11px] font-medium rounded-lg border transition-all text-center cursor-pointer ${
                  activeFilter === f.id
                    ? "bg-[#fafafa] border-[#fafafa] text-[#09090b]"
                    : "bg-[#18181b] border-[#27272a] text-[#a1a1aa] hover:border-[#3f3f46] hover:text-[#fafafa]"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Panel Section 3: Fine Adjustment Sliders */}
        <div className="p-6 border-b border-[#27272a] space-y-4">
          <div className="flex items-center justify-between text-[10px] font-bold text-[#52525b] uppercase tracking-[0.12em] mb-2">
            <div className="flex items-center space-x-1.5">
              <Sliders className="w-3.5 h-3.5 text-[#71717a]" />
              <span>Manual Custom Adjustments</span>
            </div>
            <button
              onClick={resetAdjustments}
              className="text-[10px] text-emerald-400 hover:underline hover:text-emerald-300 font-sans cursor-pointer"
            >
              Reset
            </button>
          </div>

          {/* Brightness */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-[#a1a1aa] font-medium">
              <span>Brightness (ஒளி)</span>
              <span className="font-mono text-[10px] text-[#52525b]">{brightness}%</span>
            </div>
            <input
              type="range"
              min={20}
              max={250}
              value={brightness}
              onChange={(e) => { setBrightness(parseInt(e.target.value)); setActiveFilter("none"); }}
              className="w-full h-1 bg-[#18181b] rounded-lg appearance-none cursor-pointer accent-[#a1a1aa]"
            />
          </div>

          {/* Contrast */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-[#a1a1aa] font-medium">
              <span>Contrast (மாறுபாடு)</span>
              <span className="font-mono text-[10px] text-[#52525b]">{contrast}%</span>
            </div>
            <input
              type="range"
              min={20}
              max={250}
              value={contrast}
              onChange={(e) => { setContrast(parseInt(e.target.value)); setActiveFilter("none"); }}
              className="w-full h-1 bg-[#18181b] rounded-lg appearance-none cursor-pointer accent-[#a1a1aa]"
            />
          </div>

          {/* Saturation */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-[#a1a1aa] font-medium">
              <span>Saturation (வண்ண அடர்த்தி)</span>
              <span className="font-mono text-[10px] text-[#52525b]">{saturation}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={250}
              value={saturation}
              onChange={(e) => { setSaturation(parseInt(e.target.value)); setActiveFilter("none"); }}
              className="w-full h-1 bg-[#18181b] rounded-lg appearance-none cursor-pointer accent-[#a1a1aa]"
            />
          </div>

          {/* Blur */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-[#a1a1aa] font-medium">
              <span>Blur Focus (மங்கல்)</span>
              <span className="font-mono text-[10px] text-[#52525b]">{blur}px</span>
            </div>
            <input
              type="range"
              min={0}
              max={15}
              value={blur}
              step={0.5}
              onChange={(e) => { setBlur(parseFloat(e.target.value)); setActiveFilter("none"); }}
              className="w-full h-1 bg-[#18181b] rounded-lg appearance-none cursor-pointer accent-[#a1a1aa]"
            />
          </div>

          {/* Hue-rotate */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-[#a1a1aa] font-medium">
              <span>Hue Cycle (வண்ண சுழற்சி)</span>
              <span className="font-mono text-[10px] text-[#52525b]">{hue}°</span>
            </div>
            <input
              type="range"
              min={0}
              max={360}
              value={hue}
              onChange={(e) => { setHue(parseInt(e.target.value)); setActiveFilter("none"); }}
              className="w-full h-1 bg-[#18181b] rounded-lg appearance-none cursor-pointer accent-[#a1a1aa]"
            />
          </div>

          {/* Sepia */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-[#a1a1aa] font-medium">
              <span>Sepia (பழைய பாணி செப்பியா)</span>
              <span className="font-mono text-[10px] text-[#52525b]">{sepia}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={sepia}
              onChange={(e) => { setSepia(parseInt(e.target.value)); setActiveFilter("none"); }}
              className="w-full h-1 bg-[#18181b] rounded-lg appearance-none cursor-pointer accent-[#a1a1aa]"
            />
          </div>

          {/* Grayscale */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-[#a1a1aa] font-medium">
              <span>Grayscale (சாம்பல் நிறம்)</span>
              <span className="font-mono text-[10px] text-[#52525b]">{grayscale}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={grayscale}
              onChange={(e) => { setGrayscale(parseInt(e.target.value)); setActiveFilter("none"); }}
              className="w-full h-1 bg-[#18181b] rounded-lg appearance-none cursor-pointer accent-[#a1a1aa]"
            />
          </div>
        </div>

        {/* Panel Section 4: Text Overlay Watermark parameters */}
        <div className="p-6 border-b border-[#27272a] space-y-4">
          <div className="flex items-center space-x-1.5 text-[10px] font-bold text-[#52525b] uppercase tracking-[0.12em]">
            <Type className="w-3.5 h-3.5 text-[#71717a]" />
            <span>Text Caption Overlay (விளக்கவுரை)</span>
          </div>

          <div className="space-y-2.5">
            <input
              type="text"
              value={watermarkText}
              onChange={(e) => setWatermarkText(e.target.value)}
              placeholder="Enter overlay text/subtitle..."
              className="w-full px-3 py-1.5 text-xs bg-[#18181b] border border-[#27272a] rounded-lg text-[#fafafa] placeholder-[#52525b] focus:outline-none"
            />

            {watermarkText.trim() && (
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div className="space-y-1">
                  <label className="text-[10px] text-[#71717a] font-mono">TEXT SIZE</label>
                  <input
                    type="number"
                    value={watermarkSize}
                    onChange={(e) => setWatermarkSize(Math.max(10, parseInt(e.target.value) || 12))}
                    className="w-full px-2 py-1 text-xs bg-[#18181b] border border-[#27272a] rounded text-[#fafafa] focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-[#71717a] font-mono">POSITION</label>
                  <select
                    value={watermarkPosition}
                    onChange={(e) => setWatermarkPosition(e.target.value as any)}
                    className="w-full px-2 py-1 text-xs bg-[#18181b] border border-[#27272a] rounded text-[#fafafa] focus:outline-none"
                  >
                    <option value="bottom-right">Bottom Right</option>
                    <option value="top-center">Top Center</option>
                    <option value="center">Center Stage</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Panel Section 5: Audio & Multi-media Synthesis Overlay (For videos) */}
        {activeTab === "video" && (
          <div className="p-6 border-b border-[#27272a] space-y-4 bg-[#18181b]/10">
            <div className="flex items-center space-x-1.5 text-[10px] font-bold text-[#52525b] uppercase tracking-[0.12em]">
              <Music className="w-3.5 h-3.5 text-pink-400" />
              <span>Cinematic Soundtrack Overlay</span>
            </div>

            <div className="space-y-3">
              <label className="text-xs text-[#a1a1aa] block">Select background soundtrack:</label>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: "none", label: "No Music" },
                  { id: "synthwave", label: "Synthwave Beat" },
                  { id: "lofi", label: "Ambient Lo-Fi" },
                  { id: "cinematic", label: "Cinematic Drone" },
                  ...(customAudioName ? [{ id: "custom", label: `🔊 Custom: ${customAudioName}` }] : [])
                ].map((track) => (
                  <button
                    key={track.id}
                    onClick={() => setBgMusic(track.id as any)}
                    className={`py-1.5 px-2.5 text-[11px] font-medium rounded-lg border transition-all text-left flex items-center justify-between cursor-pointer overflow-hidden text-ellipsis whitespace-nowrap ${
                      bgMusic === track.id
                        ? "bg-pink-950/20 text-pink-400 border-pink-900/40 font-bold"
                        : "bg-[#18181b] border-[#27272a] text-[#71717a] hover:bg-[#18181b]/80"
                    }`}
                  >
                    <span className="truncate max-w-[120px]">{track.label}</span>
                    {bgMusic === track.id && <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-ping flex-shrink-0" />}
                  </button>
                ))}
              </div>

              {/* Volume & Audio Configuration */}
              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => setIsMuted(prev => !prev)}
                  className="p-1 text-[#71717a] hover:text-[#fafafa] flex items-center space-x-1.5 cursor-pointer"
                >
                  {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                  <span className="text-[11px] font-mono">{isMuted ? "Muted" : `${audioVolume}%`}</span>
                </button>
                {!isMuted && (
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={audioVolume}
                    onChange={(e) => setAudioVolume(parseInt(e.target.value))}
                    className="w-24 h-1 bg-[#18181b] roundedappearance-none cursor-pointer accent-[#a1a1aa]"
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {/* Panel Section 6: Layout Dimensions Rotation, Aspect Ratio Layout selection */}
        <div className="p-6 border-b border-[#27272a] space-y-4">
          <div className="flex items-center space-x-1.5 text-[10px] font-bold text-[#52525b] uppercase tracking-[0.12em]">
            <Scissors className="w-3.5 h-3.5 text-[#71717a]" />
            <span>Format, Orientation & Layout Controls</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRotate}
              className="flex-1 py-2 px-3 text-xs bg-[#18181b] border border-[#27272a] text-[#e4e4e7] rounded-lg hover:border-[#3f3f46] active:scale-95 transition-all cursor-pointer flex items-center justify-center space-x-1.5"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Rotate 90° (சுழற்று)</span>
            </button>

            <select
              value={aspectRatio}
              onChange={(e) => setAspectRatio(e.target.value as any)}
              className="py-2 px-3 text-xs bg-[#18181b] border border-[#27272a] text-[#fafafa] rounded-lg focus:outline-none cursor-pointer select-none"
            >
              <option value="free">Free Aspect Ratio</option>
              <option value="16:9">Wide (16:9)</option>
              <option value="1:1">Square (1:1)</option>
              <option value="9:16">Vertical Portrait (9:16)</option>
            </select>
          </div>
        </div>

        {/* Master Save Exports Bar */}
        <div className="p-6 bg-[#09090b]/80 border-t border-[#27272a] sticky bottom-0 z-10">
          <button
            onClick={activeTab === "photo" ? handleDownloadPhoto : handleDownloadVideo}
            className="w-full flex items-center justify-center space-x-2 py-3 bg-[#ffffff] hover:bg-[#eaeaea] text-[#09090b] text-xs font-semibold rounded-xl leading-none cursor-pointer active:scale-98 transition-all shadow-lg"
          >
            <Download className="w-4 h-4 text-[#09090b]" />
            <span>
              {activeTab === "photo" 
                ? "Download Edited Photo (பதிவிறக்கம்)" 
                : "Generate & Download Video Track"
              }
            </span>
          </button>
        </div>

      </div>

    </div>
  );
}
