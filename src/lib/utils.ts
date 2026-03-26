import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const getRoleColor = (role: string) => {
  switch (role) {
    case 'Batsman':
      return 'text-green-400 bg-green-400/10 border-green-400/20';
    case 'Bowler':
      return 'text-red-400 bg-red-400/10 border-red-400/20';
    case 'All-rounder':
      return 'text-purple-400 bg-purple-400/10 border-purple-400/20';
    case 'Wicket-keeper':
      return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
    default:
      return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
  }
};

export const getRoleIcon = (role: string) => {
  switch (role) {
    case 'Batsman':
      return '🏏';
    case 'Bowler':
      return '🎯';
    case 'All-rounder':
      return '⚡';
    case 'Wicket-keeper':
      return '🧤';
    default:
      return '👤';
  }
};