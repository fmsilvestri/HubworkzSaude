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
  Sparkles,
  Sun,
  Moon
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/processos", label: "Processos", icon: FileText },
  { href: "/pacientes", label: "Pacientes", icon: Users },
  { href: "/medicamentos", label: "Medicamentos", icon: Pill },
  { href: "/distribuidoras", label: "Distribuidoras", icon: Truck },
  { href: "/mandatos", label: "Mandatos", icon: FileCheck },
  { href: "/declaracoes", label: "Declarações", icon: FileBadge },
  { href: "/monitoramento", label: "Monitoramento", icon: CalendarDays },
  { href: "/cotacao", label: "Cotações", icon: DollarSign },
  { href: "/recebimento", label: "Recebimento", icon: ClipboardCheck },
  { href: "/faturamento", label: "Faturamento", icon: DollarSign },
  { href: "/glosas", label: "Glosas", icon: AlertTriangle },
  { href: "/pedidos", label: "Pedidos Consolidados", icon: ShoppingCart },
  { href: "/rastreio", label: "Rastreio", icon: MapPin },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
]

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation()
  const { profile } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setLocation('/login')
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-sidebar text-foreground w-64 border-r border-border">
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 px-3">
          Menu Principal
        </div>
        {NAV_ITEMS.map((item) => {
          const isActive = location === item.href
          return (
            <Link key={item.href} href={item.href} onClick={() => setIsMobileOpen(false)}>
              <div className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors cursor-pointer text-sm font-medium",
                isActive 
                  ? "bg-primary/10 text-primary" 
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}>
                <item.icon className={cn("h-4 w-4 shrink-0", isActive ? "text-primary" : "text-muted-foreground")} />
                {item.label}
              </div>
            </Link>
          )
        })}
      </div>
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 px-3 py-2">
          <Avatar className="h-9 w-9 border border-border">
            <AvatarFallback className="bg-primary/20 text-primary">
              {profile?.nome?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-medium truncate text-foreground">{profile?.nome || 'Usuário'}</p>
            <p className="text-xs text-muted-foreground truncate capitalize">{profile?.role || 'Cargo'}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout} className="text-muted-foreground hover:text-foreground">
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
            <span className="text-lg font-bold text-foreground tracking-tight hidden sm:block">HubWorkz Saúde</span>
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

          <Button 
            onClick={() => setLocation('/di-ia')}
            className="bg-[#3C3489] hover:bg-[#3C3489]/80 text-[#A5FFD6] rounded-full px-4 h-9 font-semibold text-sm border-none shadow-lg shadow-[#3C3489]/20 transition-all hover:scale-105"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Di IA
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block shrink-0 sticky top-16 h-[calc(100vh-4rem)]">
          <SidebarContent />
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
