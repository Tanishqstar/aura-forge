import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment, Float, MeshDistortMaterial } from "@react-three/drei";
import { motion } from "framer-motion";
import * as THREE from "three";

const PlaceholderMesh = () => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.3;
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.2) * 0.1;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[1.2, 4]} />
        <MeshDistortMaterial
          color="#00d4ff"
          emissive="#00d4ff"
          emissiveIntensity={0.3}
          roughness={0.2}
          metalness={0.8}
          distort={0.3}
          speed={2}
          wireframe
        />
      </mesh>
      {/* Inner glow core */}
      <mesh scale={0.6}>
        <icosahedronGeometry args={[1, 2]} />
        <meshStandardMaterial
          color="#ff3d9a"
          emissive="#ff3d9a"
          emissiveIntensity={0.5}
          transparent
          opacity={0.4}
        />
      </mesh>
    </Float>
  );
};

interface ModelPreviewProps {
  modelUrl?: string | null;
  filterName?: string;
}

const ModelPreview = ({ modelUrl, filterName }: ModelPreviewProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.1 }}
      className="relative glass-panel rounded-lg overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-neon-violet animate-pulse-glow" />
          <span className="font-display text-xs tracking-widest text-foreground uppercase">
            3D Stage
          </span>
        </div>
        <span className="text-[10px] font-mono text-muted-foreground">
          {filterName || "No asset loaded"}
        </span>
      </div>

      {/* 3D Canvas */}
      <div className="aspect-square bg-background relative">
        <Canvas
          camera={{ position: [0, 0, 4], fov: 50 }}
          gl={{ antialias: true, alpha: true }}
        >
          <Suspense fallback={null}>
            <ambientLight intensity={0.2} />
            <pointLight position={[5, 5, 5]} intensity={0.8} color="#00d4ff" />
            <pointLight position={[-5, -3, 3]} intensity={0.4} color="#ff3d9a" />
            <PlaceholderMesh />
            <Environment preset="night" />
            <OrbitControls
              enableZoom={false}
              enablePan={false}
              autoRotate
              autoRotateSpeed={0.5}
            />
          </Suspense>
        </Canvas>

        {/* Grid overlay */}
        <div className="absolute inset-0 pointer-events-none scanlines opacity-10" />

        {/* Corner HUD elements */}
        <div className="absolute top-3 left-3 text-[9px] font-mono text-neon-cyan/60">
          <div>VERT: 2,562</div>
          <div>TRI: 5,120</div>
        </div>
        <div className="absolute bottom-3 right-3 text-[9px] font-mono text-neon-magenta/60">
          <div>ANCHOR: HEAD</div>
          <div>ANIM: FLOAT</div>
        </div>
      </div>

      {/* Footer controls */}
      <div className="p-3 flex items-center justify-between">
        <div className="flex gap-2">
          {["WIRE", "SOLID", "LIT"].map((mode, i) => (
            <span
              key={mode}
              className={`px-2 py-0.5 rounded text-[9px] font-mono border cursor-pointer transition-colors ${
                i === 2
                  ? "border-primary/40 text-primary bg-primary/10"
                  : "border-border text-muted-foreground hover:text-foreground hover:border-primary/30"
              }`}
            >
              {mode}
            </span>
          ))}
        </div>
        <span className="text-[9px] font-mono text-neon-green">60 FPS</span>
      </div>
    </motion.div>
  );
};

export default ModelPreview;
