"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Desktop } from "./Desktop";
import { Window } from "./Window";
import { Taskbar, TaskbarApp } from "./Taskbar";
import { StartMenu, StartMenuItem } from "./StartMenu";
import { useGameStore } from "@/stores/gameStore";
import type { WindowConfig } from "@/shared/components/WindowManager";

interface WindowsShellProps {
  windows: WindowConfig[];
  dmSidebar?: React.ReactNode;
  onAppClick?: (appId: string) => void;
  panelOpen?: Record<string, boolean>;
  onExit?: () => void;
}

// Map game phases to Windows apps
const phaseToApp: Record<string, StartMenuItem> = {
  "onboarding-portal": {
    id: "email",
    title: "Email Client",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path d="M0 4h16v8H0V4zm1 1v6h14V5H1zm1 1h12l-6 4L2 7zm0 0" />
      </svg>
    ),
    onClick: () => {},
  },
  "breach-email": {
    id: "email",
    title: "Email Client — INCIDENT MODE",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path d="M0 4h16v8H0V4zm1 1v6h14V5H1zm1 1h12l-6 4L2 7zm0 0" />
      </svg>
    ),
    onClick: () => {},
  },
  "breach-password": {
    id: "password",
    title: "Password Reset Required",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path d="M8 2a6 6 0 100 12A6 6 0 008 2zm0 2a4 4 0 110 8 4 4 0 010-8zm0 2a2 2 0 100 4 2 2 0 000-4z" />
      </svg>
    ),
    onClick: () => {},
  },
  "breach-wifi": {
    id: "wifi",
    title: "Network Connection",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path d="M8 2C4.5 2 1.5 4.5 0 8c1.5 3.5 4.5 6 8 6s6.5-2.5 8-6c-1.5-3.5-4.5-6-8-6zm0 2c2.2 0 4.1 1.3 5.1 3.1L11 9H5l-2.1-1.9C3.9 5.3 5.8 4 8 4zm0 8c-2.2 0-4.1-1.3-5.1-3.1L5 7h6l2.1 1.9C12.1 10.7 10.2 12 8 12z" />
      </svg>
    ),
    onClick: () => {},
  },
  "investigation-containment": {
    id: "containment",
    title: "Containment Decision",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path d="M8 1L1 8l2 2 5-5 5 5 2-2L8 1z" />
      </svg>
    ),
    onClick: () => {},
  },
  "investigation-logs": {
    id: "terminal",
    title: "Log Analysis Terminal",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path d="M0 2h16v2H0V2zm0 4h16v2H0V6zm0 4h16v2H0v-2zm0 4h16v2H0v-2z" />
      </svg>
    ),
    onClick: () => {},
  },
  "investigation-lolbins": {
    id: "taskmanager",
    title: "Task Manager — Process Analysis",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <rect x="2" y="2" width="3" height="3" />
        <rect x="6" y="2" width="3" height="3" />
        <rect x="10" y="2" width="3" height="3" />
        <rect x="2" y="6" width="3" height="3" />
        <rect x="6" y="6" width="3" height="3" />
        <rect x="10" y="6" width="3" height="3" />
        <rect x="2" y="10" width="3" height="3" />
        <rect x="6" y="10" width="3" height="3" />
        <rect x="10" y="10" width="3" height="3" />
      </svg>
    ),
    onClick: () => {},
  },
  "investigation-ioc": {
    id: "ioc",
    title: "IOC Documentation",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path d="M8 1C4.1 1 1 4.1 1 8s3.1 7 7 7 7-3.1 7-7-3.1-7-7-7zm0 2c2.8 0 5 2.2 5 5s-2.2 5-5 5-5-2.2-5-5 2.2-5 5-5z" />
      </svg>
    ),
    onClick: () => {},
  },
  "investigation-rotation": {
    id: "rotation",
    title: "Post-Breach Response",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path d="M8 1C4.1 1 1 4.1 1 8s3.1 7 7 7 7-3.1 7-7-3.1-7-7-7zm0 2c2.8 0 5 2.2 5 5s-2.2 5-5 5-5-2.2-5-5 2.2-5 5-5zm-2 2v4l3 3 1-1-2-2V5H6z" />
      </svg>
    ),
    onClick: () => {},
  },
  "debrief": {
    id: "debrief",
    title: "Incident Debrief",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path d="M8 1C4.1 1 1 4.1 1 8s3.1 7 7 7 7-3.1 7-7-3.1-7-7-7zm0 2c2.8 0 5 2.2 5 5s-2.2 5-5 5-5-2.2-5-5 2.2-5 5-5zm-1 2v4l3 3 1-1-2-2V5H7z" />
      </svg>
    ),
    onClick: () => {},
  },
};

export function WindowsShell({
  windows,
  dmSidebar,
  onAppClick,
  panelOpen = {},
  onExit,
}: WindowsShellProps) {
  const [activeWindowId, setActiveWindowId] = useState(windows[0]?.id || "");
  const [minimizedWindows, setMinimizedWindows] = useState<Set<string>>(new Set());
  const [startMenuOpen, setStartMenuOpen] = useState(false);
  const [desktopIcons, setDesktopIcons] = useState<StartMenuItem[]>([]);
  const [taskbarApps, setTaskbarApps] = useState<TaskbarApp[]>([]);
  const visualMode = useGameStore((s) => s.visualMode);
  const teamName = useGameStore((s) => s.teamName);

  // Initialize desktop icons from current phase
  useEffect(() => {
    const icons = Object.entries(phaseToApp)
      .filter(([phase]) => windows.some(w => w.id === phase))
      .map(([_, app]) => ({
        ...app,
        onClick: () => {
          setActiveWindowId(app.id);
        },
      }));

    setDesktopIcons(icons);
  }, [windows]);

  // Initialize taskbar apps
  useEffect(() => {
    const apps = windows.map((window) => ({
      id: window.id,
      title: window.title,
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <rect x="2" y="4" width="12" height="1" />
          <rect x="2" y="6" width="12" height="1" />
          <rect x="2" y="8" width="12" height="1" />
          <rect x="2" y="10" width="12" height="1" />
        </svg>
      ),
      isRunning: true,
      isActive: activeWindowId === window.id,
      isMinimized: minimizedWindows.has(window.id),
      onClick: () => {
        if (minimizedWindows.has(window.id)) {
          setMinimizedWindows(prev => {
            const newSet = new Set(prev);
            newSet.delete(window.id);
            return newSet;
          });
        }
        setActiveWindowId(window.id);
      },
      onMinimize: (id: string) => {
        setMinimizedWindows(prev => {
          const newSet = new Set(prev);
          newSet.add(id);
          return newSet;
        });
      },
      onRestore: (id: string) => {
        setMinimizedWindows(prev => {
          const newSet = new Set(prev);
          newSet.delete(id);
          return newSet;
        });
        setActiveWindowId(id);
      },
    }));

    // Add DM sidebar as an app
    if (dmSidebar) {
      apps.push({
        id: "messages",
        title: "Team Chat",
        icon: (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M0 2h16v12H0V2zm1 1v10h14V3H1zm2 2h10v1H3V5zm0 3h8v1H3V8z" />
          </svg>
        ),
        isRunning: true,
        isActive: activeWindowId === "messages",
        isMinimized: minimizedWindows.has("messages"),
        onClick: () => {
          setActiveWindowId("messages");
        },
        onMinimize: (id: string) => {
          setMinimizedWindows(prev => {
            const newSet = new Set(prev);
            newSet.add(id);
            return newSet;
          });
        },
        onRestore: (id: string) => {
          setMinimizedWindows(prev => {
            const newSet = new Set(prev);
            newSet.delete(id);
            return newSet;
          });
          setActiveWindowId(id);
        },
      });
    }

    // Add system apps (scoreboard, wiki)
    if (panelOpen.scoreboard) {
      apps.push({
        id: "scoreboard",
        title: "Scoreboard",
        icon: (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M0 2h16v12H0V2zm1 1v10h14V3H1zm2 2h10v1H3V5zm0 3h8v1H3V8z" />
          </svg>
        ),
        isRunning: true,
        isActive: !!panelOpen.scoreboard,
        isMinimized: false,
        onClick: onAppClick ? () => onAppClick?.("scoreboard") : () => {},
        onMinimize: () => {},
        onRestore: () => {},
      });
    }

    if (panelOpen.wiki) {
      apps.push({
        id: "wiki",
        title: "Security Wiki",
        icon: (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M0 2h16v12H0V2zm1 1v10h14V3H1zm2 2h10v1H3V5zm0 3h8v1H3V8z" />
          </svg>
        ),
        isRunning: true,
        isActive: !!panelOpen.wiki,
        isMinimized: false,
        onClick: onAppClick ? () => onAppClick?.("wiki") : () => {},
        onMinimize: () => {},
        onRestore: () => {},
      });
    }

    setTaskbarApps(apps);
  }, [windows, dmSidebar, activeWindowId, minimizedWindows, panelOpen, onAppClick]);

  // Reset active window when minimized
  useEffect(() => {
    if (activeWindowId && minimizedWindows.has(activeWindowId)) {
      const activeWindows = windows.filter(w => !minimizedWindows.has(w.id));
      if (activeWindows.length > 0) {
        setActiveWindowId(activeWindows[0].id);
      } else {
        setActiveWindowId("");
      }
    }
  }, [minimizedWindows, windows, activeWindowId]);

  const handleStartMenuToggle = useCallback(() => {
    setStartMenuOpen(prev => !prev);
  }, []);

  const handleStartMenuClose = useCallback(() => {
    setStartMenuOpen(false);
  }, []);

  const handleResetLayout = useCallback(() => {
    setMinimizedWindows(new Set());
  }, []);

  const activeApp = taskbarApps.find(app => app.isActive)?.id || "";

  return (
    <div className="h-screen w-screen overflow-hidden">
      <Desktop
        className="relative h-full"
        icons={desktopIcons}
        sessionInfo={`${teamName} · ${visualMode === "corporate" ? "Corporate environment" : "Incident workspace"}`}
        corporateSessionInfo={`${teamName} · Corporate environment`}
        breachSessionInfo={`${teamName} · Incident workspace · Training session`}
      >
        {/* Windows */}
        <AnimatePresence>
          {windows.map((window) => {
            const isMinimized = minimizedWindows.has(window.id);
            const isActive = activeWindowId === window.id;
            
            return (
              <Window
                key={window.id}
                id={window.id}
                title={window.title}
                icon={
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <rect x="2" y="4" width="12" height="1" />
                    <rect x="2" y="6" width="12" height="1" />
                    <rect x="2" y="8" width="12" height="1" />
                    <rect x="2" y="10" width="12" height="1" />
                  </svg>
                }
                isActive={isActive}
                isMinimized={isMinimized}
                onMinimizeChange={(minimized) => {
                  if (minimized) {
                    setMinimizedWindows(prev => new Set([...prev, window.id]));
                  } else {
                    setMinimizedWindows(prev => {
                      const newSet = new Set(prev);
                      newSet.delete(window.id);
                      return newSet;
                    });
                  }
                }}
                onClose={() => {
                  // Don't allow closing critical windows
                  if (!["start", "login", "sim-intro", "mfa", "ending"].includes(window.id)) {
                    setMinimizedWindows(prev => new Set([...prev, window.id]));
                  }
                }}
                defaultPosition={{ x: 100, y: 100 }}
                defaultSize={{ width: 640, height: 480 }}
              >
                {window.content}
              </Window>
            );
          })}
        </AnimatePresence>

        {/* Start Menu */}
        <StartMenu
          isOpen={startMenuOpen}
          onClose={handleStartMenuClose}
          title="Your workspace"
          subtitle={`${teamName} Training`}
          apps={Object.values(phaseToApp).filter(app => 
            windows.some(w => w.id === app.id)
          )}
          showResetButton={true}
          onReset={handleResetLayout}
        />
      </Desktop>

      {/* Taskbar */}
      <Taskbar
        startMenuOpen={startMenuOpen}
        onStartMenuToggle={handleStartMenuToggle}
        apps={taskbarApps}
        sessionInfo={`${teamName} · Training session`}
        showClock={true}
        networkIcon={
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <circle cx="8" cy="8" r="2" />
            <path d="M8 2C4.5 2 1.5 4.5 0 8c1.5 3.5 4.5 6 8 6s6.5-2.5 8-6c-1.5-3.5-4.5-6-8-6z" fill="none" stroke="currentColor" strokeWidth="1" />
          </svg>
        }
        powerIcon={
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M7.5 1h1v6h-1V1z" />
            <path d="M4.2 3.2l.7.7A5 5 0 1 0 11.1 4l.7-.7A6 6 0 1 1 4.2 3.2z" />
          </svg>
        }
        onExit={onExit}
      />
    </div>
  );
}