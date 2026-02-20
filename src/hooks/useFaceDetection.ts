import { useRef, useCallback, useEffect, useState } from "react";
import { type FaceRect } from "@/components/ar/filterRenderers";

// Use the browser's FaceDetector API (Chromium) with center fallback
const hasFaceDetector = typeof window !== "undefined" && "FaceDetector" in window;

export const useFaceDetection = (
  videoRef: React.RefObject<HTMLVideoElement>,
  canvasWidth: number,
  canvasHeight: number,
  enabled: boolean
) => {
  const detectorRef = useRef<any>(null);
  const lastFaceRef = useRef<FaceRect | null>(null);
  const [faceDetected, setFaceDetected] = useState(false);

  useEffect(() => {
    if (!enabled || !hasFaceDetector) return;
    try {
      // @ts-ignore - FaceDetector is not in TS types
      detectorRef.current = new window.FaceDetector({ fastMode: true, maxDetectedFaces: 1 });
    } catch {
      detectorRef.current = null;
    }
  }, [enabled]);

  const detectFace = useCallback(async (): Promise<FaceRect> => {
    const fallback: FaceRect = {
      cx: canvasWidth / 2,
      cy: canvasHeight / 2 - canvasHeight * 0.04,
      faceW: canvasWidth * 0.22,
      faceH: canvasHeight * 0.36,
    };

    if (!enabled || !videoRef.current || videoRef.current.readyState < 2) {
      setFaceDetected(false);
      return lastFaceRef.current || fallback;
    }

    if (detectorRef.current) {
      try {
        const faces = await detectorRef.current.detect(videoRef.current);
        if (faces.length > 0) {
          const box = faces[0].boundingBox;
          const face: FaceRect = {
            cx: box.x + box.width / 2,
            cy: box.y + box.height / 2,
            faceW: box.width / 2,
            faceH: box.height / 2,
          };
          lastFaceRef.current = face;
          setFaceDetected(true);
          return face;
        }
      } catch {
        // Detection failed, use fallback
      }
    }

    // No face detected — smoothly return to last known or center
    if (lastFaceRef.current) {
      // Gradually drift back to center
      const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
      lastFaceRef.current = {
        cx: lerp(lastFaceRef.current.cx, fallback.cx, 0.05),
        cy: lerp(lastFaceRef.current.cy, fallback.cy, 0.05),
        faceW: lerp(lastFaceRef.current.faceW, fallback.faceW, 0.05),
        faceH: lerp(lastFaceRef.current.faceH, fallback.faceH, 0.05),
      };
      setFaceDetected(false);
      return lastFaceRef.current;
    }

    setFaceDetected(false);
    return fallback;
  }, [canvasWidth, canvasHeight, enabled, videoRef]);

  return { detectFace, faceDetected, hasFaceTracking: hasFaceDetector };
};
