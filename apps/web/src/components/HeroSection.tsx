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

      <div className="relative mx-auto grid max-w-[1700px] items-center gap-8 px-6 pb-10 pt-10 sm:pb-14 sm:pt-14 lg:grid-cols-[1fr_1.3fr] lg:gap-8 lg:px-10 lg:pb-16 lg:pt-16 xl:gap-12 xl:pb-20 xl:pt-20">
        {/* ── Copy column ── */}
        <motion.div variants={container} initial="hidden" animate="show" className="flex min-w-0 flex-col items-start">
          <motion.div variants={item} className="flat-badge gp-mono text-[0.91rem] sm:text-[0.98rem]" style={{ padding: "1.17rem 2.6rem" }}>
            <span className="h-[0.65rem] w-[0.65rem] rounded-full bg-[var(--gp-white)]" />
            Public Alpha · Live KRC-20 token on Kaspa
          </motion.div>

          {/* WORDMARK SLOT — the chunky beveled "GEEK / PROTOCOL" lockup.
             Swap the two spans below for the static wordmark asset
             (public/hero-wordmark.svg|png) when design delivers it; keep the
             sr-only h1 text for accessibility when doing so. Until then this
             renders the CSS hard-extrusion treatment at reference scale. */}
          <motion.h1 variants={item} className="gp-wordmark mt-5 w-full leading-none sm:mt-6">
            {/* Fluid clamp() sizing — scales continuously with viewport width
               instead of snapping between fixed sizes at each breakpoint.
               One deliberate step at lg (1024px): that's where the mascot
               moves from below the text to beside it, so the column really
               does get narrower and the text really should get smaller. */}
            <span className="block origin-left -skew-x-[8deg] text-[clamp(4.9rem,3rem+7.2vw,7.15rem)] gp-wordmark-cyan lg:text-[clamp(3.8rem,1.3rem+3.9vw,6.2rem)]">GEEK</span>
            <span className="mt-0 block origin-left -skew-x-[8deg] text-[clamp(4.9rem,3rem+7.2vw,7.15rem)] gp-wordmark-pink lg:text-[clamp(3.8rem,1.3rem+3.9vw,6.2rem)]">PROTOCOL</span>
          </motion.h1>

          <motion.p variants={item} className="mt-5 max-w-[680px] text-[1.46rem] font-bold text-white md:text-[1.63rem]">
            A Quiz2Earn ecosystem… kinda a whole knowledge economy.
          </motion.p>

          <motion.div variants={item} className="mt-6 flex flex-wrap gap-[1.3rem]">
            <Link
              href="/auth/register"
              className="inline-flex items-center gap-[0.65rem] rounded-2xl border-[2.6px] border-[var(--ink)] bg-[var(--gp-pink)] px-[2.6rem] py-[1.3rem] text-[1.3rem] font-bold text-white shadow-[6.5px_6.5px_0px_0px_var(--gp-pink-dark)] transition-[transform,box-shadow] duration-100 hover:-translate-x-[2.6px] hover:-translate-y-[2.6px] hover:shadow-[9.1px_9.1px_0px_0px_var(--gp-pink-dark)] active:translate-x-[5.2px] active:translate-y-[5.2px] active:shadow-none"
            >
              Get Started →
            </Link>
            <Link
              href="/auth/login"
              className="inline-flex items-center rounded-2xl border-[2.6px] border-[var(--border-soft)] bg-transparent px-[2.6rem] py-[1.3rem] text-[1.3rem] font-bold text-white transition-colors duration-100 hover:border-[var(--gp-cyan)] hover:text-[var(--gp-cyan)]"
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
              className="h-auto max-w-full w-[clamp(31rem,20.8rem+57vw,60rem)] lg:w-[clamp(35rem,14rem+45vw,58rem)]"
            />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
