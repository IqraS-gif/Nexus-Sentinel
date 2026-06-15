import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  TerminalSquare, ShieldAlert, Activity, ChevronDown,
  Brain, Database, BarChart2, Menu, X, MessageCircle, Zap
} from "lucide-react";

// ─── Nav structure: primary links + grouped dropdowns ─────────────────────────
const PRIMARY_LINKS = [
  { name: "Demo", href: "/demo", icon: ShieldAlert },
  { name: "Command Center", href: "/dashboard", icon: Activity },
  { name: "Copilot", href: "/copilot", icon: MessageCircle },
  { name: "Detect", href: "/detect", icon: Zap, highlight: true },
];

const DROPDOWN_GROUPS = [
  {
    label: "Operations",
    icon: TerminalSquare,
    items: [
      { name: "Ops Center", href: "/command-center" },
      { name: "Incident Analysis", href: "/analysis" },
      { name: "Prediction Engine", href: "/prediction-engine" },
    ],
  },
  {
    label: "Memory",
    icon: Database,
    items: [
      { name: "Memory Impact", href: "/memory-impact" },
      { name: "Memory Explorer", href: "/memory" },
      { name: "Learning Journey", href: "/timeline" },
    ],
  },
  {
    label: "Intelligence",
    icon: Brain,
    items: [
      { name: "Agent Profile", href: "/agent-profile" },
      { name: "Learning Evolution", href: "/learning-evolution" },
      { name: "Learning Demo", href: "/learning-demo" },
    ],
  },
];

// ─── Dropdown component ───────────────────────────────────────────────────────
function NavDropdown({
  group,
  currentPath,
}: {
  group: (typeof DROPDOWN_GROUPS)[0];
  currentPath: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const isGroupActive = group.items.some((i) => i.href === currentPath);

  // Close on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((p) => !p)}
        className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 border whitespace-nowrap ${
          isGroupActive
            ? "bg-primary/10 text-primary border-primary/20"
            : open
            ? "bg-card text-foreground border-border"
            : "text-muted-foreground hover:text-foreground hover:bg-card border-transparent hover:border-border"
        }`}
      >
        <group.icon className="h-3.5 w-3.5" />
        <span className="hidden md:inline ml-1">{group.label}</span>
        <ChevronDown
          className={`h-3 w-3 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-2 w-48 bg-card border border-border rounded-xl shadow-xl z-50 py-1 overflow-hidden">
          {group.items.map((item) => {
            const isActive = currentPath === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setOpen(false)}
                className={`flex items-center px-4 py-2.5 text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}
              >
                {isActive && (
                  <span className="mr-2 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                )}
                <span className={isActive ? "" : "ml-3.5"}>{item.name}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Mobile drawer ────────────────────────────────────────────────────────────
function MobileMenu({
  open,
  onClose,
  currentPath,
}: {
  open: boolean;
  onClose: () => void;
  currentPath: string;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 md:hidden">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer */}
      <div className="absolute top-0 right-0 h-full w-72 bg-card border-l border-border shadow-2xl overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <span className="text-sm font-bold tracking-wider">Navigation</span>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-accent text-muted-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-4 space-y-1">
          {/* Primary */}
          {PRIMARY_LINKS.map((item) => {
            const isActive = currentPath === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            );
          })}

          {/* Groups */}
          {DROPDOWN_GROUPS.map((group) => (
            <div key={group.label} className="pt-3">
              <div className="flex items-center gap-2 px-4 pb-1">
                <group.icon className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-muted-foreground">
                  {group.label}
                </span>
              </div>
              {group.items.map((item) => {
                const isActive = currentPath === item.href;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={onClose}
                    className={`flex items-center gap-3 px-4 py-2 rounded-lg text-sm transition-colors ${
                      isActive
                        ? "text-primary font-semibold bg-primary/10"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent"
                    }`}
                  >
                    {isActive && <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />}
                    <span className={isActive ? "" : "ml-3.5"}>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Navbar ──────────────────────────────────────────────────────────────
export default function Navbar() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isLanding = location.pathname === "/";

  return (
    <>
      <nav
        className={`sticky top-0 z-50 w-full border-b border-border backdrop-blur-md ${
          isLanding ? "bg-background/40" : "bg-card/80"
        }`}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center justify-between gap-4">

            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2.5 group shrink-0">
              <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 group-hover:border-primary/50 transition-all duration-300">
                <TerminalSquare className="h-4.5 w-4.5 text-primary" />
                <div className="absolute inset-0 rounded-lg bg-primary/20 blur opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
              <span className="text-sm font-bold tracking-wider text-foreground group-hover:text-primary transition-colors duration-200">
                NEXUS SENTINEL
              </span>
            </Link>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-1 flex-1 justify-center">
              {/* Primary links */}
              {PRIMARY_LINKS.map((item) => {
                const isActive = location.pathname === item.href;
                const isHighlight = (item as any).highlight;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 border-2 whitespace-nowrap ${
                      isActive && isHighlight
                        ? "bg-primary text-white border-secondary shadow-[0_0_10px_rgba(0,255,255,0.3)]"
                        : isHighlight
                        ? "bg-primary text-white border-primary hover:border-secondary hover:shadow-[0_0_10px_rgba(0,255,255,0.4)]"
                        : isActive
                        ? "bg-primary/10 text-primary border-primary/20"
                        : "text-muted-foreground hover:text-foreground hover:bg-card border-transparent hover:border-border"
                    }`}
                  >
                    <item.icon className={`h-3.5 w-3.5 ${isHighlight ? "animate-pulse text-orange-500" : ""}`} />
                    {item.name}
                  </Link>
                );
              })}


              {/* Divider */}
              <div className="h-4 w-px bg-border mx-1" />

              {/* Dropdown groups */}
              {DROPDOWN_GROUPS.map((group) => (
                <NavDropdown
                  key={group.label}
                  group={group}
                  currentPath={location.pathname}
                />
              ))}
            </div>

            {/* Right: status + mobile toggle */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Hindsight status pill */}
              <div className="flex items-center gap-1.5 bg-card border border-border px-2.5 py-1 rounded-full">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span className="text-[10px] text-muted-foreground font-mono hidden sm:inline">
                  Hindsight
                </span>
                <BarChart2 className="h-3 w-3 text-emerald-500 sm:hidden" />
              </div>

              {/* Mobile hamburger */}
              <button
                className="md:hidden p-2 rounded-lg hover:bg-accent text-muted-foreground border border-transparent hover:border-border transition-colors"
                onClick={() => setMobileOpen(true)}
              >
                <Menu className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile drawer */}
      <MobileMenu
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        currentPath={location.pathname}
      />
    </>
  );
}
