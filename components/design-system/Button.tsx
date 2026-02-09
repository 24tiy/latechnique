import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { ButtonProps } from '@/types';

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  onClick,
  href,
  className,
  type = 'button',
}) => {
  const baseClasses = 'btn';
  
  const variantClasses = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    tertiary: 'btn-tertiary',
  };

  const sizeClasses = {
    sm: 'btn-sm',
    md: '',
    lg: 'btn-lg',
  };

  const classes = cn(
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    className
  );

  if (href && !disabled) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type={type}
      className={classes}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};
