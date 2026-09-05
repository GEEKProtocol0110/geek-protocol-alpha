"use client";

import { useCallback, useSyncExternalStore } from "react";

const STORAGE_KEY = "gp:alpha-banner-dismissed";
const CHANGE_EVENT = "gp:alpha-banner-change";

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

/** Storage can throw outright in private mode or with site data blocked. */
function getSnapshot() {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

/**
 * The server always renders the banner open. That keeps the full disclosure in
 * the initial HTML for crawlers, screen readers and no-JS visitors, and it
 * means the first client render matches the server exactly — the collapse
 * happens on the following commit, with no hydration mismatch.
 */
function getServerSnapshot() {
  return false;
}

interface Props {
  title: string;
  body: string;
}

export default function AlphaBannerClient({ title, body }: Props) {
  const dismissed = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setDismissed = useCallback((next: boolean) => {
    try {
      if (next) window.localStorage.setItem(STORAGE_KEY, "1");
      else window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Storage unavailable — the banner simply stays open, which is the safe
      // direction for a disclosure.
    }
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  // Dismissed state still discloses, in one line. ECONOMY.md §19.5 asks for a
  // persistent Public Alpha status indicator, so the badge stays and the detail
  // is one tap away — what goes away is the wall of text, not the disclosure.
  if (dismissed) {
    return (
      <aside
        role="status"
        aria-label="Platform status"
        className="w-full border-b-2 border-[var(--ink)] bg-[var(--surface-2)] px-3 py-1.5 text-[var(--text-1)]"
      >
        <div className="mx-auto flex max-w-[1400px] items-center gap-2">
          <span className="flat-badge shrink-0 text-[10px] font-bold uppercase tracking-wide">
            {title}
          </span>
          <button
            type="button"
            onClick={() => setDismissed(false)}
            className="truncate text-left text-xs text-[var(--text-3)] underline decoration-dotted underline-offset-2 hover:text-[var(--text-1)]"
            aria-expanded={false}
          >
            Rewards are internal Alpha balances — read the full notice
          </button>
        </div>
      </aside>
    );
  }

  return (
    <aside
      role="status"
      aria-label="Platform status"
      className="w-full border-b-2 border-[var(--ink)] bg-[var(--surface-2)] px-4 py-3 text-[var(--text-1)]"
    >
      <div className="mx-auto flex max-w-[1400px] items-start gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-3">
          <span className="flat-badge shrink-0 font-bold uppercase tracking-wide">{title}</span>
          <p className="text-sm leading-snug opacity-90">{body}</p>
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss the Public Alpha notice"
          className="shrink-0 rounded-full border-2 border-[var(--ink)] bg-[var(--surface-3)] px-2 py-0.5 text-sm font-bold leading-none text-[var(--text-2)] transition hover:text-[var(--text-1)]"
        >
          ×
        </button>
      </div>
    </aside>
  );
}
