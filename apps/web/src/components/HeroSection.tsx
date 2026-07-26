"use client";
import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

/* GEEK PROTOCOL landing hero — rebuilt from the brand reference comp.
   Flat solid fills only, hard offset shadows (zero blur), token colors from
   globals.css. Two columns on md+: copy left, mascot floating free right. */

export function HeroSection() {
  const reduced = useReducedMotion();

  const container = {
    hidden: {},
    show: { transition: { staggerChildren: 0.09 } },
  };

  const item = reduced
    ? {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { duration: 0.25 } },
      }
    : {
        hidden: { opacity: 0, y: 14 },
        show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: "easeOut" as const } },
      };

  return (
    <section className="relative overflow-hidden bg-[var(--gp-bg)]">
      <div className="gp-dot-grid" />

      <div className="relative mx-auto grid max-w-[1400px] items-center gap-14 px-6 pb-16 pt-16 sm:pb-20 sm:pt-20 lg:grid-cols-2 lg:gap-10 lg:px-10 lg:pb-24 lg:pt-24 xl:gap-16 xl:pb-32 xl:pt-28">
        {/* ── Copy column ── */}
        <motion.div variants={container} initial="hidden" animate="show" className="flex min-w-0 flex-col items-start">
          <motion.div variants={item} className="flat-badge gp-mono text-[0.7rem] sm:text-xs">
            <span className="h-2 w-2 rounded-full bg-[var(--gp-white)]" />
            Live on Kaspa · KRC-20 native
          </motion.div>

          {/* WORDMARK SLOT — the chunky beveled "GEEK / PROTOCOL" lockup.
             Swap the two spans below for the static wordmark asset
             (public/hero-wordmark.svg|png) when design delivers it; keep the
             sr-only h1 text for accessibility when doing so. Until then this
             renders the CSS hard-extrusion treatment at reference scale. */}
          <motion.h1 variants={item} className="gp-wordmark mt-8 w-full leading-none sm:mt-10">
            {/* Fluid clamp() sizing — scales continuously with viewport width
               instead of snapping between fixed sizes at each breakpoint.
               One deliberate step at lg (1024px): that's where the mascot
               moves from below the text to beside it, so the column really
               does get narrower and the text really should get smaller. */}
            <span className="block origin-left -skew-x-[8deg] text-[clamp(3rem,1.9rem+4.5vw,4.5rem)] gp-wordmark-cyan lg:text-[clamp(2.25rem,0.75rem+2.3vw,3.75rem)]">GEEK</span>
            <span className="mt-0 block origin-left -skew-x-[8deg] text-[clamp(3rem,1.9rem+4.5vw,4.5rem)] gp-wordmark-pink lg:text-[clamp(2.25rem,0.75rem+2.3vw,3.75rem)]">PROTOCOL</span>
          </motion.h1>

          <motion.p variants={item} className="mt-9 max-w-[520px] text-lg font-bold text-white md:text-xl">
            A Quiz2Earn ecosystem… kinda a whole knowledge economy.
          </motion.p>

          <motion.div variants={item} className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/auth/register"
              className="inline-flex items-center gap-2 rounded-xl border-2 border-[var(--ink)] bg-[var(--gp-pink)] px-8 py-4 text-base font-bold text-white shadow-[5px_5px_0px_0px_var(--gp-pink-dark)] transition-[transform,box-shadow] duration-100 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[7px_7px_0px_0px_var(--gp-pink-dark)] active:translate-x-1 active:translate-y-1 active:shadow-none"
            >
              Get Started →
            </Link>
            <Link
              href="/auth/login"
              className="inline-flex items-center rounded-xl border-2 border-[var(--border-soft)] bg-transparent px-8 py-4 text-base font-bold text-white transition-colors duration-100 hover:border-[var(--gp-cyan)] hover:text-[var(--gp-cyan)]"
            >
              Sign In
            </Link>
          </motion.div>
        </motion.div>

        {/* ── Mascot — floats free beside the copy, never boxed/cropped ── */}
        <motion.div
          className="flex justify-center lg:justify-end"
          initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.9, y: 24 }}
          animate={reduced ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
          transition={
            reduced
              ? { duration: 0.3 }
              : { type: "spring", stiffness: 260, damping: 18, delay: 0.15 }
          }
        >
          <motion.div
            animate={reduced ? undefined : { y: [0, -10, 0] }}
            transition={
              reduced
                ? undefined
                : { duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.8 }
            }
          >
            <Image
              src="/mascot-giga.png"
              alt="GIGA — the Geek Protocol mascot waving"
              width={1536}
              height={1024}
              priority
              className="h-auto max-w-full w-[clamp(18rem,12rem+34vw,34rem)] lg:w-[clamp(22rem,6rem+26vw,44rem)]"
            />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
