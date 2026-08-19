import React from 'react';

interface ProgressBarProps {
  value: number; // 0 - 100
  max?: number;
  variant?: 'cyan' | 'amber' | 'emerald';
  height?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  label?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  variant = 'cyan',
  height = 'md',
  showLabel = false,
  label,
}) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  const getVariantBg = () => {
    switch (variant) {
      case 'amber':
        return 'bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-300';
      case 'emerald':
        return 'bg-gradient-to-r from-emerald-600 via-emerald-400 to-teal-300';
      case 'cyan':
      default:
        return 'bg-gradient-to-r from-cyan-600 via-cyan-400 to-teal-200';
    }
  };

  const getHeightClass = () => {
    switch (height) {
      case 'sm':
        return 'h-2.5';
      case 'lg':
        return 'h-6';
      case 'md':
      default:
        return 'h-4';
    }
  };

  return (
    <div className="w-full flex flex-col gap-1">
      {showLabel && (
        <div className="flex justify-between items-center text-[10px] font-pixel text-amber-200/90">
          <span>{label}</span>
          <span>{Math.round(percentage)}%</span>
        </div>
      )}
      <div className={`w-full bg-[#1b1008] border-2 border-[#5a3922] p-0.5 shadow-inner ${getHeightClass()}`}>
        <div
          className={`h-full transition-all duration-500 ease-out shadow-[0_0_8px_rgba(0,229,255,0.4)] ${getVariantBg()}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
