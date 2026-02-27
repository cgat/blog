import Image from 'next/image';

type AvatarSize = 'sm' | 'md' | 'lg';

interface AvatarProps {
  src?: string | null;
  alt?: string;
  size?: AvatarSize;
  fallback?: string;
}

const sizeStyles: Record<AvatarSize, { container: string; text: string; pixels: number }> = {
  sm: { container: 'w-8 h-8', text: 'text-sm', pixels: 32 },
  md: { container: 'w-10 h-10', text: 'text-base', pixels: 40 },
  lg: { container: 'w-14 h-14', text: 'text-xl', pixels: 56 },
};

export function Avatar({ src, alt = 'Avatar', size = 'md', fallback }: AvatarProps) {
  const styles = sizeStyles[size];
  const initials = fallback?.slice(0, 2).toUpperCase() || '?';

  if (src) {
    return (
      <div className={`${styles.container} relative rounded-full overflow-hidden zissou-border bg-cream`}>
        <Image
          src={src}
          alt={alt}
          width={styles.pixels}
          height={styles.pixels}
          className="object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={`
        ${styles.container} ${styles.text}
        flex items-center justify-center
        rounded-full zissou-border bg-deep-ocean-teal text-white font-medium
      `}
    >
      {initials}
    </div>
  );
}
