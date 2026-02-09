/* ========================================
   COMPONENT TYPES
   ======================================== */

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  onClick?: () => void;
  href?: string;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

export interface CardProps {
  children: React.ReactNode;
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  className?: string;
}

export interface AnimatedBorderProps {
  children: React.ReactNode;
  className?: string;
}

export type BrandColor = 
  | 'altitude' 
  | 'sunflare' 
  | 'ember' 
  | 'aurora' 
  | 'dust' 
  | 'soil' 
  | 'teal' 
  | 'canopy';

export interface OrbsBackgroundProps {
  colors?: BrandColor[];
  className?: string;
}

/* ========================================
   FEATURE TYPES
   ======================================== */

export interface Feature {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}

export interface PricingTier {
  name: string;
  price: string;
  description: string;
  features: string[];
  highlighted?: boolean;
  cta: string;
}

/* ========================================
   SOCIAL PLATFORM TYPES
   ======================================== */

export type SocialPlatform = 
  | 'tiktok' 
  | 'instagram' 
  | 'youtube' 
  | 'vk' 
  | 'telegram' 
  | 'likee';

export interface SocialPost {
  url: string;
  platform: SocialPlatform;
  author: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  favorites: number;
  publishedAt: string;
  er: number; // Engagement Rate %
}

export interface AnalysisRequest {
  id: string;
  userId: string;
  urls: string[];
  totalUrls: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  results: SocialPost[];
  createdAt: string;
}

export interface UserCredits {
  userId: string;
  freeLinksUsed: number;
  paidCredits: number;
  updatedAt: string;
}

/* ========================================
   API TYPES
   ======================================== */

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface AnalyzeRequestBody {
  urls: string[];
}

export interface AnalyzeResponse {
  items: SocialPost[];
  errors: Array<{
    url: string;
    error: string;
  }>;
}

/* ========================================
   UTILITY TYPES
   ======================================== */

export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type PropsWithClassName<T = {}> = T & { className?: string };
