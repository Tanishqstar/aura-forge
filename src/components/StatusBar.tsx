import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const StatusBar = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const iv = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(iv);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between px-4 py-2 border-b border-border bg-card/50"
    >
      <div className="flex items-center gap-3">
        <span className="font-display text-sm tracking-[0.3em] text-primary text-glow-cyan">
          NEURA
        </span>
        <span className="text-[10px] font-mono text-neon-magenta">
          AR FILTER SYSTEM
        </span>
        <span className="text-[9px] font-mono text-muted-foreground">v2.4.1</span>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-neon-green animate-pulse-glow" />
          <span className="text-[9px] font-mono text-muted-foreground">SYS OK</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-neon-cyan" />
          <span className="text-[9px] font-mono text-muted-foreground">GPU READY</span>
        </div>
        <span className="text-[10px] font-mono text-muted-foreground tabular-nums">
          {time.toLocaleTimeString("en-US", { hour12: false })}
        </span>
      </div>
    </motion.div>
  );
};

export default StatusBar;
