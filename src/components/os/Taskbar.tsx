"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTaskbarGrouping, type GroupedApp } from "./hooks/useTaskbarGrouping";
import { useTaskbarPreviews } from "./hooks/useTaskbarPreviews";

export interface TaskbarApp {
  id: string;
  title: string;
  icon: React.ReactNode;
  isActive?: boolean;
  onClick?: () => void;
  isRunning?: boolean;
  isFocused?: boolean;
  isMinimized?: boolean;
  kind?: "window" | "panel";
  onMinimize?: (id: string) => void;
  onRestore?: (id: string) => void;
}

export interface TaskbarProps {
  className?: string;
  startMenuOpen?: boolean;
  onStartMenuToggle?: (open: boolean) => void;
  apps?: TaskbarApp[];
  sessionInfo?: string;
  showClock?: boolean;
  networkIcon?: React.ReactNode;
  volumeIcon?: React.ReactNode;
  powerIcon?: React.ReactNode;
  onExit?: () => void;
  onNetworkClick?: () => void;
  currentTime?: string;
  currentDate?: string;
  availableWindowIds?: string[];
  activeApp?: string;
}

export function Taskbar({
  className = "",
  startMenuOpen = false,
  onStartMenuToggle,
  apps = [],
  sessionInfo = "Ghost Architect · Training session",
  showClock = true,
  networkIcon = null,
  volumeIcon = null,
  powerIcon = null,
  onExit,
  onNetworkClick,
  currentTime = "09:41",
  currentDate = "08/10/2026",
  availableWindowIds = [],
  activeApp = "",
}: TaskbarProps) {
  const [clock, setClock] = useState({ time: currentTime, date: currentDate });
  const [isAnimating, setIsAnimating] = useState(false);
  const [hoveredGroup, setHoveredGroup] = useState<string | null>(null);
  const taskbarRef = useRef<HTMLDivElement>(null);

  // Use taskbar grouping
  const { 
    groupedApps: { apps: groupedAppsList, groups, showGrouping }, 
    toggleGroup 
  } = useTaskbarGrouping(
    apps,
    availableWindowIds,
    activeApp,
    6
  );

  // Use taskbar previews
  const { 
    previewAppId, 
    showPreview, 
    previewPosition, 
    appPreviews, 
    buttonRefs,
    handleMouseEnter,
    handleMouseLeave,
    handleKeyDown,
    handleButtonClick
  } = useTaskbarPreviews(
    apps,
    activeApp,
    400
  );

  useEffect(() => {
    // Update clock every minute
    const updateClock = () => {
      const now = new Date();
      setClock({
        time: now.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        }),
        date: now.toLocaleDateString('en-US', { 
          month: '2-digit', 
          day: '2-digit', 
          year: 'numeric' 
        }),
      });
    };

    updateClock();
    const interval = setInterval(updateClock, 60000);

    return () => clearInterval(interval);
  }, []);

  // Handle clicking outside to close start menu
  useEffect(() => {
    if (!startMenuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (taskbarRef.current && !taskbarRef.current.contains(event.target as Node)) {
        onStartMenuToggle?.(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [startMenuOpen, onStartMenuToggle]);

  const handleStartMenuToggle = () => {
    setIsAnimating(true);
    onStartMenuToggle?.(!startMenuOpen);
    setTimeout(() => setIsAnimating(false), 300);
  };

  const handleTaskbarKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && startMenuOpen) {
      onStartMenuToggle?.(false);
      // Focus back on the Start button when menu closes with Escape
      const startButton = document.querySelector('.taskbar-start-button');
      if (startButton instanceof HTMLElement) {
        startButton.focus();
      }
    }
  };

  // Handle window minimize/restore
  const handleWindowAction = (app: TaskbarApp, action: 'minimize' | 'restore') => {
    if (action === 'minimize' && app.onMinimize) {
      app.onMinimize(app.id);
    } else if (action === 'restore' && app.onRestore) {
      app.onRestore(app.id);
    }
  };

  return (
    <>
    <motion.div
      ref={taskbarRef}
      className={`taskbar ${className}`}
      onKeyDown={handleTaskbarKeyDown}
      tabIndex={0}
      role="toolbar"
      aria-label="Taskbar"
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ 
        type: "spring", 
        stiffness: 500, 
        damping: 17 
      }}
    >
      {/* Session Info */}
      <motion.div 
        className="session-info"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        {sessionInfo}
      </motion.div>

      {/* Start Button */}
      <motion.div 
        className="taskbar-start"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <button
          onClick={handleStartMenuToggle}
          className="taskbar-start-button"
          aria-label="Start menu"
          aria-expanded={startMenuOpen}
          aria-controls="start-menu"
        >
          <motion.div
            className="startmark"
            animate={startMenuOpen ? {
              scale: [1, 1.1, 1],
              transition: { duration: 0.3 }
            } : {}}
          >
            <i></i>
            <i></i>
            <i></i>
            <i></i>
          </motion.div>
        </button>
      </motion.div>

      {/* Application Buttons */}
      <div className="taskbar-app-buttons">
        <AnimatePresence mode="wait">
          {groupedAppsList.map((app) => {
            if (showGrouping && 'windows' in app) {
              // This is a grouped app
              const group = app as GroupedApp;
              return (
                <motion.button
                  key={group.id}
                  onClick={() => {
                    if (group.windows.length === 1) {
                      // Single window in group, just focus it
                      const window = group.windows[0];
                      apps.find(a => a.id === window.id)?.onClick?.();
                    } else {
                      // Toggle group expansion
                      toggleGroup(group.id);
                    }
                  }}
                  className={`taskbar-app-button ${group.windows.some(w => w.focused) ? 'focused' : ''}`}
                  aria-label={`${group.label} (${group.count})`}
                  title={`${group.label} (${group.count} windows)`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ 
                    opacity: 1, 
                    scale: 1,
                    x: 0
                  }}
                  exit={{ 
                    opacity: 0, 
                    scale: 0.8,
                    x: -20
                  }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 500, 
                    damping: 17,
                    duration: 0.3
                  }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onMouseEnter={() => setHoveredGroup(group.id)}
                  onMouseLeave={() => setHoveredGroup(null)}
                >
                  {group.icon && (
                    <div className="appicon">
                      {group.icon}
                    </div>
                  )}
                  {group.count && group.count > 1 && (
                    <div className="app-count">
                      {group.count}
                    </div>
                  )}
                  
                  {/* Group popup */}
                  {hoveredGroup === group.id && (
                    <motion.div 
                      className="taskbar-group-popup"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <div className="group-title">{group.label}</div>
                      <div className="group-windows">
                        {group.windows.map((window) => (
                          <div 
                            key={window.id}
                            className={`window-item ${window.focused ? 'focused' : ''}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              apps.find(a => a.id === window.id)?.onClick?.();
                            }}
                          >
                            <span className="window-title">{window.title}</span>
                            {window.focused && <span className="focus-indicator">●</span>}
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </motion.button>
              );
            } else {
              // Regular app button
              const taskApp = app as TaskbarApp;
              return (
                <motion.button
                  key={taskApp.id}
                  onClick={taskApp.onClick}
                  onMouseEnter={(e) => handleMouseEnter(taskApp.id, e)}
                  onMouseLeave={handleMouseLeave}
                  ref={(el) => {
                    if (el) {
                      buttonRefs.current.set(taskApp.id, el);
                    } else {
                      buttonRefs.current.delete(taskApp.id);
                    }
                  }}
                  className={`taskbar-app-button ${taskApp.isRunning ? 'running' : ''} ${taskApp.isActive ? 'focused' : ''}`}
                  aria-label={taskApp.title}
                  title={taskApp.title}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ 
                    opacity: 1, 
                    scale: 1,
                    x: 0
                  }}
                  exit={{ 
                    opacity: 0, 
                    scale: 0.8,
                    x: -20
                  }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 500, 
                    damping: 17,
                    duration: 0.3
                  }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  {taskApp.icon && (
                    <div className="appicon">
                      {taskApp.icon}
                    </div>
                  )}
                  {taskApp.isMinimized && (
                    <motion.div
                      className="minimize-indicator"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      <div className="minimize-dot"></div>
                    </motion.div>
                  )}
                </motion.button>
              );
            }
          })}
        </AnimatePresence>
      </div>

      {/* System Tray */}
      <motion.div 
        className="taskbar-tray"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <AnimatePresence mode="wait">
          {networkIcon && (
            <motion.button 
              className="system-tray-icon"
              aria-label="Network status"
              title="Network status"
              onClick={onNetworkClick}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              whileHover={{ scale: 1.1, backgroundColor: "rgba(255,255,255,0.1)" }}
              whileTap={{ scale: 0.9 }}
            >
              {networkIcon}
            </motion.button>
          )}
          
          {volumeIcon && (
            <motion.button 
              className="system-tray-icon"
              aria-label="Volume control"
              title="Volume control"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              whileHover={{ scale: 1.1, backgroundColor: "rgba(255,255,255,0.1)" }}
              whileTap={{ scale: 0.9 }}
            >
              {volumeIcon}
            </motion.button>
          )}

          {powerIcon && onExit && (
            <motion.button
              className="system-tray-icon system-tray-power"
              aria-label="Log out"
              title="Log out"
              onClick={onExit}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              whileHover={{ scale: 1.1, backgroundColor: "rgba(255,255,255,0.1)" }}
              whileTap={{ scale: 0.9 }}
            >
              {powerIcon}
            </motion.button>
          )}
        </AnimatePresence>

        {showClock && (
          <motion.div 
            className="taskbar-clock"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <motion.div 
              className="clock-time"
              key={clock.time}
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              {clock.time}
            </motion.div>
            <motion.div 
              className="clock-date"
              key={clock.date}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.3 }}
            >
              {clock.date}
            </motion.div>
          </motion.div>
        )}
      </motion.div>
    </motion.div>

      {/* Taskbar Preview Popup */}
      <AnimatePresence>
        {showPreview && previewAppId && (
          <motion.div
            className="taskbar-preview-popup"
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            style={{
              position: 'fixed',
              left: `${previewPosition.x}px`,
              top: `${previewPosition.y}px`,
              zIndex: 1000,
            }}
          >
            {appPreviews
              .filter(preview => preview.id === previewAppId)
              .map(preview => (
                <div
                  key={preview.id}
                  className="preview-window"
                  onClick={() => handleButtonClick(preview.id)}
                  onKeyDown={(e) => handleKeyDown(e, preview.id)}
                  tabIndex={0}
                  role="button"
                  aria-label={`Preview: ${preview.title}`}
                >
                  <div className="preview-header">
                    <div className="preview-icon">
                      {preview.icon}
                    </div>
                    <div className="preview-title">{preview.title}</div>
                    {preview.focused && (
                      <div className="preview-focus-indicator">Active</div>
                    )}
                  </div>
                  <div className="preview-content">
                    <div className="preview-mock-content">
                      <div className="preview-text-line"></div>
                      <div className="preview-text-line short"></div>
                      <div className="preview-text-line medium"></div>
                    </div>
                  </div>
                  <div className="preview-actions">
                    <span className="preview-hint">Click to focus • Esc to close</span>
                  </div>
                </div>
              ))}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
