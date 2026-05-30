import { Link, useRoute } from "wouter";
import { Home, FileText, Users, Activity, type LucideIcon } from "lucide-react";

type Tab = {
  path: string;
  label: string;
  icon?: LucideIcon;
  /** Use avatar image instead of icon */
  avatar?: string;
  gradient: string;
  glow: string;
};

const tabs: Tab[] = [
  {
    path: "/",
    label: "Home",
    icon: Home,
    gradient: "linear-gradient(135deg, #667eea 0%, #4c63d2 100%)",
    glow: "rgba(102,126,234,0.5)",
  },
  {
    path: "/processos",
    label: "Processos",
    icon: FileText,
    gradient: "linear-gradient(135deg, #F56E0F 0%, #c4530a 100%)",
    glow: "rgba(245,110,15,0.5)",
  },
  {
    path: "/pacientes",
    label: "Pacientes",
    icon: Users,
    gradient: "linear-gradient(135deg, #11998e 0%, #0d7a72 100%)",
    glow: "rgba(17,153,142,0.5)",
  },
  {
    path: "/monitoramento",
    label: "D30",
    icon: Activity,
    gradient: "linear-gradient(135deg, #0ea5e9 0%, #0879b7 100%)",
    glow: "rgba(14,165,233,0.5)",
  },
  {
    path: "/di-ia",
    label: "Di IA",
    avatar: "/di-avatar.png",
    gradient: "linear-gradient(135deg, #3C3489 0%, #271f6b 100%)",
    glow: "rgba(60,52,137,0.55)",
  },
];

function NavItem({ tab }: { tab: Tab }) {
  const [isActive] = useRoute(tab.path === "/" ? "/" : `${tab.path}*`);
  const Icon = tab.icon;

  return (
    <Link href={tab.path} className="flex-1">
      <button className="relative flex flex-col items-center justify-center gap-[5px] w-full h-full">
        {/* Active indicator bar */}
        {isActive && (
          <span
            className="absolute top-0 left-1/2 -translate-x-1/2 rounded-b-full"
            style={{ width: 28, height: 3, background: tab.gradient }}
          />
        )}

        {/* 3D icon badge */}
        <span
          className="flex items-center justify-center rounded-[11px] transition-all duration-200 overflow-hidden"
          style={{
            width: 40,
            height: 36,
            background: tab.gradient,
            boxShadow: isActive
              ? `0 4px 12px ${tab.glow}, 0 1px 0 rgba(255,255,255,0.18) inset, 0 -1px 0 rgba(0,0,0,0.25) inset`
              : `0 2px 6px ${tab.glow.replace("0.5", "0.25").replace("0.55", "0.28")}, 0 1px 0 rgba(255,255,255,0.12) inset`,
            transform: isActive ? "scale(1.08)" : "scale(0.92)",
            opacity: isActive ? 1 : 0.72,
          }}
        >
          {tab.avatar ? (
            <img
              src={tab.avatar}
              alt={tab.label}
              className="w-full h-full object-cover object-top"
            />
          ) : Icon ? (
            <Icon size={17} strokeWidth={2.3} color="white" style={{ filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.3))" }} />
          ) : null}
        </span>

        {/* Label */}
        <span
          className="text-[9px] font-semibold tracking-wide leading-none transition-colors"
          style={{ color: isActive ? "#ffffff" : "var(--t-text-4)" }}
        >
          {tab.label}
        </span>
      </button>
    </Link>
  );
}

export default function BottomNav() {
  return (
    <nav className="nav-bar">
      <div className="flex items-stretch h-full">
        {tabs.map((tab) => (
          <NavItem key={tab.path} tab={tab} />
        ))}
      </div>
    </nav>
  );
}
