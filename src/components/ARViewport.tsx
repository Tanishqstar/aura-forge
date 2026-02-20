import { useRef, useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";

interface ARViewportProps {
  activeFilter: string | null;
}

const ARViewport = ({ activeFilter }: ARViewportProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const animFrameRef = useRef<number>(0);

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
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((t) => t.stop());
      videoRef.current.srcObject = null;
      setIsStreaming(false);
    }
  }, []);

  // Simulated face detection overlay
  useEffect(() => {
    if (!isStreaming || !canvasRef.current || !videoRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let tick = 0;
    const draw = () => {
      canvas.width = videoRef.current!.videoWidth || 640;
      canvas.height = videoRef.current!.videoHeight || 480;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Simulated face mesh overlay
      if (activeFilter) {
        tick++;
        const cx = canvas.width / 2;
        const cy = canvas.height / 2 - 20;
        const breathe = Math.sin(tick * 0.03) * 5;

        // Face tracking reticle
        ctx.strokeStyle = "hsl(190, 100%, 50%)";
        ctx.lineWidth = 1.5;
        ctx.shadowColor = "hsl(190, 100%, 50%)";
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.ellipse(cx, cy, 90 + breathe, 120 + breathe, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Corner brackets
        const sz = 20;
        const off = 140 + breathe;
        ctx.strokeStyle = "hsl(320, 100%, 60%)";
        ctx.shadowColor = "hsl(320, 100%, 60%)";
        ctx.lineWidth = 2;

        // Top-left
        ctx.beginPath();
        ctx.moveTo(cx - off, cy - off + sz);
        ctx.lineTo(cx - off, cy - off);
        ctx.lineTo(cx - off + sz, cy - off);
        ctx.stroke();
        // Top-right
        ctx.beginPath();
        ctx.moveTo(cx + off - sz, cy - off);
        ctx.lineTo(cx + off, cy - off);
        ctx.lineTo(cx + off, cy - off + sz);
        ctx.stroke();
        // Bottom-left
        ctx.beginPath();
        ctx.moveTo(cx - off, cy + off - sz);
        ctx.lineTo(cx - off, cy + off);
        ctx.lineTo(cx - off + sz, cy + off);
        ctx.stroke();
        // Bottom-right
        ctx.beginPath();
        ctx.moveTo(cx + off - sz, cy + off);
        ctx.lineTo(cx + off, cy + off);
        ctx.lineTo(cx + off, cy + off - sz);
        ctx.stroke();

        // Status text
        ctx.font = "11px 'JetBrains Mono', monospace";
        ctx.fillStyle = "hsl(190, 100%, 50%)";
        ctx.shadowBlur = 5;
        ctx.fillText("FACE_MESH: LOCKED", cx - off, cy - off - 10);
        ctx.fillText(`ANCHOR: HEAD`, cx + off - 80, cy + off + 20);

        setFaceDetected(true);
      } else {
        setFaceDetected(false);
      }

      animFrameRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [isStreaming, activeFilter]);

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
            <span className="text-[10px] font-mono text-neon-cyan animate-pulse-glow">
              ● TRACKING
            </span>
          )}
          <span className="text-[10px] font-mono text-muted-foreground">
            640×480 @60FPS
          </span>
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

        {/* Scanline overlay */}
        {isStreaming && <div className="absolute inset-0 scanlines pointer-events-none opacity-30" />}

        {/* No stream placeholder */}
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
          {["REC", "OCL", "DBG"].map((label) => (
            <span
              key={label}
              className="px-2 py-0.5 rounded text-[9px] font-mono border border-border text-muted-foreground hover:text-foreground hover:border-primary/30 cursor-pointer transition-colors"
            >
              {label}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default ARViewport;
