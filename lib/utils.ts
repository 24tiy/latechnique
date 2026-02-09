import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Объединяет классы с помощью clsx и tailwind-merge
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Форматирует число с разделителями тысяч
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('ru-RU').format(num);
}

/**
 * Форматирует процент с точностью до 2 знаков
 */
export function formatPercent(num: number): string {
  return `${num.toFixed(2)}%`;
}

/**
 * Определяет платформу по URL
 */
export function detectPlatform(url: string): string | null {
  const patterns = {
    tiktok: /tiktok\.com/i,
    instagram: /instagram\.com/i,
    youtube: /youtube\.com|youtu\.be/i,
    vk: /vk\.com/i,
    telegram: /t\.me/i,
    likee: /likee\./i,
  };

  for (const [platform, pattern] of Object.entries(patterns)) {
    if (pattern.test(url)) {
      return platform;
    }
  }

  return null;
}

/**
 * Вычисляет Engagement Rate
 */
export function calculateER(
  views: number,
  likes: number,
  comments: number,
  shares: number,
  favorites: number
): number {
  if (views === 0) return 0;
  return ((likes + comments + shares + favorites) / views) * 100;
}

/**
 * Валидирует URL
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Форматирует дату
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(d);
}

/**
 * Форматирует относительное время
 */
export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);

  const intervals = {
    год: 31536000,
    месяц: 2592000,
    неделя: 604800,
    день: 86400,
    час: 3600,
    минута: 60,
  };

  for (const [name, seconds] of Object.entries(intervals)) {
    const interval = Math.floor(diffInSeconds / seconds);
    if (interval >= 1) {
      return `${interval} ${name}${interval > 1 ? (name === 'час' ? 'а' : name === 'месяц' ? 'а' : 'и') : ''} назад`;
    }
  }

  return 'только что';
}

/**
 * Debounce функция
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttle функция
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Генерирует случайный ID
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

/**
 * Sleep функция
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
