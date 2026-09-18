"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CTASection() {
  return (
    <section className="relative mx-auto max-w-3xl px-6 py-28 text-center">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Give your revenue team an AI they can actually cite.
        </h2>
        <p className="mx-auto mt-4 max-w-md text-sm text-white/45">
          Start with one account. Watch every claim trace back to a source before
          you send anything.
        </p>
        <div className="mt-8 flex justify-center">
          <Link href="/login">
            <Button size="lg" className="group">
              Enter Workspace
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Button>
          </Link>
        </div>
      </motion.div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-white/6 px-6 py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
        <p className="text-xs text-white/30">© 2026 ProspectIQ. Enterprise AI decision intelligence.</p>
        <div className="flex items-center gap-5 text-xs text-white/35">
          <a href="#platform" className="hover:text-white/70 transition-colors">Platform</a>
          <a href="#comparison" className="hover:text-white/70 transition-colors">Why ProspectIQ</a>
          <Link href="/login" className="hover:text-white/70 transition-colors">Sign in</Link>
        </div>
      </div>
    </footer>
  );
}
