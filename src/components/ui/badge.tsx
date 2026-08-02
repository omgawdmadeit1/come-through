import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium tracking-wide",
  {
    variants: {
      variant: {
        default:
          "border-[var(--color-border)] bg-[var(--color-bg-subtle)] text-[var(--color-fg-muted)]",
        live: "border-[color-mix(in_oklab,var(--color-live)_40%,transparent)] bg-[color-mix(in_oklab,var(--color-live)_14%,transparent)] text-[var(--color-live)]",
        accent:
          "border-[color-mix(in_oklab,var(--color-accent)_35%,transparent)] bg-[color-mix(in_oklab,var(--color-accent)_12%,transparent)] text-[var(--color-accent)]",
        warn: "border-[color-mix(in_oklab,var(--color-danger)_35%,transparent)] bg-[color-mix(in_oklab,var(--color-danger)_12%,transparent)] text-[var(--color-danger)]",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export function Badge({
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
