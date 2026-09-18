"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/common/logo";

const LINKS = [
  { label: "Platform", href: "#platform" },
  { label: "How it works", href: "#pipeline" },
  { label: "Why ProspectIQ", href: "#comparison" },
  { label: "Product", href: "#showcase" },
];

export function FloatingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.div
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="fixed inset-x-0 top-4 z-50 flex justify-center px-4"
    >
      <nav
        className={cn(
          "flex w-full max-w-4xl items-center justify-between rounded-2xl border px-4 py-2.5 transition-all duration-300",
          scrolled
            ? "border-white/10 bg-[#0c0c0c]/85 backdrop-blur-xl shadow-premium"
            : "border-white/5 bg-white/[0.02] backdrop-blur-md",
        )}
      >
        <Link href="/" className="flex items-center">
          <Logo height={22} priority />
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-1.5 text-[13px] text-white/55 hover:text-white hover:bg-white/[0.05] transition-colors"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-2">
          <Link href="/login">
            <Button variant="ghost" size="sm">
              Sign in
            </Button>
          </Link>
          <Link href="/login">
            <Button size="sm">Request access</Button>
          </Link>
        </div>

        <button
          className="md:hidden rounded-lg p-2 text-white/70"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </nav>

      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-16 w-[calc(100%-2rem)] max-w-4xl rounded-2xl border border-white/10 bg-[#0c0c0c]/95 backdrop-blur-xl p-3 md:hidden"
        >
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="block rounded-lg px-3 py-2.5 text-sm text-white/60 hover:text-white hover:bg-white/[0.05]"
            >
              {link.label}
            </a>
          ))}
          <div className="mt-2 flex gap-2 px-1">
            <Link href="/login" className="flex-1">
              <Button variant="outline" size="sm" className="w-full">
                Sign in
              </Button>
            </Link>
            <Link href="/login" className="flex-1">
              <Button size="sm" className="w-full">
                Request access
              </Button>
            </Link>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
