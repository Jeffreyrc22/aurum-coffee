import type { ButtonHTMLAttributes } from "react";
import { LoaderCircle } from "lucide-react";
type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?:
    "primary" | "secondary" | "outline" | "ghost" | "icon" | "destructive";
  loading?: boolean;
  size?: "sm" | "md";
};
export function Button({
  variant = "primary",
  loading = false,
  size = "md",
  disabled,
  className = "",
  children,
  type = "button",
  ...props
}: Props) {
  return (
    <button
      {...props}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`aurum-button aurum-button--${variant} aurum-button--${size} ${className}`}
    >
      {loading && (
        <LoaderCircle size={17} className="button-spinner" aria-hidden="true" />
      )}
      {children}
    </button>
  );
}
