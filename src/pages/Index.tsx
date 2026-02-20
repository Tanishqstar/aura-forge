import { useState, useCallback, useRef } from "react";
import { AnimatePresence } from "framer-motion";
import StatusBar from "@/components/StatusBar";
import ARViewport from "@/components/ARViewport";
import ModelPreview from "@/components/ModelPreview";
import FilterForge from "@/components/FilterForge";
import FilterGallery, { type Filter } from "@/components/FilterGallery";
import FullscreenAR from "@/components/FullscreenAR";
import { getRendererForPrompt, filterRenderers, drawIceMask, drawBioHalo } from "@/components/ar/filterRenderers";

const Index = () => {
  const [filters, setFilters] = useState<Filter[]>([
    {
      id: "preset-1",
      name: "Cyber Crown",
      prompt: "Neon cyberpunk crown with floating data shards",
      status: "ready",
      anchorType: "HEAD",
      animation: "FLOAT",
      createdAt: new Date().toISOString(),
    },
    {
      id: "preset-2",
      name: "Holo Wings",
      prompt: "Holographic butterfly wings with prismatic trails",
      status: "ready",
      anchorType: "SHOULDERS",
      animation: "PULSE",
      createdAt: new Date().toISOString(),
    },
    {
      id: "preset-3",
      name: "Ice Mask",
      prompt: "Crystalline ice mask with frost particles",
      status: "ready",
      anchorType: "HEAD",
      animation: "PULSE",
      createdAt: new Date().toISOString(),
    },
    {
      id: "preset-4",
      name: "Bio Halo",
      prompt: "Bio-luminescent tentacle halo",
      status: "ready",
      anchorType: "HEAD",
      animation: "FLOAT",
      createdAt: new Date().toISOString(),
    },
  ]);

  const [activeFilterId, setActiveFilterId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [genStatus, setGenStatus] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  // Register renderers for new presets on first render
  if (!filterRenderers["preset-3"]) {
    filterRenderers["preset-3"] = drawIceMask;
    filterRenderers["preset-4"] = drawBioHalo;
  }

  const simulateGeneration = useCallback((prompt: string) => {
    setIsGenerating(true);
    setProgress(0);

    const steps = [
      { p: 15, s: "Parsing prompt with Gemini Pro..." },
      { p: 30, s: "Extracting anchor & animation metadata..." },
      { p: 50, s: "Generating 3D mesh via Neural 3D API..." },
      { p: 70, s: "Applying PBR textures..." },
      { p: 85, s: "Optimizing for real-time rendering..." },
      { p: 95, s: "Deploying to AR pipeline..." },
      { p: 100, s: "Filter ready!" },
    ];

    let step = 0;
    timerRef.current = setInterval(() => {
      if (step < steps.length) {
        setProgress(steps[step].p);
        setGenStatus(steps[step].s);
        step++;
      } else {
        clearInterval(timerRef.current);
        setIsGenerating(false);

        const name = prompt.split(" ").slice(0, 2).join(" ");
        const anchors = ["HEAD", "SHOULDERS", "HAND", "WORLD"];
        const anims = ["FLOAT", "ROTATE", "PULSE"];

        const newFilter: Filter = {
          id: `gen-${Date.now()}`,
          name: name.charAt(0).toUpperCase() + name.slice(1),
          prompt,
          status: "ready",
          anchorType: anchors[Math.floor(Math.random() * anchors.length)],
          animation: anims[Math.floor(Math.random() * anims.length)],
          createdAt: new Date().toISOString(),
        };

        // Register the renderer for this new filter
        filterRenderers[newFilter.id] = getRendererForPrompt(prompt);

        setFilters((prev) => [newFilter, ...prev]);
        setActiveFilterId(newFilter.id);
      }
    }, 1200);
  }, []);

  const handleSelectFilter = useCallback((id: string) => {
    setActiveFilterId(id || null);
  }, []);

  const activeFilter = filters.find((f) => f.id === activeFilterId);

  return (
    <>
      <AnimatePresence>
        {isFullscreen && (
          <FullscreenAR
            filters={filters}
            activeFilterId={activeFilterId}
            onSelectFilter={handleSelectFilter}
            onExit={() => setIsFullscreen(false)}
          />
        )}
      </AnimatePresence>

      {!isFullscreen && (
        <div className="min-h-screen flex flex-col bg-background">
          <StatusBar />

          <main className="flex-1 p-4 grid grid-cols-1 lg:grid-cols-12 gap-4 max-w-[1600px] mx-auto w-full">
            {/* Left: AR Viewport */}
            <div className="lg:col-span-4 space-y-4">
              <ARViewport
                activeFilter={activeFilterId}
                filters={filters}
                onGoFullscreen={() => setIsFullscreen(true)}
              />
              <FilterGallery
                filters={filters}
                activeFilterId={activeFilterId}
                onSelect={setActiveFilterId}
              />
            </div>

            {/* Center: 3D Preview */}
            <div className="lg:col-span-4">
              <ModelPreview
                modelUrl={activeFilter?.status === "ready" ? "placeholder" : null}
                filterName={activeFilter?.name}
              />
            </div>

            {/* Right: Forge + Info */}
            <div className="lg:col-span-4 space-y-4">
              <FilterForge
                onGenerate={simulateGeneration}
                isGenerating={isGenerating}
                progress={progress}
                status={genStatus}
              />

              {activeFilter && (
                <div className="glass-panel rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-neon-cyan" />
                    <span className="font-display text-xs tracking-widest text-foreground uppercase">
                      Active Filter
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      ["Name", activeFilter.name],
                      ["Anchor", activeFilter.anchorType],
                      ["Animation", activeFilter.animation],
                      ["Status", activeFilter.status.toUpperCase()],
                    ].map(([label, value]) => (
                      <div key={label} className="space-y-0.5">
                        <span className="text-[9px] font-mono text-muted-foreground uppercase">{label}</span>
                        <div className="text-[11px] font-mono text-foreground">{value}</div>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-mono text-muted-foreground uppercase">Prompt</span>
                    <div className="text-[10px] font-mono text-secondary-foreground/70 leading-relaxed">
                      {activeFilter.prompt}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
      )}
    </>
  );
};

export default Index;
