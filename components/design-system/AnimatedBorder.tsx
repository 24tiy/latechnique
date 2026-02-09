import React from 'react';
import { cn } from '@/lib/utils';
import type { AnimatedBorderProps } from '@/types';

export const AnimatedBorder: React.FC<AnimatedBorderProps> = ({
  children,
  className,
}) => {
  return (
    <div className={cn('animated-border', className)}>
      {children}
    </div>
  );
};
