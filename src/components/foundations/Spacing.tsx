const spacings = [
  { name: 'xs', value: '0.25rem', pixels: '4px', class: 'p-1' },
  { name: 'sm', value: '0.5rem', pixels: '8px', class: 'p-2' },
  { name: 'md', value: '1rem', pixels: '16px', class: 'p-4' },
  { name: 'lg', value: '1.5rem', pixels: '24px', class: 'p-6' },
  { name: 'xl', value: '2rem', pixels: '32px', class: 'p-8' },
];

export function Spacing() {
  return (
    <div className="p-8 bg-cream">
      <h2 className="zissou-heading text-2xl font-bold text-inkstain mb-6">Spacing Scale</h2>
      <div className="space-y-4">
        {spacings.map((spacing) => (
          <div key={spacing.name} className="flex items-center gap-4">
            <div className="w-20 zissou-mono text-sm text-inkstain">{spacing.name}</div>
            <div className="w-24 zissou-mono text-sm text-deep-ocean-teal">{spacing.pixels}</div>
            <div
              className="bg-deep-ocean-teal h-4"
              style={{ width: spacing.value === '0.25rem' ? '16px' : `calc(${spacing.value} * 4)` }}
            />
            <div className="zissou-mono text-sm text-inkstain/50">{spacing.class}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
