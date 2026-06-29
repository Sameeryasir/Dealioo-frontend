"use client";

import { Fragment } from "react";

const URL_PATTERN = /(https?:\/\/[^\s]+)/g;

function isUrl(value: string): boolean {
  return /^https?:\/\//.test(value);
}

export function LinkifiedText({ text, className = "" }: { text: string; className?: string }) {
  const parts = text.split(URL_PATTERN);

  return (
    <p className={`break-words ${className}`}>
      {parts.map((part, index) =>
        isUrl(part) ? (
          <a
            key={`${part}-${index}`}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-blue-600 underline decoration-blue-300/70 underline-offset-2 transition hover:text-blue-700"
          >
            {part}
          </a>
        ) : (
          <Fragment key={`${index}-text`}>{part}</Fragment>
        ),
      )}
    </p>
  );
}
