import { AppLayout } from "@/components/layout/AppLayout";

export const metadata = {
  title: "About — The Archive of Small Things",
};

export default function AboutPage() {
  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto">
        {/* Postcard */}
        <div className="zissou-border zissou-shadow bg-[white] relative">
          {/* Stamp decoration */}
          <div className="absolute top-4 right-4 w-16 h-20 zissou-border bg-mendls-pink/30 flex items-center justify-center rotate-3">
            <span className="text-2xl">📬</span>
          </div>

          <div className="p-8 pr-24">
            <h1 className="zissou-heading text-2xl text-tracksuit-red font-black mb-6">
              About This Archive
            </h1>

            <div className="space-y-4 zissou-mono text-sm leading-relaxed text-inkstain">
              <p>
                Dear visitor,
              </p>
              <p>
                Welcome to The Archive of Small Things — a personal collection of
                moments, photographs, thoughts, and miscellaneous ephemera that
                seemed worth preserving.
              </p>
              <p>
                This is a quiet corner of the internet where things are filed away
                not because they are important, but because they happened. A meal
                that was particularly good. A walk that went somewhere unexpected.
                A sentence overheard on the bus that refused to be forgotten.
              </p>
              <p>
                The archive operates on the principle that small things, properly
                catalogued, become their own kind of treasure. Nothing here is
                urgent. Everything here is, in its own way, true.
              </p>
              <p>
                Thank you for visiting the collection. You are welcome to browse
                at your leisure. Please do not touch the exhibits.
              </p>
              <p className="mt-8 italic">
                — The Archivist
              </p>
            </div>
          </div>

          {/* Postcard line decoration */}
          <div className="border-t-2 border-dashed border-inkstain/20 mx-8 mb-4" />
          <div className="px-8 pb-6">
            <p className="zissou-mono text-xs text-inkstain/40 uppercase tracking-widest">
              Est. 2026 · Published on own site, syndicated elsewhere
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
