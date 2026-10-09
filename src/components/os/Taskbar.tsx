"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

export interface TaskbarApp {
  id: string;
  title: string;
  icon: React.ReactNode;
  isActive?: boolean;
  onClick?: () => void;
  isRunning?: boolean;
  isFocused?: boolean;
  isMinimized?: boolean;
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
  currentTime?: string;
  currentDate?: string;
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
  currentTime = "09:41",
  currentDate = "08/10/2026",
}: TaskbarProps) {
  const [clock, setClock] = useState({ time: currentTime, date: currentDate });
  const [isAnimating, setIsAnimating] = useState(false);
  const taskbarRef = useRef<HTMLDivElement>(null);

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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && startMenuOpen) {
      onStartMenuToggle?.(false);
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
    <motion.div
      ref={taskbarRef}
      className={`taskbar ${className}`}
      onKeyDown={handleKeyDown}
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
          {apps.map((app) => (
            <motion.button
              key={app.id}
              onClick={app.onClick}
              className={`taskbar-app-button ${app.isRunning ? 'running' : ''} ${app.isFocused ? 'focused' : ''}`}
              aria-label={app.title}
              title={app.title}
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
              {app.icon && (
                <div className="appicon">
                  {app.icon}
                </div>
              )}
              {app.isMinimized && (
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
          ))}
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
  );
}