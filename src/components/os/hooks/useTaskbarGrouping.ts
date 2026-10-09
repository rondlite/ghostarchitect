"use client";

import { useState, useMemo } from "react";
import type { TaskbarApp } from "../Taskbar";

export interface GroupedApp {
  id: string;
  label: string;
  icon: React.ReactNode;
  kind?: "window" | "panel";
  windows: Array<{ id: string; title: string; focused: boolean }>;
  count?: number;
}

export function useTaskbarGrouping(
  apps: TaskbarApp[],
  availableWindowIds: string[],
  activeApp: string,
  groupingThreshold = 6
) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const groupedApps = useMemo(() => {
    const windowApps = apps.filter(app => app.kind === "window");
    const panelApps = apps.filter(app => app.kind === "panel");

    // Group window apps by type if we have more than threshold
    if (windowApps.length <= groupingThreshold) {
      return {
        apps,
        groups: [] as GroupedApp[],
        showGrouping: false,
      };
    }

    // Group by similar app types (for now, group individual apps with same title)
    const appGroups: Map<string, GroupedApp> = new Map();
    
    windowApps.forEach(app => {
      // Group by app title (simple approach for now)
      const groupId = app.title;
      if (!appGroups.has(groupId)) {
        appGroups.set(groupId, {
          id: groupId,
          label: app.title,
          icon: app.icon,
          kind: app.kind,
          windows: [],
          count: 0,
        });
      }
      
      const group = appGroups.get(groupId)!;
      group.windows.push({
        id: app.id,
        title: app.title,
        focused: activeApp === app.id,
      });
      group.count = group.windows.length;
    });

    return {
      apps: [...panelApps, ...appGroups.values()],
      groups: Array.from(appGroups.values()),
      showGrouping: true,
    };
  }, [apps, availableWindowIds, activeApp, groupingThreshold]);

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  };

  const isGroupExpanded = (groupId: string) => expandedGroups.has(groupId);

  return {
    groupedApps,
    expandedGroups,
    toggleGroup,
    isGroupExpanded,
  };
}