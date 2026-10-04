import React from 'react';

interface CampusBackgroundProps {
  className?: string;
  showOverlay?: boolean;
}

export const CampusBackground: React.FC<CampusBackgroundProps> = ({
  className = '',
  showOverlay = true,
}) => {
  return (
    <div className={`absolute inset-0 w-full h-full overflow-hidden pointer-events-none select-none ${className}`}>
      {/* Real High-Resolution Wallpaper: Dubai Skyline Sunset over Water (pexels-apasaric-3629227.jpg) */}
      <img
        src="/pexels-apasaric-3629227.jpg"
        alt="Atmospheric Sunset Skyline"
        className="w-full h-full object-cover object-center scale-100 motion-safe:scale-[1.02] transition-transform duration-1000 ease-out"
        referrerPolicy="no-referrer"
      />

      {/* Elegant Atmospheric Overlay: soft twilight vignette preserving vibrant violet, rose, and amber tones */}
      {showOverlay && (
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/45 via-slate-950/20 to-slate-950/70 backdrop-blur-[0.5px]" />
      )}
    </div>
  );
};
