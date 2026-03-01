import Image from 'next/image';

interface AvatarProps {
  src?: string | null;
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeStyles = {
  sm: 'h-7 w-7 text-xs',
  md: 'h-9 w-9 text-sm',
  lg: 'h-12 w-12 text-base',
};

function getInitials(name: string): string {
  return name
    .split(/[\s_]+/)
    .map(part => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

// Generate a warm pub-toned hue from the name
function nameToHue(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  // Warm hues: amber (30-50), brown-red (10-25), warm green (90-130), deep gold (40-55)
  const hues = [15, 25, 35, 45, 95, 110, 125, 40];
  return hues[Math.abs(hash) % hues.length];
}

export function Avatar({ src, name, size = 'md', className = '' }: AvatarProps) {
  const pixelSizes = { sm: 28, md: 36, lg: 48 };

  if (src) {
    return (
      <Image
        src={src}
        alt={name}
        width={pixelSizes[size]}
        height={pixelSizes[size]}
        className={`${sizeStyles[size]} rounded-full object-cover ring-1 ring-amber-400/15 ${className}`}
      />
    );
  }

  const hue = nameToHue(name);

  return (
    <div
      className={`${sizeStyles[size]} rounded-full flex items-center justify-center font-semibold ring-1 ring-amber-400/15 ${className}`}
      style={{
        background: `linear-gradient(135deg, hsl(${hue}, 50%, 25%), hsl(${hue + 20}, 40%, 16%))`,
        color: `hsl(${hue}, 55%, 72%)`,
      }}
    >
      {getInitials(name)}
    </div>
  );
}
