"use client";

import { motion } from "framer-motion";
import { Search } from "lucide-react";

export function GuestChatSearchBar({
  value,
  onChange,
  placeholder = "Search guests or messages",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <motion.label
      className="relative block"
      animate={value ? { scale: 1.01 } : { scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      <Search
        className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-zinc-400"
        aria-hidden
      />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-[#e8edf5] bg-white py-3 pl-11 pr-4 text-sm text-[#07111f] shadow-sm placeholder:text-zinc-400 transition-all duration-200 focus:border-[#1877f2]/50 focus:outline-none focus:ring-4 focus:ring-[#1877f2]/15"
      />
    </motion.label>
  );
}
