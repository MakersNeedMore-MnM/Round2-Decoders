"use client";

import { motion } from "framer-motion";

/**
 * AuroraBackground — extremely subtle, silver/platinum metallic gradients.
 * No purple, no rainbow, no blue-purple "AI" gradient cliché. Implemented
 * as lightweight CSS/SVG blobs (not WebGL) since it needs to render behind
 * every app screen simultaneously without competing with charts and graphs
 * for GPU budget. Never reduces readability — content always sits above it
 * on a near-opaque surface.
 */
export function AuroraBackground({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#090909] ${className}`}
    >
      <motion.div
        className="absolute -top-[20%] left-[10%] h-[60vh] w-[60vh] rounded-full opacity-[0.07] blur-[110px]"
        style={{
          background:
            "radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(200,200,200,0.4) 45%, transparent 70%)",
        }}
        animate={{ x: [0, 40, -20, 0], y: [0, 20, -10, 0] }}
        transition={{ duration: 28, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-[30%] right-[5%] h-[50vh] w-[50vh] rounded-full opacity-[0.05] blur-[120px]"
        style={{
          background:
            "radial-gradient(circle, rgba(229,228,226,0.8) 0%, rgba(150,150,150,0.3) 50%, transparent 70%)",
        }}
        animate={{ x: [0, -30, 15, 0], y: [0, -25, 10, 0] }}
        transition={{ duration: 34, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-[-10%] left-[35%] h-[55vh] w-[55vh] rounded-full opacity-[0.05] blur-[130px]"
        style={{
          background:
            "radial-gradient(circle, rgba(255,255,255,0.7) 0%, rgba(180,180,180,0.25) 50%, transparent 70%)",
        }}
        animate={{ x: [0, 25, -25, 0], y: [0, -15, 15, 0] }}
        transition={{ duration: 40, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="absolute inset-0 noise-overlay" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#090909]/40 via-transparent to-[#090909]/60" />
    </div>
  );
}
