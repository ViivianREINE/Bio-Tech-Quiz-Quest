import React from 'react';
import { useAudio } from '../../context/AudioContext';

interface PixelButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'amber' | 'cyan' | 'wood' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
}

export const PixelButton: React.FC<PixelButtonProps> = ({
  children,
  variant = 'amber',
  size = 'md',
  icon,
  className = '',
  onClick,
  disabled,
  ...props
}) => {
  const { playSFX } = useAudio();

  const getVariantStyles = () => {
    switch (variant) {
      case 'cyan':
        return 'pixel-btn-cyan';
      case 'wood':
        return 'pixel-btn-wood';
      case 'danger':
        return 'bg-gradient-to-b from-red-600 to-red-800 text-white border-[3px] border-red-950 shadow-[inset_2px_2px_0px_#fca5a5,inset_-2px_-2px_0px_#7f1d1d,0_4px_0px_#450a0a] active:translate-y-[3px] active:shadow-[0_1px_0px_#450a0a]';
      case 'amber':
      default:
        return 'pixel-btn-amber';
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return 'px-3 py-1.5 text-xs font-pixel';
      case 'lg':
        return 'px-6 py-3.5 text-base font-pixel tracking-wide';
      case 'md':
      default:
        return 'px-4 py-2.5 text-sm font-pixel';
    }
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled) {
      playSFX('tick');
      onClick?.(e);
    }
  };

  return (
    <button
      {...props}
      disabled={disabled}
      onClick={handleClick}
      className={`inline-flex items-center justify-center gap-2 cursor-pointer select-none font-bold uppercase transition-all duration-75 ${getSizeStyles()} ${getVariantStyles()} ${
        disabled ? 'opacity-50 grayscale cursor-not-allowed transform-none shadow-none' : ''
      } ${className}`}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </button>
  );
};
