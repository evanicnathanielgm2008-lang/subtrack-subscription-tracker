import React from 'react';
import {
  Tv,
  Headphones,
  Code,
  GraduationCap,
  Sparkles,
  Film,
  FileText,
  Palette,
  Cloud,
  Dumbbell,
  Zap,
  Activity,
  Gamepad2,
  Layers,
  Shield,
  CreditCard,
  Music,
  Video,
  BookOpen,
  DollarSign,
  PlaySquare,
  Briefcase,
  LucideIcon,
} from 'lucide-react';

interface ServiceIconProps {
  name: string;
  iconName?: string;
  brandColor?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const ICON_MAP: Record<string, LucideIcon> = {
  Tv,
  Headphones,
  Code,
  GraduationCap,
  Sparkles,
  Film,
  FileText,
  Palette,
  Cloud,
  Dumbbell,
  Zap,
  Activity,
  Gamepad2,
  Layers,
  Shield,
  CreditCard,
  Music,
  Video,
  BookOpen,
  DollarSign,
  PlaySquare,
  Briefcase,
};

export const ServiceIcon: React.FC<ServiceIconProps> = ({
  name,
  iconName,
  brandColor = '#8B5CF6',
  size = 'md',
  className = '',
}) => {
  const IconComponent = iconName && ICON_MAP[iconName] ? ICON_MAP[iconName] : null;

  const sizeClasses = {
    sm: 'w-7 h-7 text-xs rounded-lg',
    md: 'w-10 h-10 text-sm rounded-xl',
    lg: 'w-12 h-12 text-base rounded-xl',
    xl: 'w-16 h-16 text-lg rounded-2xl',
  };

  const iconSizes = {
    sm: 14,
    md: 18,
    lg: 22,
    xl: 28,
  };

  // If we don't have an icon component, use the first 1-2 letters of the service name
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();

  return (
    <div
      className={`flex items-center justify-center font-bold text-white shrink-0 shadow-sm border border-white/10 ${sizeClasses[size]} ${className}`}
      style={{ backgroundColor: brandColor }}
      title={name}
    >
      {IconComponent ? (
        <IconComponent size={iconSizes[size]} strokeWidth={2.2} />
      ) : (
        <span>{initials || 'S'}</span>
      )}
    </div>
  );
};
