import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-md)] text-sm font-medium transition-[opacity,transform,background-color,border-color,color] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)] disabled:pointer-events-none disabled:opacity-45 active:scale-[0.98] select-none",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--color-primary)] text-[var(--color-primary-fg)] hover:opacity-92",
        accent:
          "bg-[var(--color-accent)] text-[var(--color-accent-fg)] hover:opacity-92",
        secondary:
          "bg-[var(--color-bg-subtle)] text-[var(--color-fg)] border border-[var(--color-border)] hover:bg-[var(--color-bg-press)]",
        ghost:
          "bg-transparent text-[var(--color-fg-muted)] hover:bg-[var(--color-bg-subtle)] hover:text-[var(--color-fg)]",
        danger:
          "bg-[color-mix(in_oklab,var(--color-danger)_18%,transparent)] text-[var(--color-danger)] border border-[color-mix(in_oklab,var(--color-danger)_35%,transparent)]",
      },
      size: {
        default: "h-11 px-4 py-2 min-h-11",
        sm: "h-9 rounded-[var(--radius-sm)] px-3 text-xs min-h-9",
        lg: "h-12 rounded-[var(--radius-lg)] px-6 text-base min-h-12",
        icon: "h-11 w-11 min-h-11 min-w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  ),
);
Button.displayName = "Button";
