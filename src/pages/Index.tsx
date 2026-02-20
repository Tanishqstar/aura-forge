import { useState, useCallback, useRef } from "react";
import { AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import StatusBar from "@/components/StatusBar";
import ARViewport from "@/components/ARViewport";
import ModelPreview from "@/components/ModelPreview";
import FilterForge from "@/components/FilterForge";
import FilterGallery, { type Filter } from "@/components/FilterGallery";
import FullscreenAR from "@/components/FullscreenAR";
import {
  filterRenderers,
  drawIceMask,
  drawBioHalo,
  createDynamicRenderer,
  type AIFilterParams,
} from "@/components/ar/filterRenderers";
import { supabase } from "@/integrations/supabase/client";

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

  // Register renderers for presets on first render
  if (!filterRenderers["preset-3"]) {
    filterRenderers["preset-3"] = drawIceMask;
    filterRenderers["preset-4"] = drawBioHalo;
  }

  const generateFilter = useCallback(async (prompt: string) => {
    setIsGenerating(true);
    setProgress(10);
    setGenStatus("Sending prompt to AI...");

    try {
      setProgress(30);
      setGenStatus("AI analyzing prompt & designing filter...");

      const { data, error } = await supabase.functions.invoke("generate-filter", {
        body: { prompt },
      });

      if (error) {
        throw new Error(error.message || "Failed to generate filter");
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      const aiParams: AIFilterParams = data.filter;

      setProgress(70);
      setGenStatus("Building dynamic renderer...");

      const filterId = `gen-${Date.now()}`;

      // Create and register the dynamic renderer from AI params
      filterRenderers[filterId] = createDynamicRenderer(aiParams);

      setProgress(90);
      setGenStatus("Deploying to AR pipeline...");

      await new Promise((r) => setTimeout(r, 500));

      const newFilter: Filter = {
        id: filterId,
        name: aiParams.name,
        prompt,
        status: "ready",
        anchorType: aiParams.anchorPoint,
        animation: aiParams.animation,
        createdAt: new Date().toISOString(),
        aiParams,
        description: aiParams.description,
      };

      setFilters((prev) => [newFilter, ...prev]);
      setActiveFilterId(filterId);

      setProgress(100);
      setGenStatus("Filter ready!");
      toast.success(`"${aiParams.name}" filter created!`);

      await new Promise((r) => setTimeout(r, 600));
    } catch (err) {
      console.error("Generation failed:", err);
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast.error(`Filter generation failed: ${msg}`);
      setGenStatus("Generation failed");
    } finally {
      setIsGenerating(false);
    }
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
                onGenerate={generateFilter}
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
                  {activeFilter.description && (
                    <div className="space-y-0.5">
                      <span className="text-[9px] font-mono text-muted-foreground uppercase">AI Description</span>
                      <div className="text-[10px] font-mono text-neon-cyan/70 leading-relaxed">
                        {activeFilter.description}
                      </div>
                    </div>
                  )}
                  {activeFilter.aiParams && (
                    <div className="flex gap-1.5 mt-1">
                      {[activeFilter.aiParams.primaryColor, activeFilter.aiParams.secondaryColor, activeFilter.aiParams.accentColor].map((c, i) => (
                        <div
                          key={i}
                          className="w-5 h-5 rounded-full border border-border"
                          style={{ backgroundColor: `hsl(${c.h}, ${c.s}%, ${c.l}%)` }}
                          title={`hsl(${c.h}, ${c.s}%, ${c.l}%)`}
                        />
                      ))}
                      <span className="text-[8px] font-mono text-muted-foreground self-center ml-1">
                        AI PALETTE
                      </span>
                    </div>
                  )}
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
