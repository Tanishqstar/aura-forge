import { motion } from "framer-motion";

export interface Filter {
  id: string;
  name: string;
  prompt: string;
  status: "generating" | "ready" | "failed";
  anchorType: string;
  animation: string;
  createdAt: string;
}

interface FilterGalleryProps {
  filters: Filter[];
  activeFilterId: string | null;
  onSelect: (id: string) => void;
}

const statusColors: Record<string, string> = {
  generating: "text-neon-cyan animate-pulse-glow",
  ready: "text-neon-green",
  failed: "text-destructive",
};

const statusLabels: Record<string, string> = {
  generating: "FORGING",
  ready: "READY",
  failed: "FAILED",
};

const FilterGallery = ({ filters, activeFilterId, onSelect }: FilterGalleryProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="glass-panel rounded-lg overflow-hidden"
    >
      <div className="flex items-center justify-between p-3 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-neon-green" />
          <span className="font-display text-xs tracking-widest text-foreground uppercase">
            Filter Bank
          </span>
        </div>
        <span className="text-[10px] font-mono text-muted-foreground">
          {filters.length} LOADED
        </span>
      </div>

      <div className="divide-y divide-border">
        {filters.length === 0 ? (
          <div className="p-8 text-center">
            <span className="text-muted-foreground font-mono text-xs">
              No filters generated yet.
              <br />
              Use the Forge to create one.
            </span>
          </div>
        ) : (
          filters.map((filter, i) => (
            <motion.button
              key={filter.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => filter.status === "ready" && onSelect(filter.id)}
              className={`w-full text-left p-3 transition-all ${
                activeFilterId === filter.id
                  ? "bg-primary/5 border-l-2 border-l-primary"
                  : "hover:bg-muted/50 border-l-2 border-l-transparent"
              } ${filter.status !== "ready" ? "opacity-60 cursor-default" : "cursor-pointer"}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-display text-[11px] text-foreground truncate">
                      {filter.name}
                    </span>
                    <span className={`text-[8px] font-mono ${statusColors[filter.status]}`}>
                      {statusLabels[filter.status]}
                    </span>
                  </div>
                  <p className="text-[10px] font-mono text-muted-foreground truncate">
                    {filter.prompt}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-0.5 shrink-0">
                  <span className="text-[8px] font-mono text-muted-foreground">
                    {filter.anchorType}
                  </span>
                  <span className="text-[8px] font-mono text-neon-violet/70">
                    {filter.animation}
                  </span>
                </div>
              </div>
            </motion.button>
          ))
        )}
      </div>
    </motion.div>
  );
};

export default FilterGallery;
