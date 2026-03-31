"use client";

import { ReactNode, useEffect, useState, createContext, useContext } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { useScrollDirection } from "@/hooks/useScrollDirection";

const PANEL_BREAKPOINT = 1500;

const PanelModeContext = createContext<"inline" | "modal">("modal");
export function usePanelMode() {
  return useContext(PanelModeContext);
}

interface AppLayoutProps {
  children: ReactNode;
  panel?: ReactNode | null;
}

function StickyMobileHeader() {
  const hidden = useScrollDirection();

  return (
    <div
      className={`md:hidden sticky top-0 z-40 transition-transform duration-300 ${
        hidden ? '-translate-y-full' : 'translate-y-0'
      }`}
    >
      <Header />
    </div>
  );
}

export function AppLayout({ children, panel }: AppLayoutProps) {
  const hasPanel = !!panel;
  const [isWide, setIsWide] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(`(min-width: ${PANEL_BREAKPOINT}px)`);
    setIsWide(mql.matches);
    const handler = (e: MediaQueryListEvent) => setIsWide(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  const showInlinePanel = hasPanel && isWide;
  const panelMode = isWide ? "inline" : "modal";

  return (
    <PanelModeContext.Provider value={panelMode}>
      <div className="min-h-screen bg-cream">
        {/* Mobile: sticky header */}
        <StickyMobileHeader />

        {/* Desktop: CSS grid layout */}
        <div
          className="hidden md:grid min-h-screen transition-[grid-template-columns] duration-300 ease-in-out"
          style={{
            gridTemplateColumns: showInlinePanel
              ? "64px 56rem 1fr"
              : "250px 1fr",
          }}
        >
          {/* Nav column */}
          <Sidebar minimized={showInlinePanel} />

          {/* Content column */}
          <main className="px-4 py-8 min-w-0 flex flex-col items-center">
            <div className="max-w-4xl">{children}</div>
          </main>

          {/* Panel column — only when wide enough */}
          {showInlinePanel && (
            <div className="sticky top-0 h-screen overflow-y-auto p-4">
              {panel}
            </div>
          )}
        </div>

        {/* Mobile: content */}
        <div className="md:hidden">
          <main className="max-w-4xl mx-auto px-4 py-8">{children}</main>
        </div>

        {/* Panel as modal when screen is too narrow or on mobile */}
        {hasPanel && !showInlinePanel && <div>{panel}</div>}
      </div>
    </PanelModeContext.Provider>
  );
}
