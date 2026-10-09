"use client";

import { useState, ReactNode } from 'react';

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
  // Determine which session info to show based on theme
  const [sessionText, setSessionText] = useState(corporateSessionInfo);

  // This would typically come from a context or theme provider
  const getTheme = () => {
    // In a real implementation, this would come from ThemeProvider
    return 'corporate'; // Default to corporate
  };

  // Update session info when theme changes
  if (typeof window !== 'undefined') {
    const theme = getTheme();
    setSessionText(theme === 'corporate' ? corporateSessionInfo : breachSessionInfo);
  }

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