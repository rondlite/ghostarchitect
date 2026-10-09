"use client";

import { useState, useCallback, useEffect } from "react";

export interface DraggableDesktopIcon {
  id: string;
  title: string;
  icon: React.ReactNode;
  onClick?: () => void;
  tooltip?: string;
  x: number;
  y: number;
}

const GRID_SIZE = 96; // 96px grid for snapping

export function useDesktopIcons(
  initialIcons?: DraggableDesktopIcon[],
  onIconMove?: (id: string, x: number, y: number) => void
) {
  const [icons, setIcons] = useState<DraggableDesktopIcon[]>(initialIcons || []);

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const snapToGrid = useCallback((x: number, y: number) => {
    return {
      x: Math.round(x / GRID_SIZE) * GRID_SIZE,
      y: Math.round(y / GRID_SIZE) * GRID_SIZE,
    };
  }, []);

  const startDrag = useCallback((e: React.MouseEvent, iconId: string) => {
    e.preventDefault();
    const icon = icons.find((i) => i.id === iconId);
    if (!icon) return;

    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;

    setDraggingId(iconId);
    setDragOffset({ x: offsetX, y: offsetY });
  }, [icons]);

  const handleDrag = useCallback((e: React.MouseEvent) => {
    if (!draggingId) return;

    const snappedPosition = snapToGrid(
      e.clientX - dragOffset.x,
      e.clientY - dragOffset.y
    );

    setIcons((prev) =>
      prev.map((icon) =>
        icon.id === draggingId
          ? { ...icon, x: snappedPosition.x, y: snappedPosition.y }
          : icon
      )
    );
  }, [draggingId, dragOffset, snapToGrid]);

  const endDrag = useCallback(() => {
    if (!draggingId) return;

    const icon = icons.find((i) => i.id === draggingId);
    if (icon) {
      onIconMove?.(draggingId, icon.x, icon.y);
    }

    setDraggingId(null);
    setDragOffset({ x: 0, y: 0 });
  }, [draggingId, icons, onIconMove]);

  const handleIconClick = useCallback((iconId: string) => {
    // Don't trigger click if we were just dragging
    if (draggingId) return;
    
    const icon = icons.find((i) => i.id === iconId);
    if (icon && icon.onClick) {
      icon.onClick();
    }
  }, [icons, draggingId]);

  // Add global mouse listeners for dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (draggingId) {
        handleDrag(e as unknown as React.MouseEvent);
      }
    };

    const handleMouseUp = () => {
      endDrag();
    };

    if (draggingId) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [draggingId, handleDrag, endDrag]);

  return {
    icons,
    draggingId,
    startDrag,
    handleIconClick,
  };
}