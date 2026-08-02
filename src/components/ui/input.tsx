import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, type = "text", ...props }, ref) => (
  <input
    ref={ref}
    type={type}
    className={cn(
      "flex h-12 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-4 text-base text-[var(--color-fg)] placeholder:text-[var(--color-fg-subtle)] outline-none transition-[border-color,box-shadow] duration-150 focus-visible:border-[var(--color-border-strong)] focus-visible:ring-2 focus-visible:ring-[color-mix(in_oklab,var(--color-accent)_40%,transparent)] disabled:cursor-not-allowed disabled:opacity-50",
      className,
    )}
    {...props}
  />
));
Input.displayName = "Input";
