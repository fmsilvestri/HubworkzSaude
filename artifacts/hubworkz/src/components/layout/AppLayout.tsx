import { useState } from "react"
import { Link, useLocation } from "wouter"
import { useAuth } from "@/hooks/useAuth"
import { useTheme } from "@/hooks/useTheme"
import { supabase } from "@/lib/supabase"
import {
  LayoutDashboard,
  FileText,
  Users,
  Pill,
  Truck,
  FileCheck,
  FileBadge,
  CalendarDays,
  DollarSign,
  ClipboardCheck,
  AlertTriangle,
  ShoppingCart,
  MapPin,
  Settings,
  LogOut,
  Menu,
  Activity,
  Sun,
  Moon,
  MessageSquare,
  type LucideIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

type NavItem = {
  href: string
  label: string
  icon: LucideIcon
  /** CSS gradient for the 3D icon badge */
  gradient: string
  /** Box-shadow color (rgba) for the icon badge glow */
  glow: string
}

const NAV_ITEMS: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    gradient: "linear-gradient(135deg, #667eea 0%, #4c63d2 100%)",
    glow: "rgba(102,126,234,0.45)",
  },
  {
    href: "/processos",
    label: "Processos",
    icon: FileText,
    gradient: "linear-gradient(135deg, #F56E0F 0%, #c4530a 100%)",
    glow: "rgba(245,110,15,0.45)",
  },
  {
    href: "/pacientes",
    label: "Pacientes",
    icon: Users,
    gradient: "linear-gradient(135deg, #11998e 0%, #0d7a72 100%)",
    glow: "rgba(17,153,142,0.45)",
  },
  {
    href: "/medicamentos",
    label: "Medicamentos",
    icon: Pill,
    gradient: "linear-gradient(135deg, #8e44ec 0%, #6c1ec7 100%)",
    glow: "rgba(142,68,236,0.45)",
  },
  {
    href: "/distribuidoras",
    label: "Distribuidoras",
    icon: Truck,
    gradient: "linear-gradient(135deg, #0891b2 0%, #066987 100%)",
    glow: "rgba(8,145,178,0.45)",
  },
  {
    href: "/mandatos",
    label: "Mandatos",
    icon: FileCheck,
    gradient: "linear-gradient(135deg, #f59e0b 0%, #c47d08 100%)",
    glow: "rgba(245,158,11,0.45)",
  },
  {
    href: "/declaracoes",
    label: "Declarações",
    icon: FileBadge,
    gradient: "linear-gradient(135deg, #ec4899 0%, #c21974 100%)",
    glow: "rgba(236,72,153,0.45)",
  },
  {
    href: "/monitoramento",
    label: "Monitoramento",
    icon: CalendarDays,
    gradient: "linear-gradient(135deg, #0ea5e9 0%, #0879b7 100%)",
    glow: "rgba(14,165,233,0.45)",
  },
  {
    href: "/cotacao",
    label: "Cotações",
    icon: DollarSign,
    gradient: "linear-gradient(135deg, #10b981 0%, #087a54 100%)",
    glow: "rgba(16,185,129,0.45)",
  },
  {
    href: "/recebimento",
    label: "Recebimento",
    icon: ClipboardCheck,
    gradient: "linear-gradient(135deg, #84cc16 0%, #5d8f0f 100%)",
    glow: "rgba(132,204,22,0.45)",
  },
  {
    href: "/faturamento",
    label: "Faturamento",
    icon: DollarSign,
    gradient: "linear-gradient(135deg, #f97316 0%, #c4580b 100%)",
    glow: "rgba(249,115,22,0.45)",
  },
  {
    href: "/glosas",
    label: "Glosas",
    icon: AlertTriangle,
    gradient: "linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)",
    glow: "rgba(239,68,68,0.45)",
  },
  {
    href: "/pedidos",
    label: "Pedidos Consolidados",
    icon: ShoppingCart,
    gradient: "linear-gradient(135deg, #6366f1 0%, #4338ca 100%)",
    glow: "rgba(99,102,241,0.45)",
  },
  {
    href: "/rastreio",
    label: "Rastreio",
    icon: MapPin,
    gradient: "linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)",
    glow: "rgba(6,182,212,0.45)",
  },
  {
    href: "/comunicacao",
    label: "Comunicacao",
    icon: MessageSquare,
    gradient: "linear-gradient(135deg, #25D366 0%, #1a9e4b 100%)",
    glow: "rgba(37,211,102,0.45)",
  },
  {
    href: "/configuracoes",
    label: "Configurações",
    icon: Settings,
    gradient: "linear-gradient(135deg, #6b7280 0%, #374151 100%)",
    glow: "rgba(107,114,128,0.45)",
  },
]

function IconBadge({
  icon: Icon,
  gradient,
  glow,
  active,
}: {
  icon: LucideIcon
  gradient: string
  glow: string
  active: boolean
}) {
  return (
    <span
      className="shrink-0 flex items-center justify-center rounded-[9px] transition-all duration-200"
      style={{
        width: 32,
        height: 32,
        background: gradient,
        boxShadow: active
          ? `0 4px 12px ${glow}, 0 1px 0 rgba(255,255,255,0.18) inset, 0 -1px 0 rgba(0,0,0,0.25) inset`
          : `0 2px 6px ${glow.replace("0.45", "0.3")}, 0 1px 0 rgba(255,255,255,0.15) inset, 0 -1px 0 rgba(0,0,0,0.2) inset`,
        transform: active ? "scale(1.05)" : "scale(1)",
      }}
    >
      <Icon className="h-[15px] w-[15px] text-white drop-shadow-sm" strokeWidth={2.2} />
    </span>
  )
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation()
  const { profile } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setLocation("/login")
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-sidebar text-foreground w-64 border-r border-border">
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
        <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-3 px-3">
          Menu Principal
        </div>
        {NAV_ITEMS.map((item) => {
          const isActive = location === item.href
          return (
            <Link key={item.href} href={item.href} onClick={() => setIsMobileOpen(false)}>
              <div
                className={cn(
                  "flex items-center gap-3 px-2.5 py-2 rounded-xl transition-all duration-150 cursor-pointer",
                  isActive
                    ? "bg-white/8 shadow-sm"
                    : "hover:bg-white/5"
                )}
              >
                <IconBadge
                  icon={item.icon}
                  gradient={item.gradient}
                  glow={item.glow}
                  active={isActive}
                />
                <span
                  className={cn(
                    "text-sm font-medium leading-none",
                    isActive ? "text-white" : "text-white/60 group-hover:text-white/80"
                  )}
                >
                  {item.label}
                </span>
              </div>
            </Link>
          )
        })}
      </div>

      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 px-2 py-2">
          <Avatar className="h-9 w-9 border border-border">
            <AvatarFallback className="bg-primary/20 text-primary text-sm font-bold">
              {profile?.nome?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-medium truncate text-foreground">
              {profile?.nome || "Usuário"}
            </p>
            <p className="text-xs text-muted-foreground truncate capitalize">
              {profile?.role || "Cargo"}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Topbar */}
      <header className="h-16 bg-card border-b border-border flex items-center justify-between px-4 lg:px-6 shrink-0 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden text-muted-foreground hover:text-foreground">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64 border-r-border bg-sidebar">
              <SidebarContent />
            </SheetContent>
          </Sheet>

          <Link href="/dashboard" className="flex items-center gap-2 cursor-pointer">
            <Activity className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold text-foreground tracking-tight hidden sm:block">
              HubWorkz Saúde
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="text-muted-foreground hover:text-foreground"
            title={theme === "dark" ? "Mudar para tema claro" : "Mudar para tema escuro"}
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          <button
            onClick={() => setLocation("/di-ia")}
            className="flex items-center gap-2 bg-[#3C3489] hover:bg-[#3C3489]/80 text-[#A5FFD6] rounded-full pl-1 pr-4 h-9 font-semibold text-sm border-none shadow-lg shadow-[#3C3489]/20 transition-all hover:scale-105"
          >
            <img
              src="/di-avatar.png"
              alt="Di"
              className="h-7 w-7 rounded-full object-cover object-top border border-[#A5FFD6]/30"
            />
            Di IA
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block shrink-0 sticky top-16 h-[calc(100vh-4rem)]">
          <SidebarContent />
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  )
}
