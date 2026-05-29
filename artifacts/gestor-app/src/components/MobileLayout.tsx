import BottomNav from "./BottomNav";

interface MobileLayoutProps {
  children: React.ReactNode;
}

export default function MobileLayout({ children }: MobileLayoutProps) {
  return (
    <div className="mobile-container">
      <main className="screen-content scrollbar-none overflow-y-auto">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
