import type { ImgHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface LogoProps extends ImgHTMLAttributes<HTMLImageElement> {
  className?: string;
}

export function Logo({ className, ...props }: LogoProps) {
  return (
    <img
      src="/img/logo.png"
      alt="Assesly Logo"
      className={cn("h-auto w-[100px]", className)}
      {...props}
    />
  );
}
