"use client";

import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-[#070709]">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="flex flex-col items-center gap-6"
      >
        <div className="relative flex h-24 w-24 items-center justify-center">
          {/* Outer glow ring */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="absolute h-full w-full rounded-full border-[1.5px] border-dashed border-[#7C5CFF]/30"
          />
          {/* Inner solid ring */}
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="absolute h-16 w-16 rounded-full border border-t-[#00E5A0] border-r-transparent border-b-transparent border-l-transparent"
          />
          <Loader2 className="h-8 w-8 animate-spin text-[#7C5CFF]" />
        </div>

        <div className="flex flex-col items-center gap-2">
          <motion.h3
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="font-syne text-lg font-semibold tracking-wide text-white"
          >
            INITIALIZING
          </motion.h3>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#8888A0]">
            Establishing connection...
          </p>
        </div>
      </motion.div>
    </div>
  );
}
