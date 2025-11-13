'use client';

import { User } from '@/types';
import Image from 'next/image';

interface AvatarProps {
  user: User;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  className?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-16 h-16 text-xl',
};

// Generate consistent color based on user ID
function getColorFromId(id: string): string {
  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-yellow-500',
    'bg-red-500',
    'bg-teal-500',
    'bg-orange-500',
    'bg-cyan-500',
  ];
  
  // Simple hash function to get consistent color
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
}

// Get initials from name
function getInitials(name: string): string {
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

export default function Avatar({ user, size = 'md', onClick, className = '' }: AvatarProps) {
  const sizeClass = sizeClasses[size];
  const bgColor = getColorFromId(user.id);
  const initials = getInitials(user.name);

  if (user.avatar) {
    const avatarUrl = user.avatar.startsWith('http') ? user.avatar : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${user.avatar}`;
    
    return (
      <div
        className={`${sizeClass} rounded-full overflow-hidden flex-shrink-0 ${
          onClick ? 'cursor-pointer' : ''
        } ${className}`}
        onClick={onClick}
      >
        <Image
          src={avatarUrl}
          alt={user.name}
          width={size === 'sm' ? 32 : size === 'md' ? 40 : 64}
          height={size === 'sm' ? 32 : size === 'md' ? 40 : 64}
          className="w-full h-full object-cover"
          unoptimized
        />
      </div>
    );
  }

  return (
    <div
      className={`${sizeClass} ${bgColor} rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0 ${
        onClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''
      } ${className}`}
      onClick={onClick}
    >
      {initials}
    </div>
  );
}
