"use client";

import { useState, useMemo } from "react";

export interface GroupedApp {
  id: string;
  label: string;
  icon: React.ReactNode;
  kind?: "window" | "panel";
  windows: Array<{ id: string; title: string; focused: boolean }>;
  count?: number;
}

export function useTaskbarGrouping(
  apps: Array<{ id: string; label: string; icon: React.ReactNode; kind?: "window" | "panel" }>,
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

    // Group by similar app types
    const appGroups: Map<string, GroupedApp> = new Map();
    
    windowApps.forEach(app => {
      // Simple grouping by app type (you can make this smarter)
      const groupId = app.id; // For now, group by individual app
      if (!appGroups.has(groupId)) {
        appGroups.set(groupId, {
          id: groupId,
          label: app.label,
          icon: app.icon,
          kind: app.kind,
          windows: [],
          count: 0,
        });
      }
      
      const group = appGroups.get(groupId)!;
      group.windows.push({
        id: app.id,
        title: app.label,
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