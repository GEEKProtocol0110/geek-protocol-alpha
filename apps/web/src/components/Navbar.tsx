"use client";

import { useState } from "react";
import {
  FaCoins, FaStar, FaUser, FaChartLine, FaGamepad, FaBrain,
  FaTrophy, FaSignInAlt, FaUserPlus, FaChevronDown, FaBars, FaTimes,
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
      <div className={`fixed top-0 left-0 w-full h-full bg-[#050805]/[0.97] backdrop-blur-lg z-[500] transform transition-transform duration-300 overflow-y-auto p-8 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex justify-between items-center pb-6 border-b border-[#2a1a3a] mb-6">
          <span className="font-bebas tracking-widest font-bold text-lg text-pink-600">GEEK PROTOCOL</span>
          <button onClick={() => setMobileOpen(false)} className="border border-purple-400 text-purple-400 px-3 py-1.5">
            <FaTimes />
          </button>
        </div>

        <div className="flex flex-col space-y-2">
          {isAuthenticated && user ? (
            <>
              <div className="flex gap-2 mb-2">
                <div className="flex-1 bg-[#0d120d] border border-[#2a1a3a] px-3 py-2 flex items-center gap-2 font-mono text-sm">
                  <FaCoins className="text-amber-400" /><span>{user.points || 0}</span>
                </div>
                <div className="flex-1 bg-[#0d120d] border border-[#2a1a3a] px-3 py-2 flex items-center gap-2 font-mono text-sm">
                  <FaStar className="text-purple-400" /><span>{user.geekBalance || 0}</span>
                </div>
              </div>
              <a href="/dashboard" className="flex items-center gap-2 px-4 py-3 bg-pink-600 text-white font-bold text-sm">
                <FaUser /> {user.username}
              </a>
              <a href="/dashboard" className="flex items-center gap-3 px-4 py-3 text-white/70 hover:text-white border-l-2 border-transparent hover:border-cyan-400 transition"><FaChartLine /> Dashboard</a>
              <a href="/play"      className="flex items-center gap-3 px-4 py-3 text-white/70 hover:text-white border-l-2 border-transparent hover:border-cyan-400 transition"><FaGamepad /> Play</a>
              <a href="/leaderboard" className="flex items-center gap-3 px-4 py-3 text-white/70 hover:text-white border-l-2 border-transparent hover:border-cyan-400 transition"><FaTrophy /> Leaderboard</a>
              <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 text-pink-500 hover:text-pink-400 border-l-2 border-transparent hover:border-pink-500 transition text-left">
                <FaSignInAlt /> Logout
              </button>
            </>
          ) : (
            <>
              <button onClick={handleLogin}    className="flex items-center gap-3 px-4 py-3 text-white/70 hover:text-white border-l-2 border-transparent hover:border-cyan-400 transition text-left"><FaSignInAlt /> Login</button>
              <button onClick={handleRegister} className="flex items-center gap-3 px-4 py-3 text-white/70 hover:text-white border-l-2 border-transparent hover:border-cyan-400 transition text-left"><FaUserPlus /> Register</button>
            </>
          )}
        </div>
      </div>

      {/* Main nav */}
      <nav className="sticky top-0 z-[200] bg-[#0a0e0a]/[0.92] backdrop-blur-md border-b border-[#2a1a3a]">
        <div className="flex items-center justify-between px-4 md:px-8 py-3 max-w-[1600px] mx-auto">
          {/* Logo */}
          <div className="flex items-center gap-4">
            <a href="/" className="flex items-center gap-2">
              <span className="font-bebas tracking-widest font-bold text-xl text-pink-600">GP</span>
              <span className="font-sans font-bold text-xs tracking-widest text-white/70 hidden sm:block">GEEK PROTOCOL</span>
            </a>
            <span className="text-[10px] font-mono text-cyan-400 border border-cyan-400/30 px-2 py-0.5 hidden sm:block">Proof-of-Learning</span>
            <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400 border border-emerald-400/30 px-2 py-0.5 hidden sm:block">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              LIVE
            </span>
          </div>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-6">
            <div className="flex items-center gap-4">
              <a href="/play"        className="text-white/50 hover:text-cyan-400 transition text-sm font-semibold tracking-wider">Play</a>
              <a href="/leaderboard" className="text-white/50 hover:text-cyan-400 transition text-sm font-semibold tracking-wider">Leaderboard</a>
              <a href="/litepaper"   className="text-white/50 hover:text-cyan-400 transition text-sm font-semibold tracking-wider">Litepaper</a>
            </div>
            <div className="h-6 w-px bg-[#2a1a3a]" />

            {isAuthenticated && user ? (
              <div className="relative group">
                <button className="flex items-center gap-2 bg-pink-600 hover:bg-pink-700 text-white px-4 py-1.5 text-sm font-bold transition">
                  <FaUser className="text-xs" />
                  <span>{user.username}</span>
                  <FaChevronDown className="text-xs" />
                </button>
                <div className="absolute right-0 top-full mt-2 bg-[#0d120d] border border-[#2a1a3a] min-w-[160px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <a href="/dashboard"   className="flex items-center gap-2 px-4 py-2 text-white/70 hover:text-cyan-400 hover:bg-white/5 text-sm border-l-2 border-transparent hover:border-cyan-400 transition"><FaChartLine /> Dashboard</a>
                  <a href="/profile"     className="flex items-center gap-2 px-4 py-2 text-white/70 hover:text-cyan-400 hover:bg-white/5 text-sm border-l-2 border-transparent hover:border-cyan-400 transition"><FaUser /> Profile</a>
                  <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 text-pink-500 hover:text-pink-400 hover:bg-white/5 text-sm border-l-2 border-transparent hover:border-pink-500 transition w-full text-left"><FaSignInAlt /> Logout</button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button onClick={handleLogin} className="text-xs text-white/60 font-mono hover:text-white transition px-3 py-1.5 border border-white/10 hover:border-white/30">
                  Sign In
                </button>
                <button
                  onClick={kaswareInstalled ? () => void connectWallet() : handleRegister}
                  disabled={walletConnecting}
                  className="text-xs bg-pink-600 hover:bg-pink-700 text-white px-4 py-1.5 font-bold tracking-wider transition disabled:opacity-50"
                >
                  {walletConnecting ? "Connecting…" : kaswareInstalled ? "Connect Wallet" : "Get Started"}
                </button>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <button onClick={() => setMobileOpen(true)} className="md:hidden text-white/70 border border-[#2a1a3a] px-2 py-1.5">
            <FaBars />
          </button>
        </div>
      </nav>
    </>
  );
}
