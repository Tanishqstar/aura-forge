import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface FilterForgeProps {
  onGenerate: (prompt: string) => void;
  isGenerating: boolean;
  progress: number;
  status: string;
}

const FilterForge = ({ onGenerate, isGenerating, progress, status }: FilterForgeProps) => {
  const [prompt, setPrompt] = useState("");

  const presets = [
    "Neon cyberpunk crown with floating data shards",
    "Holographic butterfly wings with prismatic trails",
    "Crystalline ice mask with frost particles",
    "Bio-luminescent tentacle halo",
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="glass-panel rounded-lg overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center gap-2 p-3 border-b border-border">
        <div className="w-2 h-2 rounded-full bg-neon-magenta animate-pulse-glow" />
        <span className="font-display text-xs tracking-widest text-foreground uppercase">
          Filter Forge
        </span>
      </div>

      <div className="p-4 space-y-4">
        {/* Prompt input */}
        <div className="space-y-2">
          <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
            Describe your AR filter
          </label>
          <div className="relative">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. Neon cyberpunk crown with floating data shards..."
              rows={3}
              className="w-full bg-background border border-border rounded px-3 py-2 text-sm font-mono text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 resize-none transition-all"
              disabled={isGenerating}
            />
            <div className="absolute bottom-2 right-2 text-[9px] font-mono text-muted-foreground">
              {prompt.length}/200
            </div>
          </div>
        </div>

        {/* Presets */}
        <div className="space-y-2">
          <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
            Quick Presets
          </span>
          <div className="flex flex-wrap gap-1.5">
            {presets.map((preset) => (
              <button
                key={preset}
                onClick={() => setPrompt(preset)}
                disabled={isGenerating}
                className="px-2 py-1 rounded text-[10px] font-mono border border-border text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-primary/5 transition-all disabled:opacity-50"
              >
                {preset.slice(0, 30)}...
              </button>
            ))}
          </div>
        </div>

        {/* Generate button */}
        <button
          onClick={() => prompt && onGenerate(prompt)}
          disabled={!prompt || isGenerating}
          className="w-full py-2.5 rounded font-display text-xs tracking-widest uppercase transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-gradient-to-r from-neon-cyan/20 to-neon-magenta/20 border border-primary/30 text-primary hover:from-neon-cyan/30 hover:to-neon-magenta/30 glow-cyan"
        >
          {isGenerating ? "⟳ Forging..." : "⚡ Generate AR Filter"}
        </button>

        {/* Progress */}
        <AnimatePresence>
          {isGenerating && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-neon-cyan">{status}</span>
                <span className="text-[10px] font-mono text-muted-foreground">{progress}%</span>
              </div>
              <div className="h-1 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-neon-cyan to-neon-magenta"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5 }}
                  style={{ boxShadow: "0 0 10px hsl(190 100% 50% / 0.5)" }}
                />
              </div>
              <div className="grid grid-cols-4 gap-1">
                {["PROMPT", "MESH", "TEXTURE", "DEPLOY"].map((step, i) => {
                  const stepProgress = progress / 25;
                  const isActive = Math.floor(stepProgress) === i;
                  const isDone = stepProgress > i + 1;
                  return (
                    <div
                      key={step}
                      className={`text-center py-1 rounded text-[8px] font-mono border transition-all ${
                        isDone
                          ? "border-neon-green/30 text-neon-green bg-neon-green/5"
                          : isActive
                          ? "border-neon-cyan/40 text-neon-cyan bg-neon-cyan/5 animate-pulse-glow"
                          : "border-border text-muted-foreground"
                      }`}
                    >
                      {isDone ? "✓ " : ""}{step}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default FilterForge;
