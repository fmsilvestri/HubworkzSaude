import { Link, useRoute } from "wouter";
import { Home, ClipboardList, Package, Phone, FileText, Sparkles } from "lucide-react";

const tabs = [
  { path: "/", label: "Início", icon: Home },
  { path: "/processo", label: "Processo", icon: ClipboardList },
  { path: "/remessas", label: "Remessas", icon: Package },
  { path: "/consultas", label: "Consultas", icon: Phone },
  { path: "/documentos", label: "Docs", icon: FileText },
  { path: "/di-ia", label: "Di", icon: Sparkles },
];

function NavItem({ path, label, Icon }: { path: string; label: string; Icon: React.ElementType }) {
  const [isActive] = useRoute(path === "/" ? "/" : `${path}*`);

  return (
    <Link href={path}>
      <button
        className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors"
        style={{ color: isActive ? "#F56E0F" : "#9CA3AF" }}
      >
        <Icon size={19} strokeWidth={isActive ? 2.5 : 1.8} />
        <span className="text-[9px] font-semibold tracking-wide" style={{ color: isActive ? "#F56E0F" : "#9CA3AF" }}>
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
