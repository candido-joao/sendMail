"use client";

import { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "danger";

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-zinc-900 text-white hover:bg-zinc-700 disabled:bg-zinc-400 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-300",
  secondary:
    "bg-zinc-100 text-zinc-900 hover:bg-zinc-200 disabled:text-zinc-400 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700",
  danger: "bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300",
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
};

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed ${variantClasses[variant]} ${className}`}
      {...props}
    />
  );
}
