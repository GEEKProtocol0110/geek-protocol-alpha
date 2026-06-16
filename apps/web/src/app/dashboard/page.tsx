"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { 
  FaFire, FaGem, FaCoins, FaTrophy, FaMedal, FaStickyNote, FaChartLine, 
  FaBolt, FaQuestionCircle, FaCode, FaRobot, FaComments, FaUser, 
  FaSignOutAlt, FaChevronDown, FaInfoCircle, FaExclamationTriangle,
  FaShieldAlt, FaLock, FaGift, FaStar, FaClock, FaArrowRight,
  FaHistory, FaSyncAlt, FaScroll, FaCalendarAlt, FaUserCircle,
  FaSlidersH, FaPlusCircle, FaList, FaCheckCircle, FaLightbulb,
  FaBrain, FaMicrochip, FaHeart, FaLink, FaTwitter, FaDiscord,
  FaGithub, FaTelegramPlane, FaCrown, FaBars, FaTimes
} from "react-icons/fa";

// Mock user data - replace with actual data from AuthContext
const mockUser = {
  id: 1,
  username: "geek_master",
  level: 12,
  xp: 12500,
  points: 3450,
  geek_balance: 127.50,
  current_streak: 24,
  longest_streak: 42,
  wallet_address: "kaspa:qzy8x...",
  character_affinity_giga: 78,
  character_affinity_ace: 45,
  date_created: new Date("2024-01-15"),
  questions_submitted: 8,
  questions_approved: 6,
  reviews_completed: 15,
  review_accuracy: 92,
  favorite_character: "GIGA",
  is_admin: false,
  role: "validator"
};

const mockStats = {
  total_users: 2487,
  total_questions: 5320,
  approved_questions: 4120,
  total_geek_earned: 1250000,
  active_users: 847,
  exchange_rate: 25,
  pending_payments_count: 3
};

const mockAchievements = {
  count: 18,
  total: 35
};

const mockStickers = [
  { id: 1, name: "GIGA", number: 1, owned: true, emoji: "🤖" },
  { id: 2, name: "ACE", number: 2, owned: true, emoji: "🧠" },
  { id: 3, name: "Gauntlet", number: 3, owned: false, emoji: "⚔️" },
  { id: 4, name: "Kaspa", number: 4, owned: false, emoji: "⛓️" },
  { id: 5, name: "GEEK", number: 5, owned: false, emoji: "💎" },
  { id: 6, name: "Knowledge", number: 6, owned: false, emoji: "📚" },
  { id: 7, name: "Community", number: 7, owned: false, emoji: "🌐" },
  { id: 8, name: "Legend", number: 8, owned: false, emoji: "🏆" }
];

const mockLeaderboard = [
  { rank: 1, name: "geek_king", level: 45, points: 28400, geek_balance: 1450.75, is_current_user: false },
  { rank: 2, name: "quiz_wizard", level: 42, points: 26100, geek_balance: 1320.50, is_current_user: false },
  { rank: 3, name: "kaspa_geek", level: 38, points: 22300, geek_balance: 1100.25, is_current_user: false },
  { rank: 4, name: "geek_master", level: 12, points: 3450, geek_balance: 127.50, is_current_user: true },
  { rank: 5, name: "brainiac", level: 11, points: 3200, geek_balance: 110.80, is_current_user: false }
];

const mockWeakTopics = [
  { id: 1, name: "Cryptography", accuracy: 45 },
  { id: 2, name: "Blockchain History", accuracy: 52 },
  { id: 3, name: "Smart Contracts", accuracy: 58 }
];

const mockRecentEarnings = [
  { amount: 12.50, timestamp: new Date("2024-01-20T14:30:00"), question_id: 42 },
  { amount: 8.75, timestamp: new Date("2024-01-20T12:15:00"), question_id: 41 },
  { amount: 15.00, timestamp: new Date("2024-01-19T18:45:00"), question_id: 39 }
];

const mockRecentInteractions = [
  { character: "GIGA", timestamp: new Date("2024-01-20T15:20:00"), message: "Great job on your streak!", interaction_type: "encouragement" },
  { character: "ACE", timestamp: new Date("2024-01-20T13:45:00"), message: "Your knowledge is expanding rapidly.", interaction_type: "feedback" },
  { character: "GIGA", timestamp: new Date("2024-01-19T20:00:00"), message: "Ready for the Gauntlet?", interaction_type: "challenge" }
];

const LEVEL_TITLES: Record<number, string> = {
  1: "Curious Explorer",
  5: "Knowledge Seeker",
  10: "Geek Initiate",
  15: "Quiz Warrior",
  20: "Blockchain Scholar",
  25: "Expert Geek",
  30: "Master of Lore",
  40: "Legendary Geek",
  50: "Immortal Geek"
};

const LEVEL_ICONS: Record<number, string> = {
  1: "👀",
  5: "🔍",
  10: "⚡",
  15: "⚔️",
  20: "📜",
  25: "🧙",
  30: "👑",
  40: "🌟",
  50: "♾️"
};

const CCE_MIN_LEVEL_FOR_CREATION = 10;
const CCE_REVIEW_REWARD_GEEK = 0.5;

export default function DashboardPage() {
  const { user: authUser, isAuthenticated } = useAuth();
  const [user, setUser] = useState(mockUser);
  const [stats, setStats] = useState(mockStats);
  const [achievements, setAchievements] = useState(mockAchievements);
  const [stickers, setStickers] = useState(mockStickers);
  const [leaderboard, setLeaderboard] = useState(mockLeaderboard);
  const [weakTopics, setWeakTopics] = useState(mockWeakTopics);
  const [recentEarnings, setRecentEarnings] = useState(mockRecentEarnings);
  const [recentInteractions, setRecentInteractions] = useState(mockRecentInteractions);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [characterMessage, setCharacterMessage] = useState("Your knowledge is your power. Keep learning, keep earning!");
  const [characterToShow, setCharacterToShow] = useState("GIGA");
  const [aiRecommendation, setAiRecommendation] = useState({ message: "Try the Cryptography quiz to improve your weak area!" });
  const [unopenedPacks, setUnopenedPacks] = useState(2);
  const [activeRun, setActiveRun] = useState<{highest_round: number} | null>({ highest_round: 3 });
  const [latestRun, setLatestRun] = useState<any>({
    highest_round: 5,
    date_completed: new Date("2024-01-19T22:30:00"),
    total_questions: 10,
    total_correct: 7,
    total_geek_earned: 45.50,
    total_xp_earned: 350,
  });
  const [creatorEarnings, setCreatorEarnings] = useState(42.75);
  const [nextMilestone, setNextMilestone] = useState(15);
  const [milestoneProgress, setMilestoneProgress] = useState(64);
  const [xpToMilestone, setXpToMilestone] = useState(3600);
  const [xpProgress, setXpProgress] = useState({ current_xp_in_level: 500, xp_needed: 1000, progress_percentage: 50 });
  const [streakMultiplier, setStreakMultiplier] = useState(1.4);
  const [questionsNearingCap, setQuestionsNearingCap] = useState([
    { question: "What is the block time of Kaspa?", id: 42 }
  ]);
  const [submittedQuestions, setSubmittedQuestions] = useState(8);
  const [approvedQuestions, setApprovedQuestions] = useState(6);
  const [validationCount, setValidationCount] = useState(15);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // PCB Canvas Engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    let W, H, nodes: any[] = [], edges: any[] = [], pulses: any[] = [];
    const CELL = 80;

    const resize = () => {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    };

    const genNodes = () => {
      nodes = [];
      const cols = Math.ceil(W/CELL) + 2;
      const rows = Math.ceil(H/CELL) + 2;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          nodes.push({
            x: c*CELL + (Math.random() - 0.5) * CELL * 0.35,
            y: r*CELL + (Math.random() - 0.5) * CELL * 0.35,
            pad: Math.random() < 0.28,
            via: Math.random() < 0.1,
            ic: Math.random() < 0.035
          });
        }
      }
    };

    const genEdges = () => {
      edges = [];
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        let nbrs = [];
        for (let j = i+1; j < nodes.length; j++) {
          const b = nodes[j];
          const d = Math.hypot(b.x - a.x, b.y - a.y);
          if (d < CELL * 1.55) nbrs.push({j, d});
        }
        nbrs.sort((x, y) => x.d - y.d);
        const cnt = 1 + Math.floor(Math.random() * 2);
        for (let k = 0; k < Math.min(cnt, nbrs.length); k++) {
          if (Math.random() < 0.5) edges.push([i, nbrs[k].j, Math.random() < 0.5]);
        }
      }
    };

    const initPulses = () => {
      pulses = [];
      for (let i = 0; i < 22; i++) addPulse();
    };

    const addPulse = () => {
      if (!edges.length) return;
      pulses.push({
        edge: edges[Math.floor(Math.random() * edges.length)],
        t: Math.random(),
        speed: 0.0012 + Math.random() * 0.003,
        color: Math.random() < 0.5 ? '#00e676' : '#c87941',
        size: 2 + Math.random() * 2
      });
    };

    const drawStatic = () => {
      ctx.strokeStyle = '#1e2126';
      ctx.lineWidth = 1.5;
      for (const [i, j, horiz] of edges) {
        const a = nodes[i], b = nodes[j];
        if (!a || !b) continue;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        if (horiz) {
          ctx.lineTo(b.x, a.y);
          ctx.lineTo(b.x, b.y);
        } else {
          ctx.lineTo(a.x, b.y);
          ctx.lineTo(b.x, b.y);
        }
        ctx.stroke();
      }

      for (const n of nodes) {
        if (n.ic) {
          const w = 38 + Math.random() * 28;
          const h = 24 + Math.random() * 18;
          ctx.fillStyle = '#0e140e';
          ctx.fillRect(n.x - w/2, n.y - h/2, w, h);
          ctx.strokeStyle = '#1e2e1e';
          ctx.lineWidth = 1;
          ctx.strokeRect(n.x - w/2, n.y - h/2, w, h);
          ctx.fillStyle = '#c87941';
          const pins = Math.floor(w / 7);
          for (let p = 0; p < pins; p++) {
            const px = n.x - w/2 + 4 + p * (w / pins);
            ctx.fillRect(px - 1.5, n.y - h/2 - 3, 3, 3);
            ctx.fillRect(px - 1.5, n.y + h/2, 3, 3);
          }
        } else if (n.via) {
          ctx.beginPath();
          ctx.arc(n.x, n.y, 4, 0, Math.PI * 2);
          ctx.fillStyle = '#1e2126';
          ctx.fill();
          ctx.strokeStyle = '#c0c0a0';
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(n.x, n.y, 1.5, 0, Math.PI * 2);
          ctx.fillStyle = '#060c06';
          ctx.fill();
        } else if (n.pad) {
          ctx.beginPath();
          ctx.arc(n.x, n.y, 5, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(212,192,96,0.3)';
          ctx.fill();
        }
      }
    };

    const drawPulses = () => {
      for (const p of pulses) {
        const [i, j, horiz] = p.edge;
        if (!nodes[i] || !nodes[j]) continue;
        const a = nodes[i], b = nodes[j];
        let x, y;
        if (p.t < 0.5) {
          const tt = p.t / 0.5;
          x = a.x + (b.x - a.x) * tt;
          y = a.y;
        } else {
          const tt = (p.t - 0.5) / 0.5;
          x = b.x;
          y = a.y + (b.y - a.y) * tt;
        }
        const grad = ctx.createRadialGradient(x, y, 0, x, y, p.size * 3.5);
        grad.addColorStop(0, p.color);
        grad.addColorStop(1, 'transparent');
        ctx.beginPath();
        ctx.arc(x, y, p.size * 3.5, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.globalAlpha = 0.55;
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.arc(x, y, p.size * 0.65, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
        p.t += p.speed;
        if (p.t > 1) {
          p.t = 0;
          if (edges.length) p.edge = edges[Math.floor(Math.random() * edges.length)];
          p.color = Math.random() < 0.5 ? '#00e676' : '#c87941';
        }
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, W, H);
      drawStatic();
      drawPulses();
      requestAnimationFrame(animate);
    };

    const rebuild = () => {
      resize();
      genNodes();
      genEdges();
      initPulses();
    };

    window.addEventListener('resize', rebuild);
    rebuild();
    animate();

    return () => {
      window.removeEventListener('resize', rebuild);
    };
  }, []);

  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);
  const toggleUserDropdown = () => setUserDropdownOpen(!userDropdownOpen);

  const getLevelTitle = (level: number) => {
    const keys = Object.keys(LEVEL_TITLES).map(Number).sort((a, b) => a - b);
    let title = "Geek";
    for (const key of keys) {
      if (level >= key) title = LEVEL_TITLES[key];
    }
    return title;
  };

  const getLevelIcon = (level: number) => {
    const keys = Object.keys(LEVEL_ICONS).map(Number).sort((a, b) => a - b);
    let icon = "⭐";
    for (const key of keys) {
      if (level >= key) icon = LEVEL_ICONS[key];
    }
    return icon;
  };

  const getMilestoneReward = (level: number) => {
    return {
      geek: level * 10,
      xp: level * 50,
      sticker_pack: level % 5 === 0 ? 1 : 0,
      title: getLevelTitle(level)
    };
  };

  return (
    <div className="min-h-screen bg-[#08090a] text-[#e8eaf0] font-['Rajdhani',sans-serif] overflow-x-hidden relative">

      {/* PCB Canvas Background */}
      <canvas ref={canvasRef} className="fixed top-0 left-0 w-full h-full pointer-events-none opacity-30 z-0" />

      {/* Scanlines */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-[1] bg-repeat-y opacity-20"
        style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.05) 2px, rgba(0,0,0,0.05) 4px)' }} />

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black/60 z-40" onClick={toggleMobileMenu} />
      )}

      {/* Mobile Menu */}
      <div className={`fixed top-0 left-0 w-[82vw] max-w-[300px] h-full bg-[#08090a]/98 backdrop-blur-md z-50 transform transition-transform duration-300 ease-out overflow-y-auto border-r border-[#1e2126] ${
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="p-4 border-b border-[#1e2126] flex justify-between items-center">
          <span className="font-['Syncopate',sans-serif] font-bold text-sm text-[#f06292]">GEEK PROTOCOL</span>
          <button onClick={toggleMobileMenu} className="border border-[#252a30] text-[#6b7380] p-2 rounded hover:border-[#00e676] hover:text-[#00e676] transition">
            <FaTimes />
          </button>
        </div>
        
        <div className="p-4 border-b border-[#1e2126] flex items-center gap-3">
          <div className="w-10 h-10 border border-[#252a30] overflow-hidden flex-shrink-0 rounded">
            <div className="w-full h-full bg-gradient-to-br from-[#00e676]/20 to-[#00e676]/5 flex items-center justify-center text-2xl">
              {getLevelIcon(user.level)}
            </div>
          </div>
          <div>
            <div className="font-bold text-[#e8eaf0] text-sm">{user.username}</div>
            <div className="font-['Share_Tech_Mono',monospace] text-xs text-[#6b7380]">LVL {user.level} · {getLevelTitle(user.level)}</div>
          </div>
        </div>

        <div className="p-3 flex gap-2 border-b border-[#1e2126] flex-wrap">
          <div className="flex-1 min-w-[calc(50%-4px)] flex items-center gap-2 bg-[#0d0f11] border border-[#1e2126] p-2 font-['Share_Tech_Mono',monospace] text-xs rounded">
            <FaCoins className="text-[#ffb300]" />
            <span>{user.points}</span>
          </div>
          <div className="flex-1 min-w-[calc(50%-4px)] flex items-center gap-2 bg-[#0d0f11] border border-[#1e2126] p-2 font-['Share_Tech_Mono',monospace] text-xs rounded">
            <FaGem className="text-[#9c6cff]" />
            <span>{user.geek_balance.toFixed(2)}</span>
          </div>
          <div className="flex-1 min-w-[calc(50%-4px)] flex items-center gap-2 bg-[#0d0f11] border border-[#1e2126] p-2 font-['Share_Tech_Mono',monospace] text-xs rounded">
            <FaFire className="text-[#ff7043]" />
            <span>{user.current_streak}</span>
          </div>
        </div>

        <nav className="p-3 space-y-1">
          <a href="/dashboard" className="flex items-center gap-3 px-3 py-2 text-[#00bcd4] font-semibold border-l-2 border-[#00bcd4] bg-[#00bcd4]/5 rounded-r">
            <FaChartLine className="w-4" /> Dashboard
          </a>
          <a href="/gauntlet" className="flex items-center gap-3 px-3 py-2 text-[#6b7380] hover:text-[#e8eaf0] hover:bg-[#111418] border-l-2 border-transparent hover:border-[#00e676] rounded-r transition">
            <FaFire className="w-4" /> Gauntlet
          </a>
          <a href="/quiz" className="flex items-center gap-3 px-3 py-2 text-[#6b7380] hover:text-[#e8eaf0] hover:bg-[#111418] border-l-2 border-transparent hover:border-[#00e676] rounded-r transition">
            <FaQuestionCircle className="w-4" /> Quiz
          </a>
          <div className="h-px bg-[#1e2126] my-2" />
          <div className="font-['Share_Tech_Mono',monospace] text-[10px] text-[#4a5260] px-3 py-1 uppercase">Community</div>
          <a href="/achievements" className="flex items-center gap-3 px-3 py-2 text-[#6b7380] hover:text-[#e8eaf0] hover:bg-[#111418] border-l-2 border-transparent hover:border-[#00e676] rounded-r transition">
            <FaMedal className="w-4 text-[#ffb300]" /> Achievements <span className="ml-auto text-[10px] text-[#4a5260] border border-[#1e2126] px-2 py-0.5 rounded">{achievements.count}</span>
          </a>
          <a href="/stickers" className="flex items-center gap-3 px-3 py-2 text-[#6b7380] hover:text-[#e8eaf0] hover:bg-[#111418] border-l-2 border-transparent hover:border-[#00e676] rounded-r transition">
            <FaStickyNote className="w-4 text-[#00e676]" /> Stickers <span className="ml-auto text-[10px] text-[#4a5260] border border-[#1e2126] px-2 py-0.5 rounded">{stickers.filter(s => s.owned).length}/8</span>
          </a>
          <a href="/leaderboard" className="flex items-center gap-3 px-3 py-2 text-[#6b7380] hover:text-[#e8eaf0] hover:bg-[#111418] border-l-2 border-transparent hover:border-[#00e676] rounded-r transition">
            <FaChartLine className="w-4 text-[#00bcd4]" /> Leaderboard
          </a>
          {user.level >= CCE_MIN_LEVEL_FOR_CREATION && (
            <>
              <div className="h-px bg-[#1e2126] my-2" />
              <div className="font-['Share_Tech_Mono',monospace] text-[10px] text-[#4a5260] px-3 py-1 uppercase">CCE</div>
              <a href="/cce" className="flex items-center gap-3 px-3 py-2 text-[#6b7380] hover:text-[#e8eaf0] hover:bg-[#111418] border-l-2 border-transparent hover:border-[#00e676] rounded-r transition">
                <FaCode className="w-4 text-[#00e676]" /> CCE Dashboard
              </a>
              <a href="/cce/submit" className="flex items-center gap-3 px-3 py-2 text-[#6b7380] hover:text-[#e8eaf0] hover:bg-[#111418] border-l-2 border-transparent hover:border-[#00e676] rounded-r transition">
                <FaPlusCircle className="w-4 text-[#00bcd4]" /> Submit Question
              </a>
            </>
          )}
          {user.is_admin && (
            <>
              <div className="h-px bg-[#1e2126] my-2" />
              <a href="/admin" className="flex items-center gap-3 px-3 py-2 text-[#f06292] hover:text-[#e8eaf0] hover:bg-[#111418] border-l-2 border-transparent hover:border-[#00e676] rounded-r transition">
                <FaShieldAlt className="w-4" /> Admin Panel
              </a>
            </>
          )}
          <div className="h-px bg-[#1e2126] my-2" />
          <button className="flex items-center gap-3 px-3 py-2 text-[#f06292] hover:text-[#e8eaf0] hover:bg-[#111418] border-l-2 border-transparent hover:border-[#00e676] rounded-r transition w-full text-left">
            <FaSignOutAlt className="w-4" /> Logout
          </button>
        </nav>
      </div>

      {/* Navigation */}
      <nav className="sticky top-0 z-30 bg-[#08090a]/95 backdrop-blur-md border-b border-[#1e2126]">
        <div className="max-w-full px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={toggleMobileMenu} className="lg:hidden border border-[#1e2126] text-[#6b7380] p-2 rounded hover:border-[#252a30] hover:text-[#e8eaf0] transition">
              <FaBars />
            </button>
            <a href="/" className="flex items-center gap-2">
              <span className="font-['Syncopate',sans-serif] font-bold text-xl text-[#f06292]">GP</span>
              <span className="font-['Rajdhani',sans-serif] font-bold text-xs tracking-widest text-white/50 hidden sm:block">GEEK PROTOCOL</span>
            </a>
          </div>

          <div className="hidden lg:flex items-center gap-1">
            <a href="/dashboard" className="flex items-center gap-2 px-4 py-2 text-[#00bcd4] bg-[#00bcd4]/5 rounded font-semibold text-sm">
              <FaChartLine /> Dashboard
            </a>
            <a href="/gauntlet" className="flex items-center gap-2 px-4 py-2 text-[#6b7380] hover:text-[#e8eaf0] hover:bg-[#0d0f11] rounded font-semibold text-sm transition">
              <FaFire /> Gauntlet
            </a>
            <a href="/quiz" className="flex items-center gap-2 px-4 py-2 text-[#6b7380] hover:text-[#e8eaf0] hover:bg-[#0d0f11] rounded font-semibold text-sm transition">
              <FaQuestionCircle /> Quiz
            </a>
            <div className="relative group">
              <button className="flex items-center gap-2 px-4 py-2 text-[#6b7380] hover:text-[#e8eaf0] hover:bg-[#0d0f11] rounded font-semibold text-sm transition">
                <FaTrophy /> Community <FaChevronDown className="text-[10px]" />
              </button>
              <div className="absolute top-full left-0 mt-1 bg-[#0d0f11] border border-[#1e2126] min-w-[200px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 rounded overflow-hidden">
                <a href="/achievements" className="flex items-center gap-3 px-4 py-2.5 text-[#6b7380] hover:text-[#e8eaf0] hover:bg-[#111418] transition text-sm">
                  <FaMedal className="text-[#ffb300]" /> Achievements <span className="ml-auto text-[10px] text-[#4a5260] border border-[#1e2126] px-2 py-0.5 rounded">{achievements.count}</span>
                </a>
                <a href="/stickers" className="flex items-center gap-3 px-4 py-2.5 text-[#6b7380] hover:text-[#e8eaf0] hover:bg-[#111418] transition text-sm">
                  <FaStickyNote className="text-[#00e676]" /> Stickers <span className="ml-auto text-[10px] text-[#4a5260] border border-[#1e2126] px-2 py-0.5 rounded">{stickers.filter(s => s.owned).length}/8</span>
                </a>
                <a href="/leaderboard" className="flex items-center gap-3 px-4 py-2.5 text-[#6b7380] hover:text-[#e8eaf0] hover:bg-[#111418] transition text-sm">
                  <FaChartLine className="text-[#00bcd4]" /> Leaderboard
                </a>
              </div>
            </div>
            {user.level >= CCE_MIN_LEVEL_FOR_CREATION && (
              <div className="relative group">
                <button className="flex items-center gap-2 px-4 py-2 text-[#6b7380] hover:text-[#e8eaf0] hover:bg-[#0d0f11] rounded font-semibold text-sm transition">
                  <FaCode /> CCE <FaChevronDown className="text-[10px]" />
                </button>
                <div className="absolute top-full left-0 mt-1 bg-[#0d0f11] border border-[#1e2126] min-w-[200px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 rounded overflow-hidden">
                  <a href="/cce" className="flex items-center gap-3 px-4 py-2.5 text-[#6b7380] hover:text-[#e8eaf0] hover:bg-[#111418] transition text-sm">
                    <FaChartLine className="text-[#00e676]" /> CCE Dashboard
                  </a>
                  <a href="/cce/submit" className="flex items-center gap-3 px-4 py-2.5 text-[#6b7380] hover:text-[#e8eaf0] hover:bg-[#111418] transition text-sm">
                    <FaPlusCircle className="text-[#00bcd4]" /> Submit Question
                  </a>
                  <a href="/cce/my-questions" className="flex items-center gap-3 px-4 py-2.5 text-[#6b7380] hover:text-[#e8eaf0] hover:bg-[#111418] transition text-sm">
                    <FaList className="text-[#9c6cff]" /> My Questions <span className="ml-auto text-[10px] text-[#4a5260] border border-[#1e2126] px-2 py-0.5 rounded">{approvedQuestions}/{submittedQuestions}</span>
                  </a>
                  {user.role === 'validator' && (
                    <a href="/cce/validate" className="flex items-center gap-3 px-4 py-2.5 text-[#6b7380] hover:text-[#e8eaf0] hover:bg-[#111418] transition text-sm">
                      <FaCheckCircle className="text-[#ffb300]" /> Validate <span className="ml-auto text-[10px] text-[#4a5260] border border-[#1e2126] px-2 py-0.5 rounded">{validationCount}</span>
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 bg-[#0d0f11] border border-[#1e2126] px-3 py-1.5 font-['Share_Tech_Mono',monospace] text-xs rounded">
              <FaCoins className="text-[#ffb300]" /> <span>{user.points}</span>
            </div>
            <div className="hidden md:flex items-center gap-2 bg-[#0d0f11] border border-[#1e2126] px-3 py-1.5 font-['Share_Tech_Mono',monospace] text-xs rounded">
              <FaGem className="text-[#9c6cff]" /> <span>{user.geek_balance.toFixed(2)}</span>
            </div>
            <div className="relative">
              <button 
                onClick={toggleUserDropdown}
                className="flex items-center gap-2 bg-[#0d0f11] border border-[#252a30] px-4 py-1.5 font-['Rajdhani',sans-serif] font-bold text-sm rounded hover:border-[#00e676] hover:text-[#00e676] transition"
              >
                <FaUser />
                <span>{user.username}</span>
                <span className="w-2 h-2 bg-[#00e676] rounded-full animate-pulse" />
                <FaChevronDown className="text-[10px]" />
              </button>
              {userDropdownOpen && (
                <div className="absolute right-0 top-full mt-1 bg-[#0d0f11] border border-[#1e2126] min-w-[220px] z-50 rounded overflow-hidden shadow-xl">
                  <div className="p-4 border-b border-[#1e2126]">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 border border-[#1e2126] overflow-hidden rounded flex items-center justify-center text-2xl bg-[#08090a]">
                        {getLevelIcon(user.level)}
                      </div>
                      <div>
                        <div className="font-bold text-[#e8eaf0]">{user.username}</div>
                        <div className="font-['Share_Tech_Mono',monospace] text-xs text-[#6b7380]">Level {user.level} · {getLevelTitle(user.level)}</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-1 mt-3 bg-[#1e2126] overflow-hidden rounded">
                      <div className="bg-[#08090a] text-center p-2">
                        <span className="font-['Share_Tech_Mono',monospace] text-sm text-[#ff7043] block">{user.current_streak}🔥</span>
                        <span className="font-['Share_Tech_Mono',monospace] text-[10px] text-[#4a5260]">Streak</span>
                      </div>
                      <div className="bg-[#08090a] text-center p-2">
                        <span className="font-['Share_Tech_Mono',monospace] text-sm text-[#00bcd4] block">{user.xp}</span>
                        <span className="font-['Share_Tech_Mono',monospace] text-[10px] text-[#4a5260]">XP</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-1">
                    <a href="/dashboard" className="flex items-center gap-3 px-4 py-2 text-[#6b7380] hover:text-[#e8eaf0] hover:bg-[#111418] rounded transition text-sm">
                      <FaChartLine className="text-[#9c6cff]" /> Dashboard
                    </a>
                    <a href="/profile" className="flex items-center gap-3 px-4 py-2 text-[#6b7380] hover:text-[#e8eaf0] hover:bg-[#111418] rounded transition text-sm">
                      <FaUserCircle className="text-[#00bcd4]" /> Profile
                    </a>
                    <a href="/preferences" className="flex items-center gap-3 px-4 py-2 text-[#6b7380] hover:text-[#e8eaf0] hover:bg-[#111418] rounded transition text-sm">
                      <FaSlidersH className="text-[#00e676]" /> Preferences
                    </a>
                    <div className="h-px bg-[#1e2126] my-1" />
                    <button className="flex items-center gap-3 px-4 py-2 text-[#f06292] hover:text-[#e8eaf0] hover:bg-[#111418] rounded transition text-sm w-full text-left">
                      <FaSignOutAlt /> Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="relative z-10 max-w-full px-4 py-6 md:px-6 md:py-8">

        {/* Welcome Banner */}
        <div className="bg-[#0d0f11] border border-[#1e2126] rounded p-4 md:p-6 mb-6 relative overflow-hidden">
          <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-[#00e676] to-transparent" />
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className="w-2 h-2 bg-[#00e676] rounded-full animate-pulse" />
                <span className="font-['Share_Tech_Mono',monospace] text-xs text-[#4a5260]">SESSION ACTIVE · GEEK PROTOCOL</span>
              </div>
              <h1 className="font-['Syncopate',sans-serif] font-bold text-2xl md:text-3xl text-[#e8eaf0]">
                WELCOME, <span className="text-[#00e676]">{user.username.toUpperCase()}</span>
              </h1>
              <p className="text-[#6b7380] mt-1">{getLevelTitle(user.level)} · <span className="text-[#ff7043]">{user.current_streak}🔥 day streak</span></p>
              
              {/* Character Message */}
              <div className="mt-4 bg-[#08090a] border border-[#1e2126] rounded p-3 flex gap-3">
                <div className="w-8 h-8 border border-[#1e2126] overflow-hidden rounded flex-shrink-0 flex items-center justify-center text-lg bg-[#0d0f11]">
                  {characterToShow === "GIGA" ? "🤖" : "🧠"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`font-['Share_Tech_Mono',monospace] text-xs ${characterToShow === "GIGA" ? 'text-[#f06292]' : 'text-[#00bcd4]'}`}>
                    {characterToShow} <span className="text-[#4a5260]">· just now</span>
                  </div>
                  <div className="text-sm text-[#e8eaf0]">{characterMessage}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-['Share_Tech_Mono',monospace] text-[10px] text-[#6b7380]">AFFINITY {characterToShow === "GIGA" ? user.character_affinity_giga : user.character_affinity_ace}%</span>
                    <div className="flex-1 h-1 bg-[#1e2126] rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ 
                        width: `${characterToShow === "GIGA" ? user.character_affinity_giga : user.character_affinity_ace}%`,
                        background: characterToShow === "GIGA" ? '#f06292' : '#00bcd4'
                      }} />
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    const messages = [
                      "Your knowledge is your power. Keep learning, keep earning!",
                      "Ready for the Gauntlet? The challenges await!",
                      "I've been watching your progress. Impressive!",
                      "Every correct answer brings you closer to legend status.",
                      "The blockchain never forgets your achievements!"
                    ];
                    setCharacterMessage(messages[Math.floor(Math.random() * messages.length)]);
                    setCharacterToShow(Math.random() > 0.5 ? "GIGA" : "ACE");
                  }}
                  className="text-[#6b7380] hover:text-[#00e676] transition flex-shrink-0"
                >
                  <FaSyncAlt />
                </button>
              </div>

              <div className="flex flex-wrap gap-2 mt-3">
                <span className="font-['Share_Tech_Mono',monospace] text-[10px] text-[#4a5260] border border-[#1e2126] px-2 py-0.5 rounded flex items-center gap-1">
                  <FaCalendarAlt className="text-[#00bcd4]" /> {user.date_created.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </span>
                <span className="font-['Share_Tech_Mono',monospace] text-[10px] text-[#4a5260] border border-[#1e2126] px-2 py-0.5 rounded flex items-center gap-1">
                  <FaScroll className="text-[#00e676]" /> {user.xp} XP
                </span>
              </div>
            </div>

            <div className="lg:min-w-[240px]">
              {!user.wallet_address ? (
                <>
                  <div className="font-['Share_Tech_Mono',monospace] text-[10px] text-[#4a5260] mb-2 uppercase">Connect Wallet</div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="kaspa:... or 0x..."
                      className="flex-1 bg-[#08090a] border border-[#1e2126] px-3 py-2 text-[#e8eaf0] font-['Share_Tech_Mono',monospace] text-xs rounded outline-none focus:border-[#00e676] transition placeholder:text-[#4a5260]"
                    />
                    <button className="bg-[#f06292] text-white px-4 py-2 font-['Rajdhani',sans-serif] font-bold text-sm rounded hover:opacity-85 transition">
                      <FaLink className="inline mr-1" /> Connect
                    </button>
                  </div>
                  <div className="font-['Share_Tech_Mono',monospace] text-[10px] text-[#4a5260] mt-2">
                    <FaInfoCircle className="inline text-[#00bcd4] mr-1" /> Connect to withdraw GEEK tokens
                  </div>
                </>
              ) : (
                <>
                  <div className="font-['Share_Tech_Mono',monospace] text-[10px] text-[#00e676] mb-2 uppercase">Wallet Connected</div>
                  <div className="flex items-center gap-3 bg-[#08090a] border border-[#1e2126] p-3 rounded">
                    <span className="w-2 h-2 bg-[#00e676] rounded-full animate-pulse" />
                    <div className="min-w-0 overflow-hidden">
                      <div className="font-['Share_Tech_Mono',monospace] text-[10px] text-[#4a5260]">Connected Wallet</div>
                      <div className="font-['Share_Tech_Mono',monospace] text-sm text-[#00e676]">{user.wallet_address.slice(0, 8)}...{user.wallet_address.slice(-6)}</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2 font-['Share_Tech_Mono',monospace] text-xs">
                    <span className="text-[#4a5260]">Rate:</span>
                    <span className="text-[#00bcd4]">1 KAS = {stats.exchange_rate} GEEK</span>
                    <a href="/buy" className="bg-[#00bcd4]/10 text-[#00bcd4] border border-[#00bcd4]/25 px-3 py-1 font-['Share_Tech_Mono',monospace] text-[10px] font-bold rounded hover:bg-[#00bcd4]/20 transition">
                      Buy GEEK
                    </a>
                  </div>
                </>
              )}
              {stats.pending_payments_count > 0 && (
                <div className="mt-3 bg-[#ffb300]/5 border border-[#ffb300]/15 rounded p-2 font-['Share_Tech_Mono',monospace] text-[10px] flex items-center justify-between">
                  <span className="text-[#ffb300]"><FaClock className="inline mr-1" /> {stats.pending_payments_count} pending</span>
                  <a href="/payments" className="text-[#ffb300] hover:underline">View →</a>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sticker Pack Banner */}
        {unopenedPacks > 0 && (
          <div className="bg-[#0d0f11] border border-[#1e2126] rounded p-4 mb-6 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🎁</span>
              <div>
                <div className="font-bold text-[#e8eaf0]">You have {unopenedPacks} unopened sticker pack{unopenedPacks > 1 ? 's' : ''}!</div>
                <div className="text-sm text-[#6b7380]">Open them now to discover rare stickers.</div>
              </div>
            </div>
            <a href="/stickers" className="bg-[#ff7043]/10 text-[#ff7043] border border-[#ff7043]/20 px-4 py-2 font-['Rajdhani',sans-serif] font-bold text-sm rounded hover:bg-[#ff7043]/20 transition">
              Open Packs
            </a>
          </div>
        )}

        {/* Main Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-4">

          {/* Left Column */}
          <div className="space-y-4">

            {/* Stats Row */}
            <div className="bg-[#0d0f11] border border-[#1e2126] rounded overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e2126]">
                <div className="flex items-center gap-2 font-['Share_Tech_Mono',monospace] text-xs text-[#6b7380]">
                  <span className="w-2 h-2 bg-[#00bcd4] rounded-full animate-pulse" /> SYS_METRICS
                </div>
                <span className="font-['Share_Tech_Mono',monospace] text-[10px] text-[#4a5260] border border-[#1e2126] px-2 py-0.5 rounded">LIVE</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-[#1e2126]">
                <div className="bg-[#0d0f11] p-4 hover:bg-[#111418] transition relative overflow-hidden">
                  <div className="absolute bottom-0 left-0 h-px w-0 transition-all duration-300 hover:w-full bg-[#ffb300]" />
                  <div className="flex items-center gap-2 font-['Share_Tech_Mono',monospace] text-[10px] text-[#4a5260]">
                    <FaCoins className="text-[#ffb300]" /> POINTS
                  </div>
                  <span className="font-['Share_Tech_Mono',monospace] text-2xl font-bold text-[#ffb300] block mt-1">{user.points.toLocaleString()}</span>
                  <div className="text-sm text-[#6b7380]">Redeem for GEEK</div>
                  <button className="mt-2 font-['Share_Tech_Mono',monospace] text-[10px] bg-transparent border border-[#1e2126] text-[#4a5260] px-3 py-1 rounded hover:border-[#ffb300] hover:text-[#ffb300] transition">
                    Redeem →
                  </button>
                </div>
                <div className="bg-[#0d0f11] p-4 hover:bg-[#111418] transition relative overflow-hidden">
                  <div className="absolute bottom-0 left-0 h-px w-0 transition-all duration-300 hover:w-full bg-[#9c6cff]" />
                  <div className="flex items-center gap-2 font-['Share_Tech_Mono',monospace] text-[10px] text-[#4a5260]">
                    <FaGem className="text-[#9c6cff]" /> $GEEK BALANCE
                  </div>
                  <span className="font-['Share_Tech_Mono',monospace] text-2xl font-bold text-[#9c6cff] block mt-1">{user.geek_balance.toFixed(2)}</span>
                  <div className="text-sm text-[#6b7380] flex items-center gap-1">
                    <FaArrowRight className="text-[#00e676] text-[10px]" /> Earn in Gauntlet &amp; CCE
                  </div>
                </div>
                <div className="bg-[#0d0f11] p-4 hover:bg-[#111418] transition relative overflow-hidden">
                  <div className="absolute bottom-0 left-0 h-px w-0 transition-all duration-300 hover:w-full bg-[#00bcd4]" />
                  <div className="flex items-center gap-2 font-['Share_Tech_Mono',monospace] text-[10px] text-[#4a5260]">
                    {getLevelIcon(user.level)} LEVEL {user.level}
                  </div>
                  <span className="font-['Share_Tech_Mono',monospace] text-lg font-bold text-[#00bcd4] block mt-1">{getLevelTitle(user.level)}</span>
                  <div className="mt-2">
                    <div className="h-1 bg-[#1e2126] rounded-full overflow-hidden">
                      <div className="h-full bg-[#00bcd4] rounded-full transition-all duration-500" style={{ width: `${xpProgress.progress_percentage}%` }} />
                    </div>
                    <div className="flex justify-between mt-1 font-['Share_Tech_Mono',monospace] text-[10px] text-[#4a5260]">
                      <span>{xpProgress.current_xp_in_level}/{xpProgress.xp_needed} XP</span>
                      <span className="text-[#00bcd4]">{Math.round(xpProgress.progress_percentage)}%</span>
                    </div>
                  </div>
                </div>
                <div className="bg-[#0d0f11] p-4 hover:bg-[#111418] transition relative overflow-hidden">
                  <div className="absolute bottom-0 left-0 h-px w-0 transition-all duration-300 hover:w-full bg-[#ff7043]" />
                  <div className="flex items-center gap-2 font-['Share_Tech_Mono',monospace] text-[10px] text-[#4a5260]">
                    <FaFire className="text-[#ff7043]" /> STREAK
                  </div>
                  <span className="font-['Share_Tech_Mono',monospace] text-2xl font-bold text-[#ff7043] block mt-1">{user.current_streak} <span className="text-base">days</span></span>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#6b7380]">Best: {user.longest_streak}</span>
                    <span className="font-['Share_Tech_Mono',monospace] text-[10px] bg-[#ff7043]/10 border border-[#ff7043]/20 text-[#ff7043] px-2 py-0.5 rounded">{streakMultiplier.toFixed(1)}x</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-[#0d0f11] border border-[#1e2126] rounded overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e2126]">
                <div className="flex items-center gap-2 font-['Share_Tech_Mono',monospace] text-xs text-[#6b7380]">
                  <FaBolt className="text-[#ffb300]" /> QUICK_ACTIONS
                </div>
                <span className="font-['Share_Tech_Mono',monospace] text-[10px] text-[#4a5260] border border-[#1e2126] px-2 py-0.5 rounded">INSTANT ACCESS</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-[#1e2126]">
                <a href="/gauntlet" className="bg-[#0d0f11] p-4 hover:bg-[#111418] transition relative overflow-hidden group">
                  <div className="absolute bottom-0 left-0 h-px w-0 group-hover:w-full transition-all duration-300 bg-[#ff7043]" />
                  <div className="w-9 h-9 border border-[#1e2126] flex items-center justify-center text-[#ff7043] rounded mb-3">
                    <FaFire />
                  </div>
                  <div className="font-bold text-[#e8eaf0]">Geek Gauntlet</div>
                  <div className="text-sm text-[#6b7380]">Progressive challenge with escalating rewards and risk.</div>
                  <div className="flex gap-2 mt-2">
                    <span className="font-['Share_Tech_Mono',monospace] text-[10px] text-[#4a5260] border border-[#1e2126] px-2 py-0.5 rounded">10 Rounds</span>
                    <span className="font-['Share_Tech_Mono',monospace] text-[10px] text-[#f06292] border border-[#f06292]/20 px-2 py-0.5 rounded">High Risk</span>
                  </div>
                  <div className="mt-2 font-['Share_Tech_Mono',monospace] text-xs text-[#ff7043]">
                    <FaGem className="inline mr-1" /> Up to 1,000 GEEK/round
                  </div>
                </a>
                <a href="/quiz" className="bg-[#0d0f11] p-4 hover:bg-[#111418] transition relative overflow-hidden group">
                  <div className="absolute bottom-0 left-0 h-px w-0 group-hover:w-full transition-all duration-300 bg-[#00bcd4]" />
                  <div className="w-9 h-9 border border-[#1e2126] flex items-center justify-center text-[#00bcd4] rounded mb-3">
                    <FaQuestionCircle />
                  </div>
                  <div className="font-bold text-[#e8eaf0]">Daily Quiz</div>
                  <div className="text-sm text-[#6b7380]">Test knowledge anytime, build your streak.</div>
                  <div className="flex gap-2 mt-2">
                    <span className="font-['Share_Tech_Mono',monospace] text-[10px] text-[#4a5260] border border-[#1e2126] px-2 py-0.5 rounded">10 pts each</span>
                    <span className="font-['Share_Tech_Mono',monospace] text-[10px] text-[#4a5260] border border-[#1e2126] px-2 py-0.5 rounded">All topics</span>
                  </div>
                  <div className="mt-2 font-['Share_Tech_Mono',monospace] text-xs text-[#00bcd4]">
                    <FaStar className="inline mr-1" /> Build your streak!
                  </div>
                </a>
                {user.level >= CCE_MIN_LEVEL_FOR_CREATION ? (
                  <a href="/cce" className="bg-[#0d0f11] p-4 hover:bg-[#111418] transition relative overflow-hidden group">
                    <div className="absolute bottom-0 left-0 h-px w-0 group-hover:w-full transition-all duration-300 bg-[#00e676]" />
                    <div className="w-9 h-9 border border-[#1e2126] flex items-center justify-center text-[#00e676] rounded mb-3">
                      <FaCode />
                    </div>
                    <div className="font-bold text-[#e8eaf0]">CCE Dashboard</div>
                    <div className="text-sm text-[#6b7380]">Track creator performance and community earnings.</div>
                    <div className="flex gap-2 mt-2">
                      <span className="font-['Share_Tech_Mono',monospace] text-[10px] text-[#4a5260] border border-[#1e2126] px-2 py-0.5 rounded">Creator Hub</span>
                      <span className="font-['Share_Tech_Mono',monospace] text-[10px] text-[#4a5260] border border-[#1e2126] px-2 py-0.5 rounded">{approvedQuestions}/{submittedQuestions} approved</span>
                    </div>
                    <div className="mt-2 font-['Share_Tech_Mono',monospace] text-xs text-[#00e676]">
                      <FaGem className="inline mr-1" /> {creatorEarnings.toFixed(2)} GEEK earned
                    </div>
                  </a>
                ) : (
                  <div className="bg-[#0d0f11] p-4 opacity-40 relative overflow-hidden">
                    <div className="w-9 h-9 border border-[#1e2126] flex items-center justify-center text-[#4a5260] rounded mb-3">
                      <FaLock />
                    </div>
                    <div className="font-bold text-[#6b7380]">CCE Dashboard</div>
                    <div className="text-sm text-[#4a5260]">Unlock at Level {CCE_MIN_LEVEL_FOR_CREATION} (currently {user.level}).</div>
                    <div className="flex gap-2 mt-2">
                      <span className="font-['Share_Tech_Mono',monospace] text-[10px] text-[#4a5260] border border-[#1e2126] px-2 py-0.5 rounded">Locked</span>
                    </div>
                    <div className="mt-2 font-['Share_Tech_Mono',monospace] text-xs text-[#4a5260]">
                      <FaArrowRight className="inline mr-1" /> Level up to unlock
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Achievements + Stickers Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Achievements */}
              <div className="bg-[#0d0f11] border border-[#1e2126] rounded overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e2126]">
                  <div className="flex items-center gap-2 font-['Share_Tech_Mono',monospace] text-xs text-[#6b7380]">
                    <FaTrophy className="text-[#ffb300]" /> ACHIEVEMENTS
                  </div>
                  <a href="/achievements" className="font-['Share_Tech_Mono',monospace] text-[10px] text-[#00bcd4] hover:underline">View All →</a>
                </div>
                <div className="p-4">
                  <div className="mb-3">
                    <div className="flex justify-between font-['Share_Tech_Mono',monospace] text-xs text-[#6b7380]">
                      <span>COMPLETION</span><span className="text-[#ffb300]">{achievements.count} / {achievements.total}</span>
                    </div>
                    <div className="h-1 bg-[#1e2126] rounded-full overflow-hidden mt-1">
                      <div className="h-full bg-[#ffb300] rounded-full transition-all duration-500" style={{ width: `${(achievements.count / achievements.total) * 100}%` }} />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-1 bg-[#1e2126] rounded overflow-hidden">
                    <div className="bg-[#08090a] text-center p-3">
                      <span className="font-['Share_Tech_Mono',monospace] text-lg text-[#ffb300] block">{achievements.count}</span>
                      <span className="font-['Share_Tech_Mono',monospace] text-[10px] text-[#4a5260]">Unlocked</span>
                    </div>
                    <div className="bg-[#08090a] text-center p-3">
                      <span className="font-['Share_Tech_Mono',monospace] text-lg text-[#00bcd4] block">{achievements.total - achievements.count}</span>
                      <span className="font-['Share_Tech_Mono',monospace] text-[10px] text-[#4a5260]">In Prog</span>
                    </div>
                    <div className="bg-[#08090a] text-center p-3">
                      <span className="font-['Share_Tech_Mono',monospace] text-lg text-[#9c6cff] block">{Math.round((achievements.count / achievements.total) * 100)}%</span>
                      <span className="font-['Share_Tech_Mono',monospace] text-[10px] text-[#4a5260]">Done</span>
                    </div>
                  </div>
                  <div className="mt-3 bg-[#08090a] border border-[#1e2126] rounded p-3 flex items-center gap-3">
                    <div className="w-8 h-8 border border-[#1e2126] flex items-center justify-center text-[#ffb300] rounded">
                      <FaBolt />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm text-[#e8eaf0]">Next Achievement</div>
                      <div className="text-xs text-[#6b7380]">Answer 100 questions correctly</div>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-1 bg-[#1e2126] rounded-full overflow-hidden">
                          <div className="h-full bg-[#ffb300] rounded-full" style={{ width: `${Math.min((user.xp / 10000) * 100, 100)}%` }} />
                        </div>
                        <span className="font-['Share_Tech_Mono',monospace] text-[10px] text-[#ffb300]">{user.xp}/10k</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stickers */}
              <div className="bg-[#0d0f11] border border-[#1e2126] rounded overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e2126]">
                  <div className="flex items-center gap-2 font-['Share_Tech_Mono',monospace] text-xs text-[#6b7380]">
                    <FaStickyNote className="text-[#00e676]" /> STICKERS
                  </div>
                  <a href="/stickers" className="font-['Share_Tech_Mono',monospace] text-[10px] text-[#00bcd4] hover:underline">Collection →</a>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-4 gap-2">
                    {stickers.map((sticker) => (
                      <div 
                        key={sticker.id}
                        className={`aspect-square bg-[#08090a] border ${sticker.owned ? 'border-[#00e676]/30' : 'border-[#1e2126]'} rounded flex items-center justify-center text-2xl transition hover:border-[#00e676]`}
                        title={sticker.owned ? `${sticker.name} #${sticker.number}` : 'Locked Sticker'}
                      >
                        {sticker.owned ? sticker.emoji : <FaLock className="text-[#1e2126]" />}
                      </div>
                    ))}
                  </div>
                  <button className="w-full mt-3 bg-[#00e676]/10 text-[#00e676] border border-[#00e676]/20 px-4 py-2 font-['Share_Tech_Mono',monospace] text-xs rounded hover:bg-[#00e676]/15 transition flex items-center justify-center gap-2">
                    <FaGift /> OPEN STICKER PACK <span className="bg-black/20 px-2 py-0.5 text-[10px] rounded">FREE</span>
                  </button>
                  <div className="font-['Share_Tech_Mono',monospace] text-[10px] text-[#4a5260] text-center mt-2">
                    <FaInfoCircle className="inline mr-1" /> Collect all 8 to unlock special rewards
                  </div>
                </div>
              </div>
            </div>

            {/* Latest Gauntlet Run */}
            {latestRun && (
              <div className="bg-[#0d0f11] border border-[#1e2126] rounded overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e2126]">
                  <div className="flex items-center gap-2 font-['Share_Tech_Mono',monospace] text-xs text-[#6b7380]">
                    <FaScroll className="text-[#ff7043]" /> LATEST_GAUNTLET_RUN
                  </div>
                  <a href="/gauntlet/results" className="font-['Share_Tech_Mono',monospace] text-[10px] text-[#00bcd4] hover:underline">Details →</a>
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="w-12 h-12 bg-[#ff7043]/10 border border-[#ff7043]/20 rounded flex items-center justify-center font-['Share_Tech_Mono',monospace] text-xl font-bold text-[#ff7043]">
                      #{latestRun.highest_round}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-[#e8eaf0]">Round {latestRun.highest_round}</div>
                      <div className="flex items-center gap-2 font-['Share_Tech_Mono',monospace] text-xs text-[#6b7380] flex-wrap">
                        <span>{latestRun.date_completed.toLocaleDateString()}</span>
                        <span>·</span>
                        <span className={latestRun.total_questions > 0 && latestRun.total_correct / latestRun.total_questions > 0.7 ? 'text-[#00e676]' : latestRun.total_questions > 0 && latestRun.total_correct / latestRun.total_questions > 0.5 ? 'text-[#ffb300]' : 'text-[#f06292]'}>
                          {latestRun.total_questions > 0 ? Math.round((latestRun.total_correct / latestRun.total_questions) * 100) : 0}% accuracy
                        </span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="font-['Share_Tech_Mono',monospace] text-lg font-bold text-[#00e676]">+{latestRun.total_geek_earned.toFixed(2)} GEEK</div>
                      <div className="font-['Share_Tech_Mono',monospace] text-[10px] text-[#6b7380]">{latestRun.total_correct}/{latestRun.total_questions} correct</div>
                    </div>
                  </div>
                  <div className="h-1 bg-[#1e2126] rounded-full overflow-hidden mt-2">
                    <div className="h-full bg-[#ff7043] rounded-full" style={{ width: `${latestRun.total_questions > 0 ? (latestRun.total_correct / latestRun.total_questions) * 100 : 0}%` }} />
                  </div>
                  <div className="grid grid-cols-3 gap-px bg-[#1e2126] mt-3 rounded overflow-hidden">
                    <div className="bg-[#08090a] text-center p-2">
                      <span className="font-['Share_Tech_Mono',monospace] text-sm text-[#00bcd4] block">{latestRun.total_xp_earned || 0}</span>
                      <span className="font-['Share_Tech_Mono',monospace] text-[10px] text-[#4a5260]">XP Earned</span>
                    </div>
                    <div className="bg-[#08090a] text-center p-2">
                      <span className="font-['Share_Tech_Mono',monospace] text-sm text-[#ffb300] block">{latestRun.total_correct * 100}</span>
                      <span className="font-['Share_Tech_Mono',monospace] text-[10px] text-[#4a5260]">Total Score</span>
                    </div>
                    <div className="bg-[#08090a] text-center p-2">
                      <span className="font-['Share_Tech_Mono',monospace] text-sm text-[#9c6cff] block">#{Math.floor(Math.random() * 100) + 1}</span>
                      <span className="font-['Share_Tech_Mono',monospace] text-[10px] text-[#4a5260]">Rank</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#1e2126] flex-wrap gap-2">
                    <span className="text-sm text-[#6b7380]">Ready for another run?</span>
                    <a href="/gauntlet" className="bg-[#ff7043]/10 text-[#ff7043] border border-[#ff7043]/20 px-4 py-2 font-['Rajdhani',sans-serif] font-bold text-sm rounded hover:bg-[#ff7043]/20 transition">
                      <FaFire className="inline mr-1" /> {activeRun ? `Continue Round ${activeRun.highest_round}` : 'Play Gauntlet'}
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* CCE Stats */}
            {user.level >= CCE_MIN_LEVEL_FOR_CREATION && (
              <div className="bg-[#0d0f11] border border-[#1e2126] rounded overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e2126]">
                  <div className="flex items-center gap-2 font-['Share_Tech_Mono',monospace] text-xs text-[#6b7380]">
                    <FaCode className="text-[#00e676]" /> CCE_CREATOR_STATS
                  </div>
                  <a href="/cce" className="font-['Share_Tech_Mono',monospace] text-[10px] text-[#00bcd4] hover:underline">Full Dashboard →</a>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-4 gap-px bg-[#1e2126] rounded overflow-hidden">
                    <div className="bg-[#08090a] text-center p-3">
                      <span className="font-['Share_Tech_Mono',monospace] text-lg text-[#00e676] block">{creatorEarnings.toFixed(2)}</span>
                      <span className="font-['Share_Tech_Mono',monospace] text-[10px] text-[#4a5260]">GEEK Earned</span>
                      <span className="font-['Share_Tech_Mono',monospace] text-[9px] text-[#4a5260] block">Lifetime</span>
                    </div>
                    <div className="bg-[#08090a] text-center p-3">
                      <span className="font-['Share_Tech_Mono',monospace] text-lg text-[#00bcd4] block">{submittedQuestions}</span>
                      <span className="font-['Share_Tech_Mono',monospace] text-[10px] text-[#4a5260]">Submitted</span>
                      <span className="font-['Share_Tech_Mono',monospace] text-[9px] text-[#4a5260] block">{approvedQuestions} approved</span>
                    </div>
                    <div className="bg-[#08090a] text-center p-3">
                      <span className="font-['Share_Tech_Mono',monospace] text-lg text-[#00e676] block">{approvedQuestions}</span>
                      <span className="font-['Share_Tech_Mono',monospace] text-[10px] text-[#4a5260]">Approved</span>
                      <span className="font-['Share_Tech_Mono',monospace] text-[9px] text-[#4a5260] block">{submittedQuestions > 0 ? Math.round((approvedQuestions / submittedQuestions) * 100) : 0}% rate</span>
                    </div>
                    <div className="bg-[#08090a] text-center p-3">
                      <span className="font-['Share_Tech_Mono',monospace] text-lg text-[#ffb300] block">{validationCount}</span>
                      <span className="font-['Share_Tech_Mono',monospace] text-[10px] text-[#4a5260]">Reviews</span>
                      <span className="font-['Share_Tech_Mono',monospace] text-[9px] text-[#4a5260] block">{user.review_accuracy}% acc</span>
                    </div>
                  </div>
                  {questionsNearingCap.length > 0 && (
                    <div className="mt-3 bg-[#08090a] border border-[#ffb300]/15 rounded p-3 flex gap-3">
                      <FaExclamationTriangle className="text-[#ffb300] flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold text-sm text-[#ffb300]">Questions nearing max earnings</div>
                        <div className="text-xs text-[#6b7380]">{questionsNearingCap.length} question(s) at 80%+ cap</div>
                        <div className="flex gap-2 mt-1 flex-wrap">
                          {questionsNearingCap.slice(0, 3).map((q) => (
                            <span key={q.id} className="font-['Share_Tech_Mono',monospace] text-[10px] bg-[#111418] border border-[#1e2126] px-2 py-0.5 text-[#4a5260] rounded">{q.question.slice(0, 20)}...</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  {recentEarnings.length > 0 && (
                    <>
                      <div className="font-['Share_Tech_Mono',monospace] text-[10px] text-[#4a5260] mt-3 mb-2">
                        <FaHistory className="inline mr-1" /> RECENT_EARNINGS
                      </div>
                      <div className="space-y-px bg-[#1e2126] rounded overflow-hidden">
                        {recentEarnings.slice(0, 4).map((earning, idx) => (
                          <div key={idx} className="bg-[#0d0f11] px-3 py-2 flex items-center justify-between hover:bg-[#111418] transition flex-wrap gap-1">
                            <span className="font-['Share_Tech_Mono',monospace] text-sm text-[#00e676]">+{earning.amount.toFixed(2)} GEEK</span>
                            <span className="font-['Share_Tech_Mono',monospace] text-[10px] text-[#4a5260]">{earning.timestamp.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                            <span className="font-['Share_Tech_Mono',monospace] text-[10px] text-[#4a5260] border border-[#1e2126] px-2 py-0.5 rounded">Q#{earning.question_id}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Activity Feed */}
            <div className="bg-[#0d0f11] border border-[#1e2126] rounded overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e2126]">
                <div className="flex items-center gap-2 font-['Share_Tech_Mono',monospace] text-xs text-[#6b7380]">
                  <span className="w-2 h-2 bg-[#00e676] rounded-full animate-pulse" /> ACTIVITY_FEED
                </div>
                <span className="font-['Share_Tech_Mono',monospace] text-[10px] text-[#4a5260] border border-[#1e2126] px-2 py-0.5 rounded">LIVE UPDATES</span>
              </div>
              <div className="divide-y divide-[#1e2126]">
                {submittedQuestions > 0 && (
                  <div className="px-4 py-3 flex items-center justify-between hover:bg-[#111418] transition flex-wrap gap-2">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-8 h-8 border border-[#1e2126] flex items-center justify-center text-[#00bcd4] rounded">
                        <FaQuestionCircle />
                      </div>
                      <div>
                        <div className="font-bold text-sm text-[#e8eaf0]">Question Contributor</div>
                        <div className="text-xs text-[#6b7380]">{approvedQuestions} approved · {submittedQuestions} total</div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="font-['Share_Tech_Mono',monospace] text-sm text-[#00e676]">+{creatorEarnings.toFixed(2)} GEEK</div>
                      <a href="/cce/my-questions" className="font-['Share_Tech_Mono',monospace] text-[10px] text-[#00bcd4] hover:underline">View Details →</a>
                    </div>
                  </div>
                )}
                {validationCount > 0 && (
                  <div className="px-4 py-3 flex items-center justify-between hover:bg-[#111418] transition flex-wrap gap-2">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-8 h-8 border border-[#1e2126] flex items-center justify-center text-[#00e676] rounded">
                        <FaCheckCircle />
                      </div>
                      <div>
                        <div className="font-bold text-sm text-[#e8eaf0]">Community Validator</div>
                        <div className="text-xs text-[#6b7380]">{validationCount} validations · {user.review_accuracy}% accuracy</div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="font-['Share_Tech_Mono',monospace] text-sm text-[#ffb300]">+{(validationCount * CCE_REVIEW_REWARD_GEEK).toFixed(1)} GEEK</div>
                      <a href="/cce/validate" className="font-['Share_Tech_Mono',monospace] text-[10px] text-[#00bcd4] hover:underline">Validate More →</a>
                    </div>
                  </div>
                )}
                {recentInteractions.length > 0 && (
                  <div className="px-4 py-3 flex items-center justify-between hover:bg-[#111418] transition flex-wrap gap-2">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-8 h-8 border border-[#1e2126] flex items-center justify-center text-[#9c6cff] rounded">
                        <FaComments />
                      </div>
                      <div>
                        <div className="font-bold text-sm text-[#e8eaf0]">Character Interactions</div>
                        <div className="text-xs text-[#6b7380]">{recentInteractions.length} new messages</div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="font-['Share_Tech_Mono',monospace] text-sm text-[#9c6cff]">{user.favorite_character}</div>
                      <a href="/character/interactions" className="font-['Share_Tech_Mono',monospace] text-[10px] text-[#00bcd4] hover:underline">History →</a>
                    </div>
                  </div>
                )}
                {user.current_streak >= 7 && (
                  <div className="px-4 py-3 bg-[#ff7043]/5 border-l-2 border-[#ff7043]/30 flex items-center justify-between hover:bg-[#ff7043]/10 transition flex-wrap gap-2">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-8 h-8 border border-[#1e2126] flex items-center justify-center text-[#ff7043] rounded">
                        <FaFire />
                      </div>
                      <div>
                        <div className="font-bold text-sm text-[#e8eaf0]">Streak Milestone</div>
                        <div className="text-xs text-[#6b7380]">{user.current_streak} day streak · {streakMultiplier.toFixed(1)}x multiplier</div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="font-['Share_Tech_Mono',monospace] text-sm text-[#ff7043]">🔥 ON FIRE</div>
                      <div className="font-['Share_Tech_Mono',monospace] text-[10px] text-[#4a5260]">Best: {user.longest_streak}</div>
                    </div>
                  </div>
                )}
              </div>
              <div className="px-4 py-2 border-t border-[#1e2126] flex items-center justify-between font-['Share_Tech_Mono',monospace] text-[10px] text-[#4a5260] flex-wrap gap-1">
                <span><FaHistory className="inline mr-1" /> Updated just now</span>
                <button onClick={() => window.location.reload()} className="bg-none border-none cursor-pointer text-[#00bcd4] hover:underline">
                  <FaSyncAlt className="inline mr-1" /> Refresh
                </button>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">

            {/* Leaderboard */}
            <div className="bg-[#0d0f11] border border-[#1e2126] rounded overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e2126]">
                <div className="flex items-center gap-2 font-['Share_Tech_Mono',monospace] text-xs text-[#6b7380]">
                  <span className="w-2 h-2 bg-[#ffb300] rounded-full animate-pulse" /> TOP_PLAYERS
                </div>
                <span className="font-['Share_Tech_Mono',monospace] text-[10px] text-[#4a5260] border border-[#1e2126] px-2 py-0.5 rounded">LIVE</span>
              </div>
              <div className="divide-y divide-[#1e2126]">
                {leaderboard.map((player) => (
                  <div key={player.rank} className={`px-4 py-2.5 flex items-center justify-between hover:bg-[#111418] transition ${player.is_current_user ? 'bg-[#00bcd4]/5 border-l-2 border-[#00bcd4]' : ''}`}>
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className={`font-['Share_Tech_Mono',monospace] text-sm font-bold w-6 ${player.rank === 1 ? 'text-[#ffb300]' : player.rank === 2 ? 'text-[#6b7380]' : player.rank === 3 ? 'text-[#c87941]' : 'text-[#00bcd4]'}`}>
                        #{player.rank}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm text-[#e8eaf0]">
                          {player.name}
                          {player.is_current_user && <span className="font-['Share_Tech_Mono',monospace] text-[10px] text-[#00bcd4] ml-1">(You)</span>}
                        </div>
                        <div className="font-['Share_Tech_Mono',monospace] text-[10px] text-[#4a5260]">Lv.{player.level}</div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="font-['Share_Tech_Mono',monospace] text-sm text-[#ffb300]">{player.points.toLocaleString()}</div>
                      <div className="font-['Share_Tech_Mono',monospace] text-[10px] text-[#9c6cff]">{player.geek_balance.toFixed(2)} GEEK</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-4 py-2 border-t border-[#1e2126] flex items-center justify-between font-['Share_Tech_Mono',monospace] text-[10px] text-[#4a5260]">
                <span><FaSyncAlt className="inline mr-1" /> Every 10s</span>
                <span>{new Date().toLocaleTimeString()}</span>
              </div>
              <div className="px-4 py-2 border-t border-[#1e2126] flex items-center justify-between font-['Share_Tech_Mono',monospace] text-xs">
                <span>Your Rank</span>
                <span className="text-[#00bcd4]">#{leaderboard.find(p => p.is_current_user)?.rank || 'Not ranked'}</span>
              </div>
            </div>

            {/* Milestone */}
            <div className="bg-[#0d0f11] border border-[#1e2126] rounded overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e2126]">
                <div className="flex items-center gap-2 font-['Share_Tech_Mono',monospace] text-xs text-[#6b7380]">
                  <FaCrown className="text-[#9c6cff]" /> MILESTONE
                </div>
                <span className="font-['Share_Tech_Mono',monospace] text-[10px] text-[#9c6cff] border border-[#9c6cff]/25 px-2 py-0.5 rounded">LVL {nextMilestone}</span>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#6b7380]">Progress to Level {nextMilestone}</span>
                  <span className="font-['Share_Tech_Mono',monospace] text-sm text-[#9c6cff]">{Math.round(milestoneProgress)}%</span>
                </div>
                <div className="h-1 bg-[#1e2126] rounded-full overflow-hidden mt-1">
                  <div className="h-full bg-[#9c6cff] rounded-full transition-all duration-500" style={{ width: `${milestoneProgress}%` }} />
                </div>
                <div className="font-['Share_Tech_Mono',monospace] text-[10px] text-[#4a5260] mt-1">{xpToMilestone} XP remaining</div>
                <div className="grid grid-cols-3 gap-px bg-[#1e2126] mt-3 rounded overflow-hidden">
                  <div className="bg-[#08090a] text-center p-2">
                    <span className="font-['Share_Tech_Mono',monospace] text-sm text-[#9c6cff] block">{getMilestoneReward(nextMilestone).geek} GEEK</span>
                    <span className="font-['Share_Tech_Mono',monospace] text-[10px] text-[#4a5260]">Reward</span>
                  </div>
                  <div className="bg-[#08090a] text-center p-2">
                    <span className="font-['Share_Tech_Mono',monospace] text-sm text-[#ffb300] block">{getMilestoneReward(nextMilestone).xp} XP</span>
                    <span className="font-['Share_Tech_Mono',monospace] text-[10px] text-[#4a5260]">Bonus</span>
                  </div>
                  <div className="bg-[#08090a] text-center p-2">
                    <span className="font-['Share_Tech_Mono',monospace] text-sm text-[#00e676] block">{getMilestoneReward(nextMilestone).sticker_pack}</span>
                    <span className="font-['Share_Tech_Mono',monospace] text-[10px] text-[#4a5260]">Stickers</span>
                  </div>
                </div>
                <div className="font-['Share_Tech_Mono',monospace] text-[10px] text-[#9c6cff] text-center mt-3 border border-[#9c6cff]/15 rounded p-2">
                  <FaTag className="inline mr-1" /> Title: {getMilestoneReward(nextMilestone).title}
                </div>
                <a href="/level-progression" className="flex items-center justify-center gap-2 w-full mt-3 border border-[#1e2126] py-2 font-['Share_Tech_Mono',monospace] text-[10px] text-[#4a5260] rounded hover:border-[#252a30] hover:text-[#e8eaf0] transition">
                  <FaChartLine /> View Full Progression
                </a>
              </div>
            </div>

            {/* AI Assistant */}
            <div className="bg-[#0d0f11] border border-[#9c6cff]/15 rounded overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e2126] bg-[#9c6cff]/5">
                <div className="flex items-center gap-2 font-['Share_Tech_Mono',monospace] text-xs text-[#6b7380]">
                  <FaRobot className="text-[#9c6cff]" /> AI_ASSISTANT
                </div>
                <span className="w-2 h-2 bg-[#f06292] rounded-full animate-pulse" />
              </div>
              <div className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 border border-[#1e2126] overflow-hidden rounded flex items-center justify-center text-2xl bg-[#08090a]">
                    🤖
                  </div>
                  <div>
                    <div className="font-bold text-[#e8eaf0]">GIGA</div>
                    <div className="text-xs text-[#6b7380]">Personalized recommendations</div>
                  </div>
                </div>
                <div className="bg-[#08090a] border border-[#1e2126] rounded p-3 flex gap-3">
                  <FaLightbulb className="text-[#ffb300] flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-[#e8eaf0]">{aiRecommendation.message}</span>
                </div>
                <a href="/ai-assistant" className="flex items-center justify-center gap-2 w-full mt-3 bg-[#9c6cff]/10 text-[#9c6cff] border border-[#9c6cff]/20 py-2 font-['Rajdhani',sans-serif] font-bold text-sm rounded hover:bg-[#9c6cff]/15 transition">
                  <FaComments /> Talk to AI
                </a>
              </div>
            </div>

            {/* Creator Earnings */}
            {creatorEarnings > 0 && (
              <div className="bg-[#0d0f11] border border-[#1e2126] rounded overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e2126]">
                  <div className="flex items-center gap-2 font-['Share_Tech_Mono',monospace] text-xs text-[#6b7380]">
                    <FaChartLine className="text-[#00bcd4]" /> CREATOR_EARNINGS
                  </div>
                  <span className="font-['Share_Tech_Mono',monospace] text-[10px] text-[#4a5260] border border-[#1e2126] px-2 py-0.5 rounded">LIFETIME</span>
                </div>
                <div className="p-4">
                  <span className="font-['Share_Tech_Mono',monospace] text-3xl font-bold text-[#00bcd4] block text-center">+{creatorEarnings.toFixed(2)} GEEK</span>
                  <div className="font-['Share_Tech_Mono',monospace] text-[10px] text-[#4a5260] text-center">from {approvedQuestions} approved questions</div>
                  <div className="grid grid-cols-2 gap-px bg-[#1e2126] mt-3 rounded overflow-hidden">
                    <div className="bg-[#08090a] text-center p-2">
                      <span className="font-['Share_Tech_Mono',monospace] text-sm text-[#e8eaf0] block">{submittedQuestions}</span>
                      <span className="font-['Share_Tech_Mono',monospace] text-[10px] text-[#4a5260]">Submitted</span>
                    </div>
                    <div className="bg-[#08090a] text-center p-2">
                      <span className="font-['Share_Tech_Mono',monospace] text-sm text-[#00e676] block">{approvedQuestions}</span>
                      <span className="font-['Share_Tech_Mono',monospace] text-[10px] text-[#4a5260]">Approved</span>
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="flex justify-between font-['Share_Tech_Mono',monospace] text-[10px] text-[#4a5260]">
                      <span>APPROVAL RATE</span>
                      <span className={submittedQuestions > 0 && (approvedQuestions / submittedQuestions) * 100 > 70 ? 'text-[#00e676]' : submittedQuestions > 0 && (approvedQuestions / submittedQuestions) * 100 > 40 ? 'text-[#ffb300]' : 'text-[#f06292]'}>
                        {submittedQuestions > 0 ? Math.round((approvedQuestions / submittedQuestions) * 100) : 0}%
                      </span>
                    </div>
                    <div className="h-1 bg-[#1e2126] rounded-full overflow-hidden mt-1">
                      <div className="h-full bg-[#00bcd4] rounded-full transition-all duration-500" style={{ width: `${submittedQuestions > 0 ? (approvedQuestions / submittedQuestions) * 100 : 0}%` }} />
                    </div>
                  </div>
                  <a href="/cce/my-questions" className="flex items-center justify-center gap-2 w-full mt-3 border border-[#1e2126] py-2 font-['Share_Tech_Mono',monospace] text-[10px] text-[#4a5260] rounded hover:border-[#252a30] hover:text-[#e8eaf0] transition">
                    <FaArrowRight /> View Questions
                  </a>
                </div>
              </div>
            )}

            {/* Weak Topics */}
            {weakTopics.length > 0 && (
              <div className="bg-[#0d0f11] border border-[#1e2126] rounded overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e2126]">
                  <div className="flex items-center gap-2 font-['Share_Tech_Mono',monospace] text-xs text-[#6b7380]">
                    <FaExclamationTriangle className="text-[#f06292]" /> NEED_PRACTICE
                  </div>
                </div>
                <div className="divide-y divide-[#1e2126]">
                  {weakTopics.slice(0, 3).map((topic) => (
                    <div key={topic.id} className="px-4 py-3">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm text-[#e8eaf0]">{topic.name}</span>
                        <span className="font-['Share_Tech_Mono',monospace] text-sm text-[#f06292]">{topic.accuracy}% accuracy</span>
                      </div>
                      <div className="h-1 bg-[#1e2126] rounded-full overflow-hidden mt-1">
                        <div className="h-full bg-[#f06292] rounded-full" style={{ width: `${topic.accuracy}%` }} />
                      </div>
                      <a href={`/quiz?topic=${topic.id}`} className="font-['Share_Tech_Mono',monospace] text-[10px] text-[#f06292] border border-[#f06292]/20 px-3 py-1 rounded hover:bg-[#f06292]/10 transition inline-block mt-2">
                        Practice Now
                      </a>
                    </div>
                  ))}
                </div>
                {weakTopics.length > 3 && (
                  <div className="font-['Share_Tech_Mono',monospace] text-[10px] text-[#4a5260] text-center py-2 border-t border-[#1e2126]">
                    +{weakTopics.length - 3} more topics
                  </div>
                )}
              </div>
            )}

            {/* Recent Interactions */}
            {recentInteractions.length > 0 && (
              <div className="bg-[#0d0f11] border border-[#1e2126] rounded overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e2126]">
                  <div className="flex items-center gap-2 font-['Share_Tech_Mono',monospace] text-xs text-[#6b7380]">
                    <FaComments className="text-[#f06292]" /> CHARACTER_CHAT
                  </div>
                  <a href="/character/interactions" className="font-['Share_Tech_Mono',monospace] text-[10px] text-[#00bcd4] hover:underline">History →</a>
                </div>
                <div className="divide-y divide-[#1e2126]">
                  {recentInteractions.slice(0, 4).map((interaction, idx) => (
                    <div key={idx} className="px-4 py-3 flex gap-3 hover:bg-[#111418] transition">
                      <div className={`w-7 h-7 border border-[#1e2126] rounded flex items-center justify-center text-sm flex-shrink-0 ${interaction.character === 'GIGA' ? 'text-[#f06292]' : 'text-[#00bcd4]'}`}>
                        {interaction.character === 'GIGA' ? <FaRobot /> : <FaBrain />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`font-['Share_Tech_Mono',monospace] text-[10px] ${interaction.character === 'GIGA' ? 'text-[#f06292]' : 'text-[#00bcd4]'}`}>
                          {interaction.character} <span className="text-[#4a5260]">{interaction.timestamp.toLocaleTimeString()}</span>
                        </div>
                        <div className="text-sm text-[#e8eaf0] truncate">{interaction.message}</div>
                        <div className="font-['Share_Tech_Mono',monospace] text-[10px] text-[#4a5260]">{interaction.interaction_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="px-4 py-2 border-t border-[#1e2126] grid grid-cols-3 gap-2 font-['Share_Tech_Mono',monospace] text-[10px] text-[#4a5260]">
                  <span><FaHeart className="inline text-[#f06292] mr-1" /> GIGA {user.character_affinity_giga}%</span>
                  <span><FaMicrochip className="inline text-[#00bcd4] mr-1" /> ACE {user.character_affinity_ace}%</span>
                  <a href="/character/stats" className="text-[#00bcd4] hover:underline text-right">Stats →</a>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-[#1e2126] mt-8 px-4 py-8 md:px-6">
        <div className="max-w-full">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-[#1e2126] mb-6">
            <div>
              <a href="/" className="flex items-center gap-2 mb-3">
                <span className="font-['Syncopate',sans-serif] font-bold text-xl text-[#f06292]">GP</span>
                <span className="font-['Rajdhani',sans-serif] font-bold text-sm tracking-widest text-white/50">GEEK PROTOCOL</span>
              </a>
              <p className="text-sm text-[#6b7380] leading-relaxed">The ultimate Web3 platform for geeks to test knowledge, earn rewards, and build community through play-to-earn gaming.</p>
              <div className="font-['Share_Tech_Mono',monospace] text-[10px] text-[#4a5260] mt-3">© 2024 Geek Protocol · v1.0</div>
              <div className="flex gap-2 mt-3">
                <a href="#" className="w-7 h-7 border border-[#1e2126] flex items-center justify-center text-[#4a5260] rounded hover:border-[#00bcd4] hover:text-[#00bcd4] transition"><FaTwitter /></a>
                <a href="#" className="w-7 h-7 border border-[#1e2126] flex items-center justify-center text-[#4a5260] rounded hover:border-[#00bcd4] hover:text-[#00bcd4] transition"><FaDiscord /></a>
                <a href="#" className="w-7 h-7 border border-[#1e2126] flex items-center justify-center text-[#4a5260] rounded hover:border-[#00bcd4] hover:text-[#00bcd4] transition"><FaGithub /></a>
                <a href="#" className="w-7 h-7 border border-[#1e2126] flex items-center justify-center text-[#4a5260] rounded hover:border-[#00bcd4] hover:text-[#00bcd4] transition"><FaTelegramPlane /></a>
              </div>
            </div>
            <div>
              <div className="font-['Share_Tech_Mono',monospace] text-[10px] text-[#00bcd4] uppercase mb-4">Platform</div>
              <div className="flex flex-col gap-2">
                <a href="/dashboard" className="text-sm text-[#6b7380] hover:text-[#e8eaf0] transition flex items-center gap-2"><span className="w-1 h-1 bg-[#00bcd4] rounded-full" /> Dashboard</a>
                <a href="/gauntlet" className="text-sm text-[#6b7380] hover:text-[#e8eaf0] transition flex items-center gap-2"><span className="w-1 h-1 bg-[#ff7043] rounded-full" /> Geek Gauntlet</a>
                <a href="/quiz" className="text-sm text-[#6b7380] hover:text-[#e8eaf0] transition flex items-center gap-2"><span className="w-1 h-1 bg-[#00bcd4] rounded-full" /> Daily Quiz</a>
                <a href="/achievements" className="text-sm text-[#6b7380] hover:text-[#e8eaf0] transition flex items-center gap-2"><span className="w-1 h-1 bg-[#ffb300] rounded-full" /> Achievements</a>
              </div>
            </div>
            <div>
              <div className="font-['Share_Tech_Mono',monospace] text-[10px] text-[#00bcd4] uppercase mb-4">Community</div>
              <div className="flex flex-col gap-2">
                <a href="/leaderboard" className="text-sm text-[#6b7380] hover:text-[#e8eaf0] transition flex items-center gap-2"><span className="w-1 h-1 bg-[#00e676] rounded-full" /> Leaderboard</a>
                <a href="/stickers" className="text-sm text-[#6b7380] hover:text-[#e8eaf0] transition flex items-center gap-2"><span className="w-1 h-1 bg-[#00e676] rounded-full" /> Sticker Trading</a>
                <a href="/character/stats" className="text-sm text-[#6b7380] hover:text-[#e8eaf0] transition flex items-center gap-2"><span className="w-1 h-1 bg-[#9c6cff] rounded-full" /> Character Stats</a>
                <a href="/character/interactions" className="text-sm text-[#6b7380] hover:text-[#e8eaf0] transition flex items-center gap-2"><span className="w-1 h-1 bg-[#f06292] rounded-full" /> AI Chat History</a>
              </div>
            </div>
            <div>
              <div className="font-['Share_Tech_Mono',monospace] text-[10px] text-[#00bcd4] uppercase mb-4">Resources</div>
              <div className="flex flex-col gap-2">
                {user.level >= CCE_MIN_LEVEL_FOR_CREATION && (
                  <>
                    <a href="/cce" className="text-sm text-[#6b7380] hover:text-[#e8eaf0] transition flex items-center gap-2"><span className="w-1 h-1 bg-[#00e676] rounded-full" /> CCE Dashboard</a>
                    <a href="/cce/submit" className="text-sm text-[#6b7380] hover:text-[#e8eaf0] transition flex items-center gap-2"><span className="w-1 h-1 bg-[#00bcd4] rounded-full" /> Submit Question</a>
                  </>
                )}
                {user.is_admin && (
                  <a href="/admin" className="text-sm text-[#f06292] hover:text-[#e8eaf0] transition flex items-center gap-2"><span className="w-1 h-1 bg-[#f06292] rounded-full" /> Admin Panel</a>
                )}
                <a href="#" className="text-sm text-[#6b7380] hover:text-[#e8eaf0] transition flex items-center gap-2"><span className="w-1 h-1 bg-[#4a5260] rounded-full" /> Help Center</a>
                <a href="#" className="text-sm text-[#6b7380] hover:text-[#e8eaf0] transition flex items-center gap-2"><span className="w-1 h-1 bg-[#4a5260] rounded-full" /> Whitepaper</a>
              </div>
            </div>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="font-['Share_Tech_Mono',monospace] text-[10px] text-[#4a5260] tracking-wider">ALL HOPE. NO HYPE. · BUILT ON KASPA · LEVEL UP. EARN ON. GEEK OUT.</div>
            <div className="flex items-center gap-4 font-['Share_Tech_Mono',monospace] text-[10px] text-[#4a5260]">
              <span className="flex items-center gap-1"><span className="w-2 h-2 bg-[#00e676] rounded-full animate-pulse" /> System Online</span>
              <span className="opacity-30">·</span>
              <span>{stats.total_users}+ Users</span>
              <span className="opacity-30">·</span>
              <span>{stats.approved_questions} Questions</span>
            </div>
            <div className="font-['Share_Tech_Mono',monospace] text-[10px] text-[#4a5260]">Powered by <span className="text-[#00bcd4]">KASPA</span> · <span className="text-[#9c6cff]">GEEK</span></div>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.2; }
        }
      `}</style>
    </div>
  );
}

// Helper component for tag icon
function FaTag(props: any) {
  return <FaInfoCircle {...props} />;
}