export function Typography() {
  return (
    <div className="p-8 bg-cream space-y-8">
      <h2 className="zissou-heading text-2xl font-bold text-inkstain mb-6">Typography</h2>

      <section>
        <h3 className="zissou-heading text-xs tracking-widest text-deep-ocean-teal mb-4">Jost — Headings & Labels</h3>
        <div className="space-y-4">
          <div>
            <span className="zissou-mono text-xs text-deep-ocean-teal">heading-1 (zissou-heading text-3xl font-bold)</span>
            <h1 className="zissou-heading text-3xl font-bold text-inkstain">The Life Aquatic</h1>
          </div>
          <div>
            <span className="zissou-mono text-xs text-deep-ocean-teal">heading-2 (zissou-heading text-2xl font-bold)</span>
            <h2 className="zissou-heading text-2xl font-bold text-inkstain">With Steve Zissou</h2>
          </div>
          <div>
            <span className="zissou-mono text-xs text-deep-ocean-teal">label (zissou-heading text-xs tracking-widest)</span>
            <p className="zissou-heading text-xs tracking-widest text-inkstain">Classification Label</p>
          </div>
        </div>
      </section>

      <section>
        <h3 className="zissou-heading text-xs tracking-widest text-deep-ocean-teal mb-4">Lora — Body Text</h3>
        <div className="space-y-4">
          <div>
            <span className="zissou-mono text-xs text-deep-ocean-teal">body (text-base, Lora)</span>
            <p className="text-base text-inkstain">The quick brown fox jumps over the lazy dog. This is body text set in Lora, a serif typeface suited for extended reading in low-light submarine conditions.</p>
          </div>
          <div>
            <span className="zissou-mono text-xs text-deep-ocean-teal">small (text-sm, Lora)</span>
            <p className="text-sm text-inkstain/70">The quick brown fox jumps over the lazy dog. Metadata and captions. Filed under: observation notes.</p>
          </div>
        </div>
      </section>

      <section>
        <h3 className="zissou-heading text-xs tracking-widest text-deep-ocean-teal mb-4">Courier Prime — Data & Timestamps</h3>
        <div className="space-y-2">
          <div>
            <span className="zissou-mono text-xs text-deep-ocean-teal">mono (zissou-mono text-sm)</span>
            <p className="zissou-mono text-sm text-inkstain">STATUS: ACTIVE — 14:32 UTC</p>
          </div>
          <p><a href="#" className="text-deep-ocean-teal underline decoration-2">Link text (Deep Ocean Teal)</a></p>
          <p className="font-semibold text-inkstain">Bold/Semibold weight</p>
        </div>
      </section>
    </div>
  );
}
