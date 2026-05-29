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
    <Link href={path}>
      <button
        className="flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors"
        style={{ color: isActive ? "#F56E0F" : "#6B6B7A" }}
      >
        <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
        <span
          className="text-[10px] font-semibold tracking-wide"
          style={{ color: isActive ? "#F56E0F" : "#6B6B7A" }}
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
      <div className="flex items-center h-full px-1">
        {tabs.map((tab) => (
          <NavItem key={tab.path} path={tab.path} label={tab.label} Icon={tab.icon} />
        ))}
      </div>
    </nav>
  );
}
