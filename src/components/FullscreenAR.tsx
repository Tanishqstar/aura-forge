import { useRef, useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { type Filter } from "@/components/FilterGallery";
import { filterRenderers, getRendererForPrompt, type FaceRect, type FilterRenderer } from "@/components/ar/filterRenderers";
import { useFaceDetection } from "@/hooks/useFaceDetection";

interface FullscreenARProps {
  filters: Filter[];
  activeFilterId: string | null;
  onSelectFilter: (id: string) => void;
  onExit: () => void;
}

const FullscreenAR = ({ filters, activeFilterId, onSelectFilter, onExit }: FullscreenARProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [showFilters, setShowFilters] = useState(true);
  const animFrameRef = useRef<number>(0);
  const tickRef = useRef(0);
  const [canvasSize, setCanvasSize] = useState({ w: 1280, h: 720 });

  const { detectFace, faceDetected, hasFaceTracking } = useFaceDetection(
    videoRef, canvasSize.w, canvasSize.h, isStreaming
  );

  const startStream = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsStreaming(true);
      }
    } catch {
      console.error("Camera access denied");
    }
  }, []);

  const stopStream = useCallback(() => {
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
      videoRef.current.srcObject = null;
      setIsStreaming(false);
    }
  }, []);

  useEffect(() => {
    startStream();
    return () => stopStream();
  }, [startStream, stopStream]);

  const getActiveRenderer = useCallback((): FilterRenderer | null => {
    if (!activeFilterId) return null;
    if (filterRenderers[activeFilterId]) return filterRenderers[activeFilterId];
    const filter = filters.find((f) => f.id === activeFilterId);
    if (filter) return getRendererForPrompt(filter.prompt);
    return null;
  }, [activeFilterId, filters]);

  const takeSnapshot = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const v = videoRef.current;
    const overlay = canvasRef.current;
    const tmpCanvas = document.createElement("canvas");
    tmpCanvas.width = v.videoWidth || 1280;
    tmpCanvas.height = v.videoHeight || 720;
    const tmpCtx = tmpCanvas.getContext("2d")!;
    tmpCtx.translate(tmpCanvas.width, 0);
    tmpCtx.scale(-1, 1);
    tmpCtx.drawImage(v, 0, 0, tmpCanvas.width, tmpCanvas.height);
    tmpCtx.setTransform(1, 0, 0, 1, 0, 0);
    tmpCtx.translate(tmpCanvas.width, 0);
    tmpCtx.scale(-1, 1);
    tmpCtx.drawImage(overlay, 0, 0, tmpCanvas.width, tmpCanvas.height);
    tmpCtx.setTransform(1, 0, 0, 1, 0, 0);
    const link = document.createElement("a");
    link.download = `neura-ar-${Date.now()}.png`;
    link.href = tmpCanvas.toDataURL("image/png");
    link.click();
  }, []);

  useEffect(() => {
    if (!isStreaming || !canvasRef.current || !videoRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = async () => {
      const vw = videoRef.current!.videoWidth || 1280;
      const vh = videoRef.current!.videoHeight || 720;
      canvas.width = vw;
      canvas.height = vh;
      setCanvasSize({ w: vw, h: vh });
      ctx.clearRect(0, 0, vw, vh);

      tickRef.current++;
      const tick = tickRef.current;

      const renderer = getActiveRenderer();
      if (renderer) {
        const face = await detectFace();
        renderer(ctx, face, tick, vw, vh);
      }

      // HUD corners
      ctx.shadowBlur = 0;
      ctx.shadowColor = "transparent";
      const hudAlpha = 0.4;
      ctx.strokeStyle = `hsla(190, 100%, 50%, ${hudAlpha})`;
      ctx.lineWidth = 1;
      const m = 20;
      const s = 40;
      ctx.beginPath(); ctx.moveTo(m, m + s); ctx.lineTo(m, m); ctx.lineTo(m + s, m); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(vw - m - s, m); ctx.lineTo(vw - m, m); ctx.lineTo(vw - m, m + s); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(m, vh - m - s); ctx.lineTo(m, vh - m); ctx.lineTo(m + s, vh - m); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(vw - m - s, vh - m); ctx.lineTo(vw - m, vh - m); ctx.lineTo(vw - m, vh - m - s); ctx.stroke();

      ctx.font = "12px 'Orbitron', sans-serif";
      ctx.fillStyle = `hsla(190, 100%, 60%, ${hudAlpha + 0.1})`;
      ctx.textAlign = "center";
      ctx.fillText("NEURA AR // LIVE", vw / 2, m + 14);

      ctx.font = "10px 'JetBrains Mono', monospace";
      ctx.textAlign = "right";
      ctx.fillStyle = `hsla(190, 100%, 50%, ${hudAlpha})`;
      ctx.fillText(`${vw}×${vh} @60FPS`, vw - m - 5, vh - m - 25);
      ctx.fillText(`TICK: ${tick}`, vw - m - 5, vh - m - 10);

      if (renderer) {
        ctx.textAlign = "left";
        ctx.fillStyle = faceDetected
          ? `hsla(150, 100%, 50%, ${hudAlpha + 0.1})`
          : `hsla(40, 100%, 50%, ${hudAlpha + 0.1})`;
        ctx.fillText(
          faceDetected ? "● FACE LOCKED" : "○ CENTER MODE",
          m + 5, vh - m - 10
        );
      }

      animFrameRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [isStreaming, getActiveRenderer, detectFace, faceDetected]);

  const readyFilters = filters.filter((f) => f.status === "ready");

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background"
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover"
        style={{ transform: "scaleX(-1)" }}
      />
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ transform: "scaleX(-1)" }}
      />
      <div className="absolute inset-0 scanlines pointer-events-none opacity-15" />

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-10">
        <button
          onClick={onExit}
          className="px-4 py-2 rounded glass-panel font-display text-[10px] tracking-widest text-foreground uppercase hover:bg-primary/10 transition-all border-glow"
        >
          ← Dashboard
        </button>

        <div className="flex items-center gap-3">
          {/* Face tracking indicator */}
          <div className="flex items-center gap-1.5 glass-panel px-3 py-1.5 rounded">
            <div className={`w-2 h-2 rounded-full ${faceDetected ? "bg-neon-green animate-pulse-glow" : hasFaceTracking ? "bg-yellow-500" : "bg-muted-foreground"}`} />
            <span className="text-[10px] font-mono text-foreground">
              {faceDetected ? "FACE LOCKED" : hasFaceTracking ? "SCANNING" : "CENTER"}
            </span>
          </div>

          <div className="flex items-center gap-1.5 glass-panel px-3 py-1.5 rounded">
            <div className={`w-2 h-2 rounded-full ${isStreaming ? "bg-neon-green animate-pulse-glow" : "bg-destructive"}`} />
            <span className="text-[10px] font-mono text-foreground">
              {isStreaming ? "LIVE" : "OFFLINE"}
            </span>
          </div>

          {activeFilterId && (
            <div className="glass-panel px-3 py-1.5 rounded">
              <span className="text-[10px] font-mono text-neon-cyan">
                {filters.find((f) => f.id === activeFilterId)?.name || "Unknown"}
              </span>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          {isStreaming && (
            <button
              onClick={takeSnapshot}
              className="px-4 py-2 rounded glass-panel font-display text-[10px] tracking-widest text-neon-green uppercase hover:bg-neon-green/10 transition-all border border-neon-green/30"
            >
              📸 Snapshot
            </button>
          )}
          <button
            onClick={() => setShowFilters((v) => !v)}
            className="px-4 py-2 rounded glass-panel font-display text-[10px] tracking-widest text-foreground uppercase hover:bg-primary/10 transition-all border-glow"
          >
            {showFilters ? "Hide Filters" : "Filters"}
          </button>
        </div>
      </div>

      {!isStreaming && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-10">
          <div className="w-20 h-20 rounded-full border-2 border-dashed border-muted-foreground flex items-center justify-center">
            <svg className="w-8 h-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <span className="font-mono text-sm text-muted-foreground">Requesting camera access...</span>
          <button
            onClick={startStream}
            className="px-6 py-2 rounded font-display text-xs tracking-widest text-primary border border-primary/30 hover:bg-primary/10 glow-cyan transition-all"
          >
            Retry
          </button>
        </div>
      )}

      {/* Bottom filter carousel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", damping: 25 }}
            className="absolute bottom-0 left-0 right-0 z-10 p-4"
          >
            <div className="max-w-2xl mx-auto">
              <div className="glass-panel rounded-xl p-3">
                <div className="flex items-center gap-2 mb-2 px-1">
                  <span className="text-[9px] font-display tracking-widest text-muted-foreground uppercase">
                    Active Filters
                  </span>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                  <button
                    onClick={() => onSelectFilter("")}
                    className={`shrink-0 flex flex-col items-center gap-1.5 px-4 py-2.5 rounded-lg transition-all ${
                      !activeFilterId
                        ? "bg-primary/10 border border-primary/40 glow-cyan"
                        : "border border-border hover:border-primary/20 hover:bg-muted/50"
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full border border-dashed border-muted-foreground flex items-center justify-center">
                      <span className="text-muted-foreground text-lg">✕</span>
                    </div>
                    <span className="text-[9px] font-mono text-muted-foreground">NONE</span>
                  </button>

                  {readyFilters.map((filter) => {
                    const isActive = filter.id === activeFilterId;
                    const colors: Record<string, string> = {
                      "Cyber Crown": "from-neon-cyan/30 to-neon-violet/30",
                      "Holo Wings": "from-neon-magenta/30 to-neon-cyan/30",
                    };
                    const bgGrad = colors[filter.name] || "from-neon-green/20 to-neon-cyan/20";

                    return (
                      <button
                        key={filter.id}
                        onClick={() => onSelectFilter(filter.id)}
                        className={`shrink-0 flex flex-col items-center gap-1.5 px-4 py-2.5 rounded-lg transition-all ${
                          isActive
                            ? "bg-primary/10 border border-primary/40 glow-cyan"
                            : "border border-border hover:border-primary/20 hover:bg-muted/50"
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${bgGrad} flex items-center justify-center`}>
                          <span className="text-foreground text-sm">
                            {filter.name.charAt(0)}
                          </span>
                        </div>
                        <span className="text-[9px] font-mono text-foreground whitespace-nowrap">
                          {filter.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default FullscreenAR;
