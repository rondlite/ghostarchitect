"use client";

import { useState, useEffect, useRef } from "react";

export interface WindowPreview {
  id: string;
  title: string;
  icon: React.ReactNode;
  focused: boolean;
}

export function useTaskbarPreviews(
  appButtons: Array<{ id: string; title: string; icon: React.ReactNode; onClick?: () => void }>,
  focusedApp: string,
  showPreviewsDelay = 400
) {
  const [previewAppId, setPreviewAppId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewPosition, setPreviewPosition] = useState({ x: 0, y: 0 });
  const previewTimerRef = useRef<NodeJS.Timeout | null>(null);
  const buttonRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  // Handle hover to show preview
  const handleMouseEnter = (appId: string, e: React.MouseEvent) => {
    const button = buttonRefs.current.get(appId);
    if (!button) return;

    const rect = button.getBoundingClientRect();
    setPreviewPosition({
      x: rect.left,
      y: rect.bottom + 8, // 8px gap below taskbar
    });

    setPreviewAppId(appId);

    // Set up delay for showing preview
    if (previewTimerRef.current) {
      clearTimeout(previewTimerRef.current);
    }

    previewTimerRef.current = setTimeout(() => {
      setShowPreview(true);
    }, showPreviewsDelay);
  };

  const handleMouseLeave = () => {
    if (previewTimerRef.current) {
      clearTimeout(previewTimerRef.current);
    }
    setShowPreview(false);
    setPreviewAppId(null);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent, appId: string) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      // Focus the window
      const app = appButtons.find(a => a.id === appId);
      if (app) {
        app.onClick?.();
      }
    } else if (e.key === "Escape") {
      setShowPreview(false);
      setPreviewAppId(null);
    }
  };

  // Update preview data when focused app changes
  const appPreviews = appButtons.map((app) => ({
    id: app.id,
    title: app.title,
    icon: app.icon,
    focused: focusedApp === app.id,
  }));

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (previewTimerRef.current) {
        clearTimeout(previewTimerRef.current);
      }
    };
  }, []);

  // Button click handler for focus
  const handleButtonClick = (appId: string) => {
    setShowPreview(false);
    setPreviewAppId(null);
    const app = appButtons.find(a => a.id === appId);
    if (app) {
      app.onClick?.();
    }
  };

  return {
    previewAppId,
    showPreview,
    previewPosition,
    appPreviews,
    buttonRefs,
    handleMouseEnter,
    handleMouseLeave,
    handleKeyDown,
    handleButtonClick,
  };
}