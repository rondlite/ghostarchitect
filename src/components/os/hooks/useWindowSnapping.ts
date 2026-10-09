"use client";

import { useState, useRef, useEffect, useCallback } from "react";

interface WindowPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface SnapZone {
  area: "left" | "right" | "top" | "top-left" | "top-right" | "bottom-left" | "bottom-right";
  x: number;
  y: number;
  width: number;
  height: number;
}

export type { WindowPosition };

export function useWindowSnapping(
  windowId: string,
  initialPosition: WindowPosition,
  onSnap?: (snapType: string, position: WindowPosition) => void,
  onRestore?: () => void
) {
  const [position, setPosition] = useState<WindowPosition>(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [snapPreview, setSnapPreview] = useState<{ area: string; x: number; y: number; width: number; height: number } | null>(null);
  const [isSnapped, setIsSnapped] = useState(false);
  const [snapType, setSnapType] = useState<string>("");
  const dragStartRef = useRef({ x: 0, y: 0, originalPosition: initialPosition });
  const windowRef = useRef<HTMLDivElement>(null);

  const screenThreshold = 50; // Distance from screen edge to trigger snap
  const gridSize = 96; // Grid snap size for desktop icons

  // Check if window is in mobile view
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  useEffect(() => {
    if (isMobile) {
      setIsSnapped(false);
      setSnapPreview(null);
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      const deltaX = e.clientX - dragStartRef.current.x;
      const deltaY = e.clientY - dragStartRef.current.y;
      
      const newX = dragStartRef.current.originalPosition.x + deltaX;
      const newY = dragStartRef.current.originalPosition.y + deltaY;

      // Grid snap for desktop icons
      const gridSnappedX = Math.round(newX / gridSize) * gridSize;
      const gridSnappedY = Math.round(newY / gridSize) * gridSize;

      setPosition({
        x: gridSnappedX,
        y: gridSnappedY,
        width: dragStartRef.current.originalPosition.width,
        height: dragStartRef.current.originalPosition.height,
      });

      // Check for snap zones
      checkSnapZones(e.clientX, e.clientY);
    };

    const handleMouseUp = () => {
      if (!isDragging) return;
      
      setIsDragging(false);
      
      if (snapPreview) {
        // Apply snap
        const newPosition = {
          x: snapPreview.x,
          y: snapPreview.y,
          width: snapPreview.width,
          height: snapPreview.height,
        };
        
        setPosition(newPosition);
        setIsSnapped(true);
        setSnapType(snapPreview.area);
        onSnap?.(snapPreview.area, newPosition);
      } else {
        // Restore to original position if not snapped
        setIsSnapped(false);
        setSnapType("");
        onRestore?.();
      }
      
      setSnapPreview(null);
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, snapPreview, onSnap, onRestore, isMobile, gridSize]);

  const checkSnapZones = useCallback((clientX: number, clientY: number) => {
    if (!windowRef.current) return;

    const windowRect = windowRef.current.getBoundingClientRect();
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    const snapZones: SnapZone[] = [
      // Left edge - half screen
      { area: "left", x: 0, y: 0, width: screenWidth / 2, height: screenHeight },
      // Right edge - half screen  
      { area: "right", x: screenWidth / 2, y: 0, width: screenWidth / 2, height: screenHeight },
      // Top edge - maximize
      { area: "top", x: 0, y: 0, width: screenWidth, height: screenHeight },
      // Top-left corner - quarter screen
      { area: "top-left", x: 0, y: 0, width: screenWidth / 2, height: screenHeight / 2 },
      // Top-right corner - quarter screen
      { area: "top-right", x: screenWidth / 2, y: 0, width: screenWidth / 2, height: screenHeight / 2 },
      // Bottom-left corner - quarter screen
      { area: "bottom-left", x: 0, y: screenHeight / 2, width: screenWidth / 2, height: screenHeight / 2 },
      // Bottom-right corner - quarter screen
      { area: "bottom-right", x: screenWidth / 2, y: screenHeight / 2, width: screenWidth / 2, height: screenHeight / 2 },
    ];

    let closestSnap: SnapZone | null = null;
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
  }, []);

  const startDrag = useCallback((e: React.MouseEvent) => {
    if (isMobile) return;
    
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      originalPosition: position,
    };
  }, [position, isMobile]);

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    if (isMobile) return;

    // Check if double-click is on title bar
    const target = e.target as HTMLElement;
    if (target.closest('[data-window-title]') || target.closest('.window-title-bar')) {
      // Toggle maximize/restore
      if (isSnapped) {
        // Restore to original size
        setIsSnapped(false);
        setSnapType("");
        onRestore?.();
      } else {
        // Maximize to full screen
        setPosition({
          x: 0,
          y: 0,
          width: window.innerWidth,
          height: window.innerHeight - 48, // Account for taskbar
        });
        setIsSnapped(true);
        setSnapType("top");
        onSnap?.("top", {
          x: 0,
          y: 0,
          width: window.innerWidth,
          height: window.innerHeight - 48,
        });
      }
    }
  }, [isSnapped, onSnap, onRestore, isMobile]);

  const restoreWindow = useCallback(() => {
    setIsSnapped(false);
    setSnapType("");
    setSnapPreview(null);
    onRestore?.();
  }, [onRestore]);

  return {
    position,
    isDragging,
    snapPreview,
    isSnapped,
    snapType,
    startDrag,
    handleDoubleClick,
    restoreWindow,
    windowRef,
  };
}