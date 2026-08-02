import * as React from "react";
import { cn } from "@/lib/utils";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "flex min-h-28 w-full rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-4 py-3 text-base text-[var(--color-fg)] placeholder:text-[var(--color-fg-subtle)] outline-none transition-[border-color,box-shadow] duration-150 focus-visible:border-[var(--color-border-strong)] focus-visible:ring-2 focus-visible:ring-[color-mix(in_oklab,var(--color-accent)_40%,transparent)] disabled:cursor-not-allowed disabled:opacity-50 resize-none",
      className,
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";
