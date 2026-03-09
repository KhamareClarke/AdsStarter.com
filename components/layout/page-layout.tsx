"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * UAE-style page layout: consistent wrapper for Navbar → Main → Footer.
 * Use for marketing/content pages. Children supply header, main, footer.
 */
export function PageLayout({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("min-h-screen flex flex-col", className)}
      {...props}
    >
      {children}
    </div>
  );
}
