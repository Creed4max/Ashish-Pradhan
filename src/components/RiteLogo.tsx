import React from 'react';

interface RiteLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  showSubtitle?: boolean;
  showOsBadge?: boolean;
  className?: string;
  theme?: 'light' | 'dark' | 'auto';
}

export const RiteLogo: React.FC<RiteLogoProps> = ({
  size = 'md',
  showOsBadge = true,
  className = '',
}) => {
  const heightClass = {
    sm: 'h-8 sm:h-9',
    md: 'h-10 sm:h-12',
    lg: 'h-16 sm:h-20',
    xl: 'h-20 sm:h-28',
  }[size];

  return (
    <div className={`inline-flex items-center gap-2 select-none ${className}`}>
      {/* Real Official RITE Logo Image (from official institute assets) */}
      <div className="relative shrink-0 flex items-center justify-center p-1 rounded-lg bg-white/90 shadow-2xs">
        <img
          src="/rite-logo.png"
          alt="Radhakrishna Institute of Technology and Engineering (RITE)"
          className={`${heightClass} w-auto object-contain shrink-0 max-w-full`}
          referrerPolicy="no-referrer"
        />
      </div>

      {showOsBadge && (
        <span className="font-extrabold font-sans text-xs sm:text-sm px-2 py-1 rounded-md bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white tracking-wider shadow-sm shrink-0">
          OS
        </span>
      )}
    </div>
  );
};
