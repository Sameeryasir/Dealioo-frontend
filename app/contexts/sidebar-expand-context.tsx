"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";

type SidebarExpandContextValue = {
  expanded: boolean;
  toggle: () => void;
  setExpanded: (value: boolean) => void;
};

const SidebarExpandContext = createContext<SidebarExpandContextValue | null>(
  null,
);

export function SidebarExpandProvider({ children }: { children: ReactNode }) {
  const [expanded, setExpanded] = useState(false);

  const toggle = useCallback(() => {
    setExpanded((prev) => !prev);
  }, []);

  return (
    <SidebarExpandContext.Provider value={{ expanded, toggle, setExpanded }}>
      {children}
    </SidebarExpandContext.Provider>
  );
}

export function useSidebarExpand(): SidebarExpandContextValue {
  const ctx = useContext(SidebarExpandContext);
  if (!ctx) {
    throw new Error(
      "useSidebarExpand must be used within SidebarExpandProvider",
    );
  }
  return ctx;
}
