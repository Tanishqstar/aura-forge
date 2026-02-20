import { useRef, useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { filterRenderers, getRendererForPrompt, type FaceRect, type FilterRenderer } from "@/components/ar/filterRenderers";
import { type Filter } from "@/components/FilterGallery";

interface ARViewportProps {
  activeFilter: string | null;
  filters: Filter[];
  onGoFullscreen: () => void;
}

const ARViewport = ({ activeFilter, filters, onGoFullscreen }: ARViewportProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const animFrameRef = useRef<number>(0);
  const tickRef = useRef(0);

  const startStream = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" },
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

  const getActiveRenderer = useCallback((): FilterRenderer | null => {
    if (!activeFilter) return null;
    if (filterRenderers[activeFilter]) return filterRenderers[activeFilter];
    const filter = filters.find((f) => f.id === activeFilter);
    if (filter) return getRendererForPrompt(filter.prompt);
    return null;
  }, [activeFilter, filters]);

  useEffect(() => {
    if (!isStreaming || !canvasRef.current || !videoRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = () => {
      canvas.width = videoRef.current!.videoWidth || 640;
      canvas.height = videoRef.current!.videoHeight || 480;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      tickRef.current++;
      const renderer = getActiveRenderer();

      if (renderer) {
        const face: FaceRect = {
          cx: canvas.width / 2,
          cy: canvas.height / 2 - canvas.height * 0.04,
          faceW: canvas.width * 0.22,
          faceH: canvas.height * 0.36,
        };
        renderer(ctx, face, tickRef.current, canvas.width, canvas.height);
        setFaceDetected(true);
      } else {
        setFaceDetected(false);
      }

      animFrameRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [isStreaming, getActiveRenderer]);

  useEffect(() => {
    return () => stopStream();
  }, [stopStream]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative glass-panel rounded-lg overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isStreaming ? "bg-neon-green animate-pulse-glow" : "bg-muted-foreground"}`} />
          <span className="font-display text-xs tracking-widest text-foreground uppercase">
            AR Viewport
          </span>
        </div>
        <div className="flex items-center gap-2">
          {faceDetected && (
            <span className="text-[10px] font-mono text-neon-cyan animate-pulse-glow">● TRACKING</span>
          )}
          <span className="text-[10px] font-mono text-muted-foreground">640×480</span>
        </div>
      </div>

      {/* Video area */}
      <div className="relative aspect-[4/3] bg-background">
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
        {isStreaming && <div className="absolute inset-0 scanlines pointer-events-none opacity-20" />}
        {!isStreaming && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
            <div className="w-16 h-16 rounded-full border-2 border-dashed border-muted-foreground flex items-center justify-center">
              <svg className="w-6 h-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="font-mono text-xs text-muted-foreground">CAMERA OFFLINE</span>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="p-3 flex items-center justify-between">
        <button
          onClick={isStreaming ? stopStream : startStream}
          className={`px-4 py-1.5 rounded font-display text-[10px] tracking-widest uppercase transition-all ${
            isStreaming
              ? "bg-destructive/20 text-destructive border border-destructive/30 hover:bg-destructive/30"
              : "bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20 glow-cyan"
          }`}
        >
          {isStreaming ? "■ Stop" : "▶ Start Stream"}
        </button>
        <div className="flex gap-1">
          <button
            onClick={onGoFullscreen}
            className="px-2 py-0.5 rounded text-[9px] font-mono border border-primary/30 text-primary hover:bg-primary/10 cursor-pointer transition-colors"
          >
            ⛶ FULLSCREEN
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default ARViewport;
