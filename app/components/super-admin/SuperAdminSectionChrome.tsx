"use client";

import styles from "@/app/components/SuperAdminDashboard.module.css";
import { Loader2, RefreshCw, Search } from "lucide-react";
import type { ReactNode } from "react";

export function SuperAdminSectionChrome({
  title,
  subtitle,
  query,
  onQueryChange,
  searchPlaceholder,
  onRefresh,
  refreshing,
  tools,
  children,
}: {
  title: string;
  subtitle: string;
  query: string;
  onQueryChange: (value: string) => void;
  searchPlaceholder: string;
  onRefresh: () => void;
  refreshing: boolean;
  tools?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className={styles.page} aria-label={title}>
      <div className={styles.inner}>
        <div className={styles.hero}>
          <div className={styles.heroCopy}>
            <h1 className={styles.title}>{title}</h1>
            <p className={styles.subtitle}>{subtitle}</p>
          </div>
          <div className={styles.heroTools}>
            <label className={styles.searchWrap}>
              <Search className={styles.searchIcon} aria-hidden />
              <input
                type="search"
                value={query}
                onChange={(event) => onQueryChange(event.target.value)}
                placeholder={searchPlaceholder}
                className={styles.searchInput}
                aria-label={searchPlaceholder}
              />
            </label>
            {tools}
            <button
              type="button"
              className={styles.iconBtn}
              onClick={onRefresh}
              disabled={refreshing}
              aria-label={`Refresh ${title.toLowerCase()}`}
            >
              {refreshing ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <RefreshCw className="size-4" />
              )}
            </button>
          </div>
        </div>
        {children}
      </div>
    </section>
  );
}
