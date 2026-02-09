import React from 'react';
import { cn } from '@/lib/utils';
import type { CardProps } from '@/types';

export const Card: React.FC<CardProps> = ({
  children,
  hover = false,
  padding = 'md',
  className,
}) => {
  const paddingClasses = {
    none: '',
    sm: 'card-padding-sm',
    md: 'card-padding',
    lg: 'card-padding-lg',
  };

  const classes = cn(
    'card',
    hover && 'card-hover',
    paddingClasses[padding],
    className
  );

  return <div className={classes}>{children}</div>;
};
