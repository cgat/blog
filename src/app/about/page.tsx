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
          {/* Portrait */}
          <div className="absolute top-4 right-4 w-24 h-28 zissou-border overflow-hidden rotate-3 shadow-md">
            <img
              src="/archivist.png"
              alt="The Archivist"
              className="w-full h-full object-cover"
            />
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
                Some of what you find here is new. Much of it has been rescued
                from the scattered corners of the internet where it once lived —
                Flickr albums, old blogs, Blogger posts, Facebook notes, Google
                pages — gathered together into one place before the platforms
                forgot them entirely. This means some entries may seem a little
                out of context. That is the nature of an archive.
              </p>
              <p>
                This is a small contribution to the{" "}
                <a
                  href="https://benhoyt.com/writings/the-small-web-is-beautiful/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-deep-ocean-teal underline decoration-2 hover:text-tracksuit-red"
                >
                  Small Web
                </a>
                {" "}— a quiet corner of the internet where things are filed away
                not because they are important, but because they happened. A meal
                that was particularly good. A walk that went somewhere unexpected.
                A sentence overheard on the bus that refused to be forgotten.
              </p>
              <p>
                Long-time visitors may recognise the name. The Archive of Small
                Things is a hat tip to its predecessor, a travel photo blog
                called The Little Picture. That branding lives on here for the
                photography, but the archive itself hopes to be something broader —
                not just travel and photographs, but all the small things worth
                keeping.
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
