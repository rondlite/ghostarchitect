"use client";

import { useState, useEffect, useLayoutEffect, ReactNode } from 'react';

export interface DesktopIcon {
  id: string;
  title: string;
  icon: ReactNode;
  onClick?: () => void;
  tooltip?: string;
}

export interface DesktopProps {
  className?: string;
  children?: ReactNode;
  icons?: DesktopIcon[];
  wallpaper?: ReactNode;
  showWallpaperDecorations?: boolean;
  sessionInfo?: ReactNode;
  corporateSessionInfo?: string;
  breachSessionInfo?: string;
}

export function Desktop({
  className = '',
  children,
  icons = [],
  wallpaper,
  showWallpaperDecorations = true,
  sessionInfo,
  corporateSessionInfo = "Workstation 07 · Corporate environment",
  breachSessionInfo = "Incident workspace · Training session",
}: DesktopProps) {
  const [sessionText, setSessionText] = useState(corporateSessionInfo);
  const [isHydrated, setIsHydrated] = useState(false);

  // Get current theme from DOM with proper hydration
  const getTheme = () => {
    if (typeof window === 'undefined') return 'corporate';
    return document.documentElement.dataset.theme || 'corporate';
  };

  // Update session text when theme changes (using observer for better performance)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateSessionText = () => {
      const theme = getTheme();
      setSessionText(theme === 'corporate' ? corporateSessionInfo : breachSessionInfo);
    };

    // Initial update
    updateSessionText();

    // Set up observer for theme changes
    const observer = new MutationObserver(updateSessionText);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    });

    setIsHydrated(true);

    return () => observer.disconnect();
  }, [corporateSessionInfo, breachSessionInfo]);

  return (
    <div className={`desktop ${className}`}>
      {/* Wallpaper Background */}
      <div className="wallpaper">
        {wallpaper || (
          <>
            {showWallpaperDecorations && (
              <>
                <div className="ribbon"></div>
                <div className="ribbon two"></div>
              </>
            )}
          </>
        )}
        
        {/* Session Info for Corporate mode */}
        <div className="corporate-mobile corporate-only">
          {sessionInfo || sessionText}
        </div>

        {/* Incident Alert for Breach mode */}
        <div className="incident breach-only">
          <strong>! WORKSTATION COMPROMISED</strong>
          <br />
          IR-024 / Containment in progress
        </div>
      </div>

      {/* Desktop Icons */}
      <div className="desktop-icons">
        {icons.map((icon) => (
          <button
            key={icon.id}
            className="desktop-icon"
            onClick={icon.onClick}
            title={icon.tooltip || icon.title}
            aria-label={icon.title}
          >
            <div className="icon-container">
              {icon.icon}
            </div>
            <span>{icon.title}</span>
          </button>
        ))}
      </div>

      {/* Desktop Children (windows, etc.) */}
      {children}
    </div>
  );
}