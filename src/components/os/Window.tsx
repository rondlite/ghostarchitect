"use client";

import { useEffect, useRef, useState, useCallback } from "react";
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
  onPointerDown?: (id: string) => void;
  onSnap?: (snapType: string, position: { x: number; y: number; width: number; height: number }) => void;
  onRestore?: () => void;
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
  onPointerDown,
  onSnap,
  onRestore,
}: WindowProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState(defaultPosition);
  const [size, setSize] = useState(defaultSize);
  const [isMaximizedState, setIsMaximizedState] = useState(isMaximized);
  const [isMinimizedState, setIsMinimizedState] = useState(isMinimized);
  const [isFocused, setIsFocused] = useState(isActive);
  const [isSnapped, setIsSnapped] = useState(false);
  const [snapPreview, setSnapPreview] = useState<{ area: string; x: number; y: number; width: number; height: number } | null>(null);
  const windowRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef({ x: 0, y: 0, originalPosition: defaultPosition, originalSize: defaultSize });

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

  // Update z-index when window is clicked (raises it to front)
  const handleFocus = () => {
    setIsFocused(true);
    // Note: The parent component (WindowsShell) should setActiveWindowId(id)
    // This component expects an onPointerDown handler from the parent
  };
  
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

  // Snap zone checking
  const checkSnapZones = useCallback((clientX: number, clientY: number) => {
    if (!windowRef.current || isMobile) return;

    const windowRect = windowRef.current.getBoundingClientRect();
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const taskbarHeight = 48;

    const snapZones = [
      // Top edge - maximize
      { area: "top", x: 0, y: 0, width: screenWidth, height: screenHeight - taskbarHeight },
      // Left edge - half screen
      { area: "left", x: 0, y: 0, width: screenWidth / 2, height: screenHeight - taskbarHeight },
      // Right edge - half screen  
      { area: "right", x: screenWidth / 2, y: 0, width: screenWidth / 2, height: screenHeight - taskbarHeight },
      // Top-left corner - quarter screen
      { area: "top-left", x: 0, y: 0, width: screenWidth / 2, height: (screenHeight - taskbarHeight) / 2 },
      // Top-right corner - quarter screen
      { area: "top-right", x: screenWidth / 2, y: 0, width: screenWidth / 2, height: (screenHeight - taskbarHeight) / 2 },
    ];

    const screenThreshold = 50;
    let closestSnap: typeof snapZones[0] | null = null;
    let minDistance = screenThreshold;

    for (const zone of snapZones) {
      const distance = Math.sqrt(
        Math.pow(clientX - (zone.x + zone.width / 2), 2) + 
        Math.pow(clientY - (zone.y + zone.height / 2), 2)
      );

      if (distance < minDistance) {
        minDistance = distance;
        closestSnap = zone;
      }
    }

    if (closestSnap) {
      setSnapPreview({
        area: closestSnap.area,
        x: closestSnap.x,
        y: closestSnap.y,
        width: closestSnap.width,
        height: closestSnap.height,
      });
    } else {
      setSnapPreview(null);
    }
  }, [isMobile]);

  // Handle double-click for maximize/restore
  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    if (isMobile) return;

    const target = e.target as HTMLElement;
    if (target.closest('[data-window-title]') || target.closest('.window-title-bar')) {
      if (isSnapped) {
        setIsSnapped(false);
        setSnapPreview(null);
        setIsMaximizedState(false);
        onRestore?.();
      } else {
        // Maximize to full screen
        setPosition({ x: 0, y: 0 });
        setSize({ 
          width: window.innerWidth, 
          height: window.innerHeight - 48 
        });
        setIsSnapped(true);
        setIsMaximizedState(true);
        onSnap?.("top", {
          x: 0,
          y: 0,
          width: window.innerWidth,
          height: window.innerHeight - 48,
        });
      }
    }
  }, [isSnapped, onSnap, onRestore, isMobile]);

  // Handle drag functionality
  const handleMouseDown = (e: React.MouseEvent) => {
    // Raise window to front when dragging starts
    handleFocus();
    onPointerDown?.(id);
    
    // Only initiate drag from the header bar itself (not its buttons/controls)
    if (windowRef.current?.classList.contains('maximized')) {
      return;
    }
    const target = e.target as HTMLElement;
    if (!headerRef.current?.contains(target) || target.closest('button')) {
      return;
    }

    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      originalPosition: position,
      originalSize: size,
    };

    const handleMouseMove = (e: MouseEvent) => {
      // NOTE: do not read the isDragging state here — it is a stale closure
      // value (false) at drag start. These listeners only exist mid-drag.

      const desktop = document.querySelector('.desktop');
      if (!desktop) return;

      const desktopRect = desktop.getBoundingClientRect();
      const deltaX = e.clientX - dragStartRef.current.x;
      const deltaY = e.clientY - dragStartRef.current.y;
      
      const newX = dragStartRef.current.originalPosition.x + deltaX;
      const newY = dragStartRef.current.originalPosition.y + deltaY;

      // Keep window within desktop bounds (read live viewport state, not stale closure)
      const maxX = desktopRect.width - (isMobile ? 0 : size.width);
      const maxY = desktopRect.height - 45; // Account for title bar height

      setPosition({
        x: isMobile ? 0 : Math.max(0, Math.min(newX, maxX)),
        y: isMobile ? 0 : Math.max(0, Math.min(newY, maxY)),
      });

      // Check for snap zones
      checkSnapZones(e.clientX, e.clientY);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      
      if (snapPreview) {
        // Apply snap
        const newPosition = {
          x: snapPreview.x,
          y: snapPreview.y,
        };
        const newSize = {
          width: snapPreview.width,
          height: snapPreview.height,
        };
        
        setPosition(newPosition);
        setSize(newSize);
        setIsSnapped(true);
        setIsMaximizedState(snapPreview.area === "top");
        onSnap?.(snapPreview.area, {
          ...newPosition,
          width: newSize.width,
          height: newSize.height,
        });
      } else {
        // Restore to original position if not snapped
        setIsSnapped(false);
        setIsMaximizedState(false);
        onRestore?.();
      }
      
      setSnapPreview(null);
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

  // Handle double-click for maximize/restore
  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    if (isMobile) return;

    const target = e.target as HTMLElement;
    if (target.closest('[data-window-title]') || target.closest('.window-title-bar')) {
      if (isSnapped) {
        setIsSnapped(false);
        setSnapPreview(null);
        setIsMaximizedState(false);
        onRestore?.();
      } else {
        // Maximize to full screen
        setPosition({ x: 0, y: 0 });
        setSize({ 
          width: window.innerWidth, 
          height: window.innerHeight - 48 
        });
        setIsSnapped(true);
        setIsMaximizedState(true);
        onSnap?.("top", {
          x: 0,
          y: 0,
          width: window.innerWidth,
          height: window.innerHeight - 48,
        });
      }
    }
  }, [isSnapped, onSnap, onRestore, isMobile]);    // Initial detection
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
            // zIndex removed - CSS handles active state with z-index: 1000
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
          onPointerDown={() => {
            handleFocus();
            onPointerDown?.(id);
          }}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Tab' || e.key === 'Enter') {
              handleFocus();
              onPointerDown?.(id);
            }
          }}
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
            onDoubleClick={handleDoubleClick}
            style={{ 
              cursor: isDragging ? 'grabbing' : 'move',
              zIndex: 20,
            }}
            data-window-title
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
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M1 1l14 14M15 1L1 15" />
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
          
          {/* Snap Preview Overlay */}
          {snapPreview && (
            <motion.div
              className="absolute pointer-events-none border-2 border-dashed border-blue-400 bg-blue-500/10"
              style={{
                left: snapPreview.x,
                top: snapPreview.y,
                width: snapPreview.width,
                height: snapPreview.height,
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.8 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}