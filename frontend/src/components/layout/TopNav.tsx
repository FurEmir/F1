import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Bot,
  FolderLock,
  GitFork,
  LayoutGrid,
  LogOut,
  Menu,
  ShieldCheck,
  Terminal,
  Tv,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { endSession } from "@/lib/session";
import type { UserProfile } from "@/types";

const STUDENT_NAV = [
  { name: "Ana Sayfa", path: "/", icon: Terminal, testid: "nav-home" },
  { name: "Görevler", path: "/gorevler", icon: FolderLock, testid: "nav-missions" },
  { name: "Kanıt Panosu", path: "/kanit-panosu", icon: LayoutGrid, testid: "nav-evidence-board" },
  { name: "Teknoloji Ağacı", path: "/teknoloji-agaci", icon: GitFork, testid: "nav-tech-tree" },
  { name: "Simülasyonlar", path: "/simulasyonlar", icon: Tv, testid: "nav-simulations" },
  { name: "Dr. Nova (AI Mentor)", path: "/mentor", icon: Bot, testid: "nav-ai-mentor" },
  { name: "Başarılar", path: "/basarilar", icon: ShieldCheck, testid: "nav-achievements" },
  { name: "Profil", path: "/profil", icon: User, testid: "nav-profile" },
];

export default function TopNav({ user }: { user: UserProfile }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const isTeacher = user.role === "teacher" || user.role === "admin";

  const items = isTeacher
    ? [{ name: "Öğretmen Paneli", path: "/pano", icon: ShieldCheck, testid: "nav-teacher" }]
    : STUDENT_NAV;

  async function handleLogout() {
    await endSession();
    navigate("/giris", { replace: true });
  }

  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-[#070A11]/80 backdrop-blur-xl">
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" aria-hidden />
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <NavLink to={isTeacher ? "/pano" : "/"} className="flex items-center gap-2" data-testid="nav-brand">
          <span className="relative inline-flex h-9 w-9 items-center justify-center rounded-md border border-emerald-500/50 bg-emerald-500/10 font-mono text-sm text-primary glow-terminal">
            KD
            <span className="absolute inset-0 rounded-md border border-emerald-400/30 animate-pulse-ring" aria-hidden />
          </span>
          <span className="hidden font-heading text-sm tracking-wide text-foreground sm:block">
            KUANTUM DEDEKTİFLERİ<span className="text-primary">_</span>
          </span>
        </NavLink>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Ana gezinme">
          {items.map(({ name, path, icon: Icon, testid }) => (
            <NavLink
              key={path}
              to={path}
              data-testid={testid}
              end={path === "/"}
              className={({ isActive }) =>
                `flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[13px] transition-all duration-200 ${
                  isActive
                    ? "border border-emerald-500/40 bg-emerald-500/10 text-primary text-glow"
                    : "border border-transparent text-muted-foreground hover:border-white/10 hover:bg-white/5 hover:text-foreground"
                }`
              }
            >
              <Icon size={15} aria-hidden />
              {name}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {!isTeacher && (
            <span className="hidden items-center gap-2 font-mono text-xs text-muted-foreground xl:flex">
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse" aria-hidden />
              {user.code} · {user.nickname ?? "—"}
            </span>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            data-testid="nav-logout-button"
            aria-label="Çıkış yap"
          >
            <LogOut size={15} aria-hidden />
            <span className="hidden sm:inline">Çıkış</span>
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            className="lg:hidden"
            onClick={() => setOpen((v) => !v)}
            data-testid="nav-menu-toggle"
            aria-label="Menüyü aç/kapat"
          >
            <Menu size={18} aria-hidden />
          </Button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-border bg-[#0B0F17] px-4 py-3 lg:hidden" aria-label="Mobil gezinme">
          <div className="grid grid-cols-2 gap-2">
            {items.map(({ name, path, icon: Icon, testid }) => (
              <NavLink
                key={path}
                to={path}
                data-testid={`${testid}-mobile`}
                end={path === "/"}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-2 rounded-sm border px-3 py-2 text-sm ${
                    isActive ? "border-primary/50 text-primary" : "border-border text-muted-foreground"
                  }`
                }
              >
                <Icon size={15} aria-hidden />
                {name}
              </NavLink>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="mt-3 w-full"
            onClick={handleLogout}
            data-testid="nav-logout-button-mobile"
          >
            <LogOut size={15} aria-hidden /> Çıkış yap
          </Button>
        </nav>
      )}
    </header>
  );
}
