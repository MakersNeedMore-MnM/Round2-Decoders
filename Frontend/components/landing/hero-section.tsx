"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck } from "lucide-react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const Threads = dynamic(() => import("@/components/backgrounds/threads"), { ssr: false });

export function HeroSection() {
  return (
    <section className="relative flex min-h-[92vh] w-full items-center justify-center overflow-hidden">
      <div className="absolute inset-0">
        <Threads color={[1, 1, 1]} amplitude={0.9} distance={0.25} enableMouseInteraction />
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-[#090909]/10 via-[#090909]/40 to-[#090909]" />

      <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Badge variant="silver" className="mb-6">
            <ShieldCheck className="h-3 w-3" />
            Guardrailed multi-agent intelligence
          </Badge>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-4xl font-semibold tracking-tight text-white sm:text-6xl"
        >
          The future of enterprise
          <br />
          <span className="text-gradient-silver">AI decision intelligence.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mt-6 max-w-xl text-balance text-base leading-relaxed text-white/50 sm:text-lg"
        >
          ProspectIQ orchestrates research, stakeholder mapping, and outreach strategy
          across explainable AI agents — every claim grounded, every risky output
          caught by a guardrail, every send approved by a human.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="mt-9 flex flex-col items-center gap-3 sm:flex-row"
        >
          <Link href="/login">
            <Button size="lg" className="group">
              Enter Workspace
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Button>
          </Link>
          <a href="#pipeline">
            <Button size="lg" variant="outline">
              See how it reasons
            </Button>
          </a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-14 flex items-center gap-6 text-[11px] uppercase tracking-widest text-white/25"
        >
          <span>Data grounding</span>
          <span className="h-1 w-1 rounded-full bg-white/20" />
          <span>Explainable reasoning</span>
          <span className="h-1 w-1 rounded-full bg-white/20" />
          <span>Human-in-the-loop</span>
        </motion.div>
      </div>
    </section>
  );
}
