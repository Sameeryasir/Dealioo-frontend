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
  closeMobile: () => void;
};

const SidebarExpandContext = createContext<SidebarExpandContextValue | null>(
  null,
);

export function SidebarExpandProvider({ children }: { children: ReactNode }) {
  const [expanded, setExpanded] = useState(false);

  const toggle = useCallback(() => {
    setExpanded((prev) => !prev);
  }, []);

  const closeMobile = useCallback(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(max-width: 767px)").matches) {
      setExpanded(false);
    }
  }, []);

  return (
    <SidebarExpandContext.Provider
      value={{ expanded, toggle, setExpanded, closeMobile }}
    >
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
