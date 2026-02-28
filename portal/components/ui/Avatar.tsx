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

// Generate a warm hue from the name for the gradient
function nameToHue(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  // Warm hues: reds (0-30), oranges (30-60), warm purples (280-330)
  const hues = [0, 15, 30, 45, 280, 300, 320, 340];
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
        className={`${sizeStyles[size]} rounded-full object-cover ring-1 ring-white/[0.08] ${className}`}
      />
    );
  }

  const hue = nameToHue(name);

  return (
    <div
      className={`${sizeStyles[size]} rounded-full flex items-center justify-center font-semibold ring-1 ring-white/[0.08] ${className}`}
      style={{
        background: `linear-gradient(135deg, hsl(${hue}, 60%, 30%), hsl(${hue + 30}, 50%, 20%))`,
        color: `hsl(${hue}, 70%, 80%)`,
      }}
    >
      {getInitials(name)}
    </div>
  );
}
