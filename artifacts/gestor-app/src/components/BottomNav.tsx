import { Link, useRoute } from "wouter";
import { Home, FileText, Users, Activity, Sparkles } from "lucide-react";

const tabs = [
  { path: "/", label: "Home", icon: Home },
  { path: "/processos", label: "Processos", icon: FileText },
  { path: "/pacientes", label: "Pacientes", icon: Users },
  { path: "/monitoramento", label: "D30", icon: Activity },
  { path: "/di-ia", label: "Di IA", icon: Sparkles },
];

function NavItem({ path, label, Icon }: { path: string; label: string; Icon: React.ElementType }) {
  const [isActive] = useRoute(path === "/" ? "/" : `${path}*`);

  return (
    <Link href={path} className="flex-1">
      <button className="relative flex flex-col items-center justify-center gap-[3px] w-full h-full">
        {isActive && (
          <span
            className="absolute top-0 left-1/2 -translate-x-1/2 rounded-b-full"
            style={{ width: 28, height: 3, background: "#F56E0F" }}
          />
        )}
        <span
          className="flex items-center justify-center rounded-xl transition-all"
          style={{
            width: 36,
            height: 28,
            background: isActive ? "rgba(245,110,15,0.15)" : "transparent",
          }}
        >
          <Icon
            size={18}
            strokeWidth={isActive ? 2.5 : 1.8}
            style={{ color: isActive ? "#F56E0F" : "var(--t-text-4)" }}
          />
        </span>
        <span
          className="text-[9px] font-semibold tracking-wide leading-none"
          style={{ color: isActive ? "#F56E0F" : "var(--t-text-4)" }}
        >
          {label}
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
          <NavItem key={tab.path} path={tab.path} label={tab.label} Icon={tab.icon} />
        ))}
      </div>
    </nav>
  );
}
