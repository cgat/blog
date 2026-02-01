const spacings = [
  { name: 'xs', value: '0.25rem', pixels: '4px', class: 'p-1' },
  { name: 'sm', value: '0.5rem', pixels: '8px', class: 'p-2' },
  { name: 'md', value: '1rem', pixels: '16px', class: 'p-4' },
  { name: 'lg', value: '1.5rem', pixels: '24px', class: 'p-6' },
  { name: 'xl', value: '2rem', pixels: '32px', class: 'p-8' },
];

export function Spacing() {
  return (
    <div className="p-8">
      <h2 className="text-2xl font-semibold text-deep-space mb-6">Spacing Scale</h2>
      <div className="space-y-4">
        {spacings.map((spacing) => (
          <div key={spacing.name} className="flex items-center gap-4">
            <div className="w-20 text-sm font-mono text-gray-600">{spacing.name}</div>
            <div className="w-24 text-sm text-gray-500">{spacing.pixels}</div>
            <div
              className="bg-blue-green h-4"
              style={{ width: spacing.value === '0.25rem' ? '16px' : `calc(${spacing.value} * 4)` }}
            />
            <div className="text-sm text-gray-400">{spacing.class}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
