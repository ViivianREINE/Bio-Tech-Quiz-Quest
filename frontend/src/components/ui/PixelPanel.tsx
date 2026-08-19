import React from 'react';

interface PixelPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'wood' | 'parchment' | 'terminal' | 'gold';
  header?: React.ReactNode;
  footer?: React.ReactNode;
}

export const PixelPanel: React.FC<PixelPanelProps> = ({
  children,
  variant = 'wood',
  header,
  footer,
  className = '',
  ...props
}) => {
  const getPanelStyle = () => {
    switch (variant) {
      case 'parchment':
        return 'pixel-box-parchment text-[#3a2216]';
      case 'terminal':
        return 'pixel-box-terminal text-[#e0f7fa]';
      case 'gold':
        return 'pixel-box-gold text-[#fdf8e2]';
      case 'wood':
      default:
        return 'pixel-box-wood text-[#fdf6e6]';
    }
  };

  return (
    <div {...props} className={`relative flex flex-col ${getPanelStyle()} ${className}`}>
      {header && (
        <div className="px-5 py-3 border-b-2 border-black/20 bg-black/10 flex items-center justify-between">
          {typeof header === 'string' ? (
            <h3 className="font-pixel text-xs md:text-sm text-amber-300 tracking-wider uppercase">
              {header}
            </h3>
          ) : (
            header
          )}
        </div>
      )}
      <div className="p-4 md:p-6 flex-1 overflow-y-auto">{children}</div>
      {footer && (
        <div className="px-5 py-3 border-t-2 border-black/20 bg-black/10 flex items-center justify-between">
          {footer}
        </div>
      )}
    </div>
  );
};
