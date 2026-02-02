const colors = [
  { name: 'Sky Blue', variable: 'sky-blue', hex: '#8ecae6', usage: 'Backgrounds, hover states, tags' },
  { name: 'Blue Green', variable: 'blue-green', hex: '#219ebc', usage: 'Buttons, links, interactive elements' },
  { name: 'Deep Space', variable: 'deep-space', hex: '#023047', usage: 'Text, headers, dark accents' },
  { name: 'Amber Flame', variable: 'amber-flame', hex: '#ffb703', usage: 'Highlights, notifications, focus rings' },
  { name: 'Princeton Orange', variable: 'princeton-orange', hex: '#fb8500', usage: 'CTAs, important actions' },
];

export function ColorPalette() {
  return (
    <div className="p-8">
      <h2 className="text-2xl font-semibold text-deep-space mb-6">Color Palette</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {colors.map((color) => (
          <div key={color.variable} className="rounded-lg overflow-hidden shadow-md">
            <div
              className="h-24"
              style={{ backgroundColor: color.hex }}
            />
            <div className="p-4 bg-white">
              <h3 className="font-semibold text-deep-space">{color.name}</h3>
              <p className="text-sm text-gray-600 font-mono">{color.hex}</p>
              <p className="text-sm text-gray-600">var(--{color.variable})</p>
              <p className="text-sm text-gray-500 mt-2">{color.usage}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
