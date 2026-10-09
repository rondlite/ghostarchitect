"use client";

import { ReactNode } from 'react';
import { motion } from 'framer-motion';

export interface StartMenuItem {
  id: string;
  title: string;
  icon: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}

export interface StartMenuProps {
  isOpen: boolean;
  onClose?: () => void;
  className?: string;
  title?: string;
  subtitle?: string;
  apps?: StartMenuItem[];
  showResetButton?: boolean;
  onReset?: () => void;
}

export function StartMenu({
  isOpen,
  onClose,
  className = '',
  title = "Your workspace",
  subtitle = "Ghost Architect",
  apps = [],
  showResetButton = true,
  onReset,
}: StartMenuProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose?.();
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    // Close when clicking outside the menu
    if (e.target === e.currentTarget) {
      onClose?.();
    }
  };

  const handleAppClick = (onClick?: () => void) => {
    onClick?.();
    onClose?.();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-20 z-[1500]"
        onClick={handleBackdropClick}
        aria-hidden="true"
      />
      
      {/* Start Menu */}
      <motion.div
        className={`start-menu ${className}`}
        role="menu"
        aria-modal="true"
        aria-label="Start menu"
        onKeyDown={handleKeyDown}
        tabIndex={-1}
        initial={{ 
          opacity: 0, 
          y: 20,
          scale: 0.95 
        }}
        animate={{ 
          opacity: 1, 
          y: 0,
          scale: 1 
        }}
        exit={{ 
          opacity: 0, 
          y: 20,
          scale: 0.95 
        }}
        transition={{ 
          duration: 0.2,
          ease: "easeOut" 
        }}
      >
        {/* Header */}
        <div className="start-menu-header">
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>

        {/* Apps Section */}
        {apps.length > 0 && (
          <div className="start-menu-apps">
            {apps.map((app) => (
              <button
                key={app.id}
                className="start-menu-app-button"
                onClick={() => handleAppClick(app.onClick)}
                disabled={app.disabled}
                role="menuitem"
                aria-label={app.title}
                tabIndex={0}
              >
                <div className="app-icon">
                  {app.icon}
                </div>
                <span>{app.title}</span>
              </button>
            ))}
          </div>
        )}

        {/* Footer - Reset Button */}
        {showResetButton && (
          <div className="start-menu-footer">
            <button
              className="start-menu-reset-button"
              onClick={() => {
                onReset?.();
                onClose?.();
              }}
              role="menuitem"
              tabIndex={0}
            >
              Reset window layout
            </button>
          </div>
        )}
      </motion.div>
    </>
  );
}