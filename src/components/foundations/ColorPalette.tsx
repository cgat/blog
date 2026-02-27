const colors = [
  { name: 'Cream', variable: 'cream', hex: '#fdf5e6', usage: 'Backgrounds, paper, base layer' },
  { name: "Mendl's Pink", variable: 'mendls-pink', hex: '#f0a0a0', usage: 'Focus states, hover accents, soft highlights' },
  { name: 'Tracksuit Red', variable: 'tracksuit-red', hex: '#c0392b', usage: 'Active states, danger, emphasis' },
  { name: 'Submarine Yellow', variable: 'submarine-yellow', hex: '#e6cc57', usage: 'Primary buttons, selected states, highlights' },
  { name: 'Deep Ocean Teal', variable: 'deep-ocean-teal', hex: '#4682b4', usage: 'Links, selected chips, secondary accents' },
  { name: 'Inkstain', variable: 'inkstain', hex: '#2c2c2c', usage: 'Text, borders, shadows' },
];

export function ColorPalette() {
  return (
    <div className="p-8 bg-cream">
      <h2 className="zissou-heading text-2xl font-bold text-inkstain mb-6">Color Palette</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {colors.map((color) => (
          <div key={color.variable} className="zissou-border overflow-hidden">
            <div
              className="h-24"
              style={{ backgroundColor: color.hex }}
            />
            <div className="p-4 bg-cream border-t-2 border-inkstain">
              <h3 className="zissou-heading text-sm font-bold text-inkstain">{color.name}</h3>
              <p className="zissou-mono text-sm text-deep-ocean-teal">{color.hex}</p>
              <p className="zissou-mono text-sm text-deep-ocean-teal">var(--{color.variable})</p>
              <p className="text-sm text-inkstain mt-2">{color.usage}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
