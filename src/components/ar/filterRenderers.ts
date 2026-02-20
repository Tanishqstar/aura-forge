// AR Filter rendering functions — each draws a unique overlay on the canvas
// All drawing is relative to a detected "face center" (cx, cy) and face size (faceW, faceH)

export interface FaceRect {
  cx: number;
  cy: number;
  faceW: number;
  faceH: number;
}

export type FilterRenderer = (
  ctx: CanvasRenderingContext2D,
  face: FaceRect,
  tick: number,
  canvasW: number,
  canvasH: number
) => void;

// ─── CYBER CROWN ────────────────────────────────────────────────────────
export const drawCyberCrown: FilterRenderer = (ctx, { cx, cy, faceW, faceH }, tick) => {
  const crownY = cy - faceH * 0.6;
  const crownW = faceW * 1.1;
  const float = Math.sin(tick * 0.04) * 4;

  ctx.save();
  ctx.translate(cx, crownY + float);

  // Main crown body — gradient filled polygon
  const gradient = ctx.createLinearGradient(-crownW / 2, -30, crownW / 2, 10);
  gradient.addColorStop(0, "hsl(190, 100%, 55%)");
  gradient.addColorStop(0.5, "hsl(270, 100%, 65%)");
  gradient.addColorStop(1, "hsl(320, 100%, 60%)");

  ctx.beginPath();
  const spikes = 7;
  const baseH = 20;
  const spikeH = 45;
  for (let i = 0; i <= spikes; i++) {
    const x = -crownW / 2 + (crownW / spikes) * i;
    const isSpike = i % 1 === 0;
    if (i === 0) {
      ctx.moveTo(x, 0);
    }
    if (i < spikes) {
      const midX = x + crownW / spikes / 2;
      ctx.lineTo(midX, -spikeH - Math.sin(tick * 0.06 + i) * 5);
      ctx.lineTo(x + crownW / spikes, 0);
    }
  }
  ctx.lineTo(crownW / 2, baseH);
  ctx.lineTo(-crownW / 2, baseH);
  ctx.closePath();

  ctx.fillStyle = gradient;
  ctx.globalAlpha = 0.7;
  ctx.fill();

  ctx.strokeStyle = "hsl(190, 100%, 70%)";
  ctx.lineWidth = 1.5;
  ctx.shadowColor = "hsl(190, 100%, 60%)";
  ctx.shadowBlur = 15;
  ctx.globalAlpha = 1;
  ctx.stroke();

  // Floating data shards
  for (let i = 0; i < 12; i++) {
    const angle = (tick * 0.02 + i * 0.52);
    const radius = crownW * 0.6 + Math.sin(tick * 0.03 + i * 1.5) * 15;
    const sx = Math.cos(angle) * radius;
    const sy = -20 + Math.sin(angle * 1.3 + i) * 25;
    const size = 3 + Math.sin(tick * 0.05 + i) * 2;

    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(tick * 0.03 + i);
    ctx.fillStyle = i % 3 === 0 ? "hsl(320, 100%, 70%)" : i % 3 === 1 ? "hsl(190, 100%, 70%)" : "hsl(270, 100%, 75%)";
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 8;
    ctx.globalAlpha = 0.6 + Math.sin(tick * 0.08 + i) * 0.3;

    // Diamond shard shape
    ctx.beginPath();
    ctx.moveTo(0, -size * 2);
    ctx.lineTo(size, 0);
    ctx.lineTo(0, size * 2);
    ctx.lineTo(-size, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // Center gem
  ctx.beginPath();
  ctx.arc(0, -spikeH * 0.6, 6, 0, Math.PI * 2);
  ctx.fillStyle = "hsl(320, 100%, 70%)";
  ctx.shadowColor = "hsl(320, 100%, 60%)";
  ctx.shadowBlur = 20;
  ctx.globalAlpha = 0.8 + Math.sin(tick * 0.08) * 0.2;
  ctx.fill();

  ctx.restore();
};

// ─── HOLO WINGS ─────────────────────────────────────────────────────────
export const drawHoloWings: FilterRenderer = (ctx, { cx, cy, faceW, faceH }, tick) => {
  const shoulderY = cy + faceH * 0.3;
  const wingSpan = faceW * 2.2;
  const pulse = Math.sin(tick * 0.05) * 0.15 + 1;
  const flapAngle = Math.sin(tick * 0.04) * 0.12;

  ctx.save();
  ctx.translate(cx, shoulderY);

  // Draw wing pair
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.scale(side, 1);
    ctx.rotate(flapAngle * side);

    // Wing membrane — layered bezier curves
    for (let layer = 0; layer < 4; layer++) {
      const layerOffset = layer * 8;
      const alpha = 0.15 - layer * 0.03;
      const hue = 190 + layer * 30 + Math.sin(tick * 0.03) * 20;

      ctx.beginPath();
      ctx.moveTo(15, 0);
      ctx.bezierCurveTo(
        40 + layerOffset, -60 * pulse,
        wingSpan * 0.35 + layerOffset, -80 * pulse,
        wingSpan * 0.5 + layerOffset, -30 * pulse
      );
      ctx.bezierCurveTo(
        wingSpan * 0.45 + layerOffset, 30 * pulse,
        40 + layerOffset, 50 * pulse,
        15, 10
      );
      ctx.closePath();

      const grad = ctx.createLinearGradient(15, -80, wingSpan * 0.5, 30);
      grad.addColorStop(0, `hsla(${hue}, 100%, 70%, ${alpha})`);
      grad.addColorStop(0.5, `hsla(${hue + 40}, 100%, 60%, ${alpha * 1.5})`);
      grad.addColorStop(1, `hsla(${hue + 80}, 100%, 50%, ${alpha * 0.5})`);

      ctx.fillStyle = grad;
      ctx.fill();
    }

    // Wing veins
    ctx.strokeStyle = "hsla(190, 100%, 70%, 0.4)";
    ctx.lineWidth = 0.8;
    ctx.shadowColor = "hsl(190, 100%, 60%)";
    ctx.shadowBlur = 5;
    for (let v = 0; v < 5; v++) {
      const angle = -0.8 + v * 0.35;
      const len = wingSpan * (0.25 + v * 0.05) * pulse;
      ctx.beginPath();
      ctx.moveTo(15, 5);
      ctx.quadraticCurveTo(
        Math.cos(angle) * len * 0.5, Math.sin(angle) * len * 0.5 - 10,
        Math.cos(angle) * len, Math.sin(angle) * len
      );
      ctx.stroke();
    }

    // Prismatic trail particles
    for (let p = 0; p < 8; p++) {
      const px = 30 + Math.random() * wingSpan * 0.4;
      const py = -40 + Math.random() * 80;
      const sparkle = Math.sin(tick * 0.1 + p * 2) * 0.5 + 0.5;
      const hue = 190 + p * 20 + tick * 2;

      ctx.beginPath();
      ctx.arc(px, py * pulse, 1.5 + sparkle * 2, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${hue % 360}, 100%, 75%, ${sparkle * 0.7})`;
      ctx.shadowColor = `hsl(${hue % 360}, 100%, 60%)`;
      ctx.shadowBlur = 10;
      ctx.fill();
    }

    ctx.restore();
  }

  ctx.restore();
};

// ─── ICE MASK ───────────────────────────────────────────────────────────
export const drawIceMask: FilterRenderer = (ctx, { cx, cy, faceW, faceH }, tick) => {
  ctx.save();
  ctx.translate(cx, cy);

  const maskW = faceW * 0.55;
  const maskH = faceH * 0.35;

  // Frosted mask shape over eyes area
  const gradient = ctx.createRadialGradient(0, -10, maskW * 0.2, 0, 0, maskW * 1.2);
  gradient.addColorStop(0, "hsla(200, 100%, 90%, 0.25)");
  gradient.addColorStop(0.5, "hsla(200, 80%, 70%, 0.15)");
  gradient.addColorStop(1, "hsla(210, 60%, 50%, 0.05)");

  // Mask body
  ctx.beginPath();
  ctx.ellipse(0, -faceH * 0.08, maskW, maskH, 0, 0, Math.PI * 2);
  ctx.fillStyle = gradient;
  ctx.fill();

  // Crystal edges
  ctx.strokeStyle = "hsla(200, 100%, 80%, 0.6)";
  ctx.lineWidth = 1;
  ctx.shadowColor = "hsl(200, 100%, 80%)";
  ctx.shadowBlur = 12;
  ctx.stroke();

  // Crystal spikes on top
  for (let i = 0; i < 9; i++) {
    const angle = -Math.PI * 0.7 + (Math.PI * 0.4 / 8) * i + (i >= 5 ? Math.PI * 0.3 : 0);
    const baseX = Math.cos(angle) * maskW;
    const baseY = Math.sin(angle) * maskH - faceH * 0.08;
    const spikeLen = 15 + Math.sin(tick * 0.05 + i * 0.8) * 8;
    const spikeAngle = angle - Math.PI * 0.5;

    ctx.beginPath();
    ctx.moveTo(baseX - 3, baseY);
    ctx.lineTo(baseX + Math.cos(spikeAngle) * spikeLen, baseY + Math.sin(spikeAngle) * spikeLen);
    ctx.lineTo(baseX + 3, baseY);
    ctx.closePath();

    const hue = 195 + i * 3;
    ctx.fillStyle = `hsla(${hue}, 100%, 85%, ${0.3 + Math.sin(tick * 0.04 + i) * 0.15})`;
    ctx.shadowColor = `hsl(${hue}, 100%, 80%)`;
    ctx.shadowBlur = 8;
    ctx.fill();
  }

  // Frost particles
  for (let i = 0; i < 20; i++) {
    const angle = tick * 0.01 + i * 0.32;
    const radius = maskW * 0.8 + Math.sin(tick * 0.02 + i * 1.1) * 20;
    const px = Math.cos(angle) * radius;
    const py = Math.sin(angle) * radius * 0.6 - faceH * 0.08;
    const size = Math.max(0.1, 1 + Math.sin(tick * 0.06 + i * 0.7) * 1.5);
    const alpha = 0.3 + Math.sin(tick * 0.05 + i * 1.3) * 0.3;

    ctx.beginPath();
    ctx.arc(px, py, size, 0, Math.PI * 2);
    ctx.fillStyle = `hsla(200, 100%, 90%, ${alpha})`;
    ctx.shadowColor = "hsl(200, 100%, 85%)";
    ctx.shadowBlur = 6;
    ctx.fill();
  }

  ctx.restore();
};

// ─── BIOLUMINESCENT HALO ────────────────────────────────────────────────
export const drawBioHalo: FilterRenderer = (ctx, { cx, cy, faceW, faceH }, tick) => {
  ctx.save();
  ctx.translate(cx, cy - faceH * 0.65);

  const haloR = faceW * 0.7;
  const float = Math.sin(tick * 0.03) * 3;

  // Outer glow ring
  for (let ring = 0; ring < 3; ring++) {
    const r = haloR + ring * 8 + float;
    const alpha = 0.12 - ring * 0.03;

    ctx.beginPath();
    ctx.ellipse(0, 0, r, r * 0.3, 0, 0, Math.PI * 2);
    ctx.strokeStyle = `hsla(150, 100%, 60%, ${alpha + Math.sin(tick * 0.04) * 0.05})`;
    ctx.lineWidth = 2 - ring * 0.5;
    ctx.shadowColor = "hsl(150, 100%, 50%)";
    ctx.shadowBlur = 15 - ring * 3;
    ctx.stroke();
  }

  // Main halo ring
  ctx.beginPath();
  ctx.ellipse(0, 0 + float, haloR, haloR * 0.3, 0, 0, Math.PI * 2);
  const haloGrad = ctx.createLinearGradient(-haloR, 0, haloR, 0);
  haloGrad.addColorStop(0, "hsla(150, 100%, 60%, 0.4)");
  haloGrad.addColorStop(0.3, "hsla(180, 100%, 55%, 0.6)");
  haloGrad.addColorStop(0.7, "hsla(280, 100%, 60%, 0.5)");
  haloGrad.addColorStop(1, "hsla(150, 100%, 60%, 0.4)");
  ctx.strokeStyle = haloGrad;
  ctx.lineWidth = 3;
  ctx.shadowColor = "hsl(150, 100%, 55%)";
  ctx.shadowBlur = 20;
  ctx.stroke();

  // Tentacle tendrils hanging down
  for (let t = 0; t < 8; t++) {
    const startAngle = t * (Math.PI / 4) + 0.2;
    const startX = Math.cos(startAngle) * haloR * 0.9;
    const startY = Math.sin(startAngle) * haloR * 0.25 + float;

    const tendrilLen = 40 + t * 8;
    const sway = Math.sin(tick * 0.03 + t * 0.8) * 15;

    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.bezierCurveTo(
      startX + sway, startY + tendrilLen * 0.3,
      startX - sway * 0.5, startY + tendrilLen * 0.7,
      startX + sway * 0.3, startY + tendrilLen
    );

    const tHue = 150 + t * 15;
    ctx.strokeStyle = `hsla(${tHue}, 100%, 60%, ${0.25 + Math.sin(tick * 0.04 + t) * 0.1})`;
    ctx.lineWidth = 2 - t * 0.1;
    ctx.shadowColor = `hsl(${tHue}, 100%, 55%)`;
    ctx.shadowBlur = 8;
    ctx.stroke();

    // Bioluminescent nodes along tendril
    for (let n = 0; n < 3; n++) {
      const nt = (n + 1) / 4;
      const nx = startX + sway * nt * (n % 2 === 0 ? 1 : -0.5);
      const ny = startY + tendrilLen * nt;
      const nodeSize = 2 + Math.sin(tick * 0.07 + t + n) * 1.5;

      ctx.beginPath();
      ctx.arc(nx, ny, nodeSize, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${tHue + 20}, 100%, 75%, ${0.5 + Math.sin(tick * 0.06 + t * 0.5 + n) * 0.3})`;
      ctx.shadowColor = `hsl(${tHue}, 100%, 65%)`;
      ctx.shadowBlur = 12;
      ctx.fill();
    }
  }

  ctx.restore();
};

// ─── AI-Generated Dynamic Renderer ──────────────────────────────────────
export interface AIFilterParams {
  name: string;
  filterType: "crown" | "wings" | "mask" | "halo" | "particles" | "geometric";
  anchorPoint: string;
  animation: string;
  primaryColor: { h: number; s: number; l: number };
  secondaryColor: { h: number; s: number; l: number };
  accentColor: { h: number; s: number; l: number };
  particleCount: number;
  glowIntensity: number;
  scale: number;
  speed: number;
  description: string;
}

const hsl = (c: { h: number; s: number; l: number }, a?: number) =>
  a !== undefined ? `hsla(${c.h}, ${c.s}%, ${c.l}%, ${a})` : `hsl(${c.h}, ${c.s}%, ${c.l}%)`;

export const createDynamicRenderer = (params: AIFilterParams): FilterRenderer => {
  const { filterType, primaryColor, secondaryColor, accentColor, particleCount, glowIntensity, scale, speed } = params;

  return (ctx, { cx, cy, faceW, faceH }, tick) => {
    ctx.save();
    const s = scale;
    const spd = speed;

    if (filterType === "crown") {
      const crownY = cy - faceH * 0.6;
      const crownW = faceW * 1.1 * s;
      const float = Math.sin(tick * 0.04 * spd) * 4;
      ctx.save();
      ctx.translate(cx, crownY + float);

      const gradient = ctx.createLinearGradient(-crownW / 2, -30, crownW / 2, 10);
      gradient.addColorStop(0, hsl(primaryColor));
      gradient.addColorStop(0.5, hsl(secondaryColor));
      gradient.addColorStop(1, hsl(accentColor));

      const spikes = 7;
      const spikeH = 45 * s;
      ctx.beginPath();
      for (let i = 0; i <= spikes; i++) {
        const x = -crownW / 2 + (crownW / spikes) * i;
        if (i === 0) ctx.moveTo(x, 0);
        if (i < spikes) {
          const midX = x + crownW / spikes / 2;
          ctx.lineTo(midX, -spikeH - Math.sin(tick * 0.06 * spd + i) * 5);
          ctx.lineTo(x + crownW / spikes, 0);
        }
      }
      ctx.lineTo(crownW / 2, 20);
      ctx.lineTo(-crownW / 2, 20);
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.globalAlpha = 0.7;
      ctx.fill();
      ctx.strokeStyle = hsl(primaryColor, 0.8);
      ctx.lineWidth = 1.5;
      ctx.shadowColor = hsl(primaryColor);
      ctx.shadowBlur = glowIntensity;
      ctx.globalAlpha = 1;
      ctx.stroke();

      for (let i = 0; i < particleCount; i++) {
        const angle = tick * 0.02 * spd + i * (Math.PI * 2 / particleCount);
        const radius = crownW * 0.6 + Math.sin(tick * 0.03 * spd + i * 1.5) * 15;
        const sx = Math.cos(angle) * radius;
        const sy = -20 + Math.sin(angle * 1.3 + i) * 25;
        const sz = Math.max(0.5, 3 + Math.sin(tick * 0.05 * spd + i) * 2);
        ctx.save();
        ctx.translate(sx, sy);
        ctx.rotate(tick * 0.03 * spd + i);
        const colors = [primaryColor, secondaryColor, accentColor];
        ctx.fillStyle = hsl(colors[i % 3], 0.7);
        ctx.shadowColor = hsl(colors[i % 3]);
        ctx.shadowBlur = glowIntensity * 0.5;
        ctx.beginPath();
        ctx.moveTo(0, -sz * 2);
        ctx.lineTo(sz, 0);
        ctx.lineTo(0, sz * 2);
        ctx.lineTo(-sz, 0);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
      ctx.restore();

    } else if (filterType === "wings") {
      const shoulderY = cy + faceH * 0.3;
      const wingSpan = faceW * 2.2 * s;
      const pulse = Math.sin(tick * 0.05 * spd) * 0.15 + 1;
      const flapAngle = Math.sin(tick * 0.04 * spd) * 0.12;
      ctx.save();
      ctx.translate(cx, shoulderY);

      for (const side of [-1, 1]) {
        ctx.save();
        ctx.scale(side, 1);
        ctx.rotate(flapAngle * side);
        for (let layer = 0; layer < 4; layer++) {
          const lo = layer * 8;
          const alpha = 0.15 - layer * 0.03;
          const color = [primaryColor, secondaryColor, accentColor, primaryColor][layer];
          ctx.beginPath();
          ctx.moveTo(15, 0);
          ctx.bezierCurveTo(40 + lo, -60 * pulse, wingSpan * 0.35 + lo, -80 * pulse, wingSpan * 0.5 + lo, -30 * pulse);
          ctx.bezierCurveTo(wingSpan * 0.45 + lo, 30 * pulse, 40 + lo, 50 * pulse, 15, 10);
          ctx.closePath();
          ctx.fillStyle = hsl(color, alpha);
          ctx.fill();
        }
        for (let p = 0; p < Math.min(particleCount, 10); p++) {
          const px = 30 + Math.random() * wingSpan * 0.4;
          const py = -40 + Math.random() * 80;
          const sparkle = Math.sin(tick * 0.1 * spd + p * 2) * 0.5 + 0.5;
          ctx.beginPath();
          ctx.arc(px, py * pulse, Math.max(0.5, 1.5 + sparkle * 2), 0, Math.PI * 2);
          ctx.fillStyle = hsl(accentColor, sparkle * 0.7);
          ctx.shadowColor = hsl(accentColor);
          ctx.shadowBlur = glowIntensity * 0.5;
          ctx.fill();
        }
        ctx.restore();
      }
      ctx.restore();

    } else if (filterType === "mask") {
      ctx.save();
      ctx.translate(cx, cy);
      const maskW = faceW * 0.55 * s;
      const maskH = faceH * 0.35 * s;
      const gradient = ctx.createRadialGradient(0, -10, maskW * 0.2, 0, 0, maskW * 1.2);
      gradient.addColorStop(0, hsl(primaryColor, 0.25));
      gradient.addColorStop(0.5, hsl(secondaryColor, 0.15));
      gradient.addColorStop(1, hsl(accentColor, 0.05));
      ctx.beginPath();
      ctx.ellipse(0, -faceH * 0.08, maskW, maskH, 0, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();
      ctx.strokeStyle = hsl(primaryColor, 0.6);
      ctx.lineWidth = 1;
      ctx.shadowColor = hsl(primaryColor);
      ctx.shadowBlur = glowIntensity;
      ctx.stroke();

      for (let i = 0; i < 9; i++) {
        const angle = -Math.PI * 0.7 + (Math.PI * 0.4 / 8) * i + (i >= 5 ? Math.PI * 0.3 : 0);
        const baseX = Math.cos(angle) * maskW;
        const baseY = Math.sin(angle) * maskH - faceH * 0.08;
        const spikeLen = (15 + Math.sin(tick * 0.05 * spd + i * 0.8) * 8) * s;
        const spikeAngle = angle - Math.PI * 0.5;
        ctx.beginPath();
        ctx.moveTo(baseX - 3, baseY);
        ctx.lineTo(baseX + Math.cos(spikeAngle) * spikeLen, baseY + Math.sin(spikeAngle) * spikeLen);
        ctx.lineTo(baseX + 3, baseY);
        ctx.closePath();
        ctx.fillStyle = hsl(secondaryColor, 0.3 + Math.sin(tick * 0.04 * spd + i) * 0.15);
        ctx.shadowColor = hsl(secondaryColor);
        ctx.shadowBlur = glowIntensity * 0.5;
        ctx.fill();
      }

      for (let i = 0; i < particleCount; i++) {
        const angle = tick * 0.01 * spd + i * 0.32;
        const radius = maskW * 0.8 + Math.sin(tick * 0.02 * spd + i * 1.1) * 20;
        const px = Math.cos(angle) * radius;
        const py = Math.sin(angle) * radius * 0.6 - faceH * 0.08;
        const sz = Math.max(0.1, 1 + Math.sin(tick * 0.06 * spd + i * 0.7) * 1.5);
        ctx.beginPath();
        ctx.arc(px, py, sz, 0, Math.PI * 2);
        ctx.fillStyle = hsl(accentColor, 0.5);
        ctx.shadowColor = hsl(accentColor);
        ctx.shadowBlur = glowIntensity * 0.3;
        ctx.fill();
      }
      ctx.restore();

    } else if (filterType === "halo") {
      ctx.save();
      ctx.translate(cx, cy - faceH * 0.65);
      const haloR = faceW * 0.7 * s;
      const float = Math.sin(tick * 0.03 * spd) * 3;

      ctx.beginPath();
      ctx.ellipse(0, float, haloR, haloR * 0.3, 0, 0, Math.PI * 2);
      const haloGrad = ctx.createLinearGradient(-haloR, 0, haloR, 0);
      haloGrad.addColorStop(0, hsl(primaryColor, 0.4));
      haloGrad.addColorStop(0.5, hsl(secondaryColor, 0.6));
      haloGrad.addColorStop(1, hsl(accentColor, 0.4));
      ctx.strokeStyle = haloGrad;
      ctx.lineWidth = 3;
      ctx.shadowColor = hsl(primaryColor);
      ctx.shadowBlur = glowIntensity;
      ctx.stroke();

      for (let t = 0; t < Math.min(particleCount, 8); t++) {
        const startAngle = t * (Math.PI / 4) + 0.2;
        const startX = Math.cos(startAngle) * haloR * 0.9;
        const startY = Math.sin(startAngle) * haloR * 0.25 + float;
        const tendrilLen = (40 + t * 8) * s;
        const sway = Math.sin(tick * 0.03 * spd + t * 0.8) * 15;

        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.bezierCurveTo(startX + sway, startY + tendrilLen * 0.3, startX - sway * 0.5, startY + tendrilLen * 0.7, startX + sway * 0.3, startY + tendrilLen);
        const colors = [primaryColor, secondaryColor, accentColor];
        ctx.strokeStyle = hsl(colors[t % 3], 0.3);
        ctx.lineWidth = 2;
        ctx.shadowColor = hsl(colors[t % 3]);
        ctx.shadowBlur = glowIntensity * 0.4;
        ctx.stroke();

        for (let n = 0; n < 3; n++) {
          const nt = (n + 1) / 4;
          const nx = startX + sway * nt * (n % 2 === 0 ? 1 : -0.5);
          const ny = startY + tendrilLen * nt;
          const nodeSize = Math.max(0.5, 2 + Math.sin(tick * 0.07 * spd + t + n) * 1.5);
          ctx.beginPath();
          ctx.arc(nx, ny, nodeSize, 0, Math.PI * 2);
          ctx.fillStyle = hsl(accentColor, 0.6);
          ctx.shadowColor = hsl(accentColor);
          ctx.shadowBlur = glowIntensity * 0.6;
          ctx.fill();
        }
      }
      ctx.restore();

    } else if (filterType === "particles" || filterType === "geometric") {
      // Universal particle/geometric aura
      ctx.save();
      ctx.translate(cx, cy - faceH * 0.1);
      const auraR = faceW * 0.8 * s;

      for (let i = 0; i < particleCount; i++) {
        const angle = tick * 0.015 * spd + i * (Math.PI * 2 / particleCount);
        const r = auraR + Math.sin(tick * 0.02 * spd + i * 0.7) * 20;
        const px = Math.cos(angle) * r;
        const py = Math.sin(angle) * r * 0.7;
        const sz = Math.max(0.5, 2 + Math.sin(tick * 0.05 * spd + i) * 2);
        const colors = [primaryColor, secondaryColor, accentColor];
        const color = colors[i % 3];
        const alpha = 0.4 + Math.sin(tick * 0.04 * spd + i * 1.2) * 0.3;

        ctx.beginPath();
        if (filterType === "geometric") {
          // Draw small polygons
          const sides = 3 + (i % 4);
          for (let s2 = 0; s2 <= sides; s2++) {
            const a = (s2 / sides) * Math.PI * 2 + tick * 0.02 * spd;
            const method = s2 === 0 ? "moveTo" : "lineTo";
            ctx[method](px + Math.cos(a) * sz * 2, py + Math.sin(a) * sz * 2);
          }
          ctx.closePath();
          ctx.strokeStyle = hsl(color, alpha);
          ctx.lineWidth = 1;
          ctx.shadowColor = hsl(color);
          ctx.shadowBlur = glowIntensity * 0.4;
          ctx.stroke();
        } else {
          ctx.arc(px, py, sz, 0, Math.PI * 2);
          ctx.fillStyle = hsl(color, alpha);
          ctx.shadowColor = hsl(color);
          ctx.shadowBlur = glowIntensity * 0.4;
          ctx.fill();
        }
      }

      // Connecting lines
      if (filterType === "geometric") {
        ctx.globalAlpha = 0.1;
        ctx.strokeStyle = hsl(primaryColor);
        ctx.lineWidth = 0.5;
        for (let i = 0; i < Math.min(particleCount, 12); i++) {
          const a1 = tick * 0.015 * spd + i * (Math.PI * 2 / particleCount);
          const r1 = auraR + Math.sin(tick * 0.02 * spd + i * 0.7) * 20;
          const a2 = tick * 0.015 * spd + ((i + 2) % particleCount) * (Math.PI * 2 / particleCount);
          const r2 = auraR + Math.sin(tick * 0.02 * spd + ((i + 2) % particleCount) * 0.7) * 20;
          ctx.beginPath();
          ctx.moveTo(Math.cos(a1) * r1, Math.sin(a1) * r1 * 0.7);
          ctx.lineTo(Math.cos(a2) * r2, Math.sin(a2) * r2 * 0.7);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }

      ctx.restore();
    }

    ctx.restore();
  };
};

// ─── Registry ───────────────────────────────────────────────────────────
export const filterRenderers: Record<string, FilterRenderer> = {
  "preset-1": drawCyberCrown,
  "preset-2": drawHoloWings,
};

// For generated filters, assign a renderer based on prompt keywords
export const getRendererForPrompt = (prompt: string): FilterRenderer => {
  const lower = prompt.toLowerCase();
  if (lower.includes("crown") || lower.includes("tiara") || lower.includes("cyber")) return drawCyberCrown;
  if (lower.includes("wing") || lower.includes("butterfly") || lower.includes("holo")) return drawHoloWings;
  if (lower.includes("ice") || lower.includes("frost") || lower.includes("crystal") || lower.includes("mask")) return drawIceMask;
  if (lower.includes("halo") || lower.includes("tentacle") || lower.includes("bio") || lower.includes("luminescent")) return drawBioHalo;

  const all = [drawCyberCrown, drawHoloWings, drawIceMask, drawBioHalo];
  const hash = prompt.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return all[hash % all.length];
};
