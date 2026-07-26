"use client";

import { useState } from "react";
import Image from "next/image";
import {
  FaCoins, FaStar, FaUser, FaChartLine, FaGamepad, FaBrain,
  FaTrophy, FaSignInAlt, FaUserPlus, FaChevronDown, FaBars, FaTimes, FaShieldAlt,
} from "react-icons/fa";
import { useAuth } from "@/context/AuthContext";

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, isAuthenticated, signOut, connectWallet, kaswareInstalled, walletConnecting } = useAuth();

  const handleLogin = () => { window.location.href = "/auth/login"; };
  const handleRegister = () => { window.location.href = "/auth/register"; };
  const handleLogout = async () => { await signOut(); };

  return (
    <>
      {/* Mobile drawer */}
      <div className={`fixed top-0 left-0 w-full h-full bg-[var(--gp-bg)] z-[500] transform transition-transform duration-300 overflow-y-auto p-8 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex justify-between items-center pb-6 border-b border-[var(--border-soft)] mb-6">
          <Image src="/logo.png" alt="Geek Protocol" width={1536} height={1024} className="h-[5.5rem] w-auto" />
          <button onClick={() => setMobileOpen(false)} className="rounded-full border border-[var(--border-strong)] text-[var(--brand-primary)] px-3 py-1.5">
            <FaTimes />
          </button>
        </div>

        <div className="flex flex-col space-y-2">
          {isAuthenticated && user ? (
            <>
              <div className="flex gap-2 mb-2">
                <div className="flex-1 rounded-full bg-[var(--surface-2)] px-3 py-2 flex items-center gap-2 text-sm font-semibold text-[var(--text-1)]">
                  <FaCoins className="text-[var(--brand-accent)]" /><span>{user.points || 0}</span>
                </div>
                <div className="flex-1 rounded-full bg-[var(--surface-2)] px-3 py-2 flex items-center gap-2 text-sm font-semibold text-[var(--text-1)]">
                  <FaStar className="text-[var(--brand-primary)]" /><span>{user.geekBalance || 0}</span>
                </div>
              </div>
              <a href="/dashboard" className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-[var(--brand-primary)] text-white font-bold text-sm">
                <FaUser /> {user.username}
              </a>
              <a href="/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-2xl text-[var(--text-2)] hover:text-[var(--brand-primary)] hover:bg-[var(--surface-2)] transition"><FaChartLine /> Dashboard</a>
              <a href="/play"      className="flex items-center gap-3 px-4 py-3 rounded-2xl text-[var(--text-2)] hover:text-[var(--brand-primary)] hover:bg-[var(--surface-2)] transition"><FaGamepad /> Play</a>
              <a href="/leaderboard" className="flex items-center gap-3 px-4 py-3 rounded-2xl text-[var(--text-2)] hover:text-[var(--brand-primary)] hover:bg-[var(--surface-2)] transition"><FaTrophy /> Leaderboard</a>
              <a href="/stickers"   className="flex items-center gap-3 px-4 py-3 rounded-2xl text-[var(--text-2)] hover:text-[var(--brand-primary)] hover:bg-[var(--surface-2)] transition">🎴 Stickers</a>
              <a href="/token"     className="flex items-center gap-3 px-4 py-3 rounded-2xl text-[var(--text-2)] hover:text-[var(--brand-primary)] hover:bg-[var(--surface-2)] transition">💱 $GEEK Market</a>
              <a href="/cce"       className="flex items-center gap-3 px-4 py-3 rounded-2xl text-[var(--text-2)] hover:text-[var(--brand-primary)] hover:bg-[var(--surface-2)] transition"><FaBrain /> CCE</a>
              {user.isAdmin && (
                <a href="/admin"   className="flex items-center gap-3 px-4 py-3 rounded-2xl text-[var(--text-2)] hover:text-[var(--brand-primary)] hover:bg-[var(--surface-2)] transition"><FaShieldAlt /> Admin</a>
              )}
              <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 rounded-2xl text-[var(--brand-tertiary)] hover:bg-[var(--surface-2)] transition text-left">
                <FaSignInAlt /> Logout
              </button>
            </>
          ) : (
            <>
              <button onClick={handleLogin}    className="flex items-center gap-3 px-4 py-3 rounded-2xl text-[var(--text-2)] hover:text-[var(--brand-primary)] hover:bg-[var(--surface-2)] transition text-left"><FaSignInAlt /> Login</button>
              <button onClick={handleRegister} className="flex items-center gap-3 px-4 py-3 rounded-2xl text-[var(--text-2)] hover:text-[var(--brand-primary)] hover:bg-[var(--surface-2)] transition text-left"><FaUserPlus /> Register</button>
            </>
          )}
        </div>
      </div>

      {/* Main nav */}
      <nav className="sticky top-0 z-[200] bg-[var(--gp-bg)] border-b-2 border-[var(--border-soft)]">
        <div className="flex items-center justify-between px-4 md:px-8 py-3 max-w-[1600px] mx-auto">
          {/* Logo */}
          <div className="flex items-center gap-4">
            <a href="/" className="flex items-center">
              <Image
                src="/logo.png"
                alt="Geek Protocol"
                width={1536}
                height={1024}
                priority
                className="h-14 w-auto sm:h-16 lg:h-20 xl:h-[6.5rem]"
              />
            </a>
          </div>

          {/* Desktop links */}
          <div className="hidden lg:flex items-center gap-4 xl:gap-6">
            <div className="flex items-center gap-1">
              {isAuthenticated && (
                <a href="/dashboard" className="rounded-full px-3 py-1.5 text-[var(--text-2)] hover:text-[var(--brand-primary)] hover:bg-[var(--surface-2)] transition text-sm font-semibold whitespace-nowrap">Dashboard</a>
              )}
              <a href="/play"        className="rounded-full px-3 py-1.5 text-[var(--text-2)] hover:text-[var(--brand-primary)] hover:bg-[var(--surface-2)] transition text-sm font-semibold whitespace-nowrap">Play</a>
              <a href="/leaderboard" className="rounded-full px-3 py-1.5 text-[var(--text-2)] hover:text-[var(--brand-primary)] hover:bg-[var(--surface-2)] transition text-sm font-semibold whitespace-nowrap">Leaderboard</a>
              <a href="/stickers"    className="rounded-full px-3 py-1.5 text-[var(--text-2)] hover:text-[var(--brand-primary)] hover:bg-[var(--surface-2)] transition text-sm font-semibold whitespace-nowrap">Stickers</a>
              <a href="/token"      className="rounded-full px-3 py-1.5 text-[var(--text-2)] hover:text-[var(--brand-primary)] hover:bg-[var(--surface-2)] transition text-sm font-semibold whitespace-nowrap">$GEEK</a>
              <a href="/litepaper"   className="rounded-full px-3 py-1.5 text-[var(--text-2)] hover:text-[var(--brand-primary)] hover:bg-[var(--surface-2)] transition text-sm font-semibold whitespace-nowrap">Litepaper</a>
            </div>
            <div className="h-6 w-px bg-[var(--border-soft)]" />

            {isAuthenticated && user ? (
              <div className="flex items-center gap-2">
                <div className="hidden lg:flex items-center gap-2 rounded-full bg-[var(--surface-2)] px-3 py-1.5 text-sm font-semibold text-[var(--text-1)]">
                  <FaCoins className="text-[var(--brand-accent)]" /><span>{user.points || 0}</span>
                </div>
                <div className="relative group">
                  <button className="pill-btn pill-btn-primary py-1.5 px-4 text-sm">
                    <FaUser className="text-xs" />
                    <span>{user.username}</span>
                    <FaChevronDown className="text-xs" />
                  </button>
                  <div className="absolute right-0 top-full mt-2 bg-[var(--surface-1)] rounded-2xl border-2 border-[var(--border-soft)] shadow-[var(--shadow-hard)] min-w-[160px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 overflow-hidden">
                    <a href="/dashboard"   className="flex items-center gap-2 px-4 py-2.5 text-[var(--text-2)] hover:text-[var(--brand-primary)] hover:bg-[var(--surface-2)] text-sm transition"><FaChartLine /> Dashboard</a>
                    <a href="/profile"     className="flex items-center gap-2 px-4 py-2.5 text-[var(--text-2)] hover:text-[var(--brand-primary)] hover:bg-[var(--surface-2)] text-sm transition"><FaUser /> Profile</a>
                    <a href="/cce"         className="flex items-center gap-2 px-4 py-2.5 text-[var(--text-2)] hover:text-[var(--brand-primary)] hover:bg-[var(--surface-2)] text-sm transition"><FaBrain /> CCE</a>
                    {user.isAdmin && (
                      <a href="/admin"     className="flex items-center gap-2 px-4 py-2.5 text-[var(--text-2)] hover:text-[var(--brand-primary)] hover:bg-[var(--surface-2)] text-sm transition"><FaShieldAlt /> Admin</a>
                    )}
                    <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2.5 text-[var(--brand-tertiary)] hover:bg-[var(--surface-2)] text-sm transition w-full text-left"><FaSignInAlt /> Logout</button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button onClick={handleLogin} className="text-sm text-[var(--text-2)] font-semibold hover:text-[var(--brand-primary)] transition px-3 py-1.5 whitespace-nowrap">
                  Sign In
                </button>
                <button
                  onClick={kaswareInstalled ? () => void connectWallet() : handleRegister}
                  disabled={walletConnecting}
                  className="pill-btn pill-btn-primary text-sm whitespace-nowrap disabled:opacity-50"
                >
                  {walletConnecting ? "Connecting…" : kaswareInstalled ? "Connect Wallet" : "Get Started"}
                </button>
              </div>
            )}
          </div>

          {/* Mobile hamburger (shown until the desktop nav has room, at lg) */}
          <button onClick={() => setMobileOpen(true)} className="lg:hidden text-[var(--text-2)] rounded-full border border-[var(--border-soft)] px-2 py-1.5">
            <FaBars />
          </button>
        </div>
      </nav>
    </>
  );
}
