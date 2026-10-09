"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export interface WindowProps {
  id: string;
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClose?: () => void;
  onMinimize?: () => void;
  onMaximize?: (newState: boolean) => void;
  isActive?: boolean;
  isMaximized?: boolean;
  defaultPosition?: { x: number; y: number };
  defaultSize?: { width: number; height: number };
  isMinimized?: boolean;
  onMinimizeChange?: (minimized: boolean) => void;
}

export function Window({
  id,
  title,
  icon,
  children,
  className = "",
  style,
  onClose,
  onMinimize,
  onMaximize,
  isActive = false,
  isMaximized = false,
  defaultPosition = { x: 100, y: 100 },
  defaultSize = { width: 640, height: 480 },
  isMinimized = false,
  onMinimizeChange,
}: WindowProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState(defaultPosition);
  const [size, setSize] = useState(defaultSize);
  const [isMaximizedState, setIsMaximizedState] = useState(isMaximized);
  const [isMinimizedState, setIsMinimizedState] = useState(isMinimized);
  const [isFocused, setIsFocused] = useState(isActive);
  const windowRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  // Active drag listeners, so they can always be removed (end-drag OR unmount mid-drag)
  const dragCleanupRef = useRef<(() => void) | null>(null);

  // Remove any live drag listeners when the component unmounts mid-drag
  useEffect(() => {
    return () => {
      dragCleanupRef.current?.();
      dragCleanupRef.current = null;
    };
  }, []);

  useEffect(() => {
    setIsMaximizedState(isMaximized);
  }, [isMaximized]);

  useEffect(() => {
    setIsMinimizedState(isMinimized);
  }, [isMinimized]);

  useEffect(() => {
    setIsFocused(isActive);
  }, [isActive]);

  // Handle minimize state changes
  const handleMinimize = () => {
    const newMinimizedState = !isMinimizedState;
    setIsMinimizedState(newMinimizedState);
    onMinimizeChange?.(newMinimizedState);
    onMinimize?.();
  };

  // Handle maximize state changes
  const handleMaximize = () => {
    const newState = !isMaximizedState;
    setIsMaximizedState(newState);
    onMaximize?.(newState);
  };

  // Handle close
  const handleClose = () => {
    onClose?.();
  };

  // Handle drag functionality
  const handleMouseDown = (e: React.MouseEvent) => {
    // Only initiate drag from the header bar itself (not its buttons/controls)
    if (windowRef.current?.classList.contains('maximized')) {
      return;
    }
    const target = e.target as HTMLElement;
    if (!headerRef.current?.contains(target) || target.closest('button')) {
      return;
    }

    setIsDragging(true);
    const startX = e.clientX - position.x;
    const startY = e.clientY - position.y;

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      const desktop = document.querySelector('.desktop');
      if (!desktop) return;

      const desktopRect = desktop.getBoundingClientRect();
      const newX = e.clientX - startX;
      const newY = e.clientY - startY;

      // Keep window within desktop bounds (read live viewport state, not stale closure)
      const mobile = window.innerWidth < 768;
      const maxX = desktopRect.width - (mobile ? 0 : size.width);
      const maxY = desktopRect.height - 45; // Account for title bar height

      setPosition({
        x: mobile ? 0 : Math.max(0, Math.min(newX, maxX)),
        y: mobile ? 0 : Math.max(0, Math.min(newY, maxY)),
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      dragCleanupRef.current = null;
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    dragCleanupRef.current = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  };

  // Focus ring animation
  const focusRingAnimation = {
    initial: { opacity: 0 },
    animate: { 
      opacity: isFocused ? 1 : 0,
      transition: { duration: 0.3, ease: "easeOut" }
    },
    exit: { opacity: 0 }
  };

  const [isMobile, setIsMobile] = useState(false);

  // Update mobile detection on resize and initial mount
  useEffect(() => {
    const updateMobileState = () => {
      if (typeof window !== 'undefined') {
        setIsMobile(window.innerWidth < 768);
      }
    };

    // Initial detection
    updateMobileState();

    // Handle resize events
    const handleResize = () => {
      updateMobileState();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <AnimatePresence>
      {!isMinimizedState && (
        <motion.div
          ref={windowRef}
          className={`window ${isActive ? 'active' : ''} ${isMaximizedState ? 'maximized' : ''} ${isFocused ? 'focused' : ''} ${className}`}
          style={{
            left: isMaximizedState ? 0 : (isMobile ? 0 : position.x),
            top: isMaximizedState ? 0 : (isMobile ? 0 : position.y),
            width: isMaximizedState ? '100vw' : (isMobile ? '100vw' : size.width),
            height: isMaximizedState ? 'calc(100vh - 48px)' : (isMobile ? 'calc(100vh - 48px)' : size.height),
            ...style,
          }}
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ 
            opacity: 1, 
            scale: 1, 
            y: 0,
            transition: { 
              duration: 0.3,
              ease: [0.22, 1, 0.36, 1]
            }
          }}
          exit={{ 
            opacity: 0, 
            scale: 0.95,
            y: -20,
            transition: { duration: 0.2 }
          }}
          transition={{ duration: 0.2 }}
          data-testid={`window-${id}`}
          onClick={() => setIsFocused(true)}
        >
          {/* Focus Ring */}
          {isFocused && (
            <motion.div
              className="absolute inset-0 rounded-lg pointer-events-none"
              style={{
                boxShadow: "0 0 0 2px var(--accent)",
                zIndex: 10,
              }}
              initial={{ opacity: 0 }}
              animate={{ 
                opacity: isFocused ? 1 : 0,
                transition: { duration: 0.3, ease: "easeOut" }
              }}
              exit={{ opacity: 0 }}
            />
          )}

          {/* Window Header */}
          <div
            ref={headerRef}
            className="window-header"
            onMouseDown={handleMouseDown}
            style={{ 
              cursor: isDragging ? 'grabbing' : 'move',
              zIndex: 20,
            }}
          >
            {icon && <div className="window-header-icon">{icon}</div>}
            <div className="window-header-title">{title}</div>
            <div className="window-controls">
              <motion.button
                onClick={handleMinimize}
                className="minimize"
                aria-label="Minimize"
                title="Minimize"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                transition={{ type: "spring", stiffness: 500, damping: 17 }}
              >
                <svg viewBox="0 0 16 16" fill="currentColor">
                  <path d="M0 7v2h16V7z" />
                </svg>
              </motion.button>
              <motion.button
                onClick={handleMaximize}
                className="maximize"
                aria-label={isMaximizedState ? "Restore" : "Maximize"}
                title={isMaximizedState ? "Restore" : "Maximize"}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                transition={{ type: "spring", stiffness: 500, damping: 17 }}
              >
                {isMaximizedState ? (
                  <svg viewBox="0 0 16 16" fill="currentColor">
                    <path d="M0 0h6v6H0zm10 0h6v6h-6zm-10 10h6v6H0zm10 0h6v6h-6z" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 16 16" fill="currentColor">
                    <path d="M0 0h16v2H0zm0 7h16v2H0zm0 7h16v2H0z" />
                  </svg>
                )}
              </motion.button>
              <motion.button
                onClick={handleClose}
                className="close"
                aria-label="Close"
                title="Close"
                whileHover={{ scale: 1.1, backgroundColor: "rgba(255,255,255,0.1)" }}
                whileTap={{ scale: 0.9 }}
                transition={{ type: "spring", stiffness: 500, damping: 17 }}
              >
                <svg viewBox="0 0 16 16" fill="currentColor">
                  <path d="M0 1l15 15m0-15L0 16" />
                </svg>
              </motion.button>
            </div>
          </div>

          {/* Window Content */}
          <motion.div
            className="window-content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ 
              delay: 0.1,
              duration: 0.3,
              ease: "easeOut"
            }}
            style={{
              pointerEvents: isMobile ? "none" : "auto",
            }}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}