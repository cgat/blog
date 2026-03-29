"use client";

import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

interface AppLayoutProps {
  children: ReactNode;
  panel?: ReactNode | null;
}

export function AppLayout({ children, panel }: AppLayoutProps) {
  const hasPanel = !!panel;

  return (
    <div className="min-h-screen bg-cream">
      {/* Mobile: sticky header */}
      <div className="md:hidden">
        <Header />
      </div>

      {/* Desktop: CSS grid layout */}
      <div
        className="hidden md:grid min-h-screen transition-[grid-template-columns] duration-300 ease-in-out"
        style={{
          gridTemplateColumns: hasPanel ? "64px 56rem 1fr" : "250px 1fr",
        }}
      >
        {/* Nav column */}
        <Sidebar minimized={hasPanel} />

        {/* Content column */}
        <main className="px-4 py-8 min-w-0 flex flex-col items-center">
          <div className="max-w-4xl">{children}</div>
        </main>

        {/* Panel column — only rendered when active */}
        {hasPanel && (
          <div className="sticky top-0 h-screen overflow-y-auto p-4">
            {panel}
          </div>
        )}
      </div>

      {/* Mobile: content */}
      <div className="md:hidden">
        <main className="max-w-4xl mx-auto px-4 py-8">{children}</main>
      </div>

      {/* Mobile: panel as modal */}
      {hasPanel && <div className="md:hidden">{panel}</div>}
    </div>
  );
}
